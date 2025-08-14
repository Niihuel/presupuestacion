/**
 * Página de Gestión de Calculistas
 * 
 * Sistema completo de gestión de calculistas con:
 * - CRUD completo con vista de lista
 * - Dashboard con métricas por calculista
 * - Gestión de plantas asignadas
 * - Herramientas de administración
 */

import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import { 
  useCalculistas, 
  useCreateCalculista,
  useUpdateCalculista,
  useDeleteCalculista, 
  useToggleCalculistaStatus,
  CALCULISTA_SPECIALTIES 
} from '@compartido/hooks/useCalculistasHook';
// Componentes
import CalculistaModal from './CalculistaModal';
import CalculistaViewModal from './CalculistaViewModal';
import CalculistaDeleteModal from './CalculistaDeleteModal';

const Calculistas = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ 
    search: '', 
    specialty: '', 
    active: 'true' 
  });
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit' | 'view'
    calculista: null
  });
  
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    calculista: null
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    calculista: null
  });

  // React Query hooks
  const { 
    data: { calculistas = [], pagination = {} } = {}, 
    isLoading: loading, 
    error 
  } = useCalculistas({ ...filters, page, limit: 10 });
  
  const createCalculistaMutation = useCreateCalculista();
  const updateCalculistaMutation = useUpdateCalculista();
  const deleteCalculistaMutation = useDeleteCalculista();
  const toggleStatusMutation = useToggleCalculistaStatus();

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleDeleteCalculista = (calculista) => {
    setDeleteModalState({
      isOpen: true,
      calculista
    });
  };

  const handleConfirmDelete = (id) => {
    deleteCalculistaMutation.mutate(id, {
      onSuccess: () => {
        setDeleteModalState({ isOpen: false, calculista: null });
      }
    });
  };

  const handleToggleStatus = (calculista) => {
    const action = calculista.active ? 'desactivar' : 'activar';
    if (window.confirm(`¿Está seguro de que desea ${action} este calculista?`)) {
      toggleStatusMutation.mutate({
        id: calculista.id,
        active: !calculista.active
      });
    }
  };

  const openModal = (mode, calculista = null) => {
    setModalState({
      isOpen: true,
      mode,
      calculista
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      calculista: null
    });
  };

  const handleSave = async (formData) => {
    try {
      if (modalState.mode === 'create') {
        await createCalculistaMutation.mutateAsync(formData);
      } else if (modalState.mode === 'edit') {
        await updateCalculistaMutation.mutateAsync({ 
          id: modalState.calculista.id, 
          data: formData 
        });
      }
      closeModal();
    } catch (error) {
      console.error('Error saving calculista:', error);
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', specialty: '', active: 'true' });
    setPage(1);
  };

  const SkeletonLoader = () => (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
      </div>

      {/* Filters skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 max-w-lg">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="flex space-x-2 ml-auto">
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) return <SkeletonLoader />;
  
  if (error) return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-sm text-red-600 bg-red-100 p-3 rounded-md">
          <p className="font-medium">Error al cargar calculistas</p>
          <p className="mt-1">{error?.message || 'Error desconocido'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header de página */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calculistas</h1>
            <p className="mt-2 text-gray-600">Gestiona y administra todos los calculistas del sistema</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={() => openModal('create')}
              className="w-full sm:w-auto flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Crear Calculista
            </button>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 max-w-lg">
            <input
              type="text"
              name="search"
              placeholder="Buscar por nombre, email o teléfono..."
              value={filters.search}
              onChange={handleFilterChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              name="specialty"
              value={filters.specialty}
              onChange={handleFilterChange}
              className="mt-1 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
            >
              <option value="">Todas las especialidades</option>
              {CALCULISTA_SPECIALTIES.map(specialty => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
            <select
              name="active"
              value={filters.active}
              onChange={handleFilterChange}
              className="mt-1 block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
            >
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
              <option value="all">Todos</option>
            </select>
            {(filters.search || filters.specialty || filters.active !== 'true') && (
              <button
                onClick={clearFilters}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card de contenido */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {calculistas.length === 0 ? (
          <div className="text-center py-12">
            <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay calculistas</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.specialty || filters.active !== 'true'
                ? 'No se encontraron calculistas que coincidan con los filtros aplicados.'
                : 'Comienza creando tu primer calculista.'
              }
            </p>
            {!filters.search && !filters.specialty && filters.active === 'true' && (
              <button
                onClick={() => openModal('create')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Calculista
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calculista</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidad</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {calculistas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Calculator className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{c.name}</div>
                          {c.license_number && (
                            <div className="text-sm text-gray-500">Mat. {c.license_number}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {c.specialty || 'No especificada'}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{c.email || '-'}</div>
                      <div className="text-sm text-gray-500">{c.phone || '-'}</div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {c.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openModal('view', c)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-gray-100 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => openModal('edit', c)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition-colors"
                          title="Editar calculista"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCalculista(c)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-gray-100 transition-colors"
                          title="Eliminar calculista"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                      disabled={page === pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, pagination.totalItems)} de {pagination.totalItems} resultados
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                          disabled={page === pagination.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modales */}
      <CalculistaModal
        calculista={modalState.isOpen && (modalState.mode === 'create' || modalState.mode === 'edit') ? (modalState.mode === 'create' ? {} : modalState.calculista) : null}
        onClose={closeModal}
        onSave={handleSave}
        isLoading={createCalculistaMutation.isLoading || updateCalculistaMutation.isLoading}
      />
      
      <CalculistaViewModal
        isOpen={modalState.isOpen && modalState.mode === 'view'}
        onClose={closeModal}
        calculista={modalState.calculista}
      />

      <CalculistaDeleteModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, calculista: null })}
        onConfirm={handleConfirmDelete}
        calculista={deleteModalState.calculista}
        isLoading={deleteCalculistaMutation.isLoading}
      />
    </div>
  );
};

export default Calculistas;
