import axios from 'axios';

// Create axios instance with default configuration
export const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
axiosClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or your auth store
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const parsedAuth = JSON.parse(authStorage);
          const token = parsedAuth.state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error parsing auth storage:', error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden
          console.error('Access denied:', data.message || 'Insufficient permissions');
          break;
        case 404:
          console.error('Resource not found:', error.config.url);
          break;
        case 500:
          console.error('Server error:', data.message || 'Internal server error');
          break;
        default:
          console.error('API Error:', data.message || error.message);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error - no response received:', error.request);
    } else {
      // Something else happened
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API endpoints configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: '/auth/sign-in/email',
    logout: '/auth/logout',
    session: '/auth/get-session',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },

  // Contract endpoints
  contracts: {
    list: '/contracts',
    create: '/contracts',
    get: (id: string) => `/contracts/${id}`,
    update: (id: string) => `/contracts/${id}`,
    delete: (id: string) => `/contracts/${id}`,
    review: (id: string) => `/contracts/${id}/review`,
    approve: (id: string) => `/contracts/${id}/approve`,
    reject: (id: string) => `/contracts/${id}/reject`,
  },

  // User endpoints
  users: {
    list: '/users',
    get: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
  },

  // Dashboard endpoints
  dashboard: {
    stats: '/dashboard/stats',
    legal: '/dashboard/legal',
    internal: '/dashboard/internal',
    management: '/dashboard/management',
  },
} as const;

export default axiosClient;