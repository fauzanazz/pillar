import { create } from 'zustand';

import { toast } from 'sonner';
import {
  Contract,
  ContractWithRelations,
  createContract,
  CreateContractData,
  deleteContract,
  DeleteContractData,
  getContractById,
  GetContractByIdData,
  getContracts,
  GetContractsData,
  GetContractsResponse,
  updateContract,
  UpdateContractData,
} from '@/api';

interface ContractState {
  contracts: Contract[];
  totalContracts: number; // To hold the total count for pagination
  loading: boolean;
  error: string | null;
  fetchContracts: (
    params?: GetContractsData
  ) => Promise<GetContractsResponse | undefined>;
  addContract: (params: CreateContractData) => Promise<unknown>;
  updateContract: (params: UpdateContractData) => Promise<void>;
  deleteContract: (params: DeleteContractData) => Promise<void>;
  getContractById: (
    params: GetContractByIdData
  ) => Promise<ContractWithRelations | undefined>;
}

export const useContractStore = create<ContractState>((set, get) => ({
  contracts: [],
  totalContracts: 0,
  loading: false,
  error: null,

  fetchContracts: async params => {
    set({ loading: true, error: null });

    try {
      const response = await getContracts(params);
      const contracts = response.data?.data?.contracts || [];
      // Assuming the API returns totalContracts in pagination object
      const totalContracts = response.data?.data?.pagination.total || 0;

      set({
        contracts,
        totalContracts,
        loading: false,
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching contracts:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch contracts';

      set({
        error: errorMessage,
        loading: false,
        contracts: [],
        totalContracts: 0, // Reset on error
      });

      toast.error(`Failed to fetch contracts: ${errorMessage}`);
    }
  },

  addContract: async contractData => {
    set({ loading: true, error: null });

    try {
      const response = await createContract(contractData);
      const createdContract = response.data?.data;

      if (createdContract) {
        // After adding, refetch the first page to ensure data consistency
        get().fetchContracts({
          url: '/api/contracts',
          query: { page: '1', limit: '10' },
        });
        toast.success('Contract created successfully!');
      }

      return response.data;
    } catch (error) {
      console.error('Error creating contract:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create contract';
      set({ error: errorMessage, loading: false });
      toast.error(`Failed to create contract: ${errorMessage}`);
      throw error;
    }
  },

  updateContract: async updates => {
    set({ loading: true, error: null });

    try {
      const response = await updateContract(updates);
      const updatedContract = response.data?.data;

      if (updatedContract) {
        set(state => ({
          contracts: state.contracts.map(contract =>
            contract.id === updatedContract.id ? updatedContract : contract
          ),
          loading: false,
        }));
        toast.success('Contract updated successfully!');
      }
    } catch (error) {
      console.error('Error updating contract:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update contract';
      set({ error: errorMessage, loading: false });
      toast.error(`Failed to update contract: ${errorMessage}`);
      throw error;
    }
  },

  deleteContract: async id => {
    set({ loading: true, error: null });
    try {
      await deleteContract(id);
      // Refetch the current page of contracts after deletion
      // This is simpler than trying to manage the state manually if pagination is affected
      get().fetchContracts();
      toast.success('Contract deleted successfully!');
    } catch (error) {
      console.error('Error deleting contract:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete contract';
      set({ error: errorMessage, loading: false });
      toast.error(`Failed to delete contract: ${errorMessage}`);
      throw error;
    }
  },

  getContractById: async id => {
    try {
      const res = await getContractById(id);
      return res.data?.data;
    } catch (error) {
      console.error('Error fetching contract by ID:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch contract';
      set({ error: errorMessage, loading: false });
      toast.error(`Failed to fetch contract: ${errorMessage}`);
    }
  },
}));
