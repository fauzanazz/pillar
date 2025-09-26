import { axiosClient, API_ENDPOINTS } from '@/lib/axios.client';
import { Contract, User } from '@/constants/mockData';
import { env } from 'process';

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await axiosClient.post(env.BACKEND_URL + API_ENDPOINTS.auth.login, {
      email,
      password,
    });
    return response.data;
  },

  logout: async () => {
    const response = await axiosClient.post(API_ENDPOINTS.auth.logout);
    return response.data;
  },

  getSession: async () => {
    const response = await axiosClient.get(env.BACKEND_URL + API_ENDPOINTS.auth.session);
    return response.data;
  },

  getProfile: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.auth.profile);
    return response.data;
  },

  refreshToken: async () => {
    const response = await axiosClient.post(API_ENDPOINTS.auth.refresh);
    return response.data;
  },
};

// Contract API
export const contractApi = {
  getContracts: async (): Promise<Contract[]> => {
    const response = await axiosClient.get(API_ENDPOINTS.contracts.list);
    return response.data;
  },

  getContract: async (id: string): Promise<Contract> => {
    const response = await axiosClient.get(API_ENDPOINTS.contracts.get(id));
    return response.data;
  },

  createContract: async (contract: Omit<Contract, 'id'>): Promise<Contract> => {
    const response = await axiosClient.post(API_ENDPOINTS.contracts.create, contract);
    return response.data;
  },

  updateContract: async (id: string, updates: Partial<Contract>): Promise<Contract> => {
    const response = await axiosClient.put(API_ENDPOINTS.contracts.update(id), updates);
    return response.data;
  },

  deleteContract: async (id: string): Promise<void> => {
    await axiosClient.delete(API_ENDPOINTS.contracts.delete(id));
  },

  reviewContract: async (id: string, review: { status: string; comments?: string }) => {
    const response = await axiosClient.post(API_ENDPOINTS.contracts.review(id), review);
    return response.data;
  },

  approveContract: async (id: string, comments?: string) => {
    const response = await axiosClient.post(API_ENDPOINTS.contracts.approve(id), { comments });
    return response.data;
  },

  rejectContract: async (id: string, reason: string) => {
    const response = await axiosClient.post(API_ENDPOINTS.contracts.reject(id), { reason });
    return response.data;
  },
};

// User API
export const userApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await axiosClient.get(API_ENDPOINTS.users.list);
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await axiosClient.get(API_ENDPOINTS.users.get(id));
    return response.data;
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    const response = await axiosClient.put(API_ENDPOINTS.users.update(id), updates);
    return response.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.dashboard.stats);
    return response.data;
  },

  getLegalStats: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.dashboard.legal);
    return response.data;
  },

  getInternalStats: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.dashboard.internal);
    return response.data;
  },

  getManagementStats: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.dashboard.management);
    return response.data;
  },
};

// Export all APIs
export const api = {
  auth: authApi,
  contracts: contractApi,
  users: userApi,
  dashboard: dashboardApi,
};