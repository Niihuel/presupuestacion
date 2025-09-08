"use client";

import type { CalendarDay, CalendarEvent } from "@/lib/types/calendar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CalendarDayCellProps {
  day: CalendarDay;
  onClick: () => void;
  onEventClick: (event: CalendarEvent) => void;
}

const categoryColors = {
  presupuestacion: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  plazo: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
  reunión: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  seguimiento: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  personal: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-600",
};

const priorityIndicators = {
  crítica: "border-l-4 border-l-red-500",
  alta: "border-l-4 border-l-orange-500", 
  media: "border-l-4 border-l-yellow-500",
  baja: "border-l-4 border-l-green-500",
};

export function CalendarDayCell({ day, onClick, onEventClick }: CalendarDayCellProps) {
  const visibleEvents = day.events.slice(0, 3);
  const remainingCount = day.events.length - 3;

  return (
    <motion.div
      className={cn(
        "min-h-[120px] p-2 border-r border-b border-border cursor-pointer transition-colors hover:bg-primary/5",
        !day.isCurrentMonth && "bg-muted/50 text-muted-foreground",
        day.isToday && "bg-primary/10 border-primary/30 font-semibold ring-2 ring-primary/20",
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex flex-col h-full">
        <div className={cn(
          "text-sm font-medium mb-1 flex items-center justify-between",
          day.isToday && "text-primary font-bold"
        )}>
          <span>{day.date.getDate()}</span>
          {day.events.some(e => e.priority === "crítica" || e.status === "vencido") && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>

        <div className="flex-1 space-y-1">
          {visibleEvents.map((event) => (
            <motion.div
              key={event.id}
              className={cn(
                "text-xs px-2 py-1 rounded border cursor-pointer truncate",
                categoryColors[event.category],
                event.priority && priorityIndicators[event.priority],
                event.status === "vencido" && "bg-red-50 text-red-900 border-red-300 dark:bg-red-900/50",
                day.isToday && "ring-1 ring-primary/20"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick(event);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`${event.title}${event.description ? ` - ${event.description}` : ''}`}
            >
              <div className="flex items-center gap-1">
                {event.startTime && (
                  <span className="text-[10px] opacity-75">{event.startTime}</span>
                )}
                <span className="truncate">{event.title}</span>
                {event.daysUntilExpiry !== undefined && event.daysUntilExpiry <= 3 && (
                  <span className="text-[10px] font-bold text-red-600">
                    {event.daysUntilExpiry === 0 ? "¡HOY!" : `${event.daysUntilExpiry}d`}
                  </span>
                )}
              </div>
            </motion.div>
          ))}

          {remainingCount > 0 && (
            <div className={cn(
              "text-xs text-muted-foreground font-medium",
              day.isToday && "text-primary/70"
            )}>
              +{remainingCount} más
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
