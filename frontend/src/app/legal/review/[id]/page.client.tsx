'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Check, Edit, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ContractWithRelations, updateContract } from '@/api';
import { useContractStore } from '@/stores/contractStore';
import { LegalClause } from '@/types/clauses';
import {
  ConvertToContractClauses,
  ConvertToLegalClauses,
  mapGeneratedClausesToLegalClauses,
} from '@/utils/converter';
import { generateClauses } from '@/services/ai';

interface LegalReviewClientProps {
  id: string;
}

export default function LegalReviewClient({ id }: LegalReviewClientProps) {
  const [contract, setContract] = useState<ContractWithRelations>();
  const [aiSuggestions, setAiSuggestions] = useState<LegalClause[]>([]);

  const [acceptedClauses, setAcceptedClauses] = useState<LegalClause[]>([]);
  const [newClause, setNewClause] = useState({ title: '', description: '' });
  const [isFinalReview, setIsFinalReview] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // const navigation = useNavigation();

  const { getContractById, createClauseContract } = useContractStore();

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const contractData = await getContractById({
          url: '/api/contracts/{id}',
          path: { id },
          query: { includeRelations: 'true' },
        });
        setContract(contractData);

        console.log('Contract Data', contractData);
        setAcceptedClauses(ConvertToLegalClauses(contractData?.clauses ?? []));
      } catch (error) {
        toast.error('Failed to fetch contract details.');
        console.error(error);
      }
    };
    fetchContract();
  }, [id, getContractById]);

  const handleAcceptSuggestion = (suggestion: LegalClause) => {
    setAcceptedClauses(prev => [...prev, { ...suggestion, isEditing: false }]);
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleRejectSuggestion = (suggestionId: number) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const handleAddNewClause = () => {
    if (newClause.title.trim() && newClause.description.trim()) {
      setAcceptedClauses(prev => [
        ...prev,
        {
          id: Date.now(),
          clauseText: newClause.title.trim(),
          clauseDescription: newClause.description.trim(),
          isEditing: false,
        },
      ]);
      setNewClause({ title: '', description: '' });
    } else {
      toast.error('Both title and description are required for a new clause.');
    }
  };

  const handleDeleteClause = (clauseId: number) => {
    setAcceptedClauses(prev => prev.filter(c => c.id !== clauseId));
  };

  const handleToggleEdit = (clauseId: number) => {
    setAcceptedClauses(prev =>
      prev.map(c => (c.id === clauseId ? { ...c, isEditing: !c.isEditing } : c))
    );
  };

  const handleUpdateClauseText = (clauseId: number, newDescription: string) => {
    setAcceptedClauses(prev =>
      prev.map(c =>
        c.id === clauseId ? { ...c, clauseDescription: newDescription } : c
      )
    );
  };

  const handleRegenerateSuggestions = async () => {
    try {
      setIsRegenerating(true);
      toast.info('Regenerating AI suggestions...');
      // Mock regeneration
      // setTimeout(() => {
      //   setAiSuggestions([
      //     {
      //       id: 3,
      //       clauseText: 'Force Majeure Clause',
      //       clauseDescription:
      //         'Consider adding a pandemic clause to the Force Majeure section.',
      //     },
      //     {
      //       id: 4,
      //       clauseText: 'Governing Law',
      //       clauseDescription:
      //         'The governing law should be specified as the State of California.',
      //     },
      //   ]);
      //   toast.success('AI suggestions have been updated.');
      //   setIsRegenerating(false);
      // }, 1500);

      const generatedClauses = await generateClauses({
        contract_id: contract?.id ?? 0,
      });

      setAiSuggestions(mapGeneratedClausesToLegalClauses(generatedClauses));

      toast.success('AI suggestions have been updated.');
      setIsRegenerating(false);
    } catch (error) {
      console.error('Failed to regenerate AI suggestions:', error);
    }
  };

  const handleCompleteReview = async () => {
    if (!contract) return;
    try {
      await createClauseContract({
        url: '/api/contracts/{id}/clause',
        path: { id: contract.id.toString() },
        body: ConvertToContractClauses(acceptedClauses),
      });

      console.log('Clauses:', ConvertToContractClauses(acceptedClauses));

      toast.success('Legal review completed!', {
        description: `Contract "${contract.title}" has been sent for management review.`,
      });

      await updateContract({
        path: {
          id: contract.id.toString(),
        },
        body: { status: 'Management Review' },
      });

      window.location.href = '/legal';
    } catch (error) {
      toast.error('Failed to update contract status.');
    }
  };

  if (!contract) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading contract...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl gap-6 px-4 py-6 md:grid md:grid-cols-12">
      {/* PDF Viewer */}
      <div className="md:col-span-8">
        <div className="h-[calc(100vh-80px)] bg-gray-100 rounded-lg flex items-center justify-center sticky top-20">
          {contract.urlContract ? (
            <iframe
              src={contract.urlContract}
              className="w-full h-full"
              title={contract.title}
            />
          ) : (
            <p className="text-gray-500">
              No PDF available for: {contract?.title}
            </p>
          )}
        </div>
      </div>

      {/* Legal Review Panel */}
      <div className="md:col-span-4">
        <div className="bg-white p-4 rounded-lg shadow space-y-6">
          <h3 className="text-lg font-semibold border-b pb-2">
            Legal Review Panel
          </h3>

          <p>
            <strong>Status:</strong>{' '}
            <span className="text-blue-600 font-medium">
              {contract?.status}
            </span>
          </p>

          {/* AI Suggestions */}
          {!isFinalReview && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-800">
                  AI Generated Suggestions
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateSuggestions}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </>
                  )}
                </Button>
              </div>
              {aiSuggestions.length > 0 ? (
                <Accordion type="multiple" className="w-full">
                  {aiSuggestions.map(suggestion => (
                    <AccordionItem
                      value={`suggestion-${suggestion.id}`}
                      key={suggestion.id}
                    >
                      <AccordionTrigger>
                        {suggestion.clauseText}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-gray-700 mb-2">
                          {suggestion.clauseDescription}
                        </p>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleRejectSuggestion(suggestion.id)
                            }
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptSuggestion(suggestion)}
                          >
                            <Check className="h-4 w-4 mr-1" /> Accept
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-gray-500">No AI suggestions.</p>
              )}
            </div>
          )}

          {/* Accepted/Manual Clauses */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">
              Accepted Legal Clauses
            </h4>
            <Accordion type="multiple" className="w-full">
              {acceptedClauses.map(clause => (
                <AccordionItem value={`clause-${clause.id}`} key={clause.id}>
                  <AccordionTrigger>{clause.clauseText}</AccordionTrigger>
                  <AccordionContent>
                    {clause.isEditing ? (
                      <Textarea
                        value={clause.clauseDescription}
                        onChange={e =>
                          handleUpdateClauseText(clause.id, e.target.value)
                        }
                        className="text-sm mb-2"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 mb-2">
                        {clause.clauseDescription}
                      </p>
                    )}
                    {!isFinalReview && (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleEdit(clause.id)}
                          className="h-7 w-7"
                        >
                          {clause.isEditing ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClause(clause.id)}
                          className="h-7 w-7 text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {!isFinalReview && (
              <div className="space-y-2 pt-2 mt-2 border-t">
                <h5 className="font-medium text-sm text-gray-700">
                  Add New Clause
                </h5>
                <Input
                  value={newClause.title}
                  onChange={e =>
                    setNewClause(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Clause Title"
                />
                <Textarea
                  value={newClause.description}
                  onChange={e =>
                    setNewClause(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Clause Description..."
                />
                <Button onClick={handleAddNewClause} className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Add Clause
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-4 space-y-2">
            {isFinalReview ? (
              <>
                <p className="text-sm text-center text-gray-600">
                  You are in the final review state. Please confirm your action.
                </p>
                <Button className="w-full" onClick={handleCompleteReview}>
                  Accept and Send to Management
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setIsFinalReview(false)}
                >
                  Return to Editing
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={() => setIsFinalReview(true)}>
                Proceed to Final Review
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
