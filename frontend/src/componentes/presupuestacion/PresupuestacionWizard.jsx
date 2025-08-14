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

import { useState, useEffect } from 'react';
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
import EtapaProyectoCliente from './components/EtapaProyectoCliente';
import EtapaPiezasCantidadesConMateriales from './components/EtapaPiezasCantidadesConMateriales';
import EtapaCostosAdicionales from './components/EtapaCostosAdicionales';
import EtapaCondicionesComerciales from './components/EtapaCondicionesComerciales';
import EtapaRevisionExportacion from './components/EtapaRevisionExportacion';
import EtapaSeguimiento from './components/EtapaSeguimiento';

// Hook personalizado
import { usePresupuestacionWizard } from '../../shared/hooks/usePresupuestacionWizard';

// Hooks y servicios
import { useNotifications } from '../../shared/hooks/useNotifications';

const ETAPAS = [
  { 
    id: 1, 
    name: 'Proyecto y Cliente', 
    component: EtapaProyectoCliente,
    required: ['project_name', 'customer_id'],
    description: 'Información básica del proyecto y cliente'
  },
  { 
    id: 2, 
    name: 'Piezas, Cantidades y Planta', 
    component: EtapaPiezasCantidadesConMateriales,
    required: ['selectedPlant', 'pieces'],
    description: 'Selección de planta, piezas y cálculo de materiales'
  },
  { 
    id: 3, 
    name: 'Costos Adicionales', 
    component: EtapaCostosAdicionales,
    required: [],
    description: 'Transporte, montaje, ingeniería e insertos'
  },
  { 
    id: 4, 
    name: 'Condiciones Comerciales', 
    component: EtapaCondicionesComerciales,
    required: ['payment_terms', 'validity_days'],
    description: 'Precios, pagos y condiciones'
  },
  { 
    id: 5, 
    name: 'Revisión y Exportación', 
    component: EtapaRevisionExportacion,
    required: [],
    description: 'Resumen final y generación de documentos'
  },
  { 
    id: 6, 
    name: 'Seguimiento', 
    component: EtapaSeguimiento,
    required: [],
    description: 'Control de estado y avances'
  }
];

const PresupuestacionWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useNotifications();
  
  // Estado del wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Hook personalizado para manejo de datos
  const {
    data: presupuestacion,
    updatePresupuestacion,
    saveAsDraft,
    validateStep,
    calculateTotals,
    isUpdating
  } = usePresupuestacionWizard(id);

  // Cargar datos existentes si es edición
  useEffect(() => {
    if (presupuestacion) {
      setFormData(presupuestacion);
      setCurrentStep(presupuestacion.current_step || 1);
    }
  }, [presupuestacion]);

  // Auto-guardado cada 30 segundos
  useEffect(() => {
    if (!autoSaveEnabled || !Object.keys(formData).length) return;

    const autoSave = setInterval(() => {
      handleAutoSave();
    }, 30000);

    return () => clearInterval(autoSave);
  }, [formData, autoSaveEnabled]);

  // Handlers
  const handleAutoSave = async () => {
    try {
      await saveAsDraft({
        ...formData,
        current_step: currentStep,
        updated_at: new Date().toISOString()
      });
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

  const handleDataChange = (stepData) => {
    setFormData(prev => ({
      ...prev,
      ...stepData,
      totals: calculateTotals({ ...prev, ...stepData })
    }));
  };

  const handleNextStep = async () => {
    const currentEtapa = ETAPAS[currentStep - 1];
    
    // Validar datos requeridos solo si es necesario avanzar
    const validation = await validateStep(formData, currentEtapa.required);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      error('Complete los campos requeridos antes de continuar');
      return;
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
      await saveAsDraft({
        ...formData,
        current_step: currentStep,
        status: 'draft'
      });
      success('Borrador guardado correctamente');
    } catch (err) {
      error('Error al guardar borrador');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExit = () => {
    if (Object.keys(formData).length > 0) {
      const shouldSave = window.confirm(
        '¿Desea guardar los cambios como borrador antes de salir?'
      );
      if (shouldSave) {
        handleAutoSave();
      }
    }
    navigate('/presupuestos');
  };

  // Componente de la etapa actual
  const CurrentStepComponent = ETAPAS[currentStep - 1]?.component;
  const currentEtapa = ETAPAS[currentStep - 1];

  // Calcular progreso
  const progress = (currentStep / ETAPAS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Wizard */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleExit}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {id ? 'Editar Presupuestación' : 'Nueva Presupuestación'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto-save indicator */}
              {autoSaveEnabled && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  Auto-guardado activo
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
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Etapa {currentStep}: {currentEtapa?.name}
              </h2>
              <p className="text-sm text-gray-600">
                {currentEtapa?.description}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {currentStep} de {ETAPAS.length}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto py-4">
            {ETAPAS.map((etapa, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;
              const hasErrors = errors[`step_${stepNumber}`];
              
              return (
                <button
                  key={etapa.id}
                  onClick={() => handleStepChange(stepNumber)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : isCompleted
                      ? 'text-green-600 hover:bg-green-50'
                      : hasErrors
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : hasErrors
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : hasErrors ? (
                      <AlertCircle className="h-3 w-3" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  <span>{etapa.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
      </div>

      {/* Padding bottom para el footer fijo */}
      <div className="h-20" />
    </div>
  );
};

export default PresupuestacionWizard;
