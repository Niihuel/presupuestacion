/**
 * Card de Proyecto
 *import { PROJECT_STATUSES } from "../../../hooks/useProjectsHook";
 * Componente para mostrar información de un proyecto en vista grid o list
 * con acciones de edición, eliminación y cambio de estado
 */

import { 
  Edit2, 
  Trash2, 
  Building, 
  User, 
  Calendar, 
  MapPin, 
  Clock,
  FileText,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Pause,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import { PROJECT_STATUSES } from '../../shared/hooks/useProjectsHook';

const ProjectCard = ({ 
  project, 
  viewMode = 'grid', 
  onEdit, 
  onDelete, 
  onStatusChange,
  customers = [],
  designers = [],
  isUpdatingStatus = false
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Obtener datos relacionados
  const customer = customers.find(c => c.id === project.customer_id);
  const designer = designers.find(d => d.id === project.designer_id);
  
  // Obtener estado actual
  const currentStatus = PROJECT_STATUSES[Object.keys(PROJECT_STATUSES).find(key => 
    PROJECT_STATUSES[key].id === project.status_id
  )] || PROJECT_STATUSES.DESIGN;

  // Formatear fechas
  const formatDate = (date) => {
    if (!date) return 'No definida';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formatear dirección
  const getAddress = () => {
    const parts = [
      project.street,
      project.street_number,
      project.neighborhood,
      project.city
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Sin dirección';
  };

  // Obtener icono de estado
  const getStatusIcon = (status) => {
    switch (status.id) {
      case PROJECT_STATUSES.DESIGN.id:
        return <FileText className="w-4 h-4" />;
      case PROJECT_STATUSES.PRODUCTION.id:
        return <Clock className="w-4 h-4" />;
      case PROJECT_STATUSES.DELIVERED.id:
        return <CheckCircle className="w-4 h-4" />;
      case PROJECT_STATUSES.CANCELLED.id:
        return <XCircle className="w-4 h-4" />;
      case PROJECT_STATUSES.ON_HOLD.id:
        return <Pause className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Calcular días transcurridos
  const getDaysFromCreation = () => {
    if (!project.created_at) return 0;
    const diffTime = new Date() - new Date(project.created_at);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleStatusChange = (newStatusId) => {
    setShowStatusMenu(false);
    if (newStatusId !== project.status_id) {
      onStatusChange(project.id, newStatusId);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Icono */}
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building className="w-6 h-6 text-purple-600" />
            </div>
            
            {/* Info principal */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {project.name}
              </h3>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {customer?.name || 'Sin cliente'}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {project.city || 'Sin ubicación'}
                </span>
                <span className="text-sm text-gray-500">
                  {getDaysFromCreation()} días
                </span>
              </div>
            </div>

            {/* Estado */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={isUpdatingStatus}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${currentStatus.bgColor} ${currentStatus.textColor} hover:opacity-80 disabled:opacity-50`}
              >
                {getStatusIcon(currentStatus)}
                <span className="ml-1">{currentStatus.name}</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>

              {/* Dropdown de estados */}
              {showStatusMenu && (
                <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-[15]">
                  {Object.values(PROJECT_STATUSES).map((status) => (
                    <button
                      key={status.id}
                      onClick={() => handleStatusChange(status.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                        status.id === project.status_id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {getStatusIcon(status)}
                      {status.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={() => onEdit(project)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar proyecto"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(project)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar proyecto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Click overlay para cerrar dropdown */}
        {showStatusMenu && (
          <div 
            className="fixed inset-0 z-5" 
            onClick={() => setShowStatusMenu(false)}
          />
        )}
      </div>
    );
  }

  // Vista Grid
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 group relative">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-t-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
              {project.name}
            </h3>
            {project.code && (
              <p className="text-sm text-gray-600 mt-1">
                Código: {project.code}
              </p>
            )}
          </div>
          <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
            <Building className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-4">
        {/* Cliente y diseñador */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Cliente:</span>
            <span className="text-sm font-medium text-gray-900 truncate ml-2">
              {customer?.name || 'Sin asignar'}
            </span>
          </div>
          
          {designer && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Diseñador:</span>
              <span className="text-sm font-medium text-gray-900 truncate ml-2">
                {designer.name} {designer.surname}
              </span>
            </div>
          )}
        </div>

        {/* Ubicación */}
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-600 line-clamp-2">
            {getAddress()}
          </span>
        </div>

        {/* Fechas importantes */}
        <div className="space-y-2">
          {project.approval_date && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Aprobación:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(project.approval_date)}
              </span>
            </div>
          )}
          
          {project.delivery_deadline && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Entrega:</span>
              <span className="text-sm font-medium text-gray-900">
                {project.delivery_deadline}
              </span>
            </div>
          )}
        </div>

        {/* Estado */}
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            disabled={isUpdatingStatus}
            className={`w-full inline-flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentStatus.bgColor} ${currentStatus.textColor} hover:opacity-80 disabled:opacity-50`}
          >
            <div className="flex items-center gap-2">
              {getStatusIcon(currentStatus)}
              {currentStatus.name}
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Dropdown de estados */}
          {showStatusMenu && (
            <div className="absolute left-0 top-10 w-full bg-white rounded-md shadow-lg border border-gray-200 z-[15]">
              {Object.values(PROJECT_STATUSES).map((status) => (
                <button
                  key={status.id}
                  onClick={() => handleStatusChange(status.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 first:rounded-t-md last:rounded-b-md ${
                    status.id === project.status_id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  {getStatusIcon(status)}
                  {status.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          Creado hace {getDaysFromCreation()} días
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-2 border-t">
          <button
            onClick={() => onEdit(project)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Editar
          </button>
          <button
            onClick={() => onDelete(project)}
            className="inline-flex items-center justify-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Click overlay para cerrar dropdown */}
      {showStatusMenu && (
        <div 
          className="fixed inset-0 z-[5]" 
          onClick={() => setShowStatusMenu(false)}
        />
      )}
    </div>
  );
};

export default ProjectCard;
