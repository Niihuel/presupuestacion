/**
 * Modal de Confirmación para el Wizard de Presupuestación
 * 
 * Aparece cuando el usuario intenta salir del wizard sin guardar cambios
 */

import React from 'react';
import { AlertTriangle, Save, X } from 'lucide-react';
import { ConfirmModal } from '@compartido/componentes/modals';

const ConfirmExitModal = ({ 
  isOpen, 
  onClose, 
  onSaveAndExit, 
  onExitWithoutSaving,
  isLoading = false,
  hasChanges = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop con efecto glassmorphism */}
            {/* Backdrop con efecto glassmorphism unificado */}
      <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity" />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all w-full max-w-md">
          {/* Header */}
          <div className="bg-white px-6 pt-6">
            <div className="flex items-center">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                ¿Salir del Wizard de Presupuestación?
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {hasChanges 
                    ? 'Tienes cambios sin guardar. ¿Qué deseas hacer con tus datos?' 
                    : 'Se perderá el progreso actual de la presupuestación.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          {hasChanges && (
            <div className="px-6 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Save className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-900">
                      Recomendación
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Guarda tus cambios como borrador para continuar más tarde. 
                      Podrás encontrar tu presupuestación en el tablero Kanban.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse gap-3 sm:flex-row sm:gap-3">
            {/* Cancelar */}
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto disabled:opacity-50"
            >
              Cancelar
            </button>

            {/* Salir sin guardar */}
            <button
              type="button"
              onClick={onExitWithoutSaving}
              disabled={isLoading}
              className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-2" />
              Salir sin Guardar
            </button>

            {/* Guardar y salir */}
            {hasChanges && (
              <button
                type="button"
                onClick={onSaveAndExit}
                disabled={isLoading}
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar y Salir
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmExitModal;
