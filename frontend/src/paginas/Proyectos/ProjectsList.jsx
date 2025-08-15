/**
 * Lista de Proyectos/Obras
 * 
 * Componente principal para gestión de proyectos con funcionalidades completas:
 * - Lista paginada con filtros avanzados
 * - Vista Kanban por estados
 * - Búsqueda y filtros por cliente, diseñador, estado
 * - Operaciones CRUD optimizadas
 * - Timeline visual y gestión de documentos
 */

import { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Grid3X3, 
  List, 
  Kanban,
  FolderOpen, 
  SlidersHorizontal,
  RefreshCw,
  X,
  Filter,
  Users,
  Calendar,
  Building
} from 'lucide-react';

// Hooks y servicios
import { 
  useProjectsManagement, 
  useCustomersForProjects, 
  useDesignersForProjects,
  PROJECT_STATUSES 
} from "../../shared/hooks/useProjectsHook";

// Componentes
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';
import ProjectKanban from './ProjectKanban';
import { 
  DialogoConfirmacion as DeleteConfirmModal, 
  Paginacion as Pagination, 
  EstadoVacio as EmptyState, 
  LoadingState 
} from "@compartido/components";

const ProjectsList = () => {
  // Estados locales
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list' | 'kanban'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedDesigner, setSelectedDesigner] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Estados de modales
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Parámetros de consulta
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: viewMode === 'kanban' ? 100 : viewMode === 'grid' ? 12 : 10,
    search: searchTerm,
    customerId: selectedCustomer,
    designerId: selectedDesigner,
    status: selectedStatus,
    sortBy,
    sortOrder
  }), [currentPage, viewMode, searchTerm, selectedCustomer, selectedDesigner, selectedStatus, sortBy, sortOrder]);

  // Hooks de datos
  const {
    projects,
    pagination,
    stats,
    isLoading,
    isError,
    error,
    createProject,
    updateProject,
    deleteProject,
    updateProjectStatus,
    isCreating,
    isUpdating,
    isDeleting,
    isUpdatingStatus,
    refetch,
    isFetching
  } = useProjectsManagement(queryParams);

  const { data: customers = [] } = useCustomersForProjects();
  const { data: designers = [] } = useDesignersForProjects();

  // Resetear página cuando cambien los filtros
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCustomerChange = (value) => {
    setSelectedCustomer(value);
    setCurrentPage(1);
  };

  const handleDesignerChange = (value) => {
    setSelectedDesigner(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCustomer('');
    setSelectedDesigner('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  // Operaciones CRUD
  const handleCreateProject = () => {
    setEditingProject(null);
    setShowProjectModal(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };

  const handleDeleteProject = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      setShowDeleteModal(false);
      setProjectToDelete(null);
    }
  };

  const handleSaveProject = (projectData) => {
    if (editingProject) {
      updateProject({ projectId: editingProject.id, projectData });
    } else {
      createProject(projectData);
    }
    setShowProjectModal(false);
    setEditingProject(null);
  };

  const handleStatusChange = (projectId, newStatus, notes = '') => {
    updateProjectStatus({ projectId, status: newStatus, notes });
  };

  // Contador de filtros activos
  const activeFiltersCount = [searchTerm, selectedCustomer, selectedDesigner, selectedStatus].filter(Boolean).length;

  // Opciones de ordenamiento
  const sortOptions = [
    { value: 'created_at', label: 'Fecha de creación' },
    { value: 'name', label: 'Nombre' },
    { value: 'approval_date', label: 'Fecha de aprobación' },
    { value: 'delivery_deadline', label: 'Fecha de entrega' }
  ];

  if (isError) {
    return (
      <div className="p-6">
        <EmptyState 
          variant="error"
          title="Error al cargar proyectos"
          description={error?.message || "Ha ocurrido un error inesperado"}
          actionLabel="Reintentar"
          onAction={refetch}
        />
      </div>
    );
  }

  // Vista Kanban
  if (viewMode === 'kanban') {
    return (
      <div className="p-6 space-y-6">
        {/* Header para Kanban */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building className="w-7 h-7 text-blue-600" />
              Proyectos - Vista Kanban
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona el flujo de trabajo de tus proyectos
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('grid')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Vista de cuadrícula"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleCreateProject}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proyecto
            </button>
          </div>
        </div>

        <ProjectKanban 
          projects={projects}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onStatusChange={handleStatusChange}
          isUpdatingStatus={isUpdatingStatus}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="w-7 h-7 text-blue-600" />
            Gestión de Proyectos
          </h1>
          <p className="text-gray-600 mt-1">
            Administra proyectos, estados y documentación
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={refetch}
            disabled={isFetching}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleCreateProject}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      {stats.totalProjects > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Proyectos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          {Object.entries(stats.byStatus || {}).map(([statusId, count]) => {
            const status = PROJECT_STATUSES[Object.keys(PROJECT_STATUSES).find(key => 
              PROJECT_STATUSES[key].id.toString() === statusId
            )];
            
            if (!status || count === 0) return null;
            
            return (
              <div key={statusId} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{status.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full bg-${status.color}-500`}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proyectos por nombre, código o ubicación..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Controles */}
          <div className="flex items-center gap-3">
            {/* Ordenamiento */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <optgroup key={option.value} label={option.label}>
                  <option value={`${option.value}-desc`}>↓ {option.label}</option>
                  <option value={`${option.value}-asc`}>↑ {option.label}</option>
                </optgroup>
              ))}
            </select>

            {/* Toggle filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Vista */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:text-gray-900'
                }`}
                title="Vista de cuadrícula"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:text-gray-900'
                }`}
                title="Vista de lista"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 ${
                  viewMode === 'kanban'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:text-gray-900'
                }`}
                title="Vista Kanban"
              >
                <Kanban className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Panel de filtros expandible */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtro por cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los clientes</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por diseñador */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diseñador
                </label>
                <select
                  value={selectedDesigner}
                  onChange={(e) => handleDesignerChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los diseñadores</option>
                  {designers.map((designer) => (
                    <option key={designer.id} value={designer.id}>
                      {designer.name} {designer.surname}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
                  {Object.values(PROJECT_STATUSES).map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón limpiar filtros */}
              <div className="flex items-end">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenido principal */}
      <div className="space-y-6">
        {/* Estados de carga */}
        {isLoading ? (
          <div className="space-y-4">
            {viewMode === 'grid' ? (
              <LoadingState.CardGridSkeleton count={12} />
            ) : (
              <LoadingState.ListSkeleton rows={10} />
            )}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState 
            icon={Building}
            title={activeFiltersCount > 0 ? "No se encontraron proyectos" : "No hay proyectos registrados"}
            description={
              activeFiltersCount > 0 
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza creando tu primer proyecto"
            }
            actionLabel={activeFiltersCount > 0 ? "Limpiar filtros" : "Crear primer proyecto"}
            onAction={activeFiltersCount > 0 ? clearFilters : handleCreateProject}
            variant={activeFiltersCount > 0 ? "search" : "default"}
          />
        ) : (
          <>
            {/* Lista de proyectos */}
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }>
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  viewMode={viewMode}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                  onStatusChange={handleStatusChange}
                  customers={customers}
                  designers={designers}
                  isUpdatingStatus={isUpdatingStatus}
                />
              ))}
            </div>

            {/* Paginación */}
            {viewMode !== 'kanban' && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>

      {/* Modales */}
      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          customers={customers}
          designers={designers}
          onSave={handleSaveProject}
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
          isLoading={isCreating || isUpdating}
        />
      )}

      {showDeleteModal && projectToDelete && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setProjectToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Eliminar proyecto"
          message={`¿Estás seguro de que deseas eliminar el proyecto "${projectToDelete.name}"? Esta acción no se puede deshacer y eliminará toda la información asociada.`}
          confirmLabel="Eliminar proyecto"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default ProjectsList;
