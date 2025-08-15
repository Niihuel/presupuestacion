/**
 * Custom Hook para Configuración del Sistema
 * 
 * Hook que encapsula la lógica de estado del servidor
 * para la configuración del sistema usando React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemConfigService } from '../servicios';
import { toast } from 'sonner';

// Query Keys
export const systemConfigKeys = {
  all: ['systemConfig'],
  config: () => [...systemConfigKeys.all, 'config'],
  section: (section) => [...systemConfigKeys.all, 'section', section],
};

/**
 * Hook para obtener la configuración completa del sistema
 */
export const useSystemConfig = () => {
  return useQuery({
    queryKey: systemConfigKeys.config(),
    queryFn: () => systemConfigService.getSystemConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    select: (data) => data?.config || data || {},
  });
};

/**
 * Hook para obtener una sección específica de configuración
 */
export const useSystemConfigSection = (section) => {
  return useQuery({
    queryKey: systemConfigKeys.section(section),
    queryFn: () => systemConfigService.getSystemConfigSection(section),
    enabled: !!section,
    staleTime: 5 * 60 * 1000, // 5 minutos
    select: (data) => data?.config || data || {},
  });
};

/**
 * Hook para actualizar la configuración del sistema
 */
export const useUpdateSystemConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configData) => systemConfigService.updateSystemConfig(configData),
    onSuccess: (data) => {
      // Invalidar toda la configuración para refrescar
      queryClient.invalidateQueries({ queryKey: systemConfigKeys.all });
      
      toast.success('Configuración actualizada exitosamente');
    },
    onError: (error) => {
      console.error('Error updating system config:', error);
      toast.error(error.message || 'Error al actualizar la configuración');
    },
  });
};

/**
 * Hook para actualizar una sección específica de configuración
 */
export const useUpdateSystemConfigSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ section, data }) => systemConfigService.updateSystemConfigSection(section, data),
    onSuccess: (data, variables) => {
      const { section } = variables;
      
      // Actualizar la sección específica en cache
      queryClient.setQueryData(
        systemConfigKeys.section(section),
        data
      );
      
      // Invalidar configuración completa
      queryClient.invalidateQueries({ queryKey: systemConfigKeys.config() });
      
      toast.success(`Configuración de ${section} actualizada exitosamente`);
    },
    onError: (error) => {
      console.error('Error updating system config section:', error);
      toast.error(error.message || 'Error al actualizar la configuración');
    },
  });
};

/**
 * Hook para resetear la configuración a valores por defecto
 */
export const useResetSystemConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (section) => systemConfigService.resetSystemConfig(section),
    onSuccess: (data, section) => {
      // Invalidar toda la configuración para refrescar
      queryClient.invalidateQueries({ queryKey: systemConfigKeys.all });
      
      const message = section 
        ? `Configuración de ${section} restablecida`
        : 'Configuración restablecida a valores por defecto';
      
      toast.success(message);
    },
    onError: (error) => {
      console.error('Error resetting system config:', error);
      toast.error(error.message || 'Error al restablecer la configuración');
    },
  });
};

/**
 * Hook para exportar la configuración actual
 */
export const useExportSystemConfig = () => {
  return useMutation({
    mutationFn: () => systemConfigService.exportSystemConfig(),
    onSuccess: (data) => {
      // Crear un blob con los datos y descargar
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Configuración exportada exitosamente');
    },
    onError: (error) => {
      console.error('Error exporting system config:', error);
      toast.error(error.message || 'Error al exportar la configuración');
    },
  });
};

/**
 * Hook para importar configuración
 */
export const useImportSystemConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configFile) => systemConfigService.importSystemConfig(configFile),
    onSuccess: (data) => {
      // Invalidar toda la configuración para refrescar
      queryClient.invalidateQueries({ queryKey: systemConfigKeys.all });
      
      toast.success('Configuración importada exitosamente');
    },
    onError: (error) => {
      console.error('Error importing system config:', error);
      toast.error(error.message || 'Error al importar la configuración');
    },
  });
};

/**
 * Hook para validar la configuración actual
 */
export const useValidateSystemConfig = () => {
  return useMutation({
    mutationFn: () => systemConfigService.validateSystemConfig(),
    onSuccess: (data) => {
      if (data.isValid) {
        toast.success('Configuración válida');
      } else {
        toast.warning('Se encontraron problemas en la configuración');
      }
    },
    onError: (error) => {
      console.error('Error validating system config:', error);
      toast.error(error.message || 'Error al validar la configuración');
    },
  });
};
