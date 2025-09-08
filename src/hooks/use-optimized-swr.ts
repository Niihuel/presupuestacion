"use client";

import useSWR, { SWRConfiguration, SWRResponse } from 'swr';
import { useMemo } from 'react';

/**
 * Configuración optimizada para SWR con mejores defaults para performance
 */
const optimizedSWRConfig: SWRConfiguration = {
  // Revalidar en focus solo si han pasado más de 5 minutos
  revalidateOnFocus: false,
  // Revalidar al reconectar
  revalidateOnReconnect: true,
  // Tiempo de cache por defecto
  dedupingInterval: 2000,
  // Tiempo de timeout
  errorRetryInterval: 5000,
  // Máximo 3 reintentos
  errorRetryCount: 3,
  // Usar cache mientras revalida
  revalidateIfStale: true,
};

/**
 * Hook SWR optimizado con configuración mejorada para performance
 */
export function useOptimizedSWR<Data = any, Error = any>(
  key: string | null,
  fetcher?: (key: string) => Promise<Data>,
  config?: SWRConfiguration<Data, Error>
): SWRResponse<Data, Error> {
  const mergedConfig = useMemo(() => ({
    ...optimizedSWRConfig,
    ...config,
  }), [config]);

  return useSWR(key, fetcher, mergedConfig);
}

/**
 * Hook SWR para datos que cambian raramente (configuración, roles, etc.)
 */
export function useStaticSWR<Data = any, Error = any>(
  key: string | null,
  fetcher?: (key: string) => Promise<Data>,
  config?: SWRConfiguration<Data, Error>
): SWRResponse<Data, Error> {
  const staticConfig = useMemo(() => ({
    ...optimizedSWRConfig,
    // Para datos estáticos, revalidar menos frecuentemente
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0,
    dedupingInterval: 60000, // 1 minuto
    ...config,
  }), [config]);

  return useSWR(key, fetcher, staticConfig);
}

/**
 * Hook SWR para datos que se actualizan frecuentemente
 */
export function useRealtimeSWR<Data = any, Error = any>(
  key: string | null,
  fetcher?: (key: string) => Promise<Data>,
  config?: SWRConfiguration<Data, Error>
): SWRResponse<Data, Error> {
  const realtimeConfig = useMemo(() => ({
    ...optimizedSWRConfig,
    // Para datos en tiempo real
    refreshInterval: 30000, // 30 segundos
    revalidateOnFocus: true,
    dedupingInterval: 1000, // 1 segundo
    ...config,
  }), [config]);

  return useSWR(key, fetcher, realtimeConfig);
}

/**
 * Hook SWR con paginación optimizada
 */
export function usePaginatedSWR<Data = any, Error = any>(
  getKey: (pageIndex: number, previousPageData: Data | null) => string | null,
  fetcher: (key: string) => Promise<Data>,
  config?: SWRConfiguration<Data, Error>
) {
  const paginatedConfig = useMemo(() => ({
    ...optimizedSWRConfig,
    // Para paginación, mantener cache más tiempo
    dedupingInterval: 10000, // 10 segundos
    ...config,
  }), [config]);

  // Aquí usarías useSWRInfinite si estuviera disponible
  // Por ahora, devolvemos una implementación básica
  return useSWR(
    getKey(0, null), 
    fetcher, 
    paginatedConfig
  );
}
