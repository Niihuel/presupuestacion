/**
 * Página de gestión de clientes
 * 
 * Permite crear, editar y gestionar clientes del sistema
 * Migrado a React Query para estado del servidor
 * UPDATED: Matching Dashboard spacing and layout
 */

import { useState } from 'react';
import { Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCustomers, useDeleteCustomer } from '@shared/hooks/useCustomersHook';
import CustomerModal from './components/CustomerModal';
import CustomerViewModal from './components/CustomerViewModal';
import DeleteConfirmModal from '@shared/components/DeleteConfirmModal';

const Clientes = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '' });
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit' | 'view'
    customer: null
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    customer: null
  });

  // React Query hooks
  const { 
    data: { customers: clientes = [], totalPages = 1, currentPage = 1 } = {}, 
    isLoading: loading, 
    error 
  } = useCustomers({ ...filters, page, limit: 10 });
  
  const deleteCustomerMutation = useDeleteCustomer();

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleDeleteCustomer = (customer) => {
    setDeleteModal({
      isOpen: true,
      customer
    });
  };

  const confirmDelete = () => {
    if (deleteModal.customer) {
      deleteCustomerMutation.mutate(deleteModal.customer.id);
      setDeleteModal({ isOpen: false, customer: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, customer: null });
  };

  const openModal = (mode, customer = null) => {
    setModalState({
      isOpen: true,
      mode,
      customer
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create',
      customer: null
    });
  };

  const SkeletonLoader = () => (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
      </div>

      {/* Actions bar skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 max-w-lg">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
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
          <p className="font-medium">Error al cargar clientes</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="mt-2 text-gray-600">Gestiona y administra todos los clientes del sistema</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={() => openModal('create')}
              className="w-full sm:w-auto flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Crear Cliente
            </button>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y acciones */}
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
        </div>
      </div>

      {/* Card de contenido */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {clientes.length === 0 ? (
          <div className="text-center py-12">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay clientes</h3>
              <p className="text-gray-600 mb-4">
                {filters.search 
                  ? 'No se encontraron clientes que coincidan con tu búsqueda.'
                  : 'Comienza creando tu primer cliente.'
                }
              </p>
              {!filters.search && (
                <button
                  onClick={() => openModal('create')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Cliente
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{c.name}</div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{c.email}</div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{c.phone}</div>
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
                          title="Editar cliente"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCustomer(c)}
                          disabled={deleteCustomerMutation.isPending}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors"
                          title="Eliminar cliente"
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
            {totalPages > 1 && (
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
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando {page} de {totalPages} páginas
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
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
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
      <CustomerModal
        isOpen={modalState.isOpen && (modalState.mode === 'create' || modalState.mode === 'edit')}
        onClose={closeModal}
        customer={modalState.customer}
        mode={modalState.mode}
      />
      
      <CustomerViewModal
        isOpen={modalState.isOpen && modalState.mode === 'view'}
        onClose={closeModal}
        customer={modalState.customer}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Eliminar Cliente"
        message="¿Está seguro de que desea eliminar este cliente?"
        itemName={deleteModal.customer?.name}
        isLoading={deleteCustomerMutation.isPending}
      />
    </div>
  );
};

export default Clientes;
