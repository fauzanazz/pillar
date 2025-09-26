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
} from 'lucide-react';

interface LegalDashboardProps {
  onEditContract?: (contract: Contract) => void;
  onReviewContract?: (contract: Contract) => void;
  onDeleteContract?: (contract: Contract) => void;
}

const LegalDashboard = ({ onEditContract, onReviewContract, onDeleteContract }: LegalDashboardProps) => {
  const contracts = useContractStore((state) => state.contracts);

  // Filter contracts relevant to legal team
  const legalContracts = useMemo(() => {
    return contracts.filter(c =>
      c.status === 'legal_review' ||
      c.status === 'management_review' ||
      c.status === 'accepted' ||
      c.status === 'rejected'
    );
  }, [contracts]);

  const stats = useMemo(() => {
    const totalContracts = legalContracts.length;
    const pendingReview = contracts.filter(c => c.status === 'legal_review').length;
    const reviewedContracts = contracts.filter(c =>
      c.status === 'management_review' || c.status === 'accepted'
    ).length;
    const rejectedContracts = contracts.filter(c => c.status === 'rejected').length;

    return {
      totalContracts,
      pendingReview,
      reviewedContracts,
      rejectedContracts
    };
  }, [contracts, legalContracts]);

  const legalStats = [
    {
      title: 'Total Contracts',
      value: stats.totalContracts,
      description: 'Legal oversight',
      icon: <FileText className="h-6 w-6 text-accent" />,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Pending Review',
      value: stats.pendingReview,
      description: 'Awaiting legal review',
      icon: <Clock className="h-6 w-6 text-warning" />
    },
    {
      title: 'Reviewed',
      value: stats.reviewedContracts,
      description: 'Completed reviews',
      icon: <CheckCircle className="h-6 w-6 text-success" />,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Rejected',
      value: stats.rejectedContracts,
      description: 'Legal concerns',
      icon: <AlertTriangle className="h-6 w-6 text-destructive" />
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Legal Dashboard</h1>
        <p className="text-muted-foreground">
          Review and approve contracts requiring legal oversight.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {legalStats.map((stat, index) => (
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
          <h2 className="text-2xl font-semibold tracking-tight">Contracts for Review</h2>
          <p className="text-sm text-muted-foreground">
            Showing {legalContracts.length} contracts requiring legal attention
          </p>
        </div>

        <ContractTable
          filteredContracts={legalContracts}
          onEditContract={onEditContract}
          onReviewContract={onReviewContract}
          onDeleteContract={onDeleteContract}
        />
      </div>
    </div>
  );
};

export default LegalDashboard;