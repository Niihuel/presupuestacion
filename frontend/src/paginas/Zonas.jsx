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
  MoreVertical
} from 'lucide-react';

// Hooks
import { 
  useZones, 
  useZonesStats,
  useCreateZone,
  useUpdateZone,
  useDeleteZone 
} from '@shared/hooks/useZonesHook';

// Componentes
import ZoneCard from '@paginas/Zonas/ZoneCard.jsx';
import ZoneMap from '@paginas/Zonas/ZoneMap.jsx';
import ZoneDashboard from '@paginas/Zonas/ZoneDashboard.jsx';
import ZoneModal from '@paginas/Zonas/ZoneModal.jsx';
import ZoneViewModal from '@paginas/Zonas/ZoneViewModal.jsx';
import DialogoConfirmacion from '@compartido/componentes/DialogoConfirmacion.jsx';
import ZoneDeleteModal from '../features/zones/components/ZoneDeleteModal';
import PriceCopyModal from './Zonas/PriceCopyModal.jsx';

const Zonas = () => {
  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'map', 'dashboard'
  const [selectedZone, setSelectedZone] = useState(null);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showZoneViewModal, setShowZoneViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showZoneDeleteModal, setShowZoneDeleteModal] = useState(false);
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
    setShowZoneDeleteModal(true);
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

  const handleSaveZone = async (zoneData) => {
    try {
      if (selectedZone) {
        // Actualizar zona existente
        await updateZoneMutation.mutateAsync({
          id: selectedZone.id,
          ...zoneData
        });
        console.log('Zona actualizada correctamente');
      } else {
        // Crear nueva zona
        await createZoneMutation.mutateAsync(zoneData);
        console.log('Zona creada correctamente');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar zona:', error);
    }
  };

  const handleCloseViewModal = () => {
    setShowZoneViewModal(false);
    setZoneToView(null);
  };

  const handleCloseDeleteModal = () => {
    setShowZoneDeleteModal(false);
    setZoneToDelete(null);
  };

  const handleCopyPrices = (sourceZone = null) => {
    setPriceCopySourceZone(sourceZone);
    setShowPriceCopyModal(true);
  };

  const handleClosePriceCopyModal = () => {
    setShowPriceCopyModal(false);
    setPriceCopySourceZone(null);
  };

  // Componente de estadísticas rápidas
  const QuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total de Zonas</p>
            <div className="text-3xl font-bold text-gray-900">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                stats.total_zones || 0
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
              {stats.active_zones || 0} activas
            </span>
            <span className="text-gray-500 ml-2">
              • {stats.inactive_zones || 0} inactivas
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Precios Gestionados</p>
            <div className="text-3xl font-bold text-gray-900">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                stats.total_prices || 0
              )}
            </div>
          </div>
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">
              {stats.price_variations?.average || '0%'} promedio
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Actividad Reciente</p>
            <div className="text-3xl font-bold text-gray-900">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                stats.recent_activity || 0
              )}
            </div>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm text-gray-500">
            <span>Últimos 30 días</span>
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
                stats.coverage?.regions || 0
              )}
            </div>
          </div>
          <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
            <Globe className="w-6 h-6 text-orange-600" />
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
            className={`px-3 py-2 text-sm font-medium ${
              viewMode === 'cards' 
                ? 'bg-blue-50 text-blue-600 border-blue-500' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-2 text-sm font-medium border-l ${
              viewMode === 'map' 
                ? 'bg-blue-50 text-blue-600 border-blue-500' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Map className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-3 py-2 text-sm font-medium border-l ${
              viewMode === 'dashboard' 
                ? 'bg-blue-50 text-blue-600 border-blue-500' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
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
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    onEdit={() => handleEditZone(zone)}
                    onView={() => handleViewZone(zone)}
                    onDelete={() => handleDeleteZone(zone)}
                    onCopyPrices={() => handleCopyPrices(zone)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'map' && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden h-96">
            <ZoneMap
              zones={zones}
              onZoneSelect={setSelectedZone}
              onZoneEdit={handleEditZone}
            />
          </div>
        )}

        {viewMode === 'dashboard' && (
          <ZoneDashboard zones={zones} stats={stats} />
        )}

        {/* Modal de zona */}
        {showZoneModal && (
          <ZoneModal
            isOpen={showZoneModal}
            onClose={handleCloseModal}
            onSave={handleSaveZone}
            zone={selectedZone}
            mode={selectedZone ? 'edit' : 'create'}
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

        {/* Modal de eliminación de zona */}
        {showZoneDeleteModal && (
          <ZoneDeleteModal
            isOpen={showZoneDeleteModal}
            onClose={handleCloseDeleteModal}
            zone={zoneToDelete}
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
