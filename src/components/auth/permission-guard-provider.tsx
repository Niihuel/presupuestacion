"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { PermissionDeniedModal } from "./permission-denied-modal";

interface PermissionModalState {
  isOpen: boolean;
  action: string;
  resource: string;
  customMessage: string;
}

interface PermissionGuardContextType {
  showPermissionModal: (action: string, resource: string, customMessage?: string) => void;
  closeModal: () => void;
  modalState: PermissionModalState;
}

const PermissionGuardContext = createContext<PermissionGuardContextType | undefined>(undefined);

export function usePermissionModal() {
  const context = useContext(PermissionGuardContext);
  if (!context) {
    throw new Error('usePermissionModal must be used within a PermissionGuardProvider');
  }
  return context;
}

interface PermissionGuardProviderProps {
  children: React.ReactNode;
}

export function PermissionGuardProvider({ children }: PermissionGuardProviderProps) {
  const [modalState, setModalState] = useState<PermissionModalState>({
    isOpen: false,
    action: "",
    resource: "",
    customMessage: ""
  });

  const showPermissionModal = useCallback((action: string, resource: string, customMessage = "") => {
    setModalState({
      isOpen: true,
      action,
      resource,
      customMessage
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const contextValue = {
    showPermissionModal,
    closeModal,
    modalState
  };
  
  return (
    <PermissionGuardContext.Provider value={contextValue}>
      {children}
      <PermissionDeniedModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        action={modalState.action}
        resource={modalState.resource}
        customMessage={modalState.customMessage}
        showContactInfo={true}
      />
    </PermissionGuardContext.Provider>
  );
}