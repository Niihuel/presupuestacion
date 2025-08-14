/**
 * Vista Kanban deimport { PROJECT_STATUSES } from "../../../hooks/useProjectsHook";Proyectos
 * 
 * Tablero Kanban interactivo con drag & drop para gestión visual
 * del flujo de trabajo de proyectos
 */

import { useState, useCallback } from 'react';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Calendar,
  MapPin,
  User,
  Building2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { PROJECT_STATUSES } from '../../shared/hooks/useProjectsHook';

const ProjectKanban = ({ 
  projects = [], 
  customers = [], 
  designers = [], 
  onEditProject, 
  onDeleteProject, 
  onUpdateStatus,
  isLoading = false 
}) => {
  const [draggedProject, setDraggedProject] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);

  // Organizar proyectos por estado
  const projectsByStatus = Object.values(PROJECT_STATUSES).reduce((acc, status) => {
    acc[status.id] = projects.filter(project => project.status_id === status.id);
    return acc;
  }, {});

  // Handlers para drag & drop
  const handleDragStart = useCallback((e, project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedProject(null);
    setDraggedOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((statusId) => {
    setDraggedOverColumn(statusId);
  }, []);

  const handleDragLeave = useCallback((e) => {
    // Solo limpiar si realmente salimos del contenedor
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDraggedOverColumn(null);
    }
  }, []);

  const handleDrop = useCallback((e, targetStatusId) => {
    e.preventDefault();
    
    if (draggedProject && draggedProject.status_id !== targetStatusId) {
      onUpdateStatus(draggedProject.id, targetStatusId);
    }
    
    setDraggedProject(null);
    setDraggedOverColumn(null);
  }, [draggedProject, onUpdateStatus]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Obtener información del cliente
  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Sin cliente';
  };

  // Obtener información del diseñador
  const getDesignerName = (designerId) => {
    const designer = designers.find(d => d.id === designerId);
    return designer ? `${designer.name} ${designer.surname}` : 'Sin asignar';
  };

  // Componente de tarjeta de proyecto
  const ProjectCard = ({ project }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, project)}
        onDragEnd={handleDragEnd}
        className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 cursor-move group ${
          draggedProject?.id === project.id ? 'opacity-50 scale-95' : ''
        }`}
      >
        <div className="p-4">
          {/* Header con menú */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm leading-5 mb-1 line-clamp-2">
                {project.name}
              </h4>
              {project.code && (
                <span className="text-xs text-gray-500 font-mono">
                  {project.code}
                </span>
              )}
            </div>
            
            <div className="relative ml-2">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-all"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-[5]" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-6 z-[15] bg-white rounded-lg shadow-lg border py-1 min-w-[120px]">
                    <button
                      onClick={() => {
                        onEditProject(project);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        onDeleteProject(project);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Información del proyecto */}
          <div className="space-y-2 text-xs text-gray-600">
            {/* Cliente */}
            <div className="flex items-center gap-2">
              <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="truncate">{getCustomerName(project.customer_id)}</span>
            </div>

            {/* Diseñador */}
            {project.designer_id && (
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">{getDesignerName(project.designer_id)}</span>
              </div>
            )}

            {/* Ubicación */}
            {(project.city || project.state) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">
                  {[project.city, project.state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            {/* Fecha de entrega */}
            {project.delivery_deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">{project.delivery_deadline}</span>
              </div>
            )}
          </div>

          {/* Fechas importantes */}
          {(project.approval_date || project.foundation_date) && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                {project.approval_date && (
                  <span title="Fecha de aprobación">
                    ✓ {formatDate(project.approval_date)}
                  </span>
                )}
                {project.foundation_date && (
                  <span title="Fecha de fundación">
                    🏗️ {formatDate(project.foundation_date)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex overflow-x-auto gap-6 p-6">
      {Object.values(PROJECT_STATUSES).map((status) => {
        const columnProjects = projectsByStatus[status.id] || [];
        const isDraggedOver = draggedOverColumn === status.id;
        const canDrop = draggedProject && draggedProject.status_id !== status.id;

        return (
          <div
            key={status.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter(status.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status.id)}
          >
            {/* Header de columna */}
            <div className={`mb-4 p-4 rounded-lg transition-colors ${
              isDraggedOver && canDrop 
                ? 'bg-blue-50 border-2 border-blue-300 border-dashed' 
                : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-3 h-3 rounded-full ${status.color}`}
                    style={{ backgroundColor: status.bgColor }}
                  />
                  <h3 className="font-medium text-gray-900">
                    {status.name}
                  </h3>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  columnProjects.length > 0 
                    ? 'bg-gray-200 text-gray-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {columnProjects.length}
                </span>
              </div>
              
              {status.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {status.description}
                </p>
              )}
            </div>

            {/* Lista de proyectos */}
            <div className={`space-y-3 min-h-[200px] transition-all duration-200 ${
              isDraggedOver && canDrop 
                ? 'bg-blue-25 rounded-lg p-2' 
                : ''
            }`}>
              {columnProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay proyectos</p>
                  {isDraggedOver && canDrop && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-blue-600">
                      <ArrowRight className="w-4 h-4" />
                      <span className="text-xs font-medium">Soltar aquí</span>
                    </div>
                  )}
                </div>
              ) : (
                columnProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))
              )}
            </div>
          </div>
        );
      })}
      
      {/* Overlay de carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[15]">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span>Actualizando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectKanban;
