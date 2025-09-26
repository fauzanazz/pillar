'use client';

import { useMemo, useEffect, useState } from 'react';
import { useContractStore } from '@/stores/contractStore';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { ManagementContractsTable } from '@/components/management/ManagementContractsTable';
import { Button } from '@/components/ui/button';

const ManagementDashboard = () => {
  const { contracts, fetchContracts, loading, error, totalContracts } =
    useContractStore();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchContracts({
      url: '/api/contracts',
      query: {
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        status: 'Management Review',
      },
    });
  }, [currentPage, fetchContracts]);

  const totalPages = Math.ceil(totalContracts / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const stats = useMemo(() => {
    const pendingApproval = contracts.filter(
      c => c.status === 'Management Review'
    ).length;
    const approvedContracts = contracts.filter(
      c => c.status === 'Accepted'
    ).length;
    return {
      totalContracts: totalContracts,
      pendingApproval,
      approvedContracts,
    };
  }, [contracts, totalContracts]);

  const managementStats = [
    {
      title: 'Total Oversight',
      value: stats.totalContracts,
      icon: <FileText className="h-6 w-6 text-accent" />,
    },
    {
      title: 'Pending Approval',
      value: stats.pendingApproval,
      icon: <Clock className="h-6 w-6 text-warning" />,
    },
    {
      title: 'Approved',
      value: stats.approvedContracts,
      icon: <CheckCircle className="h-6 w-6 text-success" />,
    },
  ];

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Failed to load contracts.</p>
        <Button onClick={() => setCurrentPage(1)}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Management Dashboard
        </h1>
        <p className="text-muted-foreground">
          Strategic oversight and contract approvals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {managementStats.map((stat, index) => (
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
        <h2 className="text-2xl font-semibold tracking-tight">
          Contracts for Approval
        </h2>
        <ManagementContractsTable
          contracts={contracts}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          loading={loading}
          itemsPerPage={itemsPerPage}
          totalItems={totalContracts}
        />
      </div>
    </div>
  );
};

export default ManagementDashboard;
