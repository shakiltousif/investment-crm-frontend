import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Query keys for consistent caching
export const queryKeys = {
  portfolios: ['portfolios'] as const,
  portfolio: (id: string) => ['portfolios', id] as const,
  investments: (filters?: any) => ['investments', filters] as const,
  investment: (id: string) => ['investments', id] as const,
  transactions: (filters?: any) => ['transactions', filters] as const,
  bankAccounts: ['bankAccounts'] as const,
  bankAccount: (id: string) => ['bankAccounts', id] as const,
  user: ['user'] as const,
  analytics: ['analytics'] as const,
  marketplace: (filters?: any) => ['marketplace', filters] as const,
};

// Custom hooks for data fetching with caching
export function usePortfolios() {
  return useQuery({
    queryKey: queryKeys.portfolios,
    queryFn: () => api.portfolios.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: queryKeys.portfolio(id),
    queryFn: () => api.portfolios.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInvestments(filters?: any) {
  return useQuery({
    queryKey: queryKeys.investments(filters),
    queryFn: () => api.investments.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTransactions(filters?: any) {
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: () => api.transactions.getAll(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
}

export function useBankAccounts() {
  return useQuery({
    queryKey: queryKeys.bankAccounts,
    queryFn: () => api.bankAccounts.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: () => api.analytics.getDashboardData(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useMarketplace(filters?: any) {
  return useQuery({
    queryKey: queryKeys.marketplace(filters),
    queryFn: () => api.marketplace.getAvailable(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  });
}

// Mutation hooks for data updates
export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.portfolios.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolios });
    },
  });
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.portfolios.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolios });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolio(id) });
    },
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.portfolios.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolios });
    },
  });
}

export function useBuyInvestment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.investments.buy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments() });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolios });
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
    },
  });
}

export function useSellInvestment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.investments.sell(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments() });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolios });
      queryClient.invalidateQueries({ queryKey: queryKeys.bankAccounts });
    },
  });
}

// Pagination hook
export function usePagination<T>(
  data: T[],
  itemsPerPage: number = 20
) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);
  
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);
  
  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);
  
  return {
    currentPage,
    totalPages,
    currentData,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

// Debounced search hook
export function useDebouncedSearch<T>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  delay: number = 300
) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);
  
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm) return data;
    
    const term = debouncedSearchTerm.toLowerCase();
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
      })
    );
  }, [data, debouncedSearchTerm, searchFields]);
  
  return filteredData;
}

// Virtual scrolling hook for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 100) { // Log slow renders
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

// Memory usage monitoring
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  
  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo((performance as any).memory);
      }
    };
    
    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return memoryInfo;
}

// Lazy loading hook
export function useLazyLoading<T>(
  loadFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loadFunction();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, dependencies);
  
  return { data, loading, error, load };
}

// Optimized re-render prevention
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
): T {
  return useCallback(callback, dependencies) as T;
}

export function useOptimizedMemo<T>(
  factory: () => T,
  dependencies: any[]
): T {
  return useMemo(factory, dependencies);
}

// Cache management utilities
export function useCacheManagement() {
  const queryClient = useQueryClient();
  
  const clearCache = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);
  
  const invalidateQueries = useCallback((queryKey: any) => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient]);
  
  const prefetchQuery = useCallback(async (queryKey: any, queryFn: () => Promise<any>) => {
    await queryClient.prefetchQuery({ queryKey, queryFn });
  }, [queryClient]);
  
  return {
    clearCache,
    invalidateQueries,
    prefetchQuery,
  };
}
