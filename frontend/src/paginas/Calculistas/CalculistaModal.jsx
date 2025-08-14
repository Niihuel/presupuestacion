/**
 * Modal de Calculista usando FormModal Reutilizable
 * 
 * Componente modal para crear/editar calculistas
 * Siguiendo el patrón consistente del proyecto
 */

import React, { useState, useEffect } from 'react';
import { FormModal } from '@shared/components/modals';
import { 
  Calculator, 
  AlertCircle
} from 'lucide-react';

const CalculistaModal = ({ 
  calculista = null, 
  onClose,
  onSave,
  isLoading = false 
}) => {
  const isOpen = calculista !== null;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    license_number: ''
  });

  const [errors, setErrors] = useState({});

  // Llenar formulario cuando se pasa un calculista para editar
  useEffect(() => {
    if (isOpen && calculista && calculista.id) {
      setFormData({
        name: calculista.name || '',
        email: calculista.email || '',
        phone: calculista.phone || '',
        specialty: calculista.specialty || '',
        license_number: calculista.license_number || ''
      });
    } else if (isOpen) {
      // Resetear para nuevo calculista
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialty: '',
        license_number: ''
      });
    }
    setErrors({});
  }, [isOpen, calculista]);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'El formato del teléfono no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error específico al escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const title = calculista?.id ? 'Editar Calculista' : 'Nuevo Calculista';
  const subtitle = calculista?.id ? 'Modifica los datos del calculista' : 'Crea un nuevo calculista en el sistema';

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={title}
      subtitle={subtitle}
      icon={Calculator}
      iconColor="text-blue-600"
      iconBgColor="bg-blue-100"
      submitText={calculista?.id ? 'Actualizar' : 'Crear'}
      isLoading={isLoading}
      size="lg"
    >
      <div className="space-y-6">
        {/* Información Personal */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Información Personal
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ingrese el nombre completo"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="calculista@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+54 11 1234-5678"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-1">
                Matrícula Profesional
              </label>
              <input
                type="text"
                id="license_number"
                name="license_number"
                value={formData.license_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: MP 12345"
              />
            </div>
          </div>
        </div>

        {/* Información Profesional */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Información Profesional
          </h3>
          
          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
              Especialidad
            </label>
            <input
              type="text"
              id="specialty"
              name="specialty"
              value={formData.specialty}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Estructuras de Hormigón, Instalaciones Eléctricas, etc."
            />
          </div>
        </div>
      </div>
    </FormModal>
  );
};

export default CalculistaModal;
