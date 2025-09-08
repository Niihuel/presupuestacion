export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  category: "presupuestacion" | "plazo" | "reunión" | "seguimiento" | "personal";
  // Campos específicos para presupuestación
  budgetId?: string;
  projectId?: string;
  clientId?: string;
  daysUntilExpiry?: number;
  priority?: "baja" | "media" | "alta" | "crítica";
  status?: "pendiente" | "en_progreso" | "completado" | "vencido";
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

// Tipos para notificaciones de presupuestación
export interface BudgetNotification {
  id: string;
  budgetId: string;
  type: "plazo_vencimiento" | "seguimiento_cliente" | "entrega_planos" | "revision_presupuesto";
  dueDate: Date;
  title: string;
  description: string;
  priority: CalendarEvent["priority"];
}
