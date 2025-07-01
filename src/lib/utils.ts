
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PeriodOfDay, DayOfWeek } from "@/types";
import { getDay, parseISO, isValid } from "date-fns";

/**
 * A utility function to combine and merge Tailwind CSS classes.
 * `clsx` handles conditional classes, and `twMerge` merges them,
 * resolving conflicts (e.g., `p-2` and `p-4` becomes `p-4`).
 * @param inputs - A list of class names, which can be strings or objects.
 * @returns A single string of merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// A mapping from Portuguese day names to the numerical representation used by `date-fns` (0 = Sunday).
const dayOfWeekMapping: Record<DayOfWeek, number> = {
  'Domingo': 0,
  'Segunda': 1,
  'Terça': 2,
  'Quarta': 3,
  'Quinta': 4,
  'Sexta': 5,
  'Sábado': 6
};

/**
 * Checks if a given date string is a valid, parseable date.
 * @param dateStr - The date string to validate (e.g., "2023-10-27T00:00:00.000Z").
 * @returns `true` if the date is valid, `false` otherwise.
 */
export function isValidDate(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const date = parseISO(dateStr);
    return isValid(date);
}

/**
 * Checks if a given date falls on one of the specified class days.
 * @param currentDate - The date to check.
 * @param classDays - An array of Portuguese day names (e.g., ['Segunda', 'Quarta']).
 * @returns `true` if the `currentDate`'s day of the week is in `classDays`.
 */
export function isClassDay(currentDate: Date, classDays: DayOfWeek[]): boolean {
  if (!currentDate || !Array.isArray(classDays)) {
    return false;
  }
  const currentDay = getDay(currentDate); // 0 for Sunday, 1 for Monday, etc.
  // Convert the class day names to their numerical equivalents for comparison.
  const numericalClassDays = classDays.map(day => dayOfWeekMapping[day]);
  return numericalClassDays.includes(currentDay);
}


/**
 * Helper to check if two time ranges overlap (HH:mm strings).
 * This is useful for checking for scheduling conflicts between reservations.
 * @param startA - Start time of the first range (e.g., "08:00").
 * @param endA - End time of the first range (e.g., "10:00").
 * @param startB - Start time of the second range.
 * @param endB - End time of the second range.
 * @returns `true` if the time ranges have any overlap.
 */
export function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  // Converts a "HH:mm" string to the number of minutes from midnight.
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

  // Basic validation: ensure all times were parsed correctly and ranges are valid.
  if (startAMin === null || endAMin === null || startBMin === null || endBMin === null) {
    return false;
  }
  if (startAMin >= endAMin || startBMin >= endBMin) {
      return false; // Not a valid range (e.g., start is after end).
  }

  // The core logic: two ranges overlap if A starts before B ends, and A ends after B starts.
  return startAMin < endBMin && endAMin > startBMin;
}

/**
 * Helper function to check if two date ranges overlap.
 * @param startA - The start date of the first range.
 * @param endA - The end date of the first range.
 * @param startB - The start date of the second range.
 * @param endB - The end date of the second range.
 * @returns `true` if the date ranges have any overlap.
 */
export const dateRangesOverlap = (startA: Date, endA: Date, startB: Date, endB: Date): boolean => {
  // Validate that all inputs are actual Date objects.
  if (!(startA instanceof Date && !isNaN(startA.getTime())) ||
      !(endA instanceof Date && !isNaN(endA.getTime())) ||
      !(startB instanceof Date && !isNaN(startB.getTime())) ||
      !(endB instanceof Date && !isNaN(endB.getTime()))) {
    return false;
  }
  // Validate that the date ranges are logical.
  if (startA > endA || startB > endB) {
      return false;
  }
  // The core overlap check.
  return startA <= endB && endA >= startB;
};

/**
 * Determines the current period of the day (shift) based on the hour.
 * @param hour - The current hour (0-23).
 * @returns The corresponding shift ('Manhã', 'Tarde', 'Noite') or `null` if outside primary school hours.
 */
export function getCurrentShift(hour: number | null): PeriodOfDay | null {
  if (hour === null || hour < 0 || hour > 23) return null; // Validate input.
  if (hour >= 6 && hour < 12) return 'Manhã'; // 6:00 AM to 11:59 AM
  if (hour >= 12 && hour < 18) return 'Tarde'; // 12:00 PM to 5:59 PM
  if (hour >= 18 && hour <= 23) return 'Noite'; // 6:00 PM to 11:59 PM
  return null; // Return null for hours outside the defined shifts (e.g., 0-5 AM).
}
