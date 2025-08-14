/**
 * Modal para crear/editar clientes
 * 
 * Formulario completo con validación para gestión de clientes
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  X,
  Save, 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin,
  AlertCircle
} from 'lucide-react';

import BaseModal from '@shared/components/BaseModal';
import { useCreateCustomer, useUpdateCustomer } from '@shared/hooks/useCustomersHook';
import LoadingSpinner from '@shared/components/LoadingSpinner';

const CustomerModal = ({ isOpen, onClose, customer = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!customer;

  // React Query hooks
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Argentina',
      company: '',
      tax_id: '',
      notes: ''
    }
  });

  // Actualizar form cuando se recibe customer para editar
  useEffect(() => {
    if (customer && isOpen) {
      reset({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        country: customer.country || 'Argentina',
        company: customer.company || '',
        tax_id: customer.tax_id || '',
        notes: customer.notes || ''
      });
    } else if (!customer && isOpen) {
      reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Argentina',
        company: '',
        tax_id: '',
        notes: ''
      });
    }
  }, [customer, isOpen, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        await updateCustomerMutation.mutateAsync({ id: customer.id, data });
      } else {
        await createCustomerMutation.mutateAsync(data);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

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
                {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Actualiza la información del cliente' : 'Completa los datos del nuevo cliente'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Información Personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  {...register('name', { required: 'El nombre es obligatorio' })}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nombre del cliente"
                />
              </div>
              {errors.name && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">{errors.name.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  {...register('email', { 
                    required: 'El email es obligatorio',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Email inválido'
                    }
                  })}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="email@ejemplo.com"
                />
              </div>
              {errors.email && (
                <div className="flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">{errors.email.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+54 11 1234-5678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empresa
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  {...register('company')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre de la empresa"
                />
              </div>
            </div>
          </div>

          {/* Información de Dirección */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  {...register('address')}
                  rows={2}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dirección completa"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  {...register('city')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ciudad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País
                </label>
                <input
                  type="text"
                  {...register('country')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="País"
                />
              </div>
            </div>
          </div>

          {/* Información Adicional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CUIT/DNI
            </label>
            <input
              type="text"
              {...register('tax_id')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="CUIT o DNI"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Información adicional sobre el cliente..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {isEditing ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? 'Actualizar Cliente' : 'Crear Cliente'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
