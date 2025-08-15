/**
 * Hook de Clientes
 * 
 * Gestión de datos de clientes con React Query
 * para el sistema de presupuestación
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../servicios';
import { useNotifications } from './useNotificaciones';

// Query keys
const QUERY_KEYS = {
  CUSTOMERS: 'customers',
  CUSTOMER: 'customer'
};

/**
 * Hook para obtener todos los clientes
 */
export const useCustomers = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CUSTOMERS, options],
    queryFn: () => customerService.getCustomers(options),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    ...options
  });
};

/**
 * Hook para obtener un cliente específico
 */
export const useCustomer = (id, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CUSTOMER, id],
    queryFn: () => customerService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    ...options
  });
};

/**
 * Hook para crear un nuevo cliente
 */
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: customerService.create,
    onSuccess: (data) => {
      // Invalidar y refetch la lista de clientes
      queryClient.invalidateQueries([QUERY_KEYS.CUSTOMERS]);
      
      // Agregar el nuevo cliente al cache
      queryClient.setQueriesData([QUERY_KEYS.CUSTOMERS], (oldData) => {
        if (!oldData || !oldData.customers) return oldData;
        
        return {
          ...oldData,
          customers: [data, ...oldData.customers]
        };
      });
      
      success('Cliente creado correctamente.');
    },
    onError: (err) => {
      console.error('Error al crear cliente:', err);
      error('Error al crear el cliente');
    }
  });
};

/**
 * Hook para actualizar un cliente
 */
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, data }) => customerService.update(id, data),
    onSuccess: (data, variables) => {
      const { id } = variables;
      
      // Actualizar el cliente específico en el cache
      queryClient.setQueryData([QUERY_KEYS.CUSTOMER, id], data);
      
      // Actualizar la lista de clientes
      queryClient.setQueriesData([QUERY_KEYS.CUSTOMERS], (oldData) => {
        if (!oldData || !oldData.customers) return oldData;
        
        return {
          ...oldData,
          customers: oldData.customers.map(customer => 
            customer.id === id ? { ...customer, ...data } : customer
          )
        };
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries([QUERY_KEYS.CUSTOMERS]);
      
      success('Cliente actualizado correctamente.');
    },
    onError: (err) => {
      console.error('Error al actualizar cliente:', err);
      error('Error al actualizar el cliente');
    }
  });
};

/**
 * Hook para eliminar un cliente
 */
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: customerService.delete,
    onSuccess: (_, deletedId) => {
      // Remover el cliente de la lista
      queryClient.setQueriesData([QUERY_KEYS.CUSTOMERS], (oldData) => {
        if (!oldData || !oldData.customers) return oldData;
        
        return {
          ...oldData,
          customers: oldData.customers.filter(customer => customer.id !== deletedId)
        };
      });
      
      // Remover el cliente específico del cache
      queryClient.removeQueries([QUERY_KEYS.CUSTOMER, deletedId]);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries([QUERY_KEYS.CUSTOMERS]);
      
      success('Cliente eliminado correctamente.');
    },
    onError: (err) => {
      console.error('Error al eliminar cliente:', err);
      error('Error al eliminar el cliente');
    }
  });
};

/**
 * Hook para búsqueda de clientes
 */
export const useSearchCustomers = (searchTerm, options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CUSTOMERS, 'search', searchTerm],
    queryFn: () => customerService.search(searchTerm),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 2 * 60 * 1000, // 2 minutos
    ...options
  });
};

/**
 * Hook para obtener estadísticas de clientes
 */
export const useCustomersStats = (options = {}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CUSTOMERS, 'stats'],
    queryFn: customerService.getStats,
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
    ...options
  });
};
