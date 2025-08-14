/**
 * Modal para visualizar detalles de cliente
 * 
 * Modal de solo lectura para mostrar información completa del cliente
 */

import { 
  X, 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  FileText,
  CreditCard
} from 'lucide-react';

const CustomerViewModal = ({ isOpen, onClose, customer }) => {
  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Detalles del Cliente
              </h2>
              <p className="text-sm text-gray-500">
                Información completa del cliente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información Personal */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Nombre Completo
                </label>
                <p className="text-gray-900 font-medium">{customer.name || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{customer.email || 'No especificado'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Teléfono
                </label>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{customer.phone || 'No especificado'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Empresa
                </label>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{customer.company || 'No especificado'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de Dirección */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Dirección
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Dirección Completa
                </label>
                <p className="text-gray-900">{customer.address || 'No especificado'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Ciudad
                  </label>
                  <p className="text-gray-900">{customer.city || 'No especificado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    País
                  </label>
                  <p className="text-gray-900">{customer.country || 'No especificado'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información Adicional
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  CUIT/DNI
                </label>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{customer.tax_id || 'No especificado'}</p>
                </div>
              </div>
              {customer.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Notas
                  </label>
                  <p className="text-gray-900 bg-white p-3 rounded border">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Información del Sistema */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Información del Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  ID del Cliente
                </label>
                <p className="text-gray-900 font-mono text-sm">#{customer.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Fecha de Registro
                </label>
                <p className="text-gray-900">
                  {customer.created_at 
                    ? new Date(customer.created_at).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'No disponible'
                  }
                </p>
              </div>
              {customer.updated_at && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Última Actualización
                  </label>
                  <p className="text-gray-900">
                    {new Date(customer.updated_at).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerViewModal;
