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
  DollarSign,
  TrendingUp,
  Users
} from 'lucide-react';

interface ManagementDashboardProps {
  onEditContract?: (contract: Contract) => void;
  onReviewContract?: (contract: Contract) => void;
  onDeleteContract?: (contract: Contract) => void;
}

const ManagementDashboard = ({
  onEditContract,
  onReviewContract,
  onDeleteContract
}: ManagementDashboardProps) => {
  const contracts = useContractStore((state) => state.contracts);

  // Management sees contracts that need their approval or are already approved
  const managementContracts = useMemo(() => {
    return contracts.filter(c =>
      c.status === 'management_review' ||
      c.status === 'accepted' ||
      c.status === 'rejected'
    );
  }, [contracts]);

  const stats = useMemo(() => {
    const totalContracts = managementContracts.length;
    const pendingApproval = contracts.filter(c => c.status === 'management_review').length;
    const approvedContracts = contracts.filter(c => c.status === 'accepted').length;

    // Calculate total contract value
    const totalValue = contracts
      .filter(c => c.amount && c.status === 'accepted')
      .reduce((sum, c) => {
        const amount = parseFloat(c.amount?.replace(/[$,]/g, '') || '0');
        return sum + amount;
      }, 0);

    // Calculate average contract value
    const avgValue = approvedContracts > 0 ? totalValue / approvedContracts : 0;

    return {
      totalContracts,
      pendingApproval,
      approvedContracts,
      totalValue: totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      avgValue: avgValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    };
  }, [contracts, managementContracts]);

  const managementStats = [
    {
      title: 'Total Oversight',
      value: stats.totalContracts,
      description: 'Management review',
      icon: <FileText className="h-6 w-6 text-accent" />,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Pending Approval',
      value: stats.pendingApproval,
      description: 'Awaiting decision',
      icon: <Clock className="h-6 w-6 text-warning" />
    },
    {
      title: 'Approved',
      value: stats.approvedContracts,
      description: 'Management approved',
      icon: <CheckCircle className="h-6 w-6 text-success" />,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Total Value',
      value: stats.totalValue,
      description: 'Active contracts',
      icon: <DollarSign className="h-6 w-6 text-accent" />,
      trend: { value: 25, isPositive: true }
    }
  ];

  const additionalStats = [
    {
      title: 'Avg Contract Value',
      value: stats.avgValue,
      description: 'Per contract',
      icon: <TrendingUp className="h-6 w-6 text-blue-500" />
    },
    {
      title: 'Active Partners',
      value: new Set(contracts.filter(c => c.status === 'accepted').map(c => c.counterparty)).size,
      description: 'Unique counterparties',
      icon: <Users className="h-6 w-6 text-purple-500" />
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Management Dashboard</h1>
        <p className="text-muted-foreground">
          Strategic oversight and contract approvals with financial insights.
        </p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {managementStats.map((stat, index) => (
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

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {additionalStats.map((stat, index) => (
          <StatCard
            key={`additional-${index}`}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Contracts Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Contracts Requiring Attention</h2>
          <p className="text-sm text-muted-foreground">
            Showing {managementContracts.length} contracts for management review
          </p>
        </div>

        <ContractTable
          filteredContracts={managementContracts}
          onEditContract={onEditContract}
          onReviewContract={onReviewContract}
          onDeleteContract={onDeleteContract}
        />
      </div>
    </div>
  );
};

export default ManagementDashboard;