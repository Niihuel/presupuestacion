/**
 * Componente ZoneCard
 * 
 * Tarjeta de zona simplificada enfocada en información geográfica
 * y de ubicación en lugar de precios
 * 
 * @author Sistema de Presupuestación
 * @version 6.0.0 - Zone Geographic Focus
 */

import { 
  MapPin, 
  Building2, 
  Globe, 
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Settings,
  Navigation
} from 'lucide-react';
import { useState } from 'react';

const ZoneCard = ({ zone, onEdit, onView, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  // Determinar color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'inactive':
        return 'Inactiva';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return 'Desconocido';
    }
  };

  const hasLocation = zone.location_iframe || (zone.latitude && zone.longitude);

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {zone.name}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(zone.status || zone.is_active ? 'active' : 'inactive')}`}>
                {getStatusText(zone.status || (zone.is_active ? 'active' : 'inactive'))}
              </span>
            </div>
            
            {zone.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {zone.description}
              </p>
            )}

            {/* Información de ubicación */}
            <div className="space-y-2">
              {(zone.city || zone.state) && (
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="truncate">
                    {[zone.city, zone.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              
              {zone.region && (
                <div className="flex items-center text-sm text-gray-500">
                  <Globe className="w-4 h-4 mr-2" />
                  <span className="truncate">Región {zone.region}</span>
                </div>
              )}

              {hasLocation && (
                <div className="flex items-center text-sm text-green-600">
                  <Navigation className="w-4 h-4 mr-2" />
                  <span>Ubicación configurada</span>
                </div>
              )}
            </div>
          </div>

          {/* Menú de acciones */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => {
                    onView?.(zone);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Eye className="w-4 h-4 mr-3" />
                  Ver detalles
                </button>
                
                <button
                  onClick={() => {
                    onEdit?.(zone);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-3" />
                  Editar zona
                </button>

                <div className="border-t border-gray-100 my-1" />
                
                <button
                  onClick={() => {
                    onDelete?.(zone);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  Eliminar zona
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Google Maps iframe - Nueva sección */}
      {zone.location_iframe && (
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <Globe className="w-4 h-4 mr-2" />
              Ubicación
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="w-full h-48"
                style={{ 
                  minHeight: '192px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: zone.location_iframe.replace(
                    /width="\d+"/g, 'width="100%"'
                  ).replace(
                    /height="\d+"/g, 'height="192"'
                  ).replace(
                    /style="[^"]*"/g, 'style="border:0; width:100%; height:100%;"'
                  )
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          {/* Tipo de zona */}
          <div>
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mx-auto mb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Tipo</p>
            <p className="text-sm font-semibold text-gray-900">
              {zone.zone_type || 'No definido'}
            </p>
          </div>

          {/* Código de zona */}
          <div>
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mx-auto mb-2">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Código</p>
            <p className="text-sm font-semibold text-gray-900">
              {zone.code || 'Sin código'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer con acciones rápidas */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onView?.(zone)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver detalles
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => onEdit?.(zone)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Editar
            </button>
          </div>

          <div className="text-xs text-gray-500">
            {zone.code && `${zone.code}`}
          </div>
        </div>
      </div>

      {/* Overlay para cerrar menú al hacer click fuera */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default ZoneCard;
