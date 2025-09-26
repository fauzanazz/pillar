'use client';

import { useMemo, useState } from 'react';
import { useContractStore } from '@/stores/contractStore';
import StatCard from '@/components/dashboard/StatCard';
import { EnhancedContractTable } from '@/components/contracts/EnhancedContractTable';
import { AddContractModal } from '@/components/contracts/AddContractModal';
import { EditContractModal } from '@/components/contracts/EditContractModal';
import { Contract } from '@/constants/mockData';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InternalDashboardProps {
  onEditContract?: (contract: Contract) => void;
  onReviewContract?: (contract: Contract) => void;
  onDeleteContract?: (contract: Contract) => void;
  onCreateContract?: () => void;
}

const InternalDashboard = ({
  onEditContract,
  onReviewContract,
  onDeleteContract,
  onCreateContract,
}: InternalDashboardProps) => {
  const contracts = useContractStore(state => state.contracts);
  const addContract = useContractStore(state => state.addContract);
  const updateContract = useContractStore(state => state.updateContract);
  const deleteContract = useContractStore(state => state.deleteContract);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // Internal team sees all contracts but focuses on their workflow
  const stats = useMemo(() => {
    const totalContracts = contracts.length;
    const draftContracts = contracts.filter(c => c.status === 'draft').length;
    const activeContracts = contracts.filter(
      c => c.status === 'accepted'
    ).length;
    // const nearExpireContracts = contracts.filter(
    //   c => c.status === 'near_expire'
    // ).length;

    return {
      totalContracts,
      draftContracts,
      activeContracts,
      // nearExpireContracts,
    };
  }, [contracts]);

  const internalStats = [
    {
      title: 'Total Contracts',
      value: stats.totalContracts,
      description: 'vs last month',
      icon: <FileText className="h-6 w-6 text-accent" />,
      trend: { value: 15, isPositive: true },
    },
    {
      title: 'Draft Contracts',
      value: stats.draftContracts,
      description: 'Pending submission',
      icon: <Clock className="h-6 w-6 text-warning" />,
    },
    {
      title: 'Active Contracts',
      value: stats.activeContracts,
      description: 'Currently active',
      icon: <CheckCircle className="h-6 w-6 text-success" />,
      trend: { value: 6, isPositive: true },
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Internal Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage contracts from creation to completion.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Contract
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {internalStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            trend={'trend' in stat ? stat.trend : undefined}
          />
        ))}
      </div>

      {/* Contracts Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            All Contracts
          </h2>
          <p className="text-sm text-muted-foreground">
            Showing {contracts.length} contracts
          </p>
        </div>

        <EnhancedContractTable
          contracts={contracts}
          onEdit={contract => {
            setEditingContract(contract);
          }}
          onDelete={contract => {
            deleteContract(contract.id);
          }}
          onSendToNextStep={contract => {
            // Update status based on current status
            let newStatus: Contract['status'];
            switch (contract.status) {
              case 'draft':
                newStatus = 'legal_review';
                break;
              case 'legal_review':
                newStatus = 'management_review';
                break;
              case 'management_review':
                newStatus = 'accepted';
                break;
              default:
                return;
            }
            updateContract(contract.id, { status: newStatus });
          }}
          onView={contract => {
            console.log('View contract:', contract);
            // TODO: Implement view modal or navigate to detail page
          }}
        />
      </div>

      {/* Add Contract Modal */}
      <AddContractModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={contractData => {
          addContract(contractData);
        }}
      />

      {/* Edit Contract Modal */}
      <EditContractModal
        isOpen={!!editingContract}
        contract={editingContract}
        onClose={() => setEditingContract(null)}
        onSubmit={(id, updates) => {
          updateContract(id, updates);
        }}
      />
    </div>
  );
};

export default InternalDashboard;
