/**
 * Timeline de Proyectoimport { PROJECT_STATUSES } from "../../../hooks/useProjectsHook"; * 
 * Visualización cronológica de eventos y etapas del proyecto
 * con representación visual de progreso y fechas importantes
 */

import { useState, useMemo } from 'react';
import { 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Construction,
  FileCheck,
  Package,
  Truck,
  MapPin,
  User,
  Building2,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';
import { PROJECT_STATUSES } from '../../shared/hooks/useProjectsHook';

const ProjectTimeline = ({ 
  project, 
  customers = [], 
  designers = [],
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  className = ''
}) => {
  const [showAddEvent, setShowAddEvent] = useState(false);

  // Obtener información del cliente y diseñador
  const customer = customers.find(c => c.id === project.customer_id);
  const designer = designers.find(d => d.id === project.designer_id);
  const currentStatus = Object.values(PROJECT_STATUSES).find(s => s.id === project.status_id);

  // Generar eventos del timeline basados en las fechas del proyecto
  const timelineEvents = useMemo(() => {
    const events = [];

    // Evento de creación (siempre presente)
    events.push({
      id: 'created',
      type: 'system',
      title: 'Proyecto creado',
      description: `Proyecto registrado en el sistema`,
      date: project.created_at,
      icon: FileCheck,
      status: 'completed',
      color: 'bg-green-500'
    });

    // Evento de aprobación
    if (project.approval_date) {
      events.push({
        id: 'approved',
        type: 'milestone',
        title: 'Proyecto aprobado',
        description: 'El cliente aprobó el proyecto y se autorizó el inicio',
        date: project.approval_date,
        icon: CheckCircle,
        status: 'completed',
        color: 'bg-blue-500'
      });
    }

    // Evento de fundación
    if (project.foundation_date) {
      events.push({
        id: 'foundation',
        type: 'milestone',
        title: 'Inicio de fundación',
        description: 'Comenzaron los trabajos de fundación en obra',
        date: project.foundation_date,
        icon: Construction,
        status: 'completed',
        color: 'bg-orange-500'
      });
    }

    // Estado actual
    if (currentStatus) {
      const now = new Date().toISOString();
      events.push({
        id: 'current_status',
        type: 'status',
        title: `Estado actual: ${currentStatus.name}`,
        description: currentStatus.description || `El proyecto se encuentra en estado ${currentStatus.name}`,
        date: now,
        icon: Clock,
        status: 'current',
        color: 'bg-purple-500'
      });
    }

    // Fecha límite de entrega
    if (project.delivery_deadline) {
      const deadlineDate = new Date(project.delivery_deadline + '-01'); // Asumimos que es YYYY-MM
      const now = new Date();
      const isPast = deadlineDate < now;
      
      events.push({
        id: 'deadline',
        type: 'deadline',
        title: 'Fecha límite de entrega',
        description: `Entrega programada para ${project.delivery_deadline}`,
        date: deadlineDate.toISOString(),
        icon: Package,
        status: isPast ? 'overdue' : 'upcoming',
        color: isPast ? 'bg-red-500' : 'bg-green-500'
      });
    }

    // Ordenar eventos por fecha
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [project, currentStatus]);

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Formatear hora
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener estilo del evento según su estado
  const getEventStyle = (event) => {
    switch (event.status) {
      case 'completed':
        return {
          dot: 'bg-green-500 border-green-200',
          line: 'bg-green-200',
          card: 'border-green-200 bg-green-50'
        };
      case 'current':
        return {
          dot: 'bg-purple-500 border-purple-200 animate-pulse',
          line: 'bg-purple-200',
          card: 'border-purple-200 bg-purple-50'
        };
      case 'upcoming':
        return {
          dot: 'bg-blue-500 border-blue-200',
          line: 'bg-blue-200',
          card: 'border-blue-200 bg-blue-50'
        };
      case 'overdue':
        return {
          dot: 'bg-red-500 border-red-200',
          line: 'bg-red-200',
          card: 'border-red-200 bg-red-50'
        };
      default:
        return {
          dot: 'bg-gray-500 border-gray-200',
          line: 'bg-gray-200',
          card: 'border-gray-200 bg-gray-50'
        };
    }
  };

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Timeline del Proyecto
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Cronología de eventos y fechas importantes
            </p>
          </div>
          
          <button
            onClick={() => setShowAddEvent(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar evento
          </button>
        </div>

        {/* Información del proyecto */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Building2 className="w-4 h-4" />
            <span>{customer ? customer.name : 'Sin cliente'}</span>
          </div>
          {designer && (
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>{designer.name} {designer.surname}</span>
            </div>
          )}
          {(project.city || project.state) && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{[project.city, project.state].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        <div className="relative">
          {timelineEvents.map((event, index) => {
            const isLast = index === timelineEvents.length - 1;
            const styles = getEventStyle(event);
            const Icon = event.icon;

            return (
              <div key={event.id} className="relative flex items-start">
                {/* Línea vertical */}
                {!isLast && (
                  <div className={`absolute left-4 top-10 w-0.5 h-16 ${styles.line}`} />
                )}

                {/* Dot del evento */}
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-4 ${styles.dot}`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>

                {/* Contenido del evento */}
                <div className="flex-1 ml-4 pb-8">
                  <div className={`bg-white rounded-lg border-2 p-4 ${styles.card}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Título y fecha */}
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {event.title}
                          </h4>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                            {formatDate(event.date)}
                          </span>
                        </div>

                        {/* Descripción */}
                        <p className="text-sm text-gray-600 mb-2">
                          {event.description}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(event.date)}
                          </span>
                          <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                            {event.type}
                          </span>
                          {event.status === 'overdue' && (
                            <span className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="w-3 h-3" />
                              Vencido
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      {event.type !== 'system' && (
                        <div className="flex items-center gap-1 ml-4">
                          <button
                            onClick={() => onEditEvent?.(event)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            title="Editar evento"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent?.(event)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Eliminar evento"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estado vacío */}
        {timelineEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin eventos en el timeline
            </h3>
            <p className="text-gray-500 mb-4">
              Los eventos aparecerán aquí conforme se registren fechas importantes del proyecto.
            </p>
            <button
              onClick={() => setShowAddEvent(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar primer evento
            </button>
          </div>
        )}
      </div>

      {/* Resumen de fechas importantes */}
      <div className="border-t bg-gray-50 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Fechas importantes</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Creación:</span>
            <div className="font-medium">
              {formatDate(project.created_at)}
            </div>
          </div>
          
          {project.approval_date && (
            <div>
              <span className="text-gray-500">Aprobación:</span>
              <div className="font-medium">
                {formatDate(project.approval_date)}
              </div>
            </div>
          )}
          
          {project.foundation_date && (
            <div>
              <span className="text-gray-500">Fundación:</span>
              <div className="font-medium">
                {formatDate(project.foundation_date)}
              </div>
            </div>
          )}
          
          {project.delivery_deadline && (
            <div>
              <span className="text-gray-500">Entrega:</span>
              <div className="font-medium">
                {project.delivery_deadline}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;
