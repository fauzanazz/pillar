import { useContractStore } from '@/stores/contractStore';
import { Contract } from '@/constants/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Eye, Trash2, FileText } from 'lucide-react';
import { useEffect } from 'react';

interface ContractTableProps {
  onEditContract?: (contract: Contract) => void;
  onReviewContract?: (contract: Contract) => void;
  onDeleteContract?: (contract: Contract) => void;
  filteredContracts?: Contract[];
}

const getStatusColor = (status: Contract['status']) => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'legal_review':
      return 'bg-yellow-100 text-yellow-800';
    case 'management_review':
      return 'bg-blue-100 text-blue-800';
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'near_expire':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: Contract['status']) => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'legal_review':
      return 'Legal Review';
    case 'management_review':
      return 'Management Review';
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    case 'near_expire':
      return 'Near Expire';
    default:
      return status;
  }
};

const ContractTable = ({
  onEditContract,
  onReviewContract,
  onDeleteContract,
  filteredContracts
}: ContractTableProps) => {
  const { contracts, fetchContracts } = useContractStore();

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const displayContracts = filteredContracts || contracts;

  if (displayContracts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No contracts found</h3>
            <p className="text-gray-500">Get started by creating your first contract.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Counterparty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{contract.title}</div>
                      <div className="text-sm text-gray-500">Created by {contract.createdBy}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contract.counterparty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                      {getStatusLabel(contract.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contract.amount || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(contract.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {onReviewContract && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onReviewContract(contract)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEditContract && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditContract(contract)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeleteContract && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteContract(contract)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractTable;