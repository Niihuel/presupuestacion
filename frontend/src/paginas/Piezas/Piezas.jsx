/**
 * Página Principal de Piezas
 * 
 * Vista principal del módulo de piezas con gestión completa:
 * - Listado con métricas y filtros avanzados
 * - CRUD completo de piezas con precios por zona
 * - Búsqueda en tiempo real y filtros dinámicos
 * - Diseño corporativo unificado siguiendo los estilos definidos
 */

import { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  MapPin,
  Layers,
  Grid3X3,
  List,
  Package2,
  Ruler,
  Weight
} from 'lucide-react';

// Hooks y servicios
import { 
  usePieces, 
  useCreatePiece, 
  useUpdatePiece, 
  useDeletePiece 
} from '@compartido/hooks/usePiecesHook';
import { useZones } from '@compartido/hooks/useZonesHook';

// Componentes
import PieceModalComplete from '@componentes/pieces/components/PieceModalComplete';
import PieceViewModal from '@componentes/pieces/components/PieceViewModal';
import DeleteConfirmModal from '@compartido/componentes/ModalConfirmarEliminar.jsx';
import { useNotifications } from '@compartido/hooks/useNotificaciones';

const Piezas = () => {
  // Estados locales
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [showPieceModal, setShowPieceModal] = useState(false);
  const [showPieceViewModal, setShowPieceViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [page, setPage] = useState(1);
  const limit = 12;

  // Notificaciones
  const { success, error } = useNotifications();

  // Hooks de datos
  const { 
    data: piecesData = { pieces: [], pagination: {} }, 
    isLoading: piecesLoading, 
    error: piecesError,
    refetch: refetchPieces
  } = usePieces({
    page,
    limit,
    search: searchTerm,
    zone: selectedZone,
    family: selectedFamily
  });

  // Extraer piezas del objeto de datos
  const pieces = piecesData.pieces || [];
  const pagination = piecesData.pagination || {};

  const { 
    data: zonesData, 
    isLoading: zonesLoading 
  } = useZones();

  // Extraer zonas del objeto de datos
  const zones = zonesData?.zones || [];

  // Mutations
  const createPieceMutation = useCreatePiece();
  const updatePieceMutation = useUpdatePiece();
  const deletePieceMutation = useDeletePiece();

  // Familias de piezas (podrían venir de una API)
  const piecesFamilies = [
    { id: 1, name: 'Vigas', code: 'VIG' },
    { id: 2, name: 'Columnas', code: 'COL' },
    { id: 3, name: 'Losas', code: 'LOS' },
    { id: 4, name: 'Placas', code: 'PLA' }
  ];

  // Métricas calculadas
  const metrics = [
    {
      label: 'Total Piezas',
      value: Array.isArray(pieces) ? pieces.length : 0,
      icon: Package,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      label: 'Con Precios',
      value: Array.isArray(pieces) ? pieces.filter(p => p.prices && p.prices.length > 0).length : 0,
      icon: DollarSign,
      color: 'text-green-600 bg-green-50'
    },
    {
      label: 'Zonas Activas',
      value: Array.isArray(zones) ? zones.filter(z => z.is_active).length : 0,
      icon: MapPin,
      color: 'text-purple-600 bg-purple-50'
    },
    {
      label: 'Familias',
      value: piecesFamilies.length,
      icon: Layers,
      color: 'text-orange-600 bg-orange-50'
    }
  ];

  // Formatear precio
  const formatPrice = (price) => {
    if (!price) return 'Sin precio';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  // Handlers
  const handleCreatePiece = () => {
    setSelectedPiece(null);
    setModalMode('create');
    setShowPieceModal(true);
  };

  const handleEditPiece = (piece) => {
    setSelectedPiece(piece);
    setModalMode('edit');
    setShowPieceModal(true);
  };

  const handleViewPiece = (piece) => {
    setSelectedPiece(piece);
    setShowPieceViewModal(true);
  };

  const handleDeletePiece = (piece) => {
    setSelectedPiece(piece);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedPiece) return;
    
    try {
      await deletePieceMutation.mutateAsync(selectedPiece.id);
      success('Pieza eliminada correctamente');
      setShowDeleteModal(false);
      setSelectedPiece(null);
    } catch (err) {
      console.error('Error al eliminar pieza:', err);
      error('Error al eliminar la pieza');
    }
  };

  const handleModalClose = () => {
    setShowPieceModal(false);
    setSelectedPiece(null);
  };

  const handleViewModalClose = () => {
    setShowPieceViewModal(false);
    setSelectedPiece(null);
  };

  // Estados de carga
  if (piecesLoading && pieces.length === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Renderizado de card de pieza
  const PieceCard = ({ piece }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{piece.name}</h3>
            <p className="text-sm text-gray-500">{piece.code || 'Sin código'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleViewPiece(piece)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEditPiece(piece)}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeletePiece(piece)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <Ruler className="h-4 w-4 mr-2" />
          <span>
            {piece.length}×{piece.width}×{piece.height} cm
          </span>
        </div>
        
        {piece.weight && (
          <div className="flex items-center text-sm text-gray-600">
            <Weight className="h-4 w-4 mr-2" />
            <span>{piece.weight} kg</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Precio base:</span>
          <span className="font-semibold text-gray-900">
            {piece.prices && piece.prices.length > 0 
              ? formatPrice(piece.prices[0].base_price) 
              : 'Sin definir'
            }
          </span>
        </div>
      </div>

      {piece.description && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 line-clamp-2">{piece.description}</p>
        </div>
      )}
    </div>
  );

  // Renderizado de fila de tabla
  const PieceTableRow = ({ piece }) => (
    <tr className="hover:bg-gray-50">
      <td className="py-4 px-6 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{piece.name}</div>
            <div className="text-sm text-gray-500">{piece.code || 'Sin código'}</div>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 whitespace-nowrap">
        <span className="text-sm text-gray-900">
          {piece.length}×{piece.width}×{piece.height}
        </span>
      </td>
      <td className="py-4 px-6 whitespace-nowrap">
        <span className="text-sm text-gray-900">{piece.weight || '-'} kg</span>
      </td>
      <td className="py-4 px-6 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">
          {piece.prices && piece.prices.length > 0 
            ? formatPrice(piece.prices[0].base_price) 
            : 'Sin definir'
          }
        </span>
      </td>
      <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => handleViewPiece(piece)}
            className="text-blue-600 hover:text-blue-900"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEditPiece(piece)}
            className="text-green-600 hover:text-green-900"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeletePiece(piece)}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-8">
      {/* Header Principal */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Piezas</h1>
            <p className="mt-2 text-gray-600">
              Administra el catálogo de piezas prefabricadas y sus precios por zona
            </p>
          </div>
          <button
            onClick={handleCreatePiece}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva Pieza
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${metric.color}`}>
                <metric.icon className="h-6 w-6" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-700">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controles y Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Búsqueda */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar piezas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center space-x-4">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las zonas</option>
              {Array.isArray(zones) && zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>

            <select
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las familias</option>
              {piecesFamilies.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>

            {/* Toggle de vista */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Piezas */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pieces.map((piece) => (
            <PieceCard key={piece.id} piece={piece} />
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pieza
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dimensiones
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peso
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Base
                </th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pieces.map((piece) => (
                <PieceTableRow key={piece.id} piece={piece} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Estado vacío */}
      {!piecesLoading && pieces.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay piezas</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedZone || selectedFamily
              ? 'No se encontraron piezas con los filtros aplicados.'
              : 'Comienza agregando tu primera pieza al catálogo.'
            }
          </p>
          {!searchTerm && !selectedZone && !selectedFamily && (
            <button
              onClick={handleCreatePiece}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Pieza
            </button>
          )}
        </div>
      )}

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, pagination.total)} de {pagination.total} piezas
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-sm text-gray-700">
                Página {page} de {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <PieceModalComplete
        isOpen={showPieceModal}
        onClose={handleModalClose}
        piece={selectedPiece}
        mode={modalMode}
        onSuccess={() => {
          refetchPieces();
          handleModalClose();
        }}
      />

      <PieceViewModal
        isOpen={showPieceViewModal}
        onClose={handleViewModalClose}
        piece={selectedPiece}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Pieza"
        message={`¿Estás seguro de que deseas eliminar la pieza "${selectedPiece?.name}"? Esta acción no se puede deshacer.`}
        isLoading={deletePieceMutation.isPending}
      />
    </div>
  );
};

export default Piezas;
