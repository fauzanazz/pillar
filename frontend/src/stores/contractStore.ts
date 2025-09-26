import { create } from 'zustand';
import { MOCK_CONTRACTS, Contract } from '@/constants/mockData';

interface ContractState {
  contracts: Contract[];
  loading: boolean;
  error: string | null;
  fetchContracts: () => void;
  addContract: (contract: Omit<Contract, 'id'>) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
  getContractById: (id: string) => Contract | undefined;
}

export const useContractStore = create<ContractState>((set, get) => ({
  contracts: [],
  loading: false,
  error: null,

  fetchContracts: () => {
    set({ loading: true, error: null });

    // Simulate API call delay
    setTimeout(() => {
      set({
        contracts: MOCK_CONTRACTS,
        loading: false,
      });
    }, 100);
  },

  addContract: (contractData) => {
    const newContract: Contract = {
      ...contractData,
      id: Date.now().toString(), // Simple ID generation for mock
    };

    set((state) => ({
      contracts: [...state.contracts, newContract],
    }));
  },

  updateContract: (id, updates) => {
    set((state) => ({
      contracts: state.contracts.map((contract) =>
        contract.id === id ? { ...contract, ...updates } : contract
      ),
    }));
  },

  deleteContract: (id) => {
    set((state) => ({
      contracts: state.contracts.filter((contract) => contract.id !== id),
    }));
  },

  getContractById: (id) => {
    return get().contracts.find((contract) => contract.id === id);
  },
}));