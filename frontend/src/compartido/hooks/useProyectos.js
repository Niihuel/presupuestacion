/**
 * Hook para gestión de proyectos/obras
 * 
 * Centraliza toda la lógica de estado y operaciones CRUD para proyectos
 * con funcionalidades avanzadas de estados, timeline y documentos
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../servicios';
import { useNotificaciones as useNotifications } from './useNotificaciones';

// Query keys
const projectsQueryKey = 'projects';

// Estados de proyecto visibles en UI (mapeados a IDs actuales)
// Nota: Para compatibilidad con la BD actual, mapeamos:
// - Activo -> 4 (En Producción) y también consideramos 3 (Aprobado) como activo en métricas
// - Pausado -> 2 (Presupuestado)
// - Completado -> 5 (Entregado)
// - Cancelado -> 6
export const PROJECT_STATUSES = {
  PLANNING:   { id: null, name: 'Planificación', color: 'gray',   bgColor: 'bg-gray-50',    textColor: 'text-gray-700' },
  ACTIVE:     { id: 4,   name: 'Activo',        color: 'blue',   bgColor: 'bg-blue-50',    textColor: 'text-blue-700' },
  PAUSED:     { id: 2,   name: 'Pausado',       color: 'yellow', bgColor: 'bg-yellow-50',  textColor: 'text-yellow-700' },
  COMPLETED:  { id: 5,   name: 'Completado',    color: 'emerald',bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
  CANCELLED:  { id: 6,   name: 'Cancelado',     color: 'red',    bgColor: 'bg-red-50',     textColor: 'text-red-700' }
};

/**
 * Hook para obtener lista de proyectos con paginación y filtros
 */
export const useProjects = (params = {}) => {
  const { 
    page = 1, 
    limit = 12, 
    search = '', 
    customerId = '', 
    status = '', 
    designerId = '',
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = params;

  return useQuery({
    queryKey: [projectsQueryKey, { page, limit, search, customerId, status, designerId, sortBy, sortOrder }],
    queryFn: () => projectService.getAll({
      page,
      limit,
      search,
      customer_id: customerId,
      status_id: status,
      designer_id: designerId,
      sort_by: sortBy,
      sort_order: sortOrder
    }),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    select: (response) => {
      const data = response.data || response; // El data real está en response.data
      return {
        projects: data.projects || [],
        pagination: {
          currentPage: data.pagination?.currentPage || 1,
          totalPages: data.pagination?.totalPages || 1,
          totalItems: data.pagination?.totalItems || 0,
          limit: data.pagination?.limit || 12
        },
        stats: {
          totalProjects: data.pagination?.totalItems || 0,
          byStatus: data.statusCounts || {},
          activeProjects: data.activeProjects || 0
        }
      };
    }
  });
};

/**
 * Hook para obtener un proyecto específico con detalles completos
 */
export const useProject = (projectId) => {
  return useQuery({
    queryKey: [projectsQueryKey, projectId],
    queryFn: () => projectService.getById(projectId),
    enabled: !!projectId,
    staleTime: 10 * 60 * 1000 // 10 minutos
  });
};

/**
 * Hook para crear nuevo proyecto
 */
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: (projectData) => projectService.createProject(projectData),
    onSuccess: (newProject) => {
      // Invalidar todas las queries de proyectos
      queryClient.invalidateQueries({ queryKey: [projectsQueryKey] });
      
      success(`El proyecto "${newProject.name}" se ha creado correctamente.`);
    },
    onError: (err) => {
      console.error('Error al crear proyecto:', err);
      error(err.response?.data?.message || 'Ha ocurrido un error inesperado al crear el proyecto.');
    }
  });
};

/**
 * Hook para actualizar proyecto existente
 */
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ id, data }) => projectService.updateProject(id, data),
    onSuccess: (updatedProject) => {
      // Invalidar queries específicas
      queryClient.invalidateQueries({ queryKey: [projectsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [projectsQueryKey, updatedProject.id] });
      
      success(`El proyecto "${updatedProject.name}" se ha actualizado correctamente.`);
    },
    onError: (err) => {
      console.error('Error al actualizar proyecto:', err);
      error(err.response?.data?.message || 'Ha ocurrido un error inesperado al actualizar el proyecto.');
    }
  });
};

