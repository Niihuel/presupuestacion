'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  MapPin, 
  Truck, 
  Wrench, 
  FileCheck,
  Save,
  RotateCcw,
  Clock 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useBudgetDraft } from '@/hooks/use-budget-draft';
import { DraftConfirmationModal } from '@/components/budget/draft-confirmation-modal';
import { PageTransition, SectionTransition } from '@/components/ui/page-transition';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';

// Importar componentes de cada paso
import Step1Client from '@/components/budget-wizard/Step1Client';
import Step2Plant from '@/components/budget-wizard/Step2Plant';
import Step3Distance from '@/components/budget-wizard/Step3Distance';
import Step4Freight from '@/components/budget-wizard/Step4Freight';
import Step5Additionals from '@/components/budget-wizard/Step5Additionals';
import Step6Summary from '@/components/budget-wizard/Step6Summary';

const WIZARD_STEPS = [
  { id: 1, title: 'Cliente y Proyecto', icon: Users },
  { id: 2, title: 'Planta y Piezas', icon: Building2 },
  { id: 3, title: 'Distancia', icon: MapPin },
  { id: 4, title: 'Flete', icon: Truck },
  { id: 5, title: 'Montaje', icon: Wrench },
  { id: 6, title: 'Resumen', icon: FileCheck }
];

interface BudgetWizardProps {
  resumeToken?: string;
  budgetId?: string;
  draftId?: string;
}

export default function BudgetWizard({ resumeToken, budgetId, draftId }: BudgetWizardProps) {
  const router = useRouter();
  // Use the draftId prop directly instead of searching params
  const effectiveDraftId = draftId || budgetId;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const {
    draftData,
    updateDraft,
    finalizeBudget,
    discardDraft,
    isSaving,
    hasChanges,
    lastSaved
  } = useBudgetDraft({
    draftId: effectiveDraftId || undefined,
    onSaveSuccess: () => {
      console.log('Draft saved successfully');
    },
    onSaveError: (error) => {
      console.error('Error saving draft:', error);
    }
  });

  // Set current step based on draft data completion
  useEffect(() => {
    if (draftData.id) {
      // Determine step based on completed data
      let step = 1;
      if (draftData.customerId) step = 2;
      if (draftData.items && draftData.items.length > 0) step = 3;
      if (draftData.finalTotal && draftData.finalTotal > 0) step = 6;
      setCurrentStep(step);
    }
  }, [draftData]);

  const loadExistingBudget = async () => {
    setLoading(true);
    try {
      const params = resumeToken ? { resumeToken } : { id: budgetId };
      const response = await axios.get('/api/budget/summary', { params });
      
      if (response.data) {
        // Determinar en qué paso estaban
        const lastCompletedStep = response.data.lastCompletedStep || 1;
        setCurrentStep(Math.min(lastCompletedStep + 1, 6));
      }
    } catch (error) {
      console.error('Error loading budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStepData = (stepData: any) => {
    updateDraft(stepData);
  };

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExit = () => {
    if (hasChanges) {
      setShowConfirmModal(true);
    } else {
      router.push('/budget/drafts');
    }
  };

  const handleFinalizeBudget = async () => {
    try {
      await finalizeBudget();
    } catch (error) {
      console.error('Error finalizing budget:', error);
    }
  };

  const handleReset = () => {
    if (confirm('¿Está seguro de reiniciar el wizard? Se perderán todos los datos no guardados.')) {
      updateDraft({});
      setCurrentStep(1);
    }
  };

  const getStepProgress = () => {
    return (currentStep / 6) * 100;
  };

  return (
    <PageTransition>
      <div className="space-y-4">
        <PageHeader
          title="Nuevo Presupuesto"
          description="Complete los pasos para generar un presupuesto completo"
        >
          <div className="flex items-center gap-3">
            {effectiveDraftId && (
              <div className="text-sm text-[var(--text-secondary)]">
                Token: <code className="bg-[var(--surface-secondary)] px-2 py-1 rounded">{effectiveDraftId}</code>
              </div>
            )}
            {lastSaved && (
              <div className="text-sm text-[var(--text-secondary)]">
                <Save className="h-4 w-4 inline mr-1" />
                Guardado: {lastSaved.toLocaleTimeString('es-AR')}
              </div>
            )}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline"
                onClick={handleReset}
                className="transition-all duration-200"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reiniciar
              </Button>
            </motion.div>
          </div>
        </PageHeader>

        {/* Stepper */}
        <SectionTransition delay={0.1}>
          <div className="space-y-4">
            <Progress value={getStepProgress()} className="h-2" />
            
            <div className="flex justify-between">
              {WIZARD_STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                
                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => {
                      if (isCompleted) {
                        setCurrentStep(step.id);
                      }
                    }}
                  >
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center mb-2
                        transition-colors duration-200
                        ${isActive 
                          ? 'bg-[var(--accent-primary)] text-white' 
                          : isCompleted 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-200 text-gray-400'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span 
                      className={`
                        text-xs font-medium text-center
                        ${isActive ? 'text-[var(--accent-primary)]' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                      `}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionTransition>

        {/* Contenido del paso actual */}
        <div className="min-h-[500px]">
          {loading ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mb-4"></div>
                <p className="text-[var(--text-secondary)]">Cargando...</p>
              </div>
            </Card>
          ) : (
            <>
              {currentStep === 1 && (
                <Step1Client
                  data={draftData}
                  onUpdate={updateStepData}
                  onNext={nextStep}
                />
              )}
              
              {currentStep === 2 && (
                <Step2Plant
                  data={draftData}
                  onUpdate={updateStepData}
                  onNext={nextStep}
                  onBack={previousStep}
                />
              )}
              
              {currentStep === 3 && (
                <Step3Distance
                  data={draftData}
                  onUpdate={updateStepData}
                  onNext={nextStep}
                  onBack={previousStep}
                />
              )}
              
              {currentStep === 4 && (
                <Step4Freight
                  data={draftData}
                  onUpdate={updateStepData}
                  onNext={nextStep}
                  onBack={previousStep}
                />
              )}
              
              {currentStep === 5 && (
                <Step5Additionals
                  data={draftData}
                  onUpdate={updateStepData}
                  onNext={nextStep}
                  onBack={previousStep}
                />
              )}
              
              {currentStep === 6 && (
                <Step6Summary
                  data={draftData}
                  onUpdate={updateStepData}
                  onComplete={handleFinalizeBudget}
                  onBack={previousStep}
                />
              )}
            </>
          )}
        </div>

        {/* Footer con información adicional */}
        <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-full dark:bg-blue-800/30">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                Guardado automático activado
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Los cambios se guardan automáticamente como borrador
              </p>
            </div>
            {isSaving && (
              <div className="text-xs text-blue-600 dark:text-blue-400">Guardando...</div>
            )}
          </div>
        </Card>

        <DraftConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onSave={handleFinalizeBudget}
          onDiscard={discardDraft}
          onSaveAsDraft={() => {
            setShowConfirmModal(false);
            router.push('/budget/drafts');
          }}
          hasChanges={hasChanges}
          draftName={draftData.description || 'Presupuesto sin título'}
        />
      </div>
    </PageTransition>
  );
}