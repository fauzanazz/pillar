'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useContractStore } from '@/stores/contractStore';
import { searchContract } from '@/services/ai';
import { debounce } from '@/utils/debounce';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Loader2,
} from 'lucide-react';
import StatCard from '../dashboard/StatCard';
import { LegalContractsTable } from './LegalContractTable';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Contract } from '@/api';

const LegalDashboard = () => {
  const { contracts, fetchContracts, loading, error, totalContracts } =
    useContractStore();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contract[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch contracts when the current page changes, but not if a search is active
  useEffect(() => {
    if (!hasSearched) {
      fetchContracts({
        url: '/api/contracts',
        query: {
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          status: 'Legal Review', // Example filter for legal dashboard
        },
      });
    }
  }, [currentPage, hasSearched]); // Removed fetchContracts

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        setIsSearching(false);
        // Refetch paginated data when search is cleared
        fetchContracts({
          url: '/api/contracts',
          query: {
            page: '1',
            limit: itemsPerPage.toString(),
            status: 'Legal Review',
          },
        });
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchContract(query);
        setSearchResults(results.data || []);
        setHasSearched(true);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [] // Empty dependency array for stable debounce function
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const totalPages = Math.ceil(totalContracts / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const stats = useMemo(() => {
    const pendingReview = contracts.filter(
      c => c.status === 'Legal Review'
    ).length;
    return {
      totalContracts: totalContracts,
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

  const displayedContracts = hasSearched ? searchResults : contracts;

  if (error && !loading) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">Failed to load contracts.</p>
        <Button
          onClick={() =>
            fetchContracts({
              url: '/api/contracts',
              query: {
                page: '1',
                limit: itemsPerPage.toString(),
                status: 'Legal Review',
              },
            })
          }
        >
          Retry
        </Button>
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Contracts for Review
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                disabled={isSearching}
                className="pl-10 pr-10 w-80 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {hasSearched
                ? `Found ${displayedContracts.length} contracts`
                : `Showing contracts for page ${currentPage}`}
            </p>
          </div>
        </div>

        <LegalContractsTable
          contracts={displayedContracts}
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
