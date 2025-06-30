
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PeriodOfDay, DayOfWeek } from "@/types";
import { getDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
const dayOfWeekMapping: Record<DayOfWeek, number> = {
  'Domingo': 0,
  'Segunda': 1,
  'Terça': 2,
  'Quarta': 3,
  'Quinta': 4,
  'Sexta': 5,
  'Sábado': 6
};

export function isClassDay(currentDate: Date, classDays: DayOfWeek[]): boolean {
  if (!currentDate || !Array.isArray(classDays)) {
    return false;
  }
  const currentDay = getDay(currentDate);
  const numericalClassDays = classDays.map(day => dayOfWeekMapping[day]);
  return numericalClassDays.includes(currentDay);
}


// Helper to check if two time ranges overlap (HH:mm strings)
export function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const toMinutes = (timeStr: string): number | null => {
    if (typeof timeStr !== 'string') return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null; 
    }
    return hours * 60 + minutes;
  };

  const startAMin = toMinutes(startA);
  const endAMin = toMinutes(endA);
  const startBMin = toMinutes(startB);
  const endBMin = toMinutes(endB);

  if (startAMin === null || endAMin === null || startBMin === null || endBMin === null) {
    return false;
  }
  if (startAMin >= endAMin || startBMin >= endBMin) {
      return false;
  }

  return startAMin < endBMin && endAMin > startBMin;
}

// Helper function to check if two date ranges overlap
export const dateRangesOverlap = (startA: Date, endA: Date, startB: Date, endB: Date): boolean => {
  if (!(startA instanceof Date && !isNaN(startA.getTime())) ||
      !(endA instanceof Date && !isNaN(endA.getTime())) ||
      !(startB instanceof Date && !isNaN(startB.getTime())) ||
      !(endB instanceof Date && !isNaN(endB.getTime()))) {
    return false;
  }
  if (startA > endA || startB > endB) {
      return false;
  }
  return startA <= endB && endA >= startB;
};

export function getCurrentShift(hour: number | null): PeriodOfDay | null {
  if (hour === null || hour < 0 || hour > 23) return null;
  if (hour >= 6 && hour < 12) return 'Manhã';
  if (hour >= 12 && hour < 18) return 'Tarde';
  if (hour >= 18 && hour <= 23) return 'Noite';
  return null;
}
