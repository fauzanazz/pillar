'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useContractStore } from '@/stores/contractStore';
import StatCard from '@/components/dashboard/StatCard';
import { InternalContractTable } from '@/components/internal/InternalContractTable';
import { AddContractModal, ContractForm } from '@/components/contracts/AddContractModal';
import { EditContractModal } from '@/components/contracts/EditContractModal';
import { Contract } from '@/api/types.gen';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Search,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateContract, searchContract, transformSearchMatches } from '@/services/ai';
import { debounce } from '@/utils/debounce';

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
  const fetchContracts = useContractStore(state => state.fetchContracts);
  const addContract = useContractStore(state => state.addContract);
  const updateContract = useContractStore(state => state.updateContract);
  const deleteContract = useContractStore(state => state.deleteContract);
  const loading = useContractStore(state => state.loading);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contract[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'draft' | 'accepted' | 'rejected'>('all');

  // Fetch contracts on component mount
  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

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

  // Internal team sees all contracts but focuses on their workflow
  const stats = useMemo(() => {
    const baseContracts = hasSearched ? searchResults : contracts;
    const totalContracts = contracts.length; // Always show total from all contracts
    const draftContracts = contracts.filter(c => c.status === 'Draft').length;
    const activeContracts = contracts.filter(
      c => c.status === 'Accepted'
    ).length;
    // const nearExpireContracts = contracts.filter(
    //   c => c.status === 'near_expire'
    // ).length;

    // Apply status filter
    let filteredContracts = baseContracts;
    switch (activeFilter) {
      case 'active':
        // Active contracts are those currently in progress (not yet decided by management)
        filteredContracts = baseContracts.filter(c => 
          c.status === 'Legal Review' || c.status === 'Management Review'
        );
        break;
      case 'draft':
        filteredContracts = baseContracts.filter(c => c.status === 'Draft');
        break;
      case 'accepted':
        // Contracts accepted by management
        filteredContracts = baseContracts.filter(c => c.status === 'Accepted');
        break;
      case 'rejected':
        // Contracts rejected by management
        filteredContracts = baseContracts.filter(c => c.status === 'Rejected');
        break;
      case 'all':
      default:
        filteredContracts = baseContracts;
        break;
    }

    return {
      totalContracts,
      draftContracts,
      activeContracts,
      // nearExpireContracts,
      filteredContracts,
    };
  }, [contracts, searchResults, hasSearched, activeFilter]);

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
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                disabled={isSearching}
                className="pl-10 pr-10 w-80 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {hasSearched 
                ? `Found ${stats.filteredContracts.length} contracts matching "${searchQuery}"`
                : `Showing ${stats.filteredContracts.length} contracts`
              }
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeFilter === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeFilter === 'active'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveFilter('draft')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeFilter === 'draft'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Draft
          </button>
          <button
            onClick={() => setActiveFilter('accepted')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeFilter === 'accepted'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Accepted
          </button>
          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeFilter === 'rejected'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Rejected
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading contracts...</span>
          </div>
        ) : (
          <InternalContractTable
            contracts={stats.filteredContracts}
            onEdit={contract => {
              setEditingContract(contract);
            }}
            onDelete={contract => {
              deleteContract({
                url: '/api/contracts/{id}',
                path: {
                  id: contract.id.toString(),
                },
              });
            }}
            onSendToNextStep={contract => {
              // Update status based on current status
              let newStatus: Contract['status'];

              console.log('Curretn Status : ', contract.status);
              switch (contract.status) {
                case 'Draft':
                  newStatus = 'Legal Review';
                  break;
                case 'Legal Review':
                  newStatus = 'Management Review';
                  break;
                case 'Management Review':
                  newStatus = 'Accepted';
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
              // TODO: Implement view modal or navigate to detail page
            }}
          />
        )}
      </div>

      {/* Add Contract Modal */}
      <AddContractModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async contractData => {      
          const response = await addContract({
            url: '/api/contracts',
            body: contractData,
          });

          console.log("response", response);

          // @ts-expect-error - Response type may not have success property
          if (response.success!) {
            // @ts-expect-error - Response data may not have presignedUrl property
            const presignedUrl = response.data?.presignedUrl;
            
            // Convert ContractFormUpload to ContractForm format
            const contractFormData: ContractForm = {
              title: contractData.title,
              description: contractData.description || '',
              endDate: contractData.endDate || '',
              parties: contractData.party.map(p => ({
                name: p.partyName,
                representation: p.partyRole,
              })),
            };
            
            await generateContract(contractFormData, presignedUrl);
            console.log('Contract generated successfully');
          }
        }}
      />

      {/* Edit Contract Modal */}
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
