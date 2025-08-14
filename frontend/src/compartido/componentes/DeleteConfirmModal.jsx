/**
 * Modal de Confirmación para Eliminar - Wrapper para ConfirmModal
 * 
 * Wrapper del ConfirmModal configurado específicamente para eliminaciones
 * para mantener compatibilidad con código existente.
 */

import React from 'react';
import { ConfirmModal } from '@compartido/components/modals';

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = "Confirmar Eliminación",
  message,
  itemName,
  isLoading = false 
}) => {
  const finalMessage = message || `¿Está seguro de que desea eliminar ${itemName || 'este elemento'}?`;
  
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      type="danger"
      title={title}
      message={finalMessage}
      description="Advertencia: Esta acción no se puede deshacer."
      confirmText="Eliminar"
      cancelText="Cancelar"
      isLoading={isLoading}
    />
  );
};

export default DeleteConfirmModal;
