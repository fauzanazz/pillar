'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { acceptContract, ContractWithRelations, rejectContract } from '@/api';
import { useContractStore } from '../../../../stores/contractStore';
import { LegalClause } from '../../../../types/clauses';
import { ConvertToLegalClauses } from '../../../../utils/converter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Check, X, ArrowLeft, Send } from 'lucide-react';

interface ManagementReviewClientProps {
  id: string;
}

export default function ManagementReviewClient({
  id,
}: ManagementReviewClientProps) {
  const [contract, setContract] = useState<ContractWithRelations>();
  const [acceptedClauses, setAcceptedClauses] = useState<LegalClause[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [acceptanceReason, setAcceptanceReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const { getContractById, updateContract } = useContractStore();

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const contractData = await getContractById({
          url: '/api/contracts/{id}',
          path: { id },
          query: { includeRelations: 'true' },
        });
        setContract(contractData);
        setAcceptedClauses(ConvertToLegalClauses(contractData?.clauses ?? []));
      } catch (error) {
        toast.error('Failed to fetch contract details.');
        console.error(error);
      }
    };
    fetchContract();
  }, [id, getContractById]);

  const handleAccept = async () => {
    if (!contract) return;
    try {
      await acceptContract({
        path: {
          id: contract.id.toString(),
        },
        body: {
          reason: acceptanceReason.trim() ?? '',
        },
      });
      toast.success('Contract Approved!', {
        description: `Contract "${contract.title}" has been successfully approved.`,
      });
      window.location.href = '/management';
    } catch (error) {
      toast.error('Failed to approve the contract.');
    }
  };

  const handleReject = async (target: 'legal' | 'all') => {
    if (!contract || !rejectionReason.trim()) {
      toast.error('Rejection reason cannot be empty.');
      return;
    }

    const newStatus = target === 'legal' ? 'Legal Review' : 'Rejected';
    const successMessage =
      target === 'legal'
        ? `Contract sent back to Legal team for review.`
        : `Contract has been rejected and sent back to the internal team.`;

    try {
      await rejectContract({
        body: {
          rejectType: target,
          reason: rejectionReason.trim() ?? '',
        },
        path: {
          id: contract.id.toString(),
        },
      });

      toast.warning('Contract Rejected', {
        description: successMessage,
      });
      window.location.href = '/management';
    } catch (error) {
      toast.error('Failed to reject the contract.');
    }
  };

  if (!contract) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <p>Loading contract details...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl gap-6 px-4 py-6 md:grid md:grid-cols-12">
      <div className="md:col-span-8">
        <div className="h-[calc(100vh-80px)] bg-gray-100 rounded-lg flex items-center justify-center sticky top-20">
          {contract.urlContract ? (
            <iframe
              src={contract.urlContract}
              className="w-full h-full border rounded-md"
              title={contract.title}
            />
          ) : (
            <div className="text-center text-gray-500">
              <p>No PDF available for: {contract?.title}</p>
              <p className="text-sm">
                The contract document might still be processing or was not
                uploaded.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="md:col-span-4">
        <div className="bg-white p-4 rounded-lg shadow space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">
            Management Review
          </h3>

          <p>
            <strong>Status:</strong>{' '}
            <span className="text-blue-600 font-medium">
              {contract?.status}
            </span>
          </p>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Final Legal Clauses</h4>
            <Accordion
              type="multiple"
              className="w-full"
              defaultValue={acceptedClauses.map(c => `clause-${c.id}`)}
            >
              {acceptedClauses.map(clause => (
                <AccordionItem value={`clause-${clause.id}`} key={clause.id}>
                  <AccordionTrigger>{clause.clauseText}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-gray-800 mb-2">
                      {clause.clauseDescription}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="border-t pt-4 space-y-2">
            {isRejecting ? (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Reason for Rejection
                </h4>
                <Textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Provide a clear reason for rejecting this contract..."
                  className="mb-2 min-h-[120px]"
                />
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {/* Reject to Legal */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Reject to Legal
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Reject and send to Legal Team?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will send the contract back to the &apos;Legal
                          Review&apos; stage. The legal team will be notified.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleReject('legal')}
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {/* Reject to Internal */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Send className="h-4 w-4 mr-2" />
                        Reject to Internal
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Reject and send to Internal Team?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will mark the contract as &apos;Rejected&apos;
                          and send it back to the original requester.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleReject('all')}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsRejecting(false)}
                  className="w-full"
                >
                  Cancel Rejection
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="destructive"
                  onClick={() => setIsRejecting(true)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button>
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to approve this contract?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will finalize the contract and move it to
                        the &apos;Accepted&apos; status. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                      placeholder="Optional acceptance note..."
                      value={acceptanceReason}
                      onChange={e => setAcceptanceReason(e.target.value)}
                      className="my-4"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleAccept}>
                        Approve
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
