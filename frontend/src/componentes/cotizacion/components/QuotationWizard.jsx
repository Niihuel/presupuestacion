/**
 * Wizard de Presupuestación
 * 
 * Sistema inteligente de creación de presupuestos con:
 * - Pasos progresivos alineados con Kanban
 * - Guardado automático de borradores
 * - Validaciones por paso
 * - Navegación flexible entre estados

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  FileText, 
  Users, 
  Package, 
  Calculator, 
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

// Hooks y servicios
import { 
  useQuotation, 
  useCreateQuotation, 
  useUpdateQuotation,
  useAdvanceQuotation,
  QUOTATION_STATUSES,
  WIZARD_STEPS,
  canAdvanceToStatus
} from '@shared/hooks/useQuotationsHook';

// Componentes de pasos
import BasicInfoStep from './wizard/BasicInfoStep';
import PiecesSelectionStep from './wizard/PiecesSelectionStep';
import CalculationsStep from './wizard/CalculationsStep';
import PreviewStep from './wizard/PreviewStep';

// Componentes shared
import { LoadingSpinner } from '@compartido/components/EstadoCarga';
import DialogoConfirmacion from '@compartido/components/DialogoConfirmacion';

const STEP_COMPONENTS = {
  BasicInfoStep,
  PiecesSelectionStep,
  CalculationsStep,
  PreviewStep
};

const QuotationWizard = () => {
  const navigate = useNavigate();
  const { id: quotationId } = useParams();
  const isEditing = !!quotationId;

  // Estados locales
  const [currentStep, setCurrentStep] = useState(1);
  const [quotationData, setQuotationData] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Hooks de datos
  const { 
    data: existingQuotation, 
    isLoading: quotationLoading 
  } = useQuotation(quotationId);

  // Mutations
  const createQuotationMutation = useCreateQuotation();
  const updateQuotationMutation = useUpdateQuotation();
  const advanceQuotationMutation = useAdvanceQuotation();

  // Auto-save cada 30 segundos si hay cambios
  useEffect(() => {
    if (!isDirty || !quotationId) return;

    const autoSaveInterval = setInterval(() => {
      handleAutoSave();
    }, 30000); // 30 segundos

    return () => clearInterval(autoSaveInterval);
  }, [isDirty, quotationId]);

  // Cargar datos existentes si estamos editando
  useEffect(() => {
    if (existingQuotation) {
      setQuotationData(existingQuotation);
      
      // Determinar paso actual basado en el estado
      const currentStatus = Object.values(QUOTATION_STATUSES).find(s => s.id === existingQuotation.status_id);
      const step = Object.values(WIZARD_STEPS).find(s => s.status.id === currentStatus?.id);
      if (step) {
        setCurrentStep(step.id);
      }
    }
  }, [existingQuotation]);

  // Prevenir salida sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Obtener configuración del paso actual
  const currentStepConfig = Object.values(WIZARD_STEPS).find(step => step.id === currentStep);
  const CurrentStepComponent = STEP_COMPONENTS[currentStepConfig?.component];

  // Handlers
  const handleStepDataChange = useCallback((stepData) => {
    setQuotationData(prev => ({
      ...prev,
      ...stepData
    }));
    setIsDirty(true);
  }, []);

  const handleAutoSave = useCallback(async () => {
    if (!quotationId || !isDirty) return;

    try {
      await updateQuotationMutation.mutateAsync({
        id: quotationId,
        data: quotationData,
        silent: true // No mostrar notificación para auto-save
      });
      setIsDirty(false);
    } catch (error) {
      console.error('Error en auto-save:', error);
    }
  }, [quotationId, quotationData, isDirty]);

  const handleSaveAsDraft = useCallback(async () => {
    try {
      if (isEditing) {
        await updateQuotationMutation.mutateAsync({
          id: quotationId,
          data: {
            ...quotationData,
            status_id: QUOTATION_STATUSES.DRAFT.id,
            is_draft: true
          }
        });
      } else {
        const newQuotation = await createQuotationMutation.mutateAsync({
          ...quotationData,
          status_id: QUOTATION_STATUSES.DRAFT.id,
          is_draft: true
        });
        
        // Redirigir a edición
        navigate(`/presupuestos/wizard/${newQuotation.id}`);
      }
      
      setIsDirty(false);
    } catch (error) {
      console.error('Error al guardar borrador:', error);
    }
  }, [quotationData, isEditing, quotationId]);

  const handleAdvanceStep = useCallback(async () => {
    const nextStep = currentStep + 1;
    const nextStepConfig = Object.values(WIZARD_STEPS).find(step => step.id === nextStep);
    
    if (!nextStepConfig) return;

    try {
      if (isEditing) {
        // Actualizar el estado del presupuesto
        await advanceQuotationMutation.mutateAsync({
          quotationId,
          targetStatus: nextStepConfig.status.id,
          data: quotationData
        });
      } else {
        // Crear nuevo presupuesto con el estado correspondiente
        const newQuotation = await createQuotationMutation.mutateAsync({
          ...quotationData,
          status_id: nextStepConfig.status.id
        });
        
        navigate(`/presupuestos/wizard/${newQuotation.id}`);
        return;
      }

      setCurrentStep(nextStep);
      setIsDirty(false);
    } catch (error) {
      console.error('Error al avanzar paso:', error);
    }
  }, [currentStep, quotationData, isEditing, quotationId]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleStepClick = useCallback((stepId) => {
    // Solo permitir navegar a pasos anteriores o al paso actual
    if (stepId <= currentStep) {
      setCurrentStep(stepId);
    }
  }, [currentStep]);

  const handleExit = useCallback(() => {
    if (isDirty) {
      setShowExitDialog(true);
    } else {
      navigate('/presupuestos');
    }
  }, [isDirty]);

  const handleConfirmExit = useCallback(() => {
    navigate('/presupuestos');
  }, []);

  // Validar si se puede avanzar al siguiente paso
  const canAdvance = () => {
    const nextStepConfig = Object.values(WIZARD_STEPS).find(step => step.id === currentStep + 1);
    if (!nextStepConfig) return false;

    return canAdvanceToStatus(quotationData, nextStepConfig.status.id);
  };

  // Mostrar loading mientras carga
  if (quotationLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Cargando presupuesto..." />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header del wizard */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleExit}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
              </h1>
              <p className="text-sm text-gray-600">
                {quotationData.project_name || 'Sin nombre'} - {currentStepConfig?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicador de auto-save */}
            {isDirty && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <Clock className="w-4 h-4" />
                <span>Cambios sin guardar</span>
              </div>
            )}

            {/* Botón guardar borrador */}
            <button
              onClick={handleSaveAsDraft}
              disabled={createQuotationMutation.isLoading || updateQuotationMutation.isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Borrador
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mt-6">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {Object.values(WIZARD_STEPS).map((step, index) => {
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;
                const isClickable = step.id <= currentStep;

                return (
                  <li key={step.id} className={`relative ${index !== Object.values(WIZARD_STEPS).length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                    {index !== Object.values(WIZARD_STEPS).length - 1 && (
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className={`h-0.5 w-full ${isCompleted ? 'bg-purple-600' : 'bg-gray-200'}`} />
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleStepClick(step.id)}
                      disabled={!isClickable}
                      className={`relative w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                        isCompleted
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : isCurrent
                          ? 'border-purple-600 bg-white text-purple-600'
                          : 'border-gray-300 bg-white text-gray-400'
                      } ${isClickable ? 'hover:border-purple-400 cursor-pointer' : 'cursor-not-allowed'}`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </button>
                    
                    <div className="mt-2">
                      <p className={`text-xs font-medium ${isCurrent ? 'text-purple-600' : 'text-gray-500'}`}>
                        {step.name}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>

      {/* Contenido del paso actual */}
      <div className="flex-1 overflow-auto">
        {CurrentStepComponent && (
          <CurrentStepComponent
            data={quotationData}
            onChange={handleStepDataChange}
            onValidationChange={() => {}} // TODO: Implementar validación
            isLoading={quotationLoading}
          />
        )}
      </div>

      {/* Footer con navegación */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Paso {currentStep} de {Object.values(WIZARD_STEPS).length}</span>
            <span>•</span>
            <span>{currentStepConfig?.status.name}</span>
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                onClick={handlePreviousStep}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </button>
            )}

            {currentStep < Object.values(WIZARD_STEPS).length ? (
              <button
                onClick={handleAdvanceStep}
                disabled={!canAdvance() || advanceQuotationMutation.isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={() => {}} // TODO: Finalizar presupuesto
                disabled={!canAdvance()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Finalizar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de confirmación de salida */}
      {showExitDialog && (
        <DialogoConfirmacion
          title="¿Salir sin guardar?"
          message="Tienes cambios sin guardar. ¿Estás seguro de que quieres salir? Los cambios se perderán."
          confirmText="Salir sin guardar"
          cancelText="Cancelar"
          onConfirm={handleConfirmExit}
          onCancel={() => setShowExitDialog(false)}
          variant="warning"
        />
      )}
    </div>
  );
};

export default QuotationWizard;
