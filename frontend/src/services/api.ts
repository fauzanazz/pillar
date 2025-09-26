import { axiosClient, API_ENDPOINTS } from '@/lib/axios.client';
import { Contract, User } from '@/constants/mockData';
import { getApiUrl, debugApiConfig } from '@/config/api';

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const apiUrl = getApiUrl(API_ENDPOINTS.auth.login);
    console.log('Login API URL: ', apiUrl);

    const response = await axiosClient.post(apiUrl, {
      email,
      password,
      rememberMe: true,
      callbackURL : "/internal"
    });
    return response.data;
  },

  logout: async () => {
    const apiUrl = getApiUrl(API_ENDPOINTS.auth.logout);
    const response = await axiosClient.post(apiUrl);
    return response.data;
  },

  getSession: async () => {
    const apiUrl = getApiUrl(API_ENDPOINTS.auth.session);
    console.log('GetSession API URL: ', apiUrl);

    const response = await axiosClient.get(apiUrl);
    return response.data;
  },

  getProfile: async () => {
    const apiUrl = getApiUrl(API_ENDPOINTS.auth.profile);
    const response = await axiosClient.get(apiUrl);
    return response.data;
  },

  refreshToken: async () => {
    const apiUrl = getApiUrl(API_ENDPOINTS.auth.refresh);
    const response = await axiosClient.post(apiUrl);
    return response.data;
  },
};

// Contract API
export const contractApi = {
  getContracts: async (): Promise<Contract[]> => {
    const apiUrl = getApiUrl(API_ENDPOINTS.contracts.list);
    const response = await axiosClient.get(apiUrl);
    return response.data;
  },

  getContract: async (id: string): Promise<Contract> => {
    const apiUrl = getApiUrl(API_ENDPOINTS.contracts.get(id));
    const response = await axiosClient.get(apiUrl);
    return response.data;
  },

  createContract: async (contract: Omit<Contract, 'id'>): Promise<Contract> => {
    const apiUrl = getApiUrl(API_ENDPOINTS.contracts.create);
    const response = await axiosClient.post(apiUrl, contract);
    return response.data;
  },

  updateContract: async (
    id: string,
    updates: Partial<Contract>
  ): Promise<Contract> => {
    const apiUrl = getApiUrl(API_ENDPOINTS.contracts.update(id));
    const response = await axiosClient.put(apiUrl, updates);
    return response.data;
  },

  deleteContract: async (id: string): Promise<void> => {
    const apiUrl = getApiUrl(API_ENDPOINTS.contracts.delete(id));
    await axiosClient.delete(apiUrl);
  },

  reviewContract: async (
    id: string,
    review: { status: string; comments?: string }
  ) => {
    const apiUrl = getApiUrl(API_ENDPOINTS.contracts.review(id));
    const response = await axiosClient.post(apiUrl, review);
    return response.data;
  },

  approveContract: async (id: string, comments?: string) => {
    const apiUrl = getApiUrl(API_ENDPOINTS.contracts.approve(id));
    const response = await axiosClient.post(apiUrl, { comments });
    return response.data;
  },

  rejectContract: async (id: string, reason: string) => {
    const apiUrl = getApiUrl(API_ENDPOINTS.contracts.reject(id));
    const response = await axiosClient.post(apiUrl, { reason });
    return response.data;
  },
};

// User API
export const userApi = {
  getUsers: async (): Promise<User[]> => {
    const apiUrl = getApiUrl(API_ENDPOINTS.users.list);
    const response = await axiosClient.get(apiUrl);
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const apiUrl = getApiUrl(API_ENDPOINTS.users.get(id));
    const response = await axiosClient.get(apiUrl);
    return response.data;
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    const apiUrl = getApiUrl(API_ENDPOINTS.users.update(id));
    const response = await axiosClient.put(apiUrl, updates);
    return response.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const apiUrl = getApiUrl(API_ENDPOINTS.dashboard.stats);
    const response = await axiosClient.get(apiUrl);
    return response.data;
  },

  getLegalStats: async () => {
    const apiUrl = getApiUrl(API_ENDPOINTS.dashboard.legal);
    const response = await axiosClient.get(apiUrl);
    return response.data;
  },

  getInternalStats: async () => {
    const apiUrl = getApiUrl(API_ENDPOINTS.dashboard.internal);
    const response = await axiosClient.get(apiUrl);
    return response.data;
  },

  getManagementStats: async () => {
    const apiUrl = getApiUrl(API_ENDPOINTS.dashboard.management);
    const response = await axiosClient.get(apiUrl);
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
