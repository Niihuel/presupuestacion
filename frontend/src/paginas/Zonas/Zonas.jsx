/**
 * Página Principal de Gestión de Zonas
 * 
 * Sistema completo de gestión de zonas/plantas con:
 * - CRUD completo con vista de lista y mapa
 * - Dashboard con métricas por zona
 * - Gestión de precios por zona
 * - Herramientas de copia de precios
 * - Reportes y análisis
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  BarChart3, 
  DollarSign,
  Copy,
  Download,
  Map,
  List,
  Settings,
  TrendingUp,
  Building2,
  Globe,
  Eye,
  Edit3,
  Trash2,
  MoreVertical,
  Trees,
  Factory,
  RefreshCw
} from 'lucide-react';

// Hooks
import { 
  useZones, 
  useZonesStats,
  useDeleteZone,
  useCreateZone,
  useUpdateZone
} from '@compartido/hooks/useZonas';

// Componentes
import ZoneCard from './ZoneCard';
import ZoneMap from './ZoneMap';
import ZoneDashboard from './ZoneDashboard';
import ZoneModal from './ZoneModal';
import ZoneViewModal from './ZoneViewModal';
import DialogoConfirmacion from '@compartido/componentes/DialogoConfirmacion';
import PriceCopyModal from './PriceCopyModal';

const Zonas = () => {
  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'map', 'dashboard'
  const [selectedZone, setSelectedZone] = useState(null);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showZoneViewModal, setShowZoneViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState(null);
  const [zoneToView, setZoneToView] = useState(null);
  const [showPriceCopyModal, setShowPriceCopyModal] = useState(false);
  const [priceCopySourceZone, setPriceCopySourceZone] = useState(null);

  // Filtros para la consulta
  const filters = useMemo(() => ({
    search: searchTerm,
    status: statusFilter,
    include_metrics: true
  }), [searchTerm, statusFilter]);

  // Hooks de datos
  const { 
    data: zonesData, 
    isLoading: zonesLoading, 
    error: zonesError 
  } = useZones(filters);

  const { 
    data: statsData, 
    isLoading: statsLoading 
  } = useZonesStats('30d');

  // Mutations
  const deleteZoneMutation = useDeleteZone();
  const createZoneMutation = useCreateZone();
  const updateZoneMutation = useUpdateZone();

  const zones = zonesData?.zones || [];
  const stats = statsData?.data || {};

  // Handlers
  const handleCreateZone = () => {
    setSelectedZone(null);
    setShowZoneModal(true);
  };

  const handleEditZone = (zone) => {
    setSelectedZone(zone);
    setShowZoneModal(true);
  };

  const handleViewZone = (zone) => {
    setZoneToView(zone);
    setShowZoneViewModal(true);
  };

  const handleDeleteZone = (zone) => {
    setZoneToDelete(zone);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (zoneToDelete) {
      await deleteZoneMutation.mutateAsync(zoneToDelete.id);
      setShowDeleteDialog(false);
      setZoneToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setShowZoneModal(false);
    setSelectedZone(null);
  };

  const handleCloseViewModal = () => {
    setShowZoneViewModal(false);
    setZoneToView(null);
  };

  const handleCopyPrices = (sourceZone = null) => {
    setPriceCopySourceZone(sourceZone);
    setShowPriceCopyModal(true);
  };

  const handleClosePriceCopyModal = () => {
    setShowPriceCopyModal(false);
    setPriceCopySourceZone(null);
  };

  const handleRefresh = () => {
    // Refrescar los datos
    refetch();
  };

  const handleSaveZone = async (zoneData) => {
    try {
      if (selectedZone) {
        // Editar zona existente
        await updateZoneMutation.mutateAsync({
          id: selectedZone.id,
          data: zoneData
        });
      } else {
        // Crear nueva zona
        await createZoneMutation.mutateAsync(zoneData);
      }
    } catch (error) {
      console.error('Error saving zone:', error);
      throw error;
    }
  };

  // Componente de estadísticas rápidas
  const QuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total de Plantas</p>
            <div className="text-3xl font-bold text-gray-900">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                zones.length || 0
              )}
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <span className="text-green-600 font-medium">
              {zones.filter(z => z.is_active).length || 0} operativas
            </span>
            <span className="text-gray-500 ml-2">
              • {zones.filter(z => !z.is_active).length || 0} inactivas
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Plantas con Maps</p>
            <div className="text-3xl font-bold text-gray-900">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                zones.filter(z => z.location_iframe || (z.latitude && z.longitude)).length || 0
              )}
            </div>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <MapPin className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">
              Geolocalizadas
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Tipos de Planta</p>
            <div className="text-3xl font-bold text-gray-900">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                new Set(zones.map(z => z.zone_type).filter(Boolean)).size || 0
              )}
            </div>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <span>Categorías diferentes</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Cobertura</p>
            <div className="text-3xl font-bold text-gray-900">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                new Set(zones.map(z => z.region).filter(Boolean)).size || 0
              )}
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <span>Regiones cubiertas</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Componente de controles
  const Controls = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar zonas por nombre, código, ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Filtro por estado */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full px-3 py-2 pl-10 pr-8 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
            <option value="maintenance">En mantenimiento</option>
          </select>
        </div>

        {/* Selector de vista */}
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 ${
              viewMode === 'cards' 
                ? 'bg-blue-50 text-blue-600 border-blue-500' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Lista</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 border-l ${
              viewMode === 'map' 
                ? 'bg-blue-50 text-blue-600 border-blue-500' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Mapas</span>
          </button>
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 border-l ${
              viewMode === 'dashboard' 
                ? 'bg-blue-50 text-blue-600 border-blue-500' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Botón crear zona */}
        <button
          onClick={handleCreateZone}
          className="w-full sm:w-auto flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Zona
        </button>
      </div>
    </div>
  );

  // Renderizado de loading
  if (zonesLoading && !zones.length) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Renderizado de error
  if (zonesError) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-600 bg-red-100 p-4 rounded-lg max-w-md">
            <h3 className="font-medium mb-2">Error al cargar las zonas</h3>
            <p className="text-sm mb-4">Por favor, intenta nuevamente.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Zonas</h1>
              <p className="mt-2 text-gray-600">
                Administra zonas, precios y métricas de tu sistema
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
              <Link
                to="/zonas/reportes"
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2 inline" />
                Reportes
              </Link>
              
              <Link
                to="/zonas/configuracion"
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Settings className="w-4 h-4 mr-2 inline" />
                Configuración
              </Link>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <QuickStats />

        {/* Controles */}
        <Controls />

        {/* Contenido principal según modo de vista */}
        {viewMode === 'cards' && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {zones.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  No hay zonas registradas
                </h3>
                <p className="text-gray-600 mb-6">
                  Comienza creando tu primera zona para gestionar precios y métricas
                </p>
                <button
                  onClick={handleCreateZone}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Zona
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {zones.map((zone) => (
                  <div key={zone.id} className="bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {zone.name}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              zone.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {zone.is_active !== false ? 'Activa' : 'Inactiva'}
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

                            {zone.location_iframe && (
                              <div className="flex items-center text-sm text-green-600">
                                <MapPin className="w-4 h-4 mr-2" />
                                <span>Ubicación configurada</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botón de opciones */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewZone(zone)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditZone(zone)}
                            className="text-gray-600 hover:text-gray-800 p-1"
                            title="Editar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteZone(zone)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

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
                            onClick={() => handleViewZone(zone)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Ver detalles
                          </button>
                          <span className="text-gray-300">•</span>
                          <button
                            onClick={() => handleEditZone(zone)}
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'map' && (
          <div className="space-y-6">
            {/* Estadística de zonas con mapas */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ubicaciones en Mapa
                </h3>
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                  {zones.filter(zone => zone.location_iframe).length} ubicaciones configuradas
                </span>
              </div>
              
              {zones.filter(zone => zone.location_iframe).length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay ubicaciones configuradas
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Configura ubicaciones en Google Maps para visualizar tus zonas en el mapa.
                  </p>
                  <button
                    onClick={() => setShowZoneModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Agregar Ubicación
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {zones
                    .filter(zone => zone.location_iframe)
                    .map((zone) => (
                      <div key={zone.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{zone.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {[zone.city, zone.state].filter(Boolean).join(', ')}
                              </p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                                zone.zone_type === 'Planta Principal' ? 'bg-blue-100 text-blue-800' :
                                zone.zone_type === 'Planta Secundaria' ? 'bg-green-100 text-green-800' :
                                zone.zone_type === 'Depósito' ? 'bg-purple-100 text-purple-800' :
                                zone.zone_type === 'Oficinas' ? 'bg-orange-100 text-orange-800' :
                                zone.zone_type === 'Punto de Venta' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {zone.zone_type || 'Sin tipo'}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewZone(zone)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditZone(zone)}
                                className="text-gray-600 hover:text-gray-800 p-1"
                                title="Editar"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Mapa embebido */}
                        <div className="relative">
                          <div className="w-full h-64 bg-gray-100">
                            <div 
                              className="w-full h-full"
                              dangerouslySetInnerHTML={{ 
                                __html: zone.location_iframe.replace(
                                  /width="\d+"/g, 'width="100%"'
                                ).replace(
                                  /height="\d+"/g, 'height="256"'
                                ).replace(
                                  /style="[^"]*"/g, 'style="border:0; width:100%; height:100%;"'
                                )
                              }}
                            />
                          </div>
                          {(zone.latitude && zone.longitude) && (
                            <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-600">
                              {zone.latitude}, {zone.longitude}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'dashboard' && (
          <div className="space-y-6">
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MapPin className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total de Zonas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {zones.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Zonas Activas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {zones.filter(z => z.is_active !== false).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Building2 className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Plantas Principales
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {zones.filter(z => z.zone_type === 'Planta Principal').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Factory className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Plantas Secundarias
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {zones.filter(z => z.zone_type === 'Planta Secundaria').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Análisis por tipo de zona */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Distribución por Tipo de Zona
                </h3>
                <div className="space-y-4">
                  {[
                    { type: 'Planta Principal', color: 'bg-blue-500', icon: Building2 },
                    { type: 'Planta Secundaria', color: 'bg-green-500', icon: Factory },
                    { type: 'Depósito', color: 'bg-purple-500', icon: Building2 },
                    { type: 'Oficinas', color: 'bg-orange-500', icon: Building2 },
                    { type: 'Punto de Venta', color: 'bg-red-500', icon: Building2 }
                  ].map(({ type, color, icon: Icon }) => {
                    const count = zones.filter(z => z.zone_type === type).length;
                    const percentage = zones.length > 0 ? (count / zones.length * 100).toFixed(1) : 0;
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Icon className="h-5 w-5 text-gray-400 mr-3" />
                          <span className="text-sm font-medium text-gray-900">{type}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 w-32">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className={`${color} h-2 rounded-full`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-500 w-12 text-right">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Zonas con Geolocalización
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-sm font-medium text-gray-900">Con Mapa</span>
                    </div>
                    <span className="text-lg font-semibold text-green-600">
                      {zones.filter(z => z.location_iframe).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900">Sin Mapa</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-600">
                      {zones.filter(z => !z.location_iframe).length}
                    </span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ 
                          width: `${zones.length > 0 ? (zones.filter(z => z.location_iframe).length / zones.length * 100) : 0}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {zones.length > 0 ? ((zones.filter(z => z.location_iframe).length / zones.length * 100).toFixed(1)) : 0}% 
                      de las zonas tienen ubicación configurada
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de zonas por estado */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Zonas por Provincia
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(
                    zones.reduce((acc, zone) => {
                      const state = zone.state || 'Sin Provincia';
                      if (!acc[state]) {
                        acc[state] = { count: 0, cities: new Set() };
                      }
                      acc[state].count++;
                      acc[state].cities.add(zone.city || 'Sin Ciudad');
                      return acc;
                    }, {})
                  ).map(([state, data]) => (
                    <div key={state} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{state}</h4>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                          {data.count} zona{data.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {data.cities.size} ciudad{data.cities.size !== 1 ? 'es' : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Array.from(data.cities).slice(0, 3).map((city, idx) => (
                          <span key={idx} className="text-xs bg-white text-gray-600 px-2 py-1 rounded">
                            {city}
                          </span>
                        ))}
                        {data.cities.size > 3 && (
                          <span className="text-xs text-gray-500">
                            +{data.cities.size - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Acciones Rápidas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowZoneModal(true)}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                >
                  <div className="text-center">
                    <Plus className="h-8 w-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                      Agregar Nueva Zona
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={() => setViewMode('map')}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
                >
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-gray-400 group-hover:text-green-500 mx-auto mb-2" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-green-600">
                      Ver Mapas
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={handleRefresh}
                  className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
                >
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 text-gray-400 group-hover:text-purple-500 mx-auto mb-2" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-purple-600">
                      Actualizar Datos
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de zona */}
        {showZoneModal && (
          <ZoneModal
            isOpen={showZoneModal}
            zone={selectedZone}
            mode={selectedZone ? 'edit' : 'create'}
            onClose={handleCloseModal}
            onSave={handleSaveZone}
          />
        )}

        {/* Modal de vista de zona */}
        {showZoneViewModal && (
          <ZoneViewModal
            isOpen={showZoneViewModal}
            onClose={handleCloseViewModal}
            zone={zoneToView}
          />
        )}

        {/* Modal de copia de precios */}
        {showPriceCopyModal && (
          <PriceCopyModal
            isOpen={showPriceCopyModal}
            onClose={handleClosePriceCopyModal}
            sourceZoneId={priceCopySourceZone?.id}
          />
        )}

        {/* Dialog de confirmación de eliminación */}
        {showDeleteDialog && (
          <DialogoConfirmacion
            title="¿Eliminar zona?"
            message={`¿Estás seguro de que quieres eliminar la zona "${zoneToDelete?.name}"? Esta acción no se puede deshacer y eliminará todos los precios asociados.`}
            confirmText="Eliminar"
            cancelText="Cancelar"
            variant="danger"
            onConfirm={confirmDelete}
            onCancel={() => setShowDeleteDialog(false)}
            isLoading={deleteZoneMutation.isLoading}
          />
        )}
    </div>
  );
};

export default Zonas;