/**
 * Hook para eliminar proyecto
 */
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: (projectId) => projectService.deleteProject(projectId),
    onSuccess: (_, projectId) => {
      // Remover de cache y invalidar queries
      queryClient.removeQueries({ queryKey: [projectsQueryKey, projectId] });
      queryClient.invalidateQueries({ queryKey: [projectsQueryKey] });
      
      success('El proyecto se ha eliminado correctamente.');
    },
    onError: (err) => {
      console.error('Error al eliminar proyecto:', err);
      error(err.response?.data?.message || 'Ha ocurrido un error inesperado al eliminar el proyecto.');
    }
  });
};

/**
 * Hook para cambiar estado del proyecto
 */
export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ projectId, statusId }) => projectService.updateStatus(projectId, statusId),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: [projectsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [projectsQueryKey, updatedProject.id] });
      
      const statusName = PROJECT_STATUSES[Object.keys(PROJECT_STATUSES).find(key => 
        PROJECT_STATUSES[key].id === updatedProject.status_id
      )]?.name || 'Estado actualizado';
      
      success(`El proyecto se ha movido a "${statusName}".`);
    },
    onError: (err) => {
      console.error('Error al cambiar estado del proyecto:', err);
      error(err.response?.data?.message || 'Ha ocurrido un error al cambiar el estado del proyecto.');
    }
  });
};

/**
 * Hook para gestión de documentos del proyecto
 */
export const useProjectDocuments = (projectId) => {
  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: () => projectService.getDocuments(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000
  });
};

/**
 * Hook para subir documentos al proyecto
 */
export const useUploadProjectDocument = () => {
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();

  return useMutation({
    mutationFn: ({ projectId, formData }) => projectService.uploadDocument(projectId, formData),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
      success('Documento subido correctamente.');
    },
    onError: (err) => {
      console.error('Error al subir documento:', err);
      error(err.response?.data?.message || 'Error al subir el documento.');
    }
  });
};

/**
 * Hook para obtener timeline del proyecto
 */
export const useProjectTimeline = (projectId) => {
  return useQuery({
    queryKey: ['project-timeline', projectId],
    queryFn: () => projectService.getTimeline(projectId),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000 // 2 minutos
  });
};

/**
 * Hook para proyectos agrupados por estado (para Kanban)
 */
export const useProjectsKanban = (filters = {}) => {
  return useQuery({
    queryKey: ['projects-kanban', filters],
    queryFn: () => projectService.getAll(filters),
    staleTime: 3 * 60 * 1000, // 3 minutos
    select: (data) => {
      // Organizar proyectos por estado para Kanban
      const columns = {};
      
      Object.values(PROJECT_STATUSES).forEach(status => {
        columns[status.id] = {
          ...status,
          projects: data.projects?.filter(p => p.status_id === status.id) || []
        };
      });
      
      return {
        columns,
        totalProjects: data.totalProjects || 0,
        stats: data.stats || {}
      };
    }
  });
};

/**
 * Hook para obtener clientes para selector
 */
export const useCustomersForProjects = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/api/v1/customers?active=true&limit=1000').then(res => res.data),
    staleTime: 15 * 60 * 1000, // 15 minutos
    select: (data) => data.customers || data || []
  });
};

/**
 * Hook para obtener diseñadores/usuarios
 */
export const useDesignersForProjects = () => {
  return useQuery({
    queryKey: ['designers'],
    queryFn: () => api.get('/api/v1/users?active=true&role=designer,admin').then(res => res.data),
    staleTime: 15 * 60 * 1000, // 15 minutos
    select: (data) => data.users || data || []
  });
};

// Hook compuesto para operaciones complejas
export const useProjectsManagement = (initialParams = {}) => {
  const projectsQuery = useProjects(initialParams);
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();
  const updateStatusMutation = useUpdateProjectStatus();

  return {
    // Datos
    projects: projectsQuery.data?.projects || [],
    pagination: projectsQuery.data?.pagination || {},
    stats: projectsQuery.data?.stats || {},
    
    // Estados de loading
    isLoading: projectsQuery.isLoading,
    isError: projectsQuery.isError,
    error: projectsQuery.error,
    
    // Operaciones
    createProject: createMutation.mutate,
    updateProject: updateMutation.mutate,
    deleteProject: deleteMutation.mutate,
    updateProjectStatus: updateStatusMutation.mutate,
    
    // Estados de mutaciones
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    
    // Utilidades
    refetch: projectsQuery.refetch,
    isFetching: projectsQuery.isFetching
  };
};
