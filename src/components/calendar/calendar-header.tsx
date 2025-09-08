"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { formatMonthYear } from "@/lib/calendar-utils";
import { motion } from "framer-motion";

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onCreateEvent: () => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
};

export function CalendarHeader({ 
  currentDate, 
  onPreviousMonth, 
  onNextMonth, 
  onToday,
  onCreateEvent 
}: CalendarHeaderProps) {
  return (
    <motion.div className="flex items-center justify-between mb-6" {...fadeInUp}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            {formatMonthYear(currentDate)}
          </h1>
        </div>
        <Button 
          variant="outline" 
          onClick={onToday} 
          className="text-sm bg-transparent hover:bg-primary/10 h-9 px-3"
        >
          Hoy
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={onPreviousMonth} 
          className="h-9 w-9 bg-transparent hover:bg-primary/10"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          onClick={onNextMonth} 
          className="h-9 w-9 bg-transparent hover:bg-primary/10"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <div className="ml-2 border-l border-border pl-2">
          <Button 
            onClick={onCreateEvent}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nuevo Evento
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
