/**
 * Modal de Eliminación de Calculista usando ConfirmModal Reutilizable
 * 
 * Modal de confirmación con estilo corporativo para confirmar
 * la eliminación de un calculista del sistema.
 */

import React from 'react';
import { ConfirmModal } from '@compartido/components/modals';

const CalculistaDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  calculista, 
  isLoading = false 
}) => {
  if (!isOpen || !calculista) return null;

  const handleConfirm = () => {
    onConfirm(calculista.id);
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      type="danger"
      title="Confirmar Eliminación"
      message={
        `¿Está seguro de que desea eliminar el calculista ${calculista.first_name} ${calculista.last_name}?`
      }
      description="Advertencia: Esta acción no se puede deshacer. Toda la información asociada a este calculista será eliminada permanentemente."
      confirmText="Eliminar"
      cancelText="Cancelar"
      isLoading={isLoading}
    />
  );
};

export default CalculistaDeleteModal;