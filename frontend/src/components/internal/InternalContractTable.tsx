'use client';

import { useEffect, useState } from 'react';
import {
  Edit,
  Trash2,
  Send,
  Eye,
  AlertTriangle,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';
import { Contract, ContractWithRelations } from '@/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useContractStore } from '@/stores/contractStore';

interface ContractTableProps {
  onEdit: (contract: ContractWithRelations) => void;
  onDelete: (contract: ContractWithRelations) => void;
  onSendToNextStep: (contract: ContractWithRelations) => void;
  onView?: (contract: ContractWithRelations) => void;
  isSearched?: boolean;
  searchedContracts?: Contract[];
}

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmVariant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText,
  confirmVariant = 'default',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InternalContractTable({
  onEdit,
  onDelete,
  onSendToNextStep,
  onView,
  isSearched,
  searchedContracts = [],
}: ContractTableProps) {
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'delete' | 'send' | null;
    contract: ContractWithRelations | null;
  }>({
    isOpen: false,
    type: null,
    contract: null,
  });

  const [currentPage, setCurrentPage] = useState(1);

  const [pagesProps, setPagesProps] = useState({
    totalPages: 1,
    totalItems: 0,
  });

  const [selectedContracts, setSelectedContracts] = useState<Contract[]>([]);

  const itemsPerPage = 5;

  const { contracts, fetchContracts, loading } = useContractStore();

  useEffect(() => {
    try {
      if (isSearched) {
        console.log('Searched contracts:', searchedContracts);
        setSelectedContracts(searchedContracts);
        return;
      }

      const response = fetchContracts({
        url: '/api/contracts',
        query: {
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
        },
      });

      response.then(res => {
        setPagesProps({
          totalPages: res?.data?.pagination.totalPages ?? 0,
          totalItems: res?.data?.pagination.total ?? 0,
        });
      });

      setSelectedContracts(contracts);
    } catch (error) {
      console.log('Error fetching contracts:', error);
    }
  }, [currentPage, fetchContracts, isSearched]);

  const handleDeleteClick = (contract: ContractWithRelations) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      contract,
    });
  };

  const handleSendClick = (contract: ContractWithRelations) => {
    setConfirmModal({
      isOpen: true,
      type: 'send',
      contract,
    });
  };

  const handleConfirmAction = () => {
    const { type, contract } = confirmModal;
    if (!contract) return;

    if (type === 'delete') {
      onDelete(contract);
      toast.success(`Contract "${contract.title}" deleted successfully`);
    } else if (type === 'send') {
      onSendToNextStep(contract);
      toast.success(`Contract "${contract.title}" sent to next step`);
    }

    setConfirmModal({ isOpen: false, type: null, contract: null });
  };

  const handleCancelAction = () => {
    setConfirmModal({ isOpen: false, type: null, contract: null });
  };

  const NextStepList = ['Draft', 'Rejected'];
  const EditStepList = ['Draft'];
  const DeleteStepList = ['Draft', 'Rejected'];

  const canSendToNextStep = (status: Contract['status']) => {
    return NextStepList.includes(status);
  };

  const canEdit = (status: Contract['status']) => {
    return EditStepList.includes(status);
  };

  const canDelete = (status: Contract['status']) => {
    return DeleteStepList.includes(status);
  };

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= pagesProps.totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                Nama
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                Deskripsi
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                End of Contract
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                Status
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                URL Contract
              </TableHead>
              <TableHead className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-gray-500">Loading contracts...</p>
                </TableCell>
              </TableRow>
            ) : selectedContracts.length > 0 ? (
              selectedContracts.map(contract => (
                <TableRow
                  key={contract.id}
                  className="border-b hover:bg-gray-50"
                >
                  <TableCell className="px-4 py-4 text-sm text-gray-900">
                    <div className="font-medium">{contract.title}</div>
                    {contract.riskScore && (
                      <div className="text-xs text-gray-500">
                        {contract.riskScore}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                    <div className="truncate" title={contract.description}>
                      {contract.description}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm text-gray-900">
                    {new Date(contract.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full `}
                    >
                      {contract.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-sm">
                    {contract.description ? (
                      <button
                        onClick={() => {
                          console.log(
                            'View generated contract:',
                            contract.description
                          );
                        }}
                        className="text-blue-600 hover:text-blue-800 underline text-xs"
                      >
                        View Generated
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        Not Generated
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4 flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        {onView && (
                          <DropdownMenuItem onSelect={() => onView(contract)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View Contract</span>
                          </DropdownMenuItem>
                        )}
                        {canEdit(contract.status) && (
                          <DropdownMenuItem onSelect={() => onEdit(contract)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit Contract</span>
                          </DropdownMenuItem>
                        )}
                        {canDelete(contract.status) && (
                          <DropdownMenuItem
                            onSelect={() => handleDeleteClick(contract)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete Contract</span>
                          </DropdownMenuItem>
                        )}
                        {canSendToNextStep(contract.status) && (
                          <DropdownMenuItem
                            onSelect={() => handleSendClick(contract)}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            <span>Send to Next Step</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="text-center py-8 text-gray-500">
                    No contracts found. Create your first contract to get
                    started.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagesProps.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-700">
            Showing {indexOfFirstItem + 1} to{' '}
            {Math.min(indexOfFirstItem + itemsPerPage, pagesProps.totalItems)}{' '}
            of {pagesProps.totalItems} Contracts
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm font-medium text-gray-800">
              Page {currentPage} of {pagesProps.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagesProps.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === 'delete'
            ? 'Confirm Delete'
            : confirmModal.type === 'send'
              ? 'Confirm Send to Next Step'
              : ''
        }
        message={
          confirmModal.type === 'delete'
            ? `Are you sure you want to delete the contract "${confirmModal.contract?.title}"? This action cannot be undone.`
            : confirmModal.type === 'send'
              ? `Are you sure you want to send the contract "${confirmModal.contract?.title}" to the next step?`
              : ''
        }
        confirmText={
          confirmModal.type === 'delete'
            ? 'Delete'
            : confirmModal.type === 'send'
              ? 'Send'
              : 'Confirm'
        }
        confirmVariant={
          confirmModal.type === 'delete' ? 'destructive' : 'default'
        }
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </>
  );
}
