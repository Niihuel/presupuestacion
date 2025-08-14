/**
 * Componente de actividad reciente
 * 
 * Lista de actividades y eventos recientes del sistema
 * con timeline y estado visual
 */

import { 
  FileText, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Edit,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const RecentActivity = ({ activities = [], loading = false }) => {
  // Datos de ejemplo mientras esperamos la API real
  const mockActivities = [
    {
      id: 1,
      type: 'quotation_created',
      title: 'Nuevo presupuesto creado',
      description: 'Presupuesto #2024-156 para Cliente ABC',
      user: 'Juan Pérez',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
      status: 'created'
    },
    {
      id: 2,
      type: 'quotation_approved',
      title: 'Presupuesto aprobado',
      description: 'Presupuesto #2024-155 aprobado por el cliente',
      user: 'María González',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
      status: 'approved'
    },
    {
      id: 3,
      type: 'customer_created',
      title: 'Nuevo cliente registrado',
      description: 'Cliente: Constructora XYZ S.A.S.',
      user: 'Carlos López',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
      status: 'created'
    },
    {
      id: 4,
      type: 'quotation_rejected',
      title: 'Presupuesto rechazado',
      description: 'Presupuesto #2024-153 rechazado - revisar precios',
      user: 'Ana Rodríguez',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 horas atrás
      status: 'rejected'
    },
    {
      id: 5,
      type: 'quotation_updated',
      title: 'Presupuesto actualizado',
      description: 'Presupuesto #2024-152 actualizado con nuevas piezas',
      user: 'Pedro Martín',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 horas atrás
      status: 'updated'
    },
    {
      id: 6,
      type: 'quotation_viewed',
      title: 'Presupuesto visualizado',
      description: 'Cliente visualizó presupuesto #2024-151',
      user: 'Sistema',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
      status: 'viewed'
    }
  ];

  const getActivityIcon = (type, status) => {
    const iconClass = "h-4 w-4";
    
    switch (type) {
      case 'quotation_created':
        return <Plus className={`${iconClass} text-blue-500`} />;
      case 'quotation_approved':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'quotation_rejected':
        return <XCircle className={`${iconClass} text-red-500`} />;
      case 'quotation_updated':
        return <Edit className={`${iconClass} text-orange-500`} />;
      case 'quotation_viewed':
        return <Eye className={`${iconClass} text-purple-500`} />;
      case 'customer_created':
        return <Users className={`${iconClass} text-indigo-500`} />;
      default:
        return <FileText className={`${iconClass} text-gray-500`} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'created':
        return 'bg-blue-100 text-blue-800';
      case 'updated':
        return 'bg-orange-100 text-orange-800';
      case 'viewed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activityData = activities.length > 0 ? activities : mockActivities;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todo
        </button>
      </div>

      <div className="space-y-4">
        {activityData.map((activity, index) => (
          <div 
            key={activity.id} 
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            {/* Icono de actividad */}
            <div className="flex-shrink-0 mt-1">
              <div className="h-8 w-8 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                {getActivityIcon(activity.type, activity.status)}
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="text-xs text-gray-500">
                      Por {activity.user}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(activity.timestamp, { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </span>
                  </div>
                </div>
                
                {/* Status badge */}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {activity.status === 'approved' && 'Aprobado'}
                  {activity.status === 'rejected' && 'Rechazado'}
                  {activity.status === 'created' && 'Creado'}
                  {activity.status === 'updated' && 'Actualizado'}
                  {activity.status === 'viewed' && 'Visto'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activityData.length === 0 && (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-2">No hay actividad reciente</h3>
          <p className="text-sm text-gray-500">
            Las actividades del sistema aparecerán aquí
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
