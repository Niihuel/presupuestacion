/**
 * Modal para visualizar detalles de un proyecto
 * 
 * Modal de solo lectura para mostrar la información completa de un proyecto:
 * - Información básica y estado
 * - Cliente y datos de contacto
 * - Cronograma y ubicación
 * - Estadísticas del proyecto
 */

import { X, Building, User, MapPin, Calendar, DollarSign, Clock } from 'lucide-react';

const ProjectViewModal = ({ isOpen, onClose, project, customer }) => {
  if (!isOpen || !project) return null;

  const getStatusBadge = (status) => {
    const statusConfig = {
      'planning': { label: 'Planificación', className: 'bg-yellow-100 text-yellow-800' },
      'active': { label: 'Activo', className: 'bg-green-100 text-green-800' },
      'paused': { label: 'Pausado', className: 'bg-orange-100 text-orange-800' },
      'completed': { label: 'Completado', className: 'bg-blue-100 text-blue-800' },
      'cancelled': { label: 'Cancelado', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig['planning'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'No especificado';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const calculateProjectDuration = () => {
    if (!project.start_date || !project.end_date) return null;
    
    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} días`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} mes${months > 1 ? 'es' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} año${years > 1 ? 's' : ''} ${remainingMonths > 0 ? `y ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}` : ''}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Building className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {project.name}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    {project.code && (
                      <span className="text-sm text-gray-500">#{project.code}</span>
                    )}
                    {getStatusBadge(project.status)}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información principal */}
              <div className="space-y-6">
                {/* Cliente */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Cliente
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">
                      {customer?.name || 'Cliente no especificado'}
                    </p>
                    {customer?.email && (
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    )}
                    {customer?.phone && (
                      <p className="text-sm text-gray-600">{customer.phone}</p>
                    )}
                  </div>
                </div>

                {/* Ubicación */}
                {project.location && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Ubicación
                    </h4>
                    <p className="text-sm text-gray-600">{project.location}</p>
                  </div>
                )}

                {/* Descripción */}
                {project.description && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Descripción
                    </h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {project.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Detalles del proyecto */}
              <div className="space-y-6">
                {/* Cronograma */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Cronograma
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fecha de inicio:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(project.start_date)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fecha de fin:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(project.end_date)}
                      </span>
                    </div>
                    {calculateProjectDuration() && (
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-600 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Duración:
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {calculateProjectDuration()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información financiera */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Información Financiera
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Presupuesto estimado:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(project.budget)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Detalles Adicionales
                  </h4>
                  <div className="space-y-3">
                    {project.project_type && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tipo de proyecto:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {project.project_type}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Estado:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {project.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    {project.created_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Creado:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(project.created_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectViewModal;
