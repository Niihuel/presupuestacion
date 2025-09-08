"use client";

import type { CalendarEvent } from "@/lib/types/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, getDateWithWarning } from "@/lib/calendar-utils";
import { Clock, Edit, Trash2, AlertTriangle, Calendar, User, Building } from "lucide-react";
import { motion } from "framer-motion";

interface EventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}

const categoryLabels = {
  presupuestacion: "Presupuestación",
  plazo: "Plazo",
  reunión: "Reunión",
  seguimiento: "Seguimiento",
  personal: "Personal",
};

const categoryColors = {
  presupuestacion: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  plazo: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  reunión: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  seguimiento: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  personal: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300",
};

const priorityLabels = {
  crítica: "Crítica",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const priorityColors = {
  crítica: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  alta: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  media: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  baja: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const statusLabels = {
  pendiente: "Pendiente",
  en_progreso: "En Progreso",
  completado: "Completado",
  vencido: "Vencido",
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2 },
};

export function EventModal({ event, isOpen, onClose, onEdit, onDelete }: EventModalProps) {
  if (!event) return null;

  const warningInfo = getDateWithWarning(event.date);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <motion.div {...scaleIn}>
          <DialogHeader>
            <DialogTitle>
              <div className="text-xl font-semibold flex items-center gap-2">
                {event.category === "plazo" && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                {event.title}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Badges de categoría y prioridad */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={categoryColors[event.category]}>
                {categoryLabels[event.category]}
              </Badge>
              {event.priority && (
                <Badge className={priorityColors[event.priority]}>
                  {priorityLabels[event.priority]}
                </Badge>
              )}
              {event.status && (
                <Badge variant={event.status === "completado" ? "default" : "secondary"}>
                  {statusLabels[event.status]}
                </Badge>
              )}
            </div>

            {/* Información de fecha y advertencias */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(event.date)}</span>
              </div>

              {(event.startTime || event.endTime) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {event.startTime && event.endTime
                      ? `${event.startTime} - ${event.endTime}`
                      : event.startTime || event.endTime}
                  </span>
                </div>
              )}

              {/* Advertencias de vencimiento */}
              {warningInfo.isExpired && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  <span>¡Plazo vencido hace {warningInfo.daysUntil} días!</span>
                </div>
              )}

              {warningInfo.isWarning && !warningInfo.isExpired && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    {warningInfo.daysUntil === 0 
                      ? "¡Vence hoy!" 
                      : `Vence en ${warningInfo.daysUntil} días`}
                  </span>
                </div>
              )}
            </div>

            {/* Información específica de presupuestación */}
            {event.budgetId && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium">Información de Presupuestación</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>ID Presupuesto: {event.budgetId}</span>
                  </div>
                  {event.projectId && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>ID Proyecto: {event.projectId}</span>
                    </div>
                  )}
                  {event.clientId && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>ID Cliente: {event.clientId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Descripción */}
            {event.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Descripción</h4>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => onEdit(event)} 
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={() => onDelete(event.id)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
