'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useContractStore } from '@/stores/contractStore';
import { searchContract, transformSearchMatches } from '@/services/ai';
import { debounce } from '@/utils/debounce';

import ContractTable from '../contracts/ContractTable';
import { FileText, Clock, CheckCircle, AlertTriangle, Search, Loader2 } from 'lucide-react';
import StatCard from '../dashboard/StatCard';
import { Contract } from '@/api/types.gen';

const LegalDashboard = () => {
  const contracts = useContractStore(state => state.contracts);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contract[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const searchResponse = await searchContract(query);
        const transformedContracts = transformSearchMatches(searchResponse.matches || []);
        setSearchResults(transformedContracts);
        setHasSearched(true);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cancel any pending debounced search when component unmounts
      debouncedSearch.cancel?.();
    };
  }, [debouncedSearch]);

  // Filter contracts relevant to legal team
  const legalContracts = useMemo(() => {
    const baseContracts = hasSearched ? searchResults : contracts;
    return baseContracts.filter(
      c =>
        c.status === 'Legal Review' ||
        c.status === 'Management Review' ||
        c.status === 'Accepted' ||
        c.status === 'Canceled'
    );
  }, [contracts, searchResults, hasSearched]);

  const stats = useMemo(() => {
    const totalContracts = legalContracts.length;
    const pendingReview = contracts.filter(
      c => c.status === 'Legal Review'
    ).length;
    const reviewedContracts = contracts.filter(
      c => c.status === 'Management Review' || c.status === 'Accepted'
    ).length;
    const rejectedContracts = contracts.filter(
      c => c.status === 'Canceled'
    ).length;

    return {
      totalContracts,
      pendingReview,
      reviewedContracts,
      rejectedContracts,
    };
  }, [contracts, legalContracts]);

  const legalStats = [
    {
      title: 'Total Contracts',
      value: stats.totalContracts,
      description: 'Legal oversight',
      icon: <FileText className="h-6 w-6 text-accent" />,
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Pending Review',
      value: stats.pendingReview,
      description: 'Awaiting legal review',
      icon: <Clock className="h-6 w-6 text-warning" />,
    },
    {
      title: 'Reviewed',
      value: stats.reviewedContracts,
      description: 'Completed reviews',
      icon: <CheckCircle className="h-6 w-6 text-success" />,
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'Rejected',
      value: stats.rejectedContracts,
      description: 'Legal concerns',
      icon: <AlertTriangle className="h-6 w-6 text-destructive" />,
    },
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

      {/* Search Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Contracts for Review
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={isSearching}
                className="pl-10 pr-10 py-2 w-80 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {hasSearched 
                ? `Found ${legalContracts.length} contracts matching "${searchQuery}"`
                : `Showing ${legalContracts.length} contracts requiring legal attention`
              }
            </p>
          </div>
        </div>

        <ContractTable filteredContracts={legalContracts} />
      </div>
    </div>
  );
};

export default LegalDashboard;
