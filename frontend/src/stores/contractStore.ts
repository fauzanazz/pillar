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
  updateContract,
  UpdateContractData,
} from '@/api';

interface ContractState {
  contracts: Contract[];
  loading: boolean;
  error: string | null;
  fetchContracts: (params?: GetContractsData) => Promise<void>;
  addContract: (params: CreateContractData) => Promise<unknown>;
  updateContract: (params: UpdateContractData) => Promise<void>;
  deleteContract: (params: DeleteContractData) => Promise<void>;
  getContractById: (
    params: GetContractByIdData
  ) => Promise<ContractWithRelations | undefined>;
}

export const useContractStore = create<ContractState>((set, get) => ({
  contracts: [],
  loading: false,
  error: null,

  fetchContracts: async params => {
    set({ loading: true, error: null });

    try {
      const response = await getContracts(params);
      const contracts = response.data?.data?.contracts || [];

      set({
        contracts,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching contracts:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch contracts';

      set({
        error: errorMessage,
        loading: false,
        contracts: [], // Clear contracts on error
      });

      toast.error(`Failed to fetch contracts: ${errorMessage}`);
    }
  },

  addContract: async contractData => {
    set({ loading: true, error: null });

    try {
      const response = await createContract(contractData);
      // const response = await openApi.contracts.createContract(apiContractData);
      const createdContract = response.data?.data;

      if (createdContract) {
        set(state => ({
          contracts: [...state.contracts, createdContract],
          loading: false,
        }));

        toast.success('Contract created successfully!');
      }
      
      return response.data; // Return the response so it can be used in the UI
    } catch (error) {
      console.error('Error creating contract:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create contract';

      set({
        error: errorMessage,
        loading: false,
      });

      toast.error(`Failed to create contract: ${errorMessage}`);
      throw error; // Re-throw to let the UI handle it
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

      set({
        error: errorMessage,
        loading: false,
      });

      toast.error(`Failed to update contract: ${errorMessage}`);
      throw error;
    }
  },

  deleteContract: async id => {
    set({ loading: true, error: null });

    try {
      const response = await deleteContract(id);

      const deleted = response.data?.data;

      set(state => ({
        contracts: state.contracts.filter(
          contract => contract.id !== deleted?.id
        ),
        loading: false,
      }));

      toast.success('Contract deleted successfully!');
    } catch (error) {
      console.error('Error deleting contract:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete contract';

      set({
        error: errorMessage,
        loading: false,
      });

      toast.error(`Failed to delete contract: ${errorMessage}`);
      throw error;
    }
  },

  getContractById: async id => {
    try {
      const res = await getContractById(id);
      const conrtract = res.data?.data;
      return conrtract;
    } catch (error) {
      console.error('Error deleting contract:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete contract';

      set({
        error: errorMessage,
        loading: false,
      });

      toast.error(`Failed to delete contract: ${errorMessage}`);
    }
  },
}));
