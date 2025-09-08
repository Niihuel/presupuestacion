'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Save, X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface DraftConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onSaveAsDraft: () => void;
  hasChanges: boolean;
  draftName?: string;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
};

export function DraftConfirmationModal({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  onSaveAsDraft,
  hasChanges,
  draftName = 'Presupuesto sin título'
}: DraftConfirmationModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
  };

  const handleSaveAsDraft = async () => {
    setIsSaving(true);
    await onSaveAsDraft();
    setIsSaving(false);
  };

  if (!hasChanges) {
    onClose();
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Cambios sin guardar
            </div>
          </DialogTitle>
        </DialogHeader>

        <motion.div className="space-y-4" {...fadeInUp}>
          <p className="text-sm text-muted-foreground">
            Tienes cambios sin guardar en <span className="font-semibold">{draftName}</span>.
            ¿Qué deseas hacer?
          </p>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full justify-start"
              variant="default"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar y finalizar presupuesto
            </Button>

            <Button
              onClick={handleSaveAsDraft}
              disabled={isSaving}
              className="w-full justify-start"
              variant="outline"
            >
              <Clock className="h-4 w-4 mr-2" />
              Guardar como borrador
            </Button>

            <Button
              onClick={onDiscard}
              disabled={isSaving}
              className="w-full justify-start"
              variant="ghost"
            >
              <X className="h-4 w-4 mr-2" />
              Descartar cambios
            </Button>
          </div>

          <div className="pt-2 border-t">
            <Button
              onClick={onClose}
              disabled={isSaving}
              className="w-full"
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
