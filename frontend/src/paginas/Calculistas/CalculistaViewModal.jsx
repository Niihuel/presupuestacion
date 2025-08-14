/**
 * Modal de Vista de Calculista usando ViewModal Reutilizable
 * 
 * Modal para mostrar información detallada de un calculista
 * con formato corporativo y diseño responsivo.
 */

import React from 'react';
import { ViewModal } from '@shared/components/modals';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Building2,
  CheckCircle,
  XCircle,
  Calculator,
  Award
} from 'lucide-react';

const CalculistaViewModal = ({ 
  isOpen, 
  onClose, 
  calculista 
}) => {
  if (!isOpen || !calculista) return null;

  const getStatusBadge = (isActive) => {
    return isActive !== false ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Activo
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inactivo
      </span>
    );
  };

  return (
    <ViewModal
      isOpen={isOpen}
      onClose={onClose}
      title="Información del Calculista"
      size="lg"
    >
      <div className="space-y-6">
        {/* Información Personal */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            Información Personal
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Nombre Completo
              </h4>
              <p className="text-gray-900 font-medium text-lg">
                {calculista.name || 'Sin especificar'}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Estado
              </h4>
              <div>
                {getStatusBadge(calculista.is_active)}
              </div>
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-blue-600" />
            Información de Contacto
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Email
              </h4>
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <p className="text-gray-900">{calculista.email || 'Sin especificar'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Teléfono
              </h4>
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                <p className="text-gray-900">{calculista.phone || 'Sin especificar'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información Profesional */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-blue-600" />
            Información Profesional
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Especialidad
              </h4>
              <div className="flex items-center">
                <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                <p className="text-gray-900">{calculista.specialty || 'Sin especialidad definida'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Matrícula Profesional
              </h4>
              <div className="flex items-center">
                <Award className="h-4 w-4 text-gray-400 mr-2" />
                <p className="text-gray-900">{calculista.license_number || 'Sin especificar'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Sistema */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Información del Sistema
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Fecha de Registro
              </h4>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <p className="text-gray-900">
                  {calculista.created_at 
                    ? new Date(calculista.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Sin especificar'
                  }
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                Última Actualización
              </h4>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <p className="text-gray-900">
                  {calculista.updated_at 
                    ? new Date(calculista.updated_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Sin especificar'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ViewModal>
  );
};

export default CalculistaViewModal;
