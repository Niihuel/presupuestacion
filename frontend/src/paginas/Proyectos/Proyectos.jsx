/**
 * Página Principal de Proyectos
 * 
 * Vista principal del módulo de proyectos con gestión completa:
 * - Listado con métricas y filtros
 * - CRUD completo de proyectos
 * - Integración con clientes
 * - Diseño corporativo unificado - MATCHING DASHBOARD SPACING
 */

import { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar
} from 'lucide-react';

// Hooks y servicios
import { 
  useProjects, 
  useCreateProject, 
  useUpdateProject, 
  useDeleteProject,
  PROJECT_STATUSES 
} from '@compartido/hooks/useProjectsHook';
import { useCustomers } from '@compartido/hooks/useCustomersHook';

// Componentes
import ProjectModal from '@componentes/projects/components/ProjectModal';
import ProjectViewModal from './ProjectViewModal';
import DeleteConfirmModal from '@compartido/componentes/ModalConfirmarEliminar.jsx';
import { useNotifications } from '@compartido/hooks/useNotificaciones';

const Proyectos = () => {
  // Estados locales
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProjectViewModal, setShowProjectViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  // Notificaciones
  const { success, error } = useNotifications();

  // Hooks de datos
  const { 
    data: projectsData = { projects: [], pagination: {} }, 
    isLoading: projectsLoading, 
    error: projectsError,
    refetch: refetchProjects
  } = useProjects({
    page,
    limit,
    search: searchTerm,
    customerId: selectedCustomer,
    status: selectedStatus
  });

  // Extraer proyectos del objeto de datos
  const projects = projectsData.projects || [];
  const pagination = projectsData.pagination || {};

  // Clientes (para selector)
  const { 
    data: customersData = { customers: [], pagination: {} }, 
    isLoading: customersLoading 
  } = useCustomers();
  const customers = customersData.customers || [];

  // Mutations
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  // Métricas rápidas con estados actualizados
  const metrics = [
    {
      title: 'Planificación',
      label: 'Planificación',
      value: Array.isArray(projects) ? projects.filter(p => p.status_id === null || p.status_id === undefined).length : 0,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: Clock
    },
    {
      title: 'Activo',
      label: 'Activo',
      value: Array.isArray(projects) ? projects.filter(p => p.status_id === PROJECT_STATUSES.ACTIVE.id || p.status_id === 3).length : 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: AlertCircle
    },
    {
      title: 'Pausado',
      label: 'Pausado',
      value: Array.isArray(projects) ? projects.filter(p => p.status_id === PROJECT_STATUSES.PAUSED.id).length : 0,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: AlertCircle
    },
    {
      title: 'Completado',
      label: 'Completado',
      value: Array.isArray(projects) ? projects.filter(p => p.status_id === PROJECT_STATUSES.COMPLETED.id).length : 0,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      icon: CheckCircle
    },
    {
      title: 'Cancelado',
      label: 'Cancelado',
      value: Array.isArray(projects) ? projects.filter(p => p.status_id === PROJECT_STATUSES.CANCELLED.id).length : 0,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: AlertCircle
    }
  ];  // Handlers
  const handleCreateProject = () => {
    setSelectedProject(null);
    setModalMode('create');
    setShowProjectModal(true);
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setModalMode('edit');
    setShowProjectModal(true);
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowProjectViewModal(true);
  };

  const handleDeleteProject = async (project) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = async () => {
    try {
      await deleteProjectMutation.mutateAsync(selectedProject.id);
      success('Proyecto eliminado correctamente');
      setShowDeleteModal(false);
      setSelectedProject(null);
    } catch (err) {
      console.error('Error al eliminar proyecto:', err);
      error('Error al eliminar el proyecto');
    }
  };

  const handleSaveProject = async (projectData) => {
    try {
      if (modalMode === 'edit' && selectedProject) {
        await updateProjectMutation.mutateAsync({
          id: selectedProject.id,
          data: projectData
        });
        success('Proyecto actualizado correctamente');
      } else {
        await createProjectMutation.mutateAsync(projectData);
        success('Proyecto creado correctamente');
      }
      setShowProjectModal(false);
      setSelectedProject(null);
    } catch (err) {
      console.error('Error al guardar proyecto:', err);
      error('Error al guardar el proyecto');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'search') setSearchTerm(value);
    if (name === 'customer') setSelectedCustomer(value);
    if (name === 'status') setSelectedStatus(value);
    setPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCustomer('');
    setSelectedStatus('');
    setPage(1);
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 max-w-lg">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="flex space-x-2 ml-auto">
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (projectsLoading || customersLoading) return <SkeletonLoader />;

  if (projectsError) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-sm text-red-600 bg-red-100 p-3 rounded-md">
            <p className="font-medium">Error al cargar proyectos</p>
            <p className="mt-1">{projectsError?.message || 'Error desconocido'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de página */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Obras</h1>
            <p className="mt-2 text-gray-600">Gestión completa de obras y proyectos</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={handleCreateProject}
              className="w-full sm:w-auto flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Proyecto
            </button>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-6 w-6 ${metric.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Buscar obras por nombre, código o ubicación..."
                value={searchTerm}
                onChange={handleFilterChange}
                className="mt-1 block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              name="customer"
              value={selectedCustomer}
              onChange={handleFilterChange}
              className="mt-1 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
            >
              <option value="">Todos los clientes</option>
              {Array.isArray(customers) && customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <select
              name="status"
              value={selectedStatus}
              onChange={handleFilterChange}
              className="mt-1 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="null">Planificación</option>
              <option value={PROJECT_STATUSES.ACTIVE.id}>Activo</option>
              <option value={PROJECT_STATUSES.PAUSED.id}>Pausado</option>
              <option value={PROJECT_STATUSES.COMPLETED.id}>Completado</option>
              <option value={PROJECT_STATUSES.CANCELLED.id}>Cancelado</option>
            </select>
            {(searchTerm || selectedCustomer || selectedStatus) && (
              <button
                onClick={clearFilters}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Listado de proyectos */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay obras</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCustomer || selectedStatus 
                ? 'No se encontraron obras que coincidan con los filtros aplicados.'
                : 'Comienza creando tu primera obra.'
              }
            </p>
            {!searchTerm && !selectedCustomer && !selectedStatus && (
              <button
                onClick={handleCreateProject}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Proyecto
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyecto</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          {project.code && (
                            <div className="text-sm text-gray-500">#{project.code}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {project.customer?.name || 'Sin cliente'}
                      </div>
                      {project.customer?.email && (
                        <div className="text-sm text-gray-500">{project.customer.email}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(project.status_id)}`}>
                        {getStatusIcon(project.status_id)}
                        {getStatusName(project.status_id)}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {project.created_at ? new Date(project.created_at).toLocaleDateString('es-AR') : 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewProject(project)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-gray-100 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleEditProject(project)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition-colors"
                          title="Editar proyecto"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(project)}
                          disabled={deleteProjectMutation.isPending}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors"
                          title="Eliminar proyecto"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium">{(page - 1) * limit + 1}</span>
                {' '}a{' '}
                <span className="font-medium">
                  {Math.min(page * limit, pagination.totalItems)}
                </span>
                {' '}de{' '}
                <span className="font-medium">{pagination.totalItems}</span>
                {' '}resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal de proyecto */}
      {showProjectModal && (
        <ProjectModal
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
          onSave={handleSaveProject}
          project={selectedProject}
          customers={customers}
          mode={modalMode}
        />
      )}

      {/* Modal de visualización de proyecto */}
      {showProjectViewModal && (
        <ProjectViewModal
          isOpen={showProjectViewModal}
          onClose={() => setShowProjectViewModal(false)}
          project={selectedProject}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProject(null);
        }}
        onConfirm={confirmDeleteProject}
        title="Eliminar Proyecto"
        message={`¿Está seguro de que desea eliminar el proyecto "${selectedProject?.name}"?`}
        itemName={selectedProject?.name}
        isLoading={deleteProjectMutation.isPending}
      />
    </div>
  );

  // Funciones helper para el estado
  function getStatusStyle(statusId) {
    // Si statusId es null o undefined, usar estilo de Planificación
    if (statusId === null || statusId === undefined) {
      return 'bg-gray-100 text-gray-800';
    }
    
    const status = Object.values(PROJECT_STATUSES).find(s => s.id === statusId);
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (statusId) {
      case PROJECT_STATUSES.CONSULTATION?.id:
        return 'bg-blue-100 text-blue-800';
      case PROJECT_STATUSES.BUDGETED?.id:
        return 'bg-yellow-100 text-yellow-800';
      case PROJECT_STATUSES.APPROVED?.id:
        return 'bg-green-100 text-green-800';
      case PROJECT_STATUSES.PRODUCTION?.id:
        return 'bg-orange-100 text-orange-800';
      case PROJECT_STATUSES.DELIVERED?.id:
        return 'bg-emerald-100 text-emerald-800';
      case PROJECT_STATUSES.CANCELLED?.id:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusIcon(statusId) {
    // Si statusId es null o undefined, usar ícono de Planificación
    if (statusId === null || statusId === undefined) {
      return <Clock className="h-3 w-3 mr-1" />;
    }
    
    switch (statusId) {
      case PROJECT_STATUSES.CONSULTATION?.id:
        return <Clock className="h-3 w-3 mr-1" />;
      case PROJECT_STATUSES.BUDGETED?.id:
        return <AlertCircle className="h-3 w-3 mr-1" />;
      case PROJECT_STATUSES.APPROVED?.id:
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case PROJECT_STATUSES.PRODUCTION?.id:
        return <AlertCircle className="h-3 w-3 mr-1" />;
      case PROJECT_STATUSES.DELIVERED?.id:
        return <CheckCircle className="h-3 w-3 mr-1" />;
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  }

  function getStatusName(statusId) {
    // Si statusId es null o undefined, usar Planificación por defecto
    if (statusId === null || statusId === undefined) {
      return PROJECT_STATUSES.PLANNING.name;
    }
    const status = Object.values(PROJECT_STATUSES).find(s => s.id === statusId);
    return status?.name || PROJECT_STATUSES.PLANNING.name;
  }
};

export default Proyectos;
