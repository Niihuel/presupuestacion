/**
 * Sistema Kanban para Gestión de Presupuestos
 * 
 * Interfaz tipo tablero Kanban para gestionar los estados de los presupuestos:
 * - Borrador
 * - En Revisión  
 * - Enviado
 * - Aprobado
 * - Rechazado
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Calendar, 
  DollarSign, 
  Users, 
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Search
} from 'lucide-react';

<<<<<<< Current (Your changes)
import { quotationService } from '@compartido/services';
import { useNotificaciones as useNotifications } from '@compartido/hooks';
=======
import { quotationService } from '@compartido/servicios';
import { useNotifications } from '@compartido/hooks/useNotificaciones';
>>>>>>> Incoming (Background Agent changes)

const KanbanPresupuestos = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useNotifications();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);

  // Estados del Kanban
  const boardColumns = [
    {
      id: 'draft',
      title: 'Borradores',
      color: 'bg-gray-100 border-gray-300',
      headerColor: 'bg-gray-600',
      icon: FileText,
      description: 'Presupuestos en desarrollo'
    },
    {
      id: 'in_review',
      title: 'En Revisión',
      color: 'bg-yellow-50 border-yellow-300',
      headerColor: 'bg-yellow-600',
      icon: Clock,
      description: 'Esperando revisión interna'
    },
    {
      id: 'sent',
      title: 'Enviados',
      color: 'bg-blue-50 border-blue-300',
      headerColor: 'bg-blue-600',
      icon: FileText,
      description: 'Enviados al cliente'
    },
    {
      id: 'approved',
      title: 'Aprobados',
      color: 'bg-green-50 border-green-300',
      headerColor: 'bg-green-600',
      icon: CheckCircle,
      description: 'Aprobados por el cliente'
    },
    {
      id: 'rejected',
      title: 'Rechazados',
      color: 'bg-red-50 border-red-300',
      headerColor: 'bg-red-600',
      icon: XCircle,
      description: 'Rechazados o necesitan cambios'
    }
  ];

  // Query para obtener quotations
  const { data: quotationsData, isLoading } = useQuery({
    queryKey: ['quotations-kanban', { search: searchTerm, priority: filterPriority }],
    queryFn: () => quotationService.getAll({
      search: searchTerm,
      priority: filterPriority
    }),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutación para actualizar estado
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }) => quotationService.updateQuotation(id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries(['quotations-kanban']);
      success('Estado actualizado correctamente');
    },
    onError: () => {
      error('Error al actualizar el estado');
    },
  });

  // Organizar quotations por estado
  const organizeByStatus = (quotations) => {
    if (!quotations) return {};
    
    return quotations.reduce((acc, quotation) => {
      // Unificar estados con wizard:
      // draft, in_review, sent, approved, rejected
      let status = quotation.status || 'draft';
      if (status === 'para_revision') status = 'in_review';
      if (!acc[status]) acc[status] = [];
      acc[status].push(quotation);
      return acc;
    }, {});
  };

  const quotationsByStatus = organizeByStatus(quotationsData?.quotations || []);

  // Obtener color de prioridad
  const getPriorityColor = (priority) => {
    const colors = {
      'urgente': 'bg-red-500',
      'alta': 'bg-orange-500',
      'media': 'bg-yellow-500',
      'baja': 'bg-green-500'
    };
    return colors[priority] || 'bg-gray-400';
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  // Manejar drag and drop
  const handleDragStart = (e, quotation) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(quotation));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const quotationData = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    if (quotationData.status !== newStatus) {
      updateStatusMutation.mutate({
        id: quotationData.id,
        newStatus
      });
    }
  };

  // Componente de Tarjeta
  const QuotationCard = ({ quotation }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, quotation)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 cursor-move hover:shadow-md transition-shadow"
    >
      {/* Header de la tarjeta */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm mb-1">
            {quotation.project?.name || `Presupuesto #${quotation.id}`}
          </h4>
          <div className="flex items-center text-xs text-gray-600 mb-2">
            <Users className="w-3 h-3 mr-1" />
            {quotation.customer?.name || `Cliente #${quotation.customer_id}`}
          </div>
        </div>
        
        {/* Prioridad */}
        {quotation.priority && (
          <div 
            className={`w-3 h-3 rounded-full ${getPriorityColor(quotation.priority)}`}
            title={`Prioridad: ${quotation.priority}`}
          />
        )}
      </div>

      {/* Detalles */}
      <div className="space-y-2 text-xs text-gray-600">
        {/* Monto */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="w-3 h-3 mr-1" />
            <span>Total</span>
          </div>
          <span className="font-medium text-gray-900">
            ${quotation.total?.toLocaleString() || '0'}
          </span>
        </div>

        {/* Fecha */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            <span>Creado</span>
          </div>
          <span>{formatDate(quotation.created_at)}</span>
        </div>

        {/* Etapa actual si es borrador */}
        {quotation.status === 'draft' && quotation.current_step && (
          <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
            Etapa {quotation.current_step}/6
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/presupuestos/${quotation.id}`)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Ver detalle"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {quotation.status === 'draft' && (
            <button
              onClick={() => navigate(`/presupuestos/wizard/${quotation.id}`)}
              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
              title="Continuar editando"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setSelectedCard(quotation)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Más opciones"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Componente de Columna
  const KanbanColumn = ({ column, quotations = [] }) => (
    <div className="flex flex-col w-80 flex-shrink-0">
      {/* Header de la columna */}
      <div className={`${column.headerColor} text-white p-4 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <column.icon className="w-5 h-5" />
            <h3 className="font-semibold">{column.title}</h3>
          </div>
          <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-sm">
            {quotations.length}
          </span>
        </div>
        <p className="text-sm opacity-90 mt-1">{column.description}</p>
      </div>

      {/* Contenido de la columna */}
      <div
        className={`${column.color} border-2 border-dashed min-h-96 p-4 rounded-b-lg flex-1`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, column.id)}
      >
        {quotations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <column.icon className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay presupuestos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quotations.map(quotation => (
              <QuotationCard key={quotation.id} quotation={quotation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tablero de Presupuestos</h2>
            <p className="text-gray-600 mt-1">
              Gestiona el flujo de trabajo de tus presupuestaciones
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => navigate('/presupuestos/wizard')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Presupuestación
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar presupuestos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtro por Prioridad */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las prioridades</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {boardColumns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              quotations={quotationsByStatus[column.id] || []}
            />
          ))}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {boardColumns.map(column => {
          const count = quotationsByStatus[column.id]?.length || 0;
          const colorMap = {
            'bg-gray-600': '#4B5563',
            'bg-yellow-600': '#D97706', 
            'bg-blue-600': '#2563EB',
            'bg-green-600': '#059669',
            'bg-red-600': '#DC2626'
          };
          const iconBgColor = colorMap[column.headerColor] || '#6B7280';
          
          return (
            <div key={column.id} className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div 
                className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center"
                style={{backgroundColor: iconBgColor}}
              >
                <column.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600">{column.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanPresupuestos;
