import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
};

const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }
};

const clearTokens = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: any) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        setTokens(accessToken, newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Auth endpoints
  auth: {
    register: (data: any) => apiClient.post('/api/auth/register', data),
    login: (data: any) => apiClient.post('/api/auth/login', data),
    logout: () => apiClient.post('/api/auth/logout'),
    refreshToken: (refreshToken: string) => apiClient.post('/api/auth/refresh-token', { refreshToken }),
    forgotPassword: (email: string) => apiClient.post('/api/auth/forgot-password', { email }),
    resetPassword: (data: any) => apiClient.post('/api/auth/reset-password', data),
  },

  // User endpoints
  users: {
    getProfile: () => apiClient.get('/api/users/profile'),
    updateProfile: (data: any) => apiClient.put('/api/users/profile', data),
    getSecuritySettings: () => apiClient.get('/api/users/security-settings'),
    updateSecuritySettings: (data: any) => apiClient.put('/api/users/security-settings', data),
    changePassword: (data: any) => apiClient.post('/api/users/change-password', data),
  },

  // Portfolio endpoints
  portfolios: {
    getAll: () => apiClient.get('/api/portfolios'),
    getById: (id: string) => apiClient.get(`/api/portfolios/${id}`),
    create: (data: any) => apiClient.post('/api/portfolios', data),
    update: (id: string, data: any) => apiClient.put(`/api/portfolios/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/portfolios/${id}`),
    getOverview: () => apiClient.get('/api/portfolios/overview'),
  },

  // Investment endpoints
  investments: {
    getAll: (params?: any) => apiClient.get('/api/investments', { params }),
    getById: (id: string) => apiClient.get(`/api/investments/${id}`),
    create: (data: any) => apiClient.post('/api/investments', data),
    update: (id: string, data: any) => apiClient.put(`/api/investments/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/investments/${id}`),
    buy: (data: any) => apiClient.post('/api/investments/buy', data),
    sell: (id: string, data: any) => apiClient.post(`/api/investments/${id}/sell`, data),
  },

  // Transaction endpoints
  transactions: {
    getAll: (params?: any) => apiClient.get('/api/transactions', { params }),
    getById: (id: string) => apiClient.get(`/api/transactions/${id}`),
    create: (data: any) => apiClient.post('/api/transactions', data),
    update: (id: string, data: any) => apiClient.put(`/api/transactions/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/transactions/${id}`),
  },

  // Bank Account endpoints
  bankAccounts: {
    getAll: () => apiClient.get('/api/bank-accounts'),
    getById: (id: string) => apiClient.get(`/api/bank-accounts/${id}`),
    create: (data: any) => apiClient.post('/api/bank-accounts', data),
    update: (id: string, data: any) => apiClient.put(`/api/bank-accounts/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/bank-accounts/${id}`),
    verify: (id: string) => apiClient.post(`/api/bank-accounts/${id}/verify`),
    setPrimary: (id: string) => apiClient.post(`/api/bank-accounts/${id}/set-primary`),
  },

  // Marketplace endpoints
  marketplace: {
    getAvailable: (params?: any) => apiClient.get('/api/marketplace', { params }),
    getById: (id: string) => apiClient.get(`/api/marketplace/${id}`),
    // CRUD operations for marketplace items
    createItem: (data: any) => apiClient.post('/api/marketplace/items', data),
    updateItem: (id: string, data: any) => apiClient.put(`/api/marketplace/items/${id}`, data),
    deleteItem: (id: string) => apiClient.delete(`/api/marketplace/items/${id}`),
    getItem: (id: string) => apiClient.get(`/api/marketplace/items/${id}`),
    updatePrices: () => apiClient.post('/api/marketplace/update-prices'),
  },

  // Quotes endpoints
  quotes: {
    getQuote: (symbol: string) => apiClient.get(`/api/quotes/${symbol}`),
    getQuotes: (symbols: string[]) => apiClient.post('/api/quotes/batch', { symbols }),
    searchSymbols: (query: string) => apiClient.get(`/api/quotes/search/${query}`),
    getCacheStats: () => apiClient.get('/api/quotes/cache/stats'),
    clearCache: () => apiClient.delete('/api/quotes/cache'),
  },

  // Deposit endpoints
  deposits: {
    getAll: (params?: any) => apiClient.get('/api/deposits', { params }),
    getById: (id: string) => apiClient.get(`/api/deposits/${id}`),
    create: (data: any) => apiClient.post('/api/deposits', data),
    update: (id: string, data: any) => apiClient.put(`/api/deposits/${id}`, data),
    cancel: (id: string) => apiClient.post(`/api/deposits/${id}/cancel`),
  },

  // Withdrawal endpoints
  withdrawals: {
    getAll: (params?: any) => apiClient.get('/api/withdrawals', { params }),
    getById: (id: string) => apiClient.get(`/api/withdrawals/${id}`),
    create: (data: any) => apiClient.post('/api/withdrawals', data),
    update: (id: string, data: any) => apiClient.put(`/api/withdrawals/${id}`, data),
    cancel: (id: string) => apiClient.post(`/api/withdrawals/${id}/cancel`),
  },

  // Analytics endpoints
  analytics: {
    getPortfolioPerformance: (params?: any) => apiClient.get('/api/analytics/portfolio-performance', { params }),
    getPortfolioAllocation: () => apiClient.get('/api/analytics/portfolio-allocation'),
    getInvestmentPerformance: (params?: any) => apiClient.get('/api/analytics/investment-performance', { params }),
    getTransactionStats: (params?: any) => apiClient.get('/api/analytics/transaction-stats', { params }),
    getDashboardData: () => apiClient.get('/api/analytics/dashboard'),
  },

  // Two-Factor Authentication endpoints
  twoFactor: {
    setup: () => apiClient.post('/api/2fa/setup'),
    verify: (data: any) => apiClient.post('/api/2fa/verify', data),
    disable: (data: any) => apiClient.post('/api/2fa/disable', data),
    generateBackupCodes: () => apiClient.post('/api/2fa/backup-codes'),
  },

  // Audit Log endpoints
  auditLogs: {
    getAll: (params?: any) => apiClient.get('/api/audit-logs', { params }),
    getById: (id: string) => apiClient.get(`/api/audit-logs/${id}`),
    export: (params?: any) => apiClient.get('/api/audit-logs/export', { params }),
  },
};

export default apiClient;
