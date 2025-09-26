'use client';

import { useState } from 'react';
import { FileText, Clock, CheckCircle, Plus } from 'lucide-react';
import { ContractWithRelations, Contract } from '@/api';
import { AddContractModal } from '@/components/contracts/AddContractModal';
import { EditContractModal } from '@/components/contracts/EditContractModal';
import StatCard from '@/components/dashboard/StatCard';
import { InternalContractTable } from '@/components/internal/InternalContractTable';
import { Button } from '@/components/ui/button';
import { useContractStore } from '@/stores/contractStore';

const InternalDashboard = () => {
  const {
    addContract,
    updateContract,
    deleteContract,
    contracts,
    totalContracts,
  } = useContractStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContract, setEditingContract] =
    useState<ContractWithRelations | null>(null);

  const stats = {
    totalContracts: totalContracts,
    draftContracts: contracts.filter(c => c.status === 'Draft').length,
    activeContracts: contracts.filter(c => c.status === 'Accepted').length,
  };

  const internalStats = [
    {
      title: 'Total Contracts',
      value: stats.totalContracts,
      icon: <FileText className="h-6 w-6 text-accent" />,
    },
    {
      title: 'Draft Contracts',
      value: stats.draftContracts,
      icon: <Clock className="h-6 w-6 text-warning" />,
    },
    {
      title: 'Active Contracts',
      value: stats.activeContracts,
      icon: <CheckCircle className="h-6 w-6 text-success" />,
    },
  ];

  return (
    <div className="space-y-6 p-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {internalStats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            description={''}
          />
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">All Contracts</h2>
        <InternalContractTable
          onEdit={contract => setEditingContract(contract)}
          onDelete={contract => {
            deleteContract({
              url: '/api/contracts/{id}',
              path: { id: contract.id.toString() },
            });
          }}
          onSendToNextStep={contract => {
            let newStatus: Contract['status'];
            switch (contract.status) {
              case 'Draft':
                newStatus = 'Legal Review';
                break;
              case 'Rejected':
                newStatus = 'Draft';
                break;
              default:
                return;
            }
            updateContract({
              url: '/api/contracts/{id}',
              path: { id: contract.id.toString() },
              body: { status: newStatus },
            });
          }}
          onView={contract => {
            console.log('View contract:', contract);
          }}
        />
      </div>

      <AddContractModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async contractData => {
          addContract({
            url: '/api/contracts',
            body: contractData,
          });
        }}
      />

      <EditContractModal
        isOpen={!!editingContract}
        contract={editingContract}
        onClose={() => setEditingContract(null)}
        onSubmit={(id, updates) => {
          updateContract({
            url: '/api/contracts/{id}',
            path: { id: id.toString() },
            body: updates,
          });
        }}
      />
    </div>
  );
};

export default InternalDashboard;
