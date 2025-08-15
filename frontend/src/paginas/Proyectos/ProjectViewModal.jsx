/**
 * Modal de Vista de Proyecto usando ViewModal Reutilizable
 * 
 * Componente modal para visualizar información detallada de un proyecto
 * en formato de solo lectura con diseño corporativo.
 */

import React from 'react';
import { ViewModal } from '@compartido/componentes/modals';
import { PROJECT_STATUSES } from '@compartido/hooks/useProjectsHook';

const ProjectViewModal = ({ 
  isOpen, 
  onClose, 
  project 
}) => {
  if (!isOpen || !project) return null;

  const getStatusBadge = (statusId) => {
    const status = Object.values(PROJECT_STATUSES).find(s => s.id === statusId);
    const statusConfig = status || PROJECT_STATUSES.PLANNING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
        {statusConfig.name}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Baja' },
      medium: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Media' },
      high: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Alta' },
      urgent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Urgente' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <ViewModal
      isOpen={isOpen}
      onClose={onClose}
      title="Información del Proyecto"
      size="xl"
    >
      <div className="space-y-6">
        {/* Información Básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Información Básica
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Nombre del Proyecto
              </h4>
              <p className="text-lg text-gray-700">
                {project.name}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Estado
              </h4>
              <div>
                {getStatusBadge(project.status_id)}
              </div>
            </div>

            {project.code && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Código del Proyecto
                </h4>
                <p className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded">
                  {project.code}
                </p>
              </div>
            )}

            {project.priority && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Prioridad
                </h4>
                <div>
                  {getPriorityBadge(project.priority)}
                </div>
              </div>
            )}

            {project.customer_name && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Cliente
                </h4>
                <p className="text-sm text-gray-700">
                  {project.customer_name}
                </p>
              </div>
            )}

            {project.calculista_name && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Calculista Asignado
                </h4>
                <p className="text-sm text-gray-700">
                  {project.calculista_name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Descripción */}
        {project.description && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Descripción
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          </div>
        )}

        {/* Fechas */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Cronograma
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.start_date && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Fecha de Inicio
                </h4>
                <p className="text-sm text-gray-700">
                  {new Date(project.start_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {project.end_date && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Fecha de Finalización
                </h4>
                <p className="text-sm text-gray-700">
                  {new Date(project.end_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {project.deadline && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Fecha Límite
                </h4>
                <p className="text-sm text-gray-700">
                  {new Date(project.deadline).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Información Financiera */}
        {(project.budget || project.estimated_cost || project.actual_cost) && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Información Financiera
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {project.budget && (
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    ${parseFloat(project.budget).toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-800">
                    Presupuesto
                  </p>
                </div>
              )}

              {project.estimated_cost && (
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    ${parseFloat(project.estimated_cost).toLocaleString()}
                  </p>
                  <p className="text-sm text-yellow-800">
                    Costo Estimado
                  </p>
                </div>
              )}

              {project.actual_cost && (
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    ${parseFloat(project.actual_cost).toLocaleString()}
                  </p>
                  <p className="text-sm text-green-800">
                    Costo Real
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progreso */}
        {project.progress_percentage !== undefined && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Progreso del Proyecto
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Completado</span>
                <span className="font-medium text-gray-900">{project.progress_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress_percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Ubicación y Mapa */}
        {(project.city || project.location_iframe || project.location || project.address) && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Ubicación
            </h3>
            
            {/* Información de dirección */}
            {(project.city || project.location || project.address) && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Dirección
                  </h4>
                  <p className="text-sm text-gray-700 ml-6">
                    {project.city || project.location || project.address}
                  </p>
                </div>
              </div>
            )}

            {/* Mapa de Google */}
            {project.location_iframe && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                  </svg>
                  Mapa de Ubicación
                </h4>
                <div className="relative bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                  <div className="aspect-video w-full">
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: project.location_iframe.replace(
                          /width="[^"]*"/g, 'width="100%"'
                        ).replace(
                          /height="[^"]*"/g, 'height="100%"'
                        ).replace(
                          /style="[^"]*"/g, 'style="border:0; width: 100%; height: 100%; display: block;"'
                        )
                      }}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notas */}
        {project.notes && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Notas Adicionales
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {project.notes}
              </p>
            </div>
          </div>
        )}

        {/* Fechas del Sistema */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Información del Sistema
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide flex items-center">
                <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Fecha de Creación
              </h4>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900">
                  {project.created_at 
                    ? new Date(project.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'No disponible'
                  }
                </p>
              </div>
            </div>

            {project.updated_at && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Última Actualización
                </h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    {new Date(project.updated_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ViewModal>
  );
};

export default ProjectViewModal;
