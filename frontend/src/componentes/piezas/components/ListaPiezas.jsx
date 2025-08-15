/**
 * Lista principal de piezas
 * 
 * Componente para mostrar, buscar y filtrar piezas con diseño moderno.
 * Incluye paginación, búsqueda en tiempo real y filtros por zona.
 */

import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Grid3X3, 
  List,
  Package,
  DollarSign,
  MapPin
} from 'lucide-react';

import { usePieces, useDeletePiece } from '@compartido/hooks/usePiecesHook';
import PieceCard from './PieceCard';
// Importar el modal desde el mismo directorio para evitar rutas incorrectas
import PieceModalComplete from './PieceModalComplete';
<<<<<<< Current (Your changes)
import { DialogoConfirmacion as DeleteConfirmModal, LoadingSpinner, Paginacion } from '@compartido/components';
=======
import DeleteConfirmModal from '@compartido/componentes/ModalConfirmarEliminar.jsx';
import LoadingSpinner from '@compartido/componentes/CargandoSpinner.jsx';
import Paginacion from '@compartido/componentes/Paginacion.jsx';
>>>>>>> Incoming (Background Agent changes)

const PiecesList = () => {
  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, piece: null });
  
  const itemsPerPage = 12;

  // React Query hooks
  const { 
    data: piecesData, 
    isLoading, 
    error,
    refetch 
  } = usePieces({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm,
    zone: selectedZone
  });

  const deletePieceMutation = useDeletePiece();

  // Datos paginados
  const pieces = piecesData?.pieces || [];
  const totalPages = Math.ceil((piecesData?.total || 0) / itemsPerPage);

  // Filtros locales (adicionales al servidor)
  const filteredPieces = useMemo(() => {
    return pieces.filter(piece => {
      const matchesSearch = !searchTerm || 
        piece.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        piece.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        piece.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesZone = !selectedZone || piece.zoneId === selectedZone;
      
      return matchesSearch && matchesZone;
    });
  }, [pieces, searchTerm, selectedZone]);

  // Handlers
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset a primera página
  };

  const handleZoneFilter = (zoneId) => {
    setSelectedZone(zoneId);
    setCurrentPage(1);
  };

  const handleEdit = (piece) => {
    setSelectedPiece(piece);
    setIsModalOpen(true);
  };

  const handleDelete = (piece) => {
    setDeleteConfirm({ open: true, piece });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.piece) {
      try {
        await deletePieceMutation.mutateAsync(deleteConfirm.piece.id);
        setDeleteConfirm({ open: false, piece: null });
      } catch (error) {
        console.error('Error deleting piece:', error);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPiece(null);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-sm">
        <div className="text-center">
          <Package className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar piezas</h3>
          <p className="text-gray-500 mb-4">No se pudieron cargar las piezas</p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Piezas</h1>
          <p className="text-gray-500 mt-1">
            Administra el catálogo de piezas y sus precios por zona
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Pieza
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, código o descripción..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por zona */}
          <div className="sm:w-48">
            <select
              value={selectedZone}
              onChange={(e) => handleZoneFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las zonas</option>
              <option value="1">Zona Norte</option>
              <option value="2">Zona Sur</option>
              <option value="3">Zona Centro</option>
              <option value="4">Zona Este</option>
              <option value="5">Zona Oeste</option>
            </select>
          </div>

          {/* Toggle vista */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">
                Total: <span className="font-semibold text-gray-900">{piecesData?.total || 0}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-600">
                En stock: <span className="font-semibold text-gray-900">{filteredPieces.filter(p => p.stock > 0).length}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-600">
                Filtrados: <span className="font-semibold text-gray-900">{filteredPieces.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {/* Lista de piezas */}
      {!isLoading && (
        <>
          {filteredPieces.length > 0 ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {filteredPieces.map((piece) => (
                <PieceCard
                  key={piece.id}
                  piece={piece}
                  viewMode={viewMode}
                  onEdit={() => handleEdit(piece)}
                  onDelete={() => handleDelete(piece)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron piezas
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedZone 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza agregando tu primera pieza al catálogo'
                }
              </p>
              {!searchTerm && !selectedZone && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primera Pieza
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Paginación */}
      {!isLoading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modales */}
      <PieceModalComplete
        isOpen={isModalOpen}
        onClose={handleModalClose}
        piece={selectedPiece}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, piece: null })}
        onConfirm={confirmDelete}
        title="Eliminar Pieza"
        message={`¿Estás seguro de que deseas eliminar la pieza "${deleteConfirm.piece?.name}"? Esta acción no se puede deshacer.`}
        isLoading={deletePieceMutation.isPending}
      />
    </div>
  );
};

export default PiecesList;
