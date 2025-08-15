/**
 * React Query Provider Configuration
 * 
 * Configura el cliente de React Query con opciones optimizadas
 * para el manejo de estado del servidor
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Configuración del QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos
      staleTime: 5 * 60 * 1000,
      // Mantener datos en cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Retry en caso de error
      retry: (failureCount, error) => {
        // No retry para errores 4xx
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      // Refetch cuando la ventana vuelve a tener foco
      refetchOnWindowFocus: false,
      // Refetch cuando se reconecta
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry para mutaciones en caso de error de red
      retry: (failureCount, error) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Solo mostrar devtools en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

export { queryClient };
export default QueryProvider;
