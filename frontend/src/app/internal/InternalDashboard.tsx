'use client';

import { useMemo } from 'react';
import { useContractStore } from '@/stores/contractStore';
import StatCard from '@/components/dashboard/StatCard';
import ContractTable from '../contracts/ContractTable';
import { Contract } from '@/constants/mockData';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus
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
  onCreateContract
}: InternalDashboardProps) => {
  const contracts = useContractStore((state) => state.contracts);

  // Internal team sees all contracts but focuses on their workflow
  const stats = useMemo(() => {
    const totalContracts = contracts.length;
    const draftContracts = contracts.filter(c => c.status === 'draft').length;
    const activeContracts = contracts.filter(c => c.status === 'accepted').length;
    const nearExpireContracts = contracts.filter(c => c.status === 'near_expire').length;

    return {
      totalContracts,
      draftContracts,
      activeContracts,
      nearExpireContracts
    };
  }, [contracts]);

  const internalStats = [
    {
      title: 'Total Contracts',
      value: stats.totalContracts,
      description: 'vs last month',
      icon: <FileText className="h-6 w-6 text-accent" />,
      trend: { value: 15, isPositive: true }
    },
    {
      title: 'Draft Contracts',
      value: stats.draftContracts,
      description: 'Pending submission',
      icon: <Clock className="h-6 w-6 text-warning" />
    },
    {
      title: 'Active Contracts',
      value: stats.activeContracts,
      description: 'Currently active',
      icon: <CheckCircle className="h-6 w-6 text-success" />,
      trend: { value: 6, isPositive: true }
    },
    {
      title: 'Near Expire',
      value: stats.nearExpireContracts,
      description: 'Expiring soon',
      icon: <AlertTriangle className="h-6 w-6 text-destructive" />
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Internal Dashboard</h1>
          <p className="text-muted-foreground">
            Manage contracts from creation to completion.
          </p>
        </div>
        {onCreateContract && (
          <Button onClick={onCreateContract} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Contract
          </Button>
        )}
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
          <h2 className="text-2xl font-semibold tracking-tight">All Contracts</h2>
          <p className="text-sm text-muted-foreground">
            Showing {contracts.length} contracts
          </p>
        </div>

        <ContractTable
          onEditContract={onEditContract}
          onReviewContract={onReviewContract}
          onDeleteContract={onDeleteContract}
        />
      </div>
    </div>
  );
};

export default InternalDashboard;