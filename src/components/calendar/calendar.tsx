"use client";

import { useState, useMemo } from "react";
import type { CalendarEvent } from "@/lib/types/calendar";
import { getDaysInMonth, isSameDay, getDateWithWarning, addDays } from "@/lib/calendar-utils";
import { CalendarHeader } from "./calendar-header";
import { CalendarGrid } from "./calendar-grid";
import { EventModal } from "./event-modal";
import { EventForm } from "./event-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import useSWR from "swr";
import axios from "axios";

const fetcher = (url: string) => axios.get(url).then(r => r.data);

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
};

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Cargar eventos del calendario
  const { data: eventsData, mutate } = useSWR("/api/calendar/events", fetcher);
  const events: CalendarEvent[] = eventsData?.items || [];

  // Convertir eventos del API al formato del calendario
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map(event => {
      const eventDate = new Date(event.date);
      const warningInfo = getDateWithWarning(eventDate);
      
      return {
        ...event,
        date: eventDate,
        daysUntilExpiry: event.category === "plazo" ? warningInfo.daysUntil : undefined,
        status: warningInfo.isExpired ? "vencido" : event.status,
      };
    });
  }, [events]);

  const days = useMemo(() => {
    const calendarDays = getDaysInMonth(currentDate);
    return calendarDays.map((day) => ({
      ...day,
      events: calendarEvents.filter((event) => isSameDay(event.date, day.date)),
    }));
  }, [currentDate, calendarEvents]);

  // Estadísticas para el dashboard
  const stats = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    const overdueEvents = calendarEvents.filter(e => 
      e.status === "vencido" || getDateWithWarning(e.date).isExpired
    );
    
    const upcomingEvents = calendarEvents.filter(e => 
      e.date >= today && e.date <= nextWeek && e.status !== "completado"
    );
    
    const completedThisMonth = calendarEvents.filter(e => 
      e.date.getMonth() === currentDate.getMonth() && 
      e.date.getFullYear() === currentDate.getFullYear() &&
      e.status === "completado"
    );

    return {
      overdue: overdueEvents.length,
      upcoming: upcomingEvents.length,
      completed: completedThisMonth.length,
      total: calendarEvents.length
    };
  }, [calendarEvents, currentDate]);

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleCreateEvent = () => {
    setSelectedDate(new Date());
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedDate(event.date);
    setEditingEvent(event);
    setIsEventModalOpen(false);
    setIsFormOpen(true);
  };

  const handleSaveEvent = async (eventData: Omit<CalendarEvent, "id">) => {
    try {
      if (editingEvent) {
        await axios.put(`/api/calendar/events/${editingEvent.id}`, eventData);
      } else {
        await axios.post("/api/calendar/events", eventData);
      }
      mutate(); // Recargar eventos
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await axios.delete(`/api/calendar/events/${eventId}`);
      setIsEventModalOpen(false);
      mutate(); // Recargar eventos
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header del calendario */}
      <CalendarHeader
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onCreateEvent={handleCreateEvent}
      />

      {/* Estadísticas rápidas */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próximos 7 días</p>
                <p className="text-2xl font-bold text-orange-600">{stats.upcoming}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total eventos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="flex flex-col gap-1">
                <Badge variant="secondary" className="text-xs">
                  Este mes
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grilla del calendario */}
      <CalendarGrid 
        days={days} 
        onDayClick={handleDayClick} 
        onEventClick={handleEventClick} 
      />

      {/* Card de gestión de eventos */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Gestión de Eventos</h3>
                <p className="text-sm text-muted-foreground">
                  Haz clic en cualquier día para agregar un evento, o crea uno ahora
                </p>
              </div>
              <Button onClick={handleCreateEvent} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Crear Evento
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modales */}
      <EventModal
        event={selectedEvent}
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      <EventForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveEvent}
        selectedDate={selectedDate}
        editingEvent={editingEvent}
      />
    </div>
  );
}
