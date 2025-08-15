/**
 * Wizard de Presupuestación - Componente Principal
 * 
 * Sistema multi-paso para crear presupuestaciones siguiendo el flujo real:
 * 1. Proyecto y Cliente
 * 2. Piezas y Cantidades  
 * 3. Costos Adicionales
 * 4. Condiciones Comerciales
 * 5. Revisión y Exportación
 * 6. Seguimiento (opcional)
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';

// Componentes de cada etapa
import EtapaProyectoCliente from '@componentes/presupuestacion/components/EtapaProyectoCliente';
import EtapaPiezasCantidades from '@componentes/presupuestacion/components/EtapaPiezasCantidades';
import EtapaCostosAdicionales from '@componentes/presupuestacion/components/EtapaCostosAdicionales';
import EtapaUbicaciones from '@componentes/presupuestacion/components/EtapaUbicaciones';
import EtapaCondicionesComerciales from '@componentes/presupuestacion/components/EtapaCondicionesComerciales';
import EtapaRevisionExportacion from '@componentes/presupuestacion/components/EtapaRevisionExportacion';
import EtapaSeguimiento from '@componentes/presupuestacion/components/EtapaSeguimiento';
import ConfirmExitModal from '@componentes/presupuestacion/components/ConfirmExitModal';

// Hook personalizado
import { usePresupuestacionWizard } from '@componentes/presupuestacion/hooks/usePresupuestacionWizard';
import { useWizardNavigation } from '@componentes/presupuestacion/hooks/useWizardNavigation';

// Hooks y servicios
import { useNotifications } from '@compartido/hooks/useNotifications';

const ETAPAS = [
  { 
    id: 1, 
    name: 'Obra y Cliente', 
    component: EtapaProyectoCliente,
    required: ['project_name', 'customer_id'],
    description: 'Información básica de la obra y cliente'
  },
  { 
    id: 2, 
    name: 'Piezas y Cantidades', 
    component: EtapaPiezasCantidades,
    required: ['pieces'],
    description: 'Selección de piezas desde el catálogo'
  },
  { 
    id: 3, 
    name: 'Ubicaciones', 
    component: EtapaUbicaciones,
    required: [],
    description: 'Definir ubicación de obra y planta para calcular distancias'
  },
  { 
    id: 4, 
    name: 'Costos Adicionales', 
    component: EtapaCostosAdicionales,
    required: [],
    description: 'Transporte, montaje y trabajos complementarios'
  },
  { 
    id: 5, 
    name: 'Condiciones Comerciales', 
    component: EtapaCondicionesComerciales,
    required: ['payment_terms', 'validity_days'],
    description: 'Precios, pagos y condiciones'
  },
  { 
    id: 6, 
    name: 'Revisión y Exportación', 
    component: EtapaRevisionExportacion,
    required: [],
    description: 'Resumen final y generación de documentos'
  },
  { 
    id: 7, 
    name: 'Seguimiento', 
    component: EtapaSeguimiento,
    required: [],
    description: 'Control de estado y avances'
  }
];

const PresupuestacionWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error, warning, info } = useNotifications();
  
  // Estado del wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState({});

  // Hook personalizado para manejo de datos
  const {
    data: presupuestacion,
    updatePresupuestacion,
    saveAsDraft,
    validateStep,
    calculateTotals,
    isUpdating
  } = usePresupuestacionWizard(id);

  // Hook para manejar navegación con confirmación
  const {
    handleNavigation,
    confirmAndExit,
    exitWithoutSaving,
    cancelExit
  } = useWizardNavigation({
    hasUnsavedChanges,
    onSaveAndExit: async () => {
      await handleSaveDraft();
    },
    onExitWithoutSaving: () => {
      setHasUnsavedChanges(false);
    },
    showConfirmModal,
    setShowConfirmModal
  });

  // Cargar datos existentes si es edición
  useEffect(() => {
    if (presupuestacion) {
      setFormData(presupuestacion);
      setInitialFormData(presupuestacion);
      setCurrentStep(presupuestacion.current_step || 1);
      setHasUnsavedChanges(false);
    }
  }, [presupuestacion]);

  // Detectar cambios en el formData
  useEffect(() => {
    if (Object.keys(formData).length === 0 || Object.keys(initialFormData).length === 0) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
      setHasUnsavedChanges(hasChanges);
    }, 500); // Debounce para evitar verificaciones excesivas

    return () => clearTimeout(timeoutId);
  }, [JSON.stringify(formData), JSON.stringify(initialFormData)]);

  // Auto-guardado cada 30 segundos
  useEffect(() => {
    if (!autoSaveEnabled || !Object.keys(formData).length || !hasUnsavedChanges) return;

    const autoSave = setInterval(() => {
      if (hasUnsavedChanges) {
        handleAutoSave();
      }
    }, 30000);

    return () => clearInterval(autoSave);
  }, [autoSaveEnabled, hasUnsavedChanges, JSON.stringify(formData)]);

  // Handlers
  const handleAutoSave = async () => {
    try {
      await saveAsDraft({
        ...formData,
        current_step: currentStep,
        updated_at: new Date().toISOString()
      });
      // Actualizar estado inicial después del auto-guardado
      setInitialFormData({ ...formData, current_step: currentStep });
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error en auto-guardado:', err);
    }
  };

  const handleStepChange = (newStep) => {
    if (newStep < 1 || newStep > ETAPAS.length) return;
    
    setCurrentStep(newStep);
    setErrors({});
    
    // Guardar progreso al cambiar de etapa
    handleAutoSave();
  };

  const handleDataChange = useCallback((stepData) => {
    // Verificar si realmente hay cambios antes de actualizar
    setFormData(prev => {
      const newData = {
        ...prev,
        ...stepData,
        totals: calculateTotals({ ...prev, ...stepData })
      };
      
      // Evitar actualización si los datos son idénticos
      if (JSON.stringify(newData) === JSON.stringify(prev)) {
        return prev;
      }
      
      return newData;
    });
  }, [calculateTotals]);

  const handleNextStep = async () => {
    const currentEtapa = ETAPAS[currentStep - 1];
    
    // Validar datos requeridos solo si es necesario avanzar
    const validation = await validateStep(formData, currentEtapa.required);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      error('Complete los campos requeridos antes de continuar', 'Validación');
      return;
    }

    // Validación adicional: no permitir avanzar si hay piezas sin precio
    if (currentStep === 2) {
      const pieces = formData?.pieces || [];
      const hasNoPrice = pieces.some(p => !p.unit_price || Number(p.unit_price) <= 0);
      if (hasNoPrice) {
        error('Hay piezas sin precio para la planta seleccionada. Asigne una planta o defina los precios por zona.', 'Precios incompletos');
        return;
      }
    }

    setErrors({});
    
    // Guardar antes de avanzar
    await handleAutoSave();
    
    if (currentStep < ETAPAS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      const result = await saveAsDraft({
        ...formData,
        current_step: currentStep,
        status: 'draft'
      });
      
      // Actualizar el estado inicial después de guardar
      setInitialFormData({ ...formData, current_step: currentStep });
      setHasUnsavedChanges(false);
      
      success('Borrador guardado correctamente');
      return result;
    } catch (err) {
      error('Error al guardar borrador');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleExit = () => {
    handleNavigation('/presupuestos');
  };

  // Componente de la etapa actual
  const CurrentStepComponent = ETAPAS[currentStep - 1]?.component;
  const currentEtapa = ETAPAS[currentStep - 1];

  // Calcular progreso
  const progress = (currentStep / ETAPAS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header del Wizard */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleExit}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nueva Presupuestación</h1>
              <p className="text-gray-600">Sistema paso a paso para crear presupuestaciones completas</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {autoSaveEnabled && hasUnsavedChanges && (
              <div className="flex items-center text-sm text-amber-600">
                <Clock className="h-4 w-4 mr-1" />
                Cambios sin guardar
              </div>
            )}
            
            <button
              onClick={handleSaveDraft}
              disabled={isLoading}
              className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Borrador
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Etapa {currentStep}: {currentEtapa?.name}
            </h2>
            <p className="text-blue-700 mt-1">
              {currentEtapa?.description}
            </p>
          </div>
          <div className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            {currentStep} de {ETAPAS.length}
          </div>
        </div>
        
        <div className="w-full bg-blue-200 rounded-full h-3 shadow-inner">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps Navigation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <nav className="flex space-x-2 overflow-x-auto">
          {ETAPAS.map((etapa, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            const hasErrors = errors[`step_${stepNumber}`];
            
            return (
              <button
                key={etapa.id}
                onClick={() => handleStepChange(stepNumber)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : isCompleted
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : hasErrors
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? 'bg-white text-blue-600'
                    : isCompleted
                    ? 'bg-green-600 text-white'
                    : hasErrors
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : hasErrors ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span className="font-medium">{etapa.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content - Sin fondo blanco adicional */}
      {CurrentStepComponent && (
        <CurrentStepComponent
          data={formData}
          onChange={handleDataChange}
          errors={errors}
          onNext={handleNextStep}
          onPrevious={handlePreviousStep}
          isLoading={isLoading || isUpdating}
        />
      )}

      {/* Footer Navigation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {Object.keys(errors).length > 0 && (
                <span className="text-red-600">
                  {Object.keys(errors).length} errores pendientes
                </span>
              )}
            </span>
            
            <button
              onClick={handleNextStep}
              disabled={currentStep === ETAPAS.length}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === ETAPAS.length ? 'Finalizar' : 'Siguiente'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      <ConfirmExitModal
        isOpen={showConfirmModal}
        onClose={cancelExit}
        onSaveAndExit={confirmAndExit}
        onExitWithoutSaving={exitWithoutSaving}
        isLoading={isLoading}
        hasChanges={hasUnsavedChanges}
      />
    </div>
  );
};

export default PresupuestacionWizard;
