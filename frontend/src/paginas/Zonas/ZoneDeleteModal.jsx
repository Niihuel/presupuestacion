/**
 * Modal de Eliminación de Zona usando ConfirmModal Reutilizable
 * 
 * Modal de confirmación con estilo corporativo para confirmar
 * la eliminación de una zona del sistema.
 */

import React from 'react';
import { ConfirmModal } from '@compartido/components/modals';

const ZoneDeleteModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  zone,
  isLoading = false 
}) => {
  if (!isOpen || !zone) return null;

  const handleConfirm = () => {
    onConfirm(zone.id);
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      type="danger"
      title="Confirmar Eliminación de Zona"
      message={`¿Está seguro de que desea eliminar la zona "${zone.name}"?`}
      description="Advertencia: Esta acción no se puede deshacer. Se eliminarán todos los precios y datos asociados a esta zona permanentemente."
      confirmText="Eliminar Zona"
      cancelText="Cancelar"
      isLoading={isLoading}
    />
  );
};

export default ZoneDeleteModal;
