/**
 * Página Principal de Gestión de Materiales
 * 
 * Sistema completo de gestión de materiales/materia prima con:
 * - CRUD completo de materiales
 * - Gestión de stock por planta
 * - Control de precios por proveedor y planta
 * - Dashboard con métricas de materiales
 * - Historial de precios y proveedores
 * - Integración con piezas y plantas
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  DollarSign,
  TrendingUp,
  Factory,
  Truck,
  BarChart3,
  Download,
  Upload,
  Eye,
  Edit3,
  Trash2,
  MoreVertical,
  Archive,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers
} from 'lucide-react';

// Hooks
import { 
  useMaterials, 
  useMaterialsStats,
  useDeleteMaterial 
} from '@compartido/hooks/useMateriales';
import { useZonas as useZones } from '@compartido/hooks/useZonas';
import { useNotificaciones as useNotifications } from '@compartido/hooks/useNotificaciones';

// Componentes
import MaterialCard from '@features/materials/components/MaterialCard.jsx';
import MaterialModal from '@features/materials/components/MaterialModal.jsx';
import MaterialViewModal from '@features/materials/components/MaterialViewModal.jsx';
import MaterialDeleteModal from '@features/materials/components/MaterialDeleteModal.jsx';
import MaterialStockModal from '@features/materials/components/MaterialStockModal.jsx';
import MaterialPriceHistoryModal from '@features/materials/components/MaterialPriceHistoryModal.jsx';
import MaterialWhereUsed from '@componentes/materials/components/MaterialWhereUsed';
import DialogoConfirmacion from '@compartido/components/DialogoConfirmacion';

const Materiales = () => {
  // Estados locales
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isPriceHistoryModalOpen, setIsPriceHistoryModalOpen] = useState(false);
  const [isWhereUsedModalOpen, setIsWhereUsedModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('');
  const [stockFilter, setStockFilter] = useState(''); // 'low' | 'out' | 'available'
  const [priceFilter, setPriceFilter] = useState(''); // 'updated' | 'outdated'
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Hooks de datos
  const { 
    data: materialsData = { materials: [], pagination: {} }, 
    isLoading: materialsLoading,
    refetch: refetchMaterials 
  } = useMaterials({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    category: selectedCategory,
    plant: selectedPlant,
    stockStatus: stockFilter,
    priceStatus: priceFilter
  });

  const { 
    data: zonesData = { zones: [] }, 
    isLoading: zonesLoading 
  } = useZones();

  const { 
    data: statsData = {}, 
    isLoading: statsLoading 
  } = useMaterialsStats();

  const { mutate: deleteMaterial } = useDeleteMaterial();
  const { showNotification } = useNotifications();

  // Datos procesados
  const { materials = [], pagination = {} } = materialsData;
  const { zones = [] } = zonesData;
  const totalPages = Math.ceil((pagination.total || 0) / itemsPerPage);

  // Categorías de materiales
  const materialCategories = [
    'Hormigón',
    'Acero',
    'Insertos Metálicos',
    'Geotextil',
    'Aditivos',
    'Herramientas',
    'Otros'
  ];

  // Filtros computados
  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      const matchesSearch = material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           material.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           material.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || material.category === selectedCategory;
      const matchesPlant = !selectedPlant || material.plantStocks?.some(stock => stock.plantId === selectedPlant);
      
      return matchesSearch && matchesCategory && matchesPlant;
    });
  }, [materials, searchTerm, selectedCategory, selectedPlant]);

  // Handlers
  const handleCreateMaterial = () => {
    setSelectedMaterial(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditMaterial = (material) => {
    setSelectedMaterial(material);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleViewMaterial = (material) => {
    setSelectedMaterial(material);
    setIsViewModalOpen(true);
  };

  const handleWhereUsed = (material) => {
    setSelectedMaterial(material);
    setIsWhereUsedModalOpen(true);
  };

  const handleDeleteMaterial = (material) => {
    setSelectedMaterial(material);
    setIsDeleteModalOpen(true);
  };

  const handleManageStock = (material) => {
    setSelectedMaterial(material);
    setIsStockModalOpen(true);
  };

  const handleViewPriceHistory = (material) => {
    setSelectedMaterial(material);
    setIsPriceHistoryModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedMaterial) {
      try {
        await deleteMaterial(selectedMaterial.id);
        showNotification('Material eliminado correctamente', 'success');
        setIsDeleteModalOpen(false);
        setSelectedMaterial(null);
        refetchMaterials();
      } catch (error) {
        showNotification('Error al eliminar el material', 'error');
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsStockModalOpen(false);
    setIsPriceHistoryModalOpen(false);
    setSelectedMaterial(null);
    refetchMaterials();
  };

  // Métricas rápidas
  const quickStats = {
    total: materials.length,
    lowStock: materials.filter(m => m.stockStatus === 'low').length,
    outOfStock: materials.filter(m => m.stockStatus === 'out').length,
    pricesUpdated: materials.filter(m => m.priceStatus === 'updated').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-8 w-8 text-blue-600" />
            Gestión de Materiales
          </h1>
          <p className="text-gray-600 mt-1">
            Administra materias primas, stock por planta y precios de proveedores
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {/* TODO: Implementar importación */}}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Importar
          </button>
          
          <button
            onClick={() => {/* TODO: Implementar exportación */}}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          
          <button
            onClick={handleCreateMaterial}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Material
          </button>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Materiales</p>
              <p className="text-2xl font-bold text-gray-900">{quickStats.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-orange-600">{quickStats.lowStock}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sin Stock</p>
              <p className="text-2xl font-bold text-red-600">{quickStats.outOfStock}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Archive className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Precios Actualizados</p>
              <p className="text-2xl font-bold text-green-600">{quickStats.pricesUpdated}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar materiales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categoría */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {materialCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Planta */}
          <select
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las plantas</option>
            {zones.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
          </select>

          {/* Estado del Stock */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Estado del stock</option>
            <option value="available">Disponible</option>
            <option value="low">Stock bajo</option>
            <option value="out">Sin stock</option>
          </select>

          {/* Estado de Precios */}
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Estado de precios</option>
            <option value="updated">Actualizados</option>
            <option value="outdated">Desactualizados</option>
          </select>
        </div>
      </div>

      {/* Lista de Materiales */}
      <div className="bg-white rounded-lg shadow-md">
        {materialsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay materiales</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory || selectedPlant 
                ? 'No se encontraron materiales con los filtros aplicados'
                : 'Comienza creando tu primer material'
              }
            </p>
            {!searchTerm && !selectedCategory && !selectedPlant && (
              <div className="mt-6">
                <button
                  onClick={handleCreateMaterial}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Material
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {filteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onView={handleViewMaterial}
                onEdit={handleEditMaterial}
                onDelete={handleDeleteMaterial}
                onManageStock={handleManageStock}
                onViewPriceHistory={handleViewPriceHistory}
                onWhereUsed={handleWhereUsed}
              />
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-700">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, pagination.total || 0)} de {pagination.total || 0} materiales
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="px-3 py-1 text-sm font-medium text-gray-900">
                {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {isModalOpen && (
        <MaterialModal
          material={selectedMaterial}
          mode={modalMode}
          zones={zones}
          onClose={handleModalClose}
        />
      )}

      {isViewModalOpen && selectedMaterial && (
        <MaterialViewModal
          material={selectedMaterial}
          onClose={handleModalClose}
          onEdit={() => {
            setIsViewModalOpen(false);
            handleEditMaterial(selectedMaterial);
          }}
          onDelete={() => {
            setIsViewModalOpen(false);
            handleDeleteMaterial(selectedMaterial);
          }}
        />
      )}

      {isDeleteModalOpen && selectedMaterial && (
        <MaterialDeleteModal
          material={selectedMaterial}
          onClose={handleModalClose}
          onConfirm={confirmDelete}
        />
      )}

      {isStockModalOpen && selectedMaterial && (
        <MaterialStockModal
          material={selectedMaterial}
          zones={zones}
          onClose={handleModalClose}
        />
      )}

      {isPriceHistoryModalOpen && selectedMaterial && (
        <MaterialPriceHistoryModal
          material={selectedMaterial}
          onClose={handleModalClose}
        />
      )}

      {/* Modal Where-Used */}
      <MaterialWhereUsed
        material={selectedMaterial}
        isOpen={isWhereUsedModalOpen}
        onClose={() => {
          setIsWhereUsedModalOpen(false);
          setSelectedMaterial(null);
        }}
      />
    </div>
  );
};

export default Materiales;
