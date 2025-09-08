"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { CalendarEvent } from "@/lib/types/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchSelect } from "@/components/ui/search-select";
import { formatDate } from "@/lib/calendar-utils";
import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import axios from "axios";

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, "id">) => void;
  selectedDate: Date | null;
  editingEvent?: CalendarEvent | null;
}

interface Budget {
  id: string;
  code: string;
  clientName: string;
  projectName: string;
}

interface Project {
  id: string;
  name: string;
  client: { name: string };
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
};

export function EventForm({ isOpen, onClose, onSave, selectedDate, editingEvent }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    category: "presupuestacion" as CalendarEvent["category"],
    priority: "media" as CalendarEvent["priority"],
    status: "pendiente" as CalendarEvent["status"],
    budgetId: "",
    projectId: "",
    clientId: "",
  });

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos relacionados
  useEffect(() => {
    if (isOpen) {
      loadBudgets();
      loadProjects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description || "",
        startTime: editingEvent.startTime || "",
        endTime: editingEvent.endTime || "",
        category: editingEvent.category,
        priority: editingEvent.priority || "media",
        status: editingEvent.status || "pendiente",
        budgetId: editingEvent.budgetId || "",
        projectId: editingEvent.projectId || "",
        clientId: editingEvent.clientId || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        category: "presupuestacion",
        priority: "media",
        status: "pendiente",
        budgetId: "",
        projectId: "",
        clientId: "",
      });
    }
  }, [editingEvent, isOpen]);

  const loadBudgets = async () => {
    try {
      const response = await axios.get('/api/budgets');
      setBudgets(response.data.items || []);
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.items || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !selectedDate) return;

    setLoading(true);
    try {
      const eventData: Omit<CalendarEvent, "id"> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: selectedDate,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        budgetId: formData.budgetId || undefined,
        projectId: formData.projectId || undefined,
        clientId: formData.clientId || undefined,
      };

      // Calcular días hasta vencimiento si es un plazo
      if (formData.category === "plazo") {
        const today = new Date();
        const diffTime = selectedDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        eventData.daysUntilExpiry = diffDays;
      }

      onSave(eventData);
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <motion.div {...fadeInUp}>
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {editingEvent ? "Editar Evento" : "Crear Nuevo Evento"}
              </div>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {selectedDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                <Calendar className="h-4 w-4" />
                {formatDate(selectedDate)}
              </div>
            )}

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Título del evento"
                required
              />
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value as CalendarEvent["category"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presupuestacion">Presupuestación</SelectItem>
                  <SelectItem value="plazo">Plazo</SelectItem>
                  <SelectItem value="reunión">Reunión</SelectItem>
                  <SelectItem value="seguimiento">Seguimiento</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prioridad y Estado */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, priority: value as CalendarEvent["priority"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="crítica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value as CalendarEvent["status"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En Progreso</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Hora de Inicio
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Hora de Fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Relación con presupuestación */}
            {(formData.category === "presupuestacion" || formData.category === "plazo") && (
              <div className="space-y-4 p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium">Relación con Presupuestación</h4>
                
                <div className="space-y-2">
                  <Label>Presupuesto</Label>
                  <SearchSelect
                    value={formData.budgetId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, budgetId: value }))}
                    placeholder="Seleccionar presupuesto"
                    searchPlaceholder="Buscar presupuesto..."
                    options={budgets.map(budget => ({
                      value: budget.id,
                      label: budget.code,
                      description: `${budget.clientName} - ${budget.projectName}`
                    }))}
                    emptyText="No se encontraron presupuestos"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Proyecto</Label>
                  <SearchSelect
                    value={formData.projectId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
                    placeholder="Seleccionar proyecto"
                    searchPlaceholder="Buscar proyecto..."
                    options={projects.map(project => ({
                      value: project.id,
                      label: project.name,
                      description: `Cliente: ${project.client.name}`
                    }))}
                    emptyText="No se encontraron proyectos"
                  />
                </div>
              </div>
            )}

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del evento (opcional)"
                rows={3}
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : editingEvent ? "Actualizar Evento" : "Crear Evento"}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
