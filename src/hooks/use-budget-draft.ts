'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
// Simple debounce implementation to avoid lodash dependency
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

interface BudgetDraftData {
  id?: string;
  customerId?: string;
  projectId?: string;
  description?: string;
  items?: any[];
  tax?: number;
  discount?: number;
  validUntil?: Date;
  paymentTerms?: string;
  paymentConditions?: string;
  notes?: string;
  finalTotal?: number;
  validityDays?: number;
  isDraft?: boolean;
  draftStep?: number;
}

interface UseBudgetDraftOptions {
  draftId?: string;
  autoSaveInterval?: number;
  onSaveSuccess?: () => void;
  onSaveError?: (error: any) => void;
}

export function useBudgetDraft({
  draftId,
  autoSaveInterval = 30000, // 30 seconds
  onSaveSuccess,
  onSaveError
}: UseBudgetDraftOptions = {}) {
  const [draftData, setDraftData] = useState<BudgetDraftData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const router = useRouter();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing draft if draftId is provided
  useEffect(() => {
    if (draftId) {
      loadDraft();
    }
  }, [draftId]);

  const loadDraft = async (): Promise<void> => {
    try {
      const response = await axios.get(`/api/budget/drafts/${draftId}`);
      setDraftData(response.data);
      setLastSaved(new Date(response.data.lastEditedAt || response.data.createdAt));
    } catch (error: any) {
      console.error('Error loading draft:', error);
      
      // Handle network errors with Spanish translation
      let errorMessage = 'Error al cargar el borrador';
      if (error?.code === 'NETWORK_ERROR' || error?.message?.toLowerCase().includes('network')) {
        errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.';
      }
      
      onSaveError?.({
        ...error,
        message: errorMessage
      });
    }
  };

  // Auto-save functionality
  const saveDraft = useCallback(async (data: BudgetDraftData) => {
    if (!hasChanges && draftData.id) return;

    setIsSaving(true);
    try {
      let response: any;
      if (data.id) {
        // Update existing draft
        response = await axios.put(`/api/budget/drafts/${data.id}`, {
          ...data,
          status: 'draft'
        });
      } else {
        // Create new draft
        response = await axios.post('/api/budget/drafts', {
          ...data,
          status: 'draft'
        });
        // Update the draft data with the new ID
        setDraftData(prev => ({ ...prev, id: response.data.id }));
      }

      setLastSaved(new Date());
      setHasChanges(false);
      onSaveSuccess?.();
      
      return response?.data;
    } catch (error: any) {
      console.error('Error saving draft:', error);
      
      // Handle network errors with Spanish translation
      let errorMessage = 'Error al guardar el borrador';
      if (error?.code === 'NETWORK_ERROR' || error?.message?.toLowerCase().includes('network')) {
        errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.';
      }
      
      onSaveError?.({
        ...error,
        message: errorMessage
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [draftData.id, hasChanges, onSaveSuccess, onSaveError]);

  // Debounced auto-save
  const debouncedSave = useCallback(
    debounce((data: BudgetDraftData) => {
      saveDraft(data);
    }, 2000),
    [saveDraft]
  );

  // Update draft data and trigger auto-save
  const updateDraft = useCallback((updates: Partial<BudgetDraftData>) => {
    setDraftData(prev => {
      const newData = { ...prev, ...updates };
      setHasChanges(true);
      debouncedSave(newData);
      return newData;
    });
  }, [debouncedSave]);

  // Periodic auto-save
  useEffect(() => {
    if (autoSaveInterval && hasChanges) {
      autoSaveTimerRef.current = setInterval(() => {
        saveDraft(draftData);
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSaveInterval, hasChanges, draftData, saveDraft]);

  // Save and finalize budget
  const finalizeBudget = async () => {
    setIsSaving(true);
    try {
      const response = await axios.put(`/api/budget/drafts/${draftData.id}`, {
        ...draftData,
        status: 'PENDING'
      });
      
      router.push(`/budget/${response.data.id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error finalizing budget:', error);
      
      // Handle network errors with Spanish translation
      let errorMessage = 'Error al finalizar el presupuesto';
      if (error?.code === 'NETWORK_ERROR' || error?.message?.toLowerCase().includes('network')) {
        errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.';
      }
      
      onSaveError?.({
        ...error,
        message: errorMessage
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Discard draft
  const discardDraft = async () => {
    if (draftData.id) {
      try {
        await axios.delete(`/api/budget/drafts/${draftData.id}`);
        router.push('/budget/drafts');
      } catch (error: any) {
        console.error('Error discarding draft:', error);
        
        // Handle network errors with Spanish translation
        let errorMessage = 'Error al descartar el borrador';
        if (error?.code === 'NETWORK_ERROR' || error?.message?.toLowerCase().includes('network')) {
          errorMessage = 'Error de conexión. Por favor, verifica tu conexión a internet.';
        }
        
        onSaveError?.({
          ...error,
          message: errorMessage
        });
      }
    } else {
      router.push('/budget/drafts');
    }
  };

  return {
    draftData,
    updateDraft,
    saveDraft: () => saveDraft(draftData),
    finalizeBudget,
    discardDraft,
    isSaving,
    hasChanges,
    lastSaved
  };
}
