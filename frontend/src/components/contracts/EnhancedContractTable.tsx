'use client';

import { useState } from 'react';
import { Edit, Trash2, Send, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';
import { ContractWithRelations } from '@/api';

interface ContractTableProps {
  contracts: ContractWithRelations[];
  onEdit: (contract: ContractWithRelations) => void;
  onDelete: (contract: ContractWithRelations) => void;
  onSendToNextStep: (contract: ContractWithRelations) => void;
  onView?: (contract: ContractWithRelations) => void;
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

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  legal_review: 'bg-blue-100 text-blue-800',
  management_review: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  canceled: 'bg-gray-100 text-gray-600',
};

const statusLabels = {
  draft: 'Draft',
  legal_review: 'Legal Review',
  management_review: 'Management Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  canceled: 'Canceled',
};

export function EnhancedContractTable({
  contracts,
  onEdit,
  onDelete,
  onSendToNextStep,
  onView,
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

  const getNextStepLabel = (status: ContractWithRelations['status']) => {
    // switch (status) {
    //   case 'draft':
    //     return 'Send to Legal Review';
    //   case 'legal_review':
    //     return 'Send to Management';
    //   case 'management_review':
    //     return 'Accept Contract';
    //   default:
    //     return 'Send to Next Step';
    // }
  };

  const canSendToNextStep = (status: ContractWithRelations['status']) => {
    return ['draft', 'legal_review', 'management_review'].includes(status);
  };

  const canEdit = (status: ContractWithRelations['status']) => {
    return ['draft'].includes(status);
  };

  const canDelete = (status: ContractWithRelations['status']) => {
    return ['draft', 'rejected'].includes(status);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                Nama
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                Deskripsi
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                End of Contract
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                Status
              </th>

              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b">
                URL Contract
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {contracts.map(contract => (
              <tr key={contract.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-4 text-sm text-gray-900">
                  <div className="font-medium">{contract.title}</div>
                  {contract.riskScore && (
                    <div className="text-xs text-gray-500">
                      {contract.riskScore}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 max-w-xs">
                  <div className="truncate" title={contract.description}>
                    {contract.description}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {new Date(contract.endDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full `}
                  >
                    {contract.status}
                  </span>
                </td>

                <td className="px-4 py-4 text-sm">
                  {contract.description ? (
                    <button
                      onClick={() => {
                        // Open generated contract in new window or modal
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
                    <span className="text-gray-400 text-xs">Not Generated</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {/* View Button */}
                    {onView && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(contract)}
                        className="h-8 w-8 p-0"
                        title="View Contract"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(contract)}
                      disabled={!canEdit(contract.status)}
                      className="h-8 w-8 p-0"
                      title={
                        canEdit(contract.status)
                          ? 'Edit Contract'
                          : 'Cannot edit this status'
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(contract)}
                      disabled={!canDelete(contract.status)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                      title={
                        canDelete(contract.status)
                          ? 'Delete Contract'
                          : 'Cannot delete this status'
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* Send to Next Step */}
                    {canSendToNextStep(contract.status) && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSendClick(contract)}
                        className="h-8 px-2"
                        // title={getNextStepLabel(contract.status)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Next
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {contracts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No contracts found. Create your first contract to get started.
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
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
