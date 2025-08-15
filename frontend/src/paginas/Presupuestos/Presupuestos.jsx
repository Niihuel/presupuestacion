/**
 * Página de Presupuestos - Rediseño 4.0
 * 
 * Lista y gestión de presupuestos con diseño moderno
 * basado en los principios de diseño corporativo del dashboard
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  Search, 
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  Users,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Hooks
import { useCotizaciones as useQuotations } from '@compartido/hooks';

const PresupuestosModern = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Obtener presupuestos
  const { 
    data: quotationsData, 
    isLoading, 
    error 
  } = useQuotations({
    search: searchTerm,
    status: statusFilter,
    sort_by: sortBy,
    sort_order: sortOrder
  });

  const quotations = quotationsData?.quotations || [];
  const pagination = quotationsData?.pagination || {};

  // Estados de presupuesto con colores
  const getStatusStyle = (status) => {
    const statusStyles = {
      'draft': { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800', 
        icon: Clock,
        label: 'Borrador' 
      },
      'sent': { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        icon: FileText,
        label: 'Enviado' 
      },
      'pending': { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        icon: Clock,
        label: 'Pendiente' 
      },
      'approved': { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        icon: CheckCircle,
        label: 'Aprobado' 
      },
      'rejected': { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        icon: XCircle,
        label: 'Rechazado' 
      },
      'expired': { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800', 
        icon: XCircle,
        label: 'Expirado' 
      }
    };
    return statusStyles[status] || statusStyles['draft'];
  };

  // Estados de carga
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar presupuestos</h3>
            <p className="text-gray-600 mb-4">
              No se pudieron cargar los presupuestos. Por favor, intenta nuevamente.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Componente para mostrar estado vacío
  const EmptyState = () => (
    <div className="text-center py-12">
      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay presupuestos</h3>
      <p className="text-gray-600 mb-4">
        Comienza creando tu primer presupuesto para ver la información aquí.
      </p>
      <button
        onClick={() => navigate('/presupuestos/wizard')}
        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nueva Presupuestación
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Presupuestos</h2>
            <p className="text-lg text-gray-600 mt-1">
              Gestiona y da seguimiento a todos tus presupuestos
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <button
              onClick={() => navigate('/presupuestos/kanban')}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Vista Kanban
            </button>
            <button
              onClick={() => navigate('/presupuestos/wizard')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              Nueva Presupuestación
            </button>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar presupuestos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtro por Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="sent">Enviado</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Aprobado</option>
            <option value="rejected">Rechazado</option>
            <option value="expired">Expirado</option>
          </select>

          {/* Ordenar por */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="created_at">Fecha de creación</option>
            <option value="updated_at">Última actualización</option>
            <option value="total_amount">Monto total</option>
            <option value="status">Estado</option>
          </select>

          {/* Orden */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </div>
      </div>

      {/* Lista de Presupuestos */}
      <div className="bg-white rounded-lg shadow-md">
        {quotations.length === 0 ? (
          <div className="p-6">
            <EmptyState />
          </div>
        ) : (
          <>
            {/* Header de la tabla */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-1">#</div>
                <div className="col-span-2">Cliente</div>
                <div className="col-span-2">Proyecto</div>
                <div className="col-span-2">Estado</div>
                <div className="col-span-2">Monto</div>
                <div className="col-span-2">Fecha</div>
                <div className="col-span-1">Acciones</div>
              </div>
            </div>

            {/* Filas de presupuestos */}
            <div className="divide-y divide-gray-200">
              {quotations.map((quotation, index) => {
                const statusStyle = getStatusStyle(quotation.status);
                const StatusIcon = statusStyle.icon;

                return (
                  <div key={quotation.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* ID */}
                      <div className="col-span-1">
                        <span className="text-sm font-medium text-gray-900">
                          #{quotation.id}
                        </span>
                      </div>

                      {/* Cliente */}
                      <div className="col-span-2">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {quotation.customer?.name || `Cliente #${quotation.customer_id}`}
                          </span>
                        </div>
                      </div>

                      {/* Proyecto */}
                      <div className="col-span-2">
                        <span className="text-sm text-gray-900">
                          {quotation.project?.name || quotation.description || 'Sin descripción'}
                        </span>
                      </div>

                      {/* Estado */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusStyle.label}
                        </span>
                      </div>

                      {/* Monto */}
                      <div className="col-span-2">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            ${quotation.total?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>

                      {/* Fecha */}
                      <div className="col-span-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">
                            {new Date(quotation.created_at).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/presupuestos/${quotation.id}`)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/presupuestos/${quotation.id}/editar`)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50">
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded">
                      {pagination.page}
                    </span>
                    <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50">
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PresupuestosModern;
