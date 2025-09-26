import { axiosClient, API_ENDPOINTS } from '@/lib/axios.client';

import { getApiUrl, debugApiConfig } from '@/config/api';
import { User } from '@/stores/authStore';

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const apiUrl = getApiUrl(API_ENDPOINTS.auth.login);
    console.log('Login API URL: ', apiUrl);

    const response = await axiosClient.post(apiUrl, {
      email,
      password,
      rememberMe: true,
      callbackURL: '/internal',
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

// Note: Contract API is now handled by OpenAPI client in @/services/openapi
// This section is kept for reference but should not be used

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

// Export all APIs (Note: contracts now use OpenAPI client)
export const api = {
  auth: authApi,
  users: userApi,
  dashboard: dashboardApi,
};
