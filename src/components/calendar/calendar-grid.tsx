"use client";

import type { CalendarDay, CalendarEvent } from "@/lib/types/calendar";
import { CalendarDayCell } from "./calendar-day-cell";
import { motion } from "framer-motion";

interface CalendarGridProps {
  days: CalendarDay[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
};

export function CalendarGrid({ days, onDayClick, onEventClick }: CalendarGridProps) {
  return (
    <motion.div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm" {...fadeInUp}>
      {/* Headers de días de la semana */}
      <div className="grid grid-cols-7 bg-muted/50">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-semibold text-muted-foreground border-r border-border last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grilla de días del calendario */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => (
          <CalendarDayCell
            key={`${day.date.getTime()}-${index}`}
            day={day}
            onClick={() => onDayClick(day.date)}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </motion.div>
  );
}
