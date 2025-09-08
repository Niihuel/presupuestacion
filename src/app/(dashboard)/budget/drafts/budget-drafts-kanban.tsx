'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Clock, 
  Calendar, 
  User, 
  Search,
  Plus,
  Trash2,
  Edit,
  Play,
  Archive
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import { DraftConfirmationModal } from '@/components/budget/draft-confirmation-modal';
import { SectionTransition } from '@/components/ui/page-transition';
import { PageHeader } from '@/components/ui/page-header';

interface BudgetDraft {
  id: string;
  name: string;
  customerName: string;
  projectName?: string;
  status: 'draft' | 'in_progress' | 'review';
  lastModified: Date;
  createdAt: Date;
  totalAmount?: number;
  completionPercentage: number;
  items?: any[];
}

type KanbanColumn = 'draft' | 'in_progress' | 'review';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
};

interface BudgetDraftsKanbanProps {
  initialDrafts: BudgetDraft[];
}

export default function BudgetDraftsKanban({ initialDrafts }: BudgetDraftsKanbanProps) {
  const [drafts, setDrafts] = useState<BudgetDraft[]>(initialDrafts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDraft, setSelectedDraft] = useState<BudgetDraft | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<BudgetDraft | null>(null);

  useEffect(() => {
    if (initialDrafts.length > 0) {
      setDrafts(initialDrafts);
    } else {
      fetchDrafts();
    }
  }, [initialDrafts]);

  const fetchDrafts = async () => {
    try {
      const response = await axios.get('/api/budget/drafts');
      setDrafts(response.data);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, draft: BudgetDraft) => {
    setDraggedItem(draft);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: KanbanColumn) => {
    e.preventDefault();
    if (!draggedItem) return;

    try {
      await axios.put(`/api/budget/drafts/${draggedItem.id}`, {
        ...draggedItem,
        status: newStatus
      });

      setDrafts(prevDrafts =>
        prevDrafts.map(draft =>
          draft.id === draggedItem.id
            ? { ...draft, status: newStatus }
            : draft
        )
      );
    } catch (error) {
      console.error('Error updating draft status:', error);
    }

    setDraggedItem(null);
  };

  const handleResumeDraft = (draft: BudgetDraft) => {
    window.location.href = `/budget/create?draftId=${draft.id}`;
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await axios.delete(`/api/budget/drafts/${draftId}`);
      setDrafts(prevDrafts => prevDrafts.filter(d => d.id !== draftId));
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const filteredDrafts = drafts.filter(draft =>
    draft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    draft.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    draft.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: { key: KanbanColumn; title: string; color: string }[] = [
    { key: 'draft', title: 'Borradores', color: 'bg-gray-500' },
    { key: 'in_progress', title: 'En Progreso', color: 'bg-blue-500' },
    { key: 'review', title: 'En Revisión', color: 'bg-yellow-500' }
  ];

  const getDraftsByColumn = (column: KanbanColumn) =>
    filteredDrafts.filter(draft => draft.status === column);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Borradores de Presupuestos"
        description="Gestiona y continúa trabajando en tus presupuestos guardados"
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={() => window.location.href = '/budget/create'}
            className="flex items-center gap-2 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Nuevo Presupuesto
          </Button>
        </motion.div>
      </PageHeader>

      {/* Search and Filters */}
      <SectionTransition delay={0.1} className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <Input
              type="text"
              placeholder="Buscar borradores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="outline" className="px-3 py-1">
            {drafts.length} {drafts.length === 1 ? 'borrador' : 'borradores'}
          </Badge>
        </div>
      </SectionTransition>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column, index) => (
          <SectionTransition key={column.key} delay={0.1 + index * 0.05}>
            <div
              className="space-y-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.key)}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <h2 className="text-lg font-semibold">{column.title}</h2>
                <Badge variant="secondary" className="ml-auto">
                  {getDraftsByColumn(column.key).length}
                </Badge>
              </div>

              <div className="space-y-3 min-h-[400px] bg-muted/20 rounded-lg p-4">
                {getDraftsByColumn(column.key).map((draft, draftIndex) => (
                  <motion.div
                    key={draft.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: draftIndex * 0.05 }}
                  >
                    <Card
                      draggable
                      onDragStart={(e) => handleDragStart(e, draft)}
                      className="p-4 cursor-move hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm line-clamp-1">
                              {draft.name}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {draft.customerName}
                              {draft.projectName && ` - ${draft.projectName}`}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(draft.completionPercentage)}%
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {draft.items?.length || 0} ítems
                          {draft.totalAmount && ` • $${draft.totalAmount.toLocaleString()}`}
                        </p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {format(new Date(draft.lastModified), 'dd/MM/yyyy', { locale: es })}
                          </span>
                          <span>
                            <Clock className="inline h-3 w-3 mr-1" />
                            {format(new Date(draft.lastModified), 'HH:mm', { locale: es })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResumeDraft(draft)}
                              className="w-full text-xs h-8 transition-all duration-200"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Continuar
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedDraft(draft);
                                setIsConfirmModalOpen(true);
                              }}
                              className="h-8 w-8 p-0 transition-all duration-200"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                
                {getDraftsByColumn(column.key).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No hay borradores en esta categoría</p>
                  </div>
                )}
              </div>
            </div>
          </SectionTransition>
        ))}
      </div>

      <DraftConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onSave={() => {
          // Implement save functionality
          console.log('Save functionality not implemented');
          setIsConfirmModalOpen(false);
        }}
        onDiscard={() => {
          if (selectedDraft) {
            handleDeleteDraft(selectedDraft.id);
          }
          setIsConfirmModalOpen(false);
        }}
        onSaveAsDraft={() => {
          // Implement save as draft functionality
          console.log('Save as draft functionality not implemented');
          setIsConfirmModalOpen(false);
        }}
        hasChanges={true}
        draftName={selectedDraft?.name || 'Presupuesto'}
      />
    </div>
  );
}
