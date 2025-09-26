'use client';

import { useMemo, useEffect, useState } from 'react';
import { useContractStore } from '@/stores/contractStore';
import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import StatCard from '../dashboard/StatCard';
import { LegalContractsTable } from './LegalContractTable';
import { Button } from '../ui/button';

const LegalDashboard = () => {
  const { contracts, fetchContracts, loading, error, totalContracts } =
    useContractStore();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch contracts when the current page changes
  useEffect(() => {
    fetchContracts({
      url: '/api/contracts',
      query: {
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        status: 'Legal Review', // Example filter for legal dashboard
      },
    });
  }, [currentPage]); // Removed fetchContracts from dependencies

  const totalPages = Math.ceil(totalContracts / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Memoized stats based on the fetched contracts for the current page
  const stats = useMemo(() => {
    // Note: These stats will reflect the current page, not all contracts.
    // For global stats, you might need a separate API call or adjust the store.
    const pendingReview = contracts.filter(
      c => c.status === 'Legal Review'
    ).length;
    return {
      totalContracts: totalContracts, // Use total from store for accuracy
      pendingReview,
    };
  }, [contracts, totalContracts]);

  const legalStats = [
    {
      title: 'Total Contracts',
      value: stats.totalContracts,
      icon: <FileText className="h-6 w-6 text-accent" />,
    },
    {
      title: 'Pending Review',
      value: stats.pendingReview,
      icon: <Clock className="h-6 w-6 text-warning" />,
    },
    {
      title: 'Reviewed',
      value: 0, // Placeholder
      icon: <CheckCircle className="h-6 w-6 text-success" />,
    },
    {
      title: 'Rejected',
      value: 0, // Placeholder
      icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
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
        <h1 className="text-3xl font-bold tracking-tight">Legal Dashboard</h1>
        <p className="text-muted-foreground">
          Review and approve contracts requiring legal oversight.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {legalStats.map((stat, index) => (
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
          Contracts for Review
        </h2>
        <LegalContractsTable
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

export default LegalDashboard;
