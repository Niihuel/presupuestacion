/**
 * Modal de Vista de Zona usando ViewModal Reutilizable
 * 
 * Componente modal para visualizar información detallada de una zona
 * en formato de solo lectura con diseño corporativo.
 */

import React from 'react';
import { ViewModal } from '@shared/components/modals';

const ZoneViewModal = ({ 
  isOpen, 
  onClose, 
  zone 
}) => {
  if (!isOpen || !zone) return null;

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activa' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactiva' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspendida' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    
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
      title="Información de la Zona"
      size="lg"
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
                Nombre de la Zona
              </h4>
              <p className="text-lg text-gray-700">
                {zone.name}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Estado
              </h4>
              <div>
                {getStatusBadge(zone.status)}
              </div>
            </div>

            {zone.code && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Código
                </h4>
                <p className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded">
                  {zone.code}
                </p>
              </div>
            )}

            {zone.region && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Región
                </h4>
                <p className="text-sm text-gray-700">
                  {zone.region}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Descripción */}
        {zone.description && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Descripción
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {zone.description}
              </p>
            </div>
          </div>
        )}

        {/* Información Geográfica */}
        {(zone.coordinates || zone.area || zone.population || zone.city || zone.state || zone.latitude || zone.longitude) && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Información Geográfica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(zone.city || zone.state) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                    Ubicación
                  </h4>
                  <p className="text-sm text-gray-700">
                    {[zone.city, zone.state].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {(zone.latitude && zone.longitude) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                    Coordenadas
                  </h4>
                  <p className="text-sm text-gray-700 font-mono">
                    {zone.latitude}, {zone.longitude}
                  </p>
                </div>
              )}

              {zone.zone_type && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                    Tipo de Zona
                  </h4>
                  <p className="text-sm text-gray-700">
                    {zone.zone_type}
                  </p>
                </div>
              )}

              {zone.coordinates && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                    Coordenadas
                  </h4>
                  <p className="text-sm text-gray-700 font-mono">
                    {zone.coordinates}
                  </p>
                </div>
              )}

              {zone.area && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                    Área (km²)
                  </h4>
                  <p className="text-sm text-gray-700">
                    {parseFloat(zone.area).toLocaleString()} km²
                  </p>
                </div>
              )}

              {zone.population && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                    Población
                  </h4>
                  <p className="text-sm text-gray-700">
                    {parseInt(zone.population).toLocaleString()} habitantes
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mapa de Ubicación */}
        {zone.location_iframe && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Ubicación en Mapa
            </h3>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    Ubicación de {zone.name}
                  </span>
                </div>
              </div>
              <div className="w-full h-80 flex items-center justify-center">
                <div 
                  className="w-full h-full"
                  style={{ 
                    minHeight: '320px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: zone.location_iframe.replace(
                      /width="\d+"/g, 'width="100%"'
                    ).replace(
                      /height="\d+"/g, 'height="320"'
                    ).replace(
                      /style="[^"]*"/g, 'style="border:0; width:100%; height:100%;"'
                    )
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas de Precios */}
        {(zone.price_count || zone.avg_price || zone.min_price || zone.max_price) && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Estadísticas de Precios
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {zone.price_count && (
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {zone.price_count}
                  </p>
                  <p className="text-sm text-blue-800">
                    Precios Registrados
                  </p>
                </div>
              )}

              {zone.avg_price && (
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    ${parseFloat(zone.avg_price).toFixed(2)}
                  </p>
                  <p className="text-sm text-green-800">
                    Precio Promedio
                  </p>
                </div>
              )}

              {zone.min_price && (
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    ${parseFloat(zone.min_price).toFixed(2)}
                  </p>
                  <p className="text-sm text-yellow-800">
                    Precio Mínimo
                  </p>
                </div>
              )}

              {zone.max_price && (
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    ${parseFloat(zone.max_price).toFixed(2)}
                  </p>
                  <p className="text-sm text-red-800">
                    Precio Máximo
                  </p>
                </div>
              )}
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
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Fecha de Creación
              </h4>
              <p className="text-sm text-gray-700">
                {zone.created_at 
                  ? new Date(zone.created_at).toLocaleDateString('es-ES', {
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

            {zone.updated_at && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Última Actualización
                </h4>
                <p className="text-sm text-gray-700">
                  {new Date(zone.updated_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ViewModal>
  );
};

export default ZoneViewModal;
