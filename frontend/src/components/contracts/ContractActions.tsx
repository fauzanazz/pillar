'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Contract } from '@/constants/mockData';
import { Edit, Eye, Trash2, FileCheck, FileX, Plus } from 'lucide-react';

interface ContractActionsProps {
  contract?: Contract;
  onEdit?: (contract: Contract) => void;
  onCreate?: () => void;
  onView?: (contract: Contract) => void;
  onApprove?: (contract: Contract) => void;
  onReject?: (contract: Contract) => void;
  onDelete?: (contract: Contract) => void;
}

const ContractActions = ({
  contract,
  onEdit,
  onCreate,
  onView,
  onApprove,
  onReject,
  onDelete
}: ContractActionsProps) => {
  const {
    canCreateContracts,
    canReviewContracts,
    isInternal,
    isLegal,
    isManagement
  } = useAuth();

  // If no contract provided, show create action for internal users
  if (!contract) {
    return (
      <>
        {canCreateContracts && onCreate && (
          <Button
            onClick={onCreate}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Contract
          </Button>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* View action - everyone can view contracts they have access to */}
      {onView && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(contract)}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
      )}

      {/* Edit action - only internal users can edit */}
      {isInternal && onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(contract)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      )}

      {/* Review actions - legal and management can approve/reject */}
      {canReviewContracts && (
        <>
          {/* Legal review actions */}
          {isLegal && contract.status === 'legal_review' && (
            <>
              {onApprove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onApprove(contract)}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700"
                >
                  <FileCheck className="h-4 w-4" />
                  Approve
                </Button>
              )}
              {onReject && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReject(contract)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <FileX className="h-4 w-4" />
                  Reject
                </Button>
              )}
            </>
          )}

          {/* Management review actions */}
          {isManagement && contract.status === 'management_review' && (
            <>
              {onApprove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onApprove(contract)}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700"
                >
                  <FileCheck className="h-4 w-4" />
                  Final Approval
                </Button>
              )}
              {onReject && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReject(contract)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <FileX className="h-4 w-4" />
                  Reject
                </Button>
              )}
            </>
          )}
        </>
      )}

      {/* Delete action - only internal users can delete drafts */}
      {isInternal && contract.status === 'draft' && onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(contract)}
          className="flex items-center gap-2 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      )}
    </div>
  );
};

export default ContractActions;