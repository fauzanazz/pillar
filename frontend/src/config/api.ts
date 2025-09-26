// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ||
           process.env.NEXT_PUBLIC_BACKEND_URL ||
           'http://localhost:3001/api',
  timeout: 10000,
};

// Helper function to get the full API URL
export const getApiUrl = (endpoint: string): string => {
  // If endpoint already starts with http, return as is
  if (endpoint.startsWith('http')) {
    return endpoint;
  }

  // If endpoint starts with /, remove it to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Ensure baseURL doesn't end with / to avoid double slashes
  const baseURL = API_CONFIG.baseURL.endsWith('/')
    ? API_CONFIG.baseURL.slice(0, -1)
    : API_CONFIG.baseURL;

  return `${baseURL}/${cleanEndpoint}`;
};

// Debug helper to log API configuration
export const debugApiConfig = () => {
  console.log('API Configuration:', {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    baseURL: API_CONFIG.baseURL,
  });
};