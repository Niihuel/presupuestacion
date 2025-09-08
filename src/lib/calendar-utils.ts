import type { CalendarDay } from "./types/calendar";

export function getDaysInMonth(date: Date): CalendarDay[] {
  const year = date.getFullYear();
  const month = date.getMonth();

  // Obtener primer y último día del mes
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  
  // Empezar desde el lunes (1) en lugar de domingo (0)
  const firstDayOfWeek = firstDay.getDay();
  const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  startDate.setDate(startDate.getDate() - daysToSubtract);

  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generar 42 días (6 semanas × 7 días)
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const isCurrentMonth = currentDate.getMonth() === month;
    const isToday = currentDate.getTime() === today.getTime();

    days.push({
      date: new Date(currentDate),
      isCurrentMonth,
      isToday,
      events: [],
    });
  }

  return days;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long", 
    day: "numeric",
    weekday: "long"
  });
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
  });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDaysDifference(date1: Date, date2: Date): number {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isDateExpired(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function getDateWithWarning(date: Date, warningDays: number = 7): {
  isExpired: boolean;
  isWarning: boolean;
  daysUntil: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const daysUntil = getDaysDifference(today, targetDate);
  
  return {
    isExpired: daysUntil < 0,
    isWarning: daysUntil >= 0 && daysUntil <= warningDays,
    daysUntil: Math.abs(daysUntil)
  };
}
