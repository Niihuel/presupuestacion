/**
 * Custom hooks para la gestión del dashboard
 * 
 * Hooks que encapsulan la lógica de estado del servidor
 * para las operaciones del dashboard usando React Query con datos reales
 */

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services';

// Query Keys
export const dashboardKeys = {
  all: ['dashboard'],
  stats: () => [...dashboardKeys.all, 'stats'],
  data: (params) => [...dashboardKeys.all, 'data', params],
};

/**
 * Hook para obtener estadísticas del dashboard con datos reales
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardService.getDashboardStats(),
    staleTime: 5 * 60 * 1000, // 5 minutos - datos estadísticos pueden ser menos frescos
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    select: (data) => ({
      totalQuotations: data?.metrics?.totalQuotations || 0,
      totalCustomers: data?.metrics?.totalCustomers || 0,
      totalProjects: data?.metrics?.totalProjects || 0,
      totalZones: data?.metrics?.totalZones || 0,
      totalUsers: data?.metrics?.totalUsers || 0,
      recentActivity: data?.recentActivity || [],
      isEmpty: data?.isEmpty || {},
      trends: data?.metrics?.change || {}
    }),
  });
};

/**
 * Hook principal para obtener datos completos del dashboard
 */
export const useDashboard = (params = { range: 'month' }) => {
  return useQuery({
    queryKey: dashboardKeys.data(params),
    queryFn: () => dashboardService.getDashboardStats(params),
    staleTime: 3 * 60 * 1000, // 3 minutos
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    select: (data) => {
      if (!data) {
        return {
          metrics: {},
          charts: {},
          recentActivity: [],
          isEmpty: {
            quotations: true,
            customers: true,
            projects: true,
            zones: true,
            activity: true
          },
          hasData: false
        };
      }

      return {
        metrics: {
          totalQuotations: data.metrics?.totalQuotations || 0,
          totalCustomers: data.metrics?.totalCustomers || 0,
          totalProjects: data.metrics?.totalProjects || 0,
          totalZones: data.metrics?.totalZones || 0,
          totalUsers: data.metrics?.totalUsers || 0,
          change: data.metrics?.change || {}
        },
        charts: {
          quotationStatus: data.charts?.quotationStatus || [],
          topZones: data.charts?.topZones || []
        },
        recentActivity: data.recentActivity || [],
        isEmpty: data.isEmpty || {},
        period: data.period || {},
        hasData: (
          (data.metrics?.totalQuotations || 0) > 0 ||
          (data.metrics?.totalCustomers || 0) > 0 ||
          (data.metrics?.totalProjects || 0) > 0
        )
      };
    },
  });
};

/**
 * Hook para verificar si el dashboard tiene datos
 */
export const useDashboardHasData = (params = { range: 'month' }) => {
  const { data, isLoading, error } = useDashboard(params);
  
  return {
    hasData: data?.hasData || false,
    isEmpty: data?.isEmpty || {},
    isLoading,
    error
  };
};
