/**
 * Componente ZoneMap
 * 
 * Mapa interactivo mostrando ubicaciones de zonas con información adicional
 */

import { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Maximize2, 
  Minimize2,
  Navigation,
  Layers,
  Filter,
  Info
} from 'lucide-react';

const ZoneMap = ({ zones = [], onZoneSelect, onZoneEdit, className = '' }) => {
  const mapRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [mapView, setMapView] = useState('satellite'); // 'satellite', 'map', 'hybrid'
  const [showZoneInfo, setShowZoneInfo] = useState(true);

  // Estados para filtros del mapa
  const [statusFilter, setStatusFilter] = useState('all');
  const [centerCoordinates, setCenterCoordinates] = useState({
    lat: -34.6037, // Buenos Aires por defecto
    lng: -58.3816
  });

  // Filtrar zonas según criterios
  const filteredZones = zones.filter(zone => {
    if (statusFilter === 'all') return true;
    return zone.status === statusFilter;
  });

  // Manejar clic en zona
  const handleZoneClick = (zone) => {
    setSelectedZone(zone);
    onZoneSelect?.(zone);
  };

  // Centrar mapa en zona seleccionada
  const centerOnZone = (zone) => {
    if (zone.latitude && zone.longitude) {
      setCenterCoordinates({
        lat: zone.latitude,
        lng: zone.longitude
      });
      setSelectedZone(zone);
    }
  };

  // Obtener ubicación actual del usuario
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenterCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Error obteniendo ubicación:', error);
        }
      );
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Marker component para las zonas
  const ZoneMarker = ({ zone, isSelected }) => {
    const getMarkerColor = (status) => {
      switch (status) {
        case 'active': return 'bg-green-500';
        case 'inactive': return 'bg-gray-500';
        case 'maintenance': return 'bg-yellow-500';
        default: return 'bg-blue-500';
      }
    };

    return (
      <div 
        className={`relative cursor-pointer transition-transform ${isSelected ? 'scale-125 z-[15]' : 'hover:scale-110'}`}
        onClick={() => handleZoneClick(zone)}
      >
        <div className={`w-8 h-8 rounded-full ${getMarkerColor(zone.status)} border-2 border-white shadow-lg flex items-center justify-center`}>
          <MapPin className="w-4 h-4 text-white" />
        </div>
        
        {/* Pulse animation para zona seleccionada */}
        {isSelected && (
          <div className={`absolute inset-0 w-8 h-8 rounded-full ${getMarkerColor(zone.status)} opacity-50 animate-ping`} />
        )}

        {/* Info popup al hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg border p-3 text-sm whitespace-nowrap">
            <p className="font-semibold text-gray-900">{zone.name}</p>
            {zone.location && <p className="text-gray-600">{zone.location}</p>}
            <p className="text-xs text-gray-500 mt-1">
              {zone.metrics?.total_prices || 0} precios gestionados
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Panel de información de la zona seleccionada
  const ZoneInfoPanel = () => {
    if (!selectedZone || !showZoneInfo) return null;

    return (
      <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border z-[15]">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{selectedZone.name}</h3>
              {selectedZone.code && (
                <p className="text-sm text-gray-500">Código: {selectedZone.code}</p>
              )}
            </div>
            <button
              onClick={() => setShowZoneInfo(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {selectedZone.location && (
            <div>
              <p className="text-sm font-medium text-gray-700">Ubicación</p>
              <p className="text-sm text-gray-600">{selectedZone.location}</p>
            </div>
          )}

          {selectedZone.description && (
            <div>
              <p className="text-sm font-medium text-gray-700">Descripción</p>
              <p className="text-sm text-gray-600">{selectedZone.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Estado</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                selectedZone.status === 'active' ? 'bg-green-100 text-green-800' :
                selectedZone.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedZone.status === 'active' ? 'Activa' :
                 selectedZone.status === 'inactive' ? 'Inactiva' : 'Mantenimiento'}
              </span>
            </div>
            
            <div>
              <p className="font-medium text-gray-700">Precios</p>
              <p className="text-gray-600">{selectedZone.metrics?.total_prices || 0}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => onZoneEdit?.(selectedZone)}
              className="flex-1 px-3 py-2 text-xs font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200"
            >
              Editar
            </button>
            <button
              onClick={() => window.open(`/zonas/${selectedZone.id}`, '_blank')}
              className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Ver detalles
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Panel de controles del mapa
  const MapControls = () => (
    <div className="absolute top-4 left-4 space-y-2 z-[15]">
      {/* Toggle fullscreen */}
      <button
        onClick={toggleFullscreen}
        className="w-10 h-10 bg-white rounded-lg shadow-lg border flex items-center justify-center text-gray-600 hover:text-gray-800"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Ubicación actual */}
      <button
        onClick={getCurrentLocation}
        className="w-10 h-10 bg-white rounded-lg shadow-lg border flex items-center justify-center text-gray-600 hover:text-gray-800"
      >
        <Navigation className="w-4 h-4" />
      </button>

      {/* Toggle info panel */}
      <button
        onClick={() => setShowZoneInfo(!showZoneInfo)}
        className={`w-10 h-10 rounded-lg shadow-lg border flex items-center justify-center ${
          showZoneInfo 
            ? 'bg-purple-100 text-purple-600' 
            : 'bg-white text-gray-600 hover:text-gray-800'
        }`}
      >
        <Info className="w-4 h-4" />
      </button>
    </div>
  );

  // Panel de filtros
  const FilterPanel = () => (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border p-3 z-[15]">
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-600" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border-0 focus:ring-0 bg-transparent"
        >
          <option value="all">Todas las zonas</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
          <option value="maintenance">En mantenimiento</option>
        </select>
      </div>
    </div>
  );

  // Leyenda del mapa
  const MapLegend = () => (
    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border p-3 z-[15]">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">Estado de zonas</h4>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Activa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Inactiva</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-xs text-gray-600">Mantenimiento</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className} ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      {/* Simulación de mapa - En producción sería Google Maps/Leaflet */}
      <div 
        ref={mapRef}
        className="w-full h-full relative bg-gradient-to-br from-blue-200 via-green-200 to-yellow-200"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m0 40l40-40h-40v40z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Controles del mapa */}
        <MapControls />

        {/* Panel de información */}
        <ZoneInfoPanel />

        {/* Filtros */}
        <FilterPanel />

        {/* Leyenda */}
        <MapLegend />

        {/* Markers de zonas */}
        <div className="absolute inset-0">
          {filteredZones.map((zone, index) => {
            // Simular posiciones en el mapa (en producción serían las coordenadas reales)
            const position = {
              x: 20 + (index % 5) * 15 + Math.random() * 10,
              y: 20 + Math.floor(index / 5) * 20 + Math.random() * 10,
            };

            return (
              <div
                key={zone.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${Math.min(position.x, 90)}%`,
                  top: `${Math.min(position.y, 80)}%`,
                }}
              >
                <ZoneMarker 
                  zone={zone} 
                  isSelected={selectedZone?.id === zone.id}
                />
              </div>
            );
          })}
        </div>

        {/* Mensaje cuando no hay zonas */}
        {filteredZones.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay zonas para mostrar
              </h3>
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? 'No se encontraron zonas en el sistema'
                  : `No hay zonas con estado "${statusFilter}"`
                }
              </p>
            </div>
          </div>
        )}

        {/* Información del mapa en la esquina */}
        <div className="absolute top-4 right-4 bg-white bg-opacity-75 rounded px-2 py-1 text-xs text-gray-600">
          {filteredZones.length} zona{filteredZones.length !== 1 ? 's' : ''} mostrada{filteredZones.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Overlay para modo fullscreen con efecto glassmorphism */}
      {isFullscreen && (
        <div className="absolute inset-0 bg-white/10 backdrop-blur-md z-[45]" />
      )}
    </div>
  );
};

export default ZoneMap;
