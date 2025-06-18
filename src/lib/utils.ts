
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PeriodOfDay } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to check if two time ranges overlap (HH:mm strings)
export function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const toMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        // console.error(`Invalid time string format: ${timeStr}`); // Avoid console.error in util, let caller handle
        throw new Error(`Invalid time string format: ${timeStr}`);
    }
    return hours * 60 + minutes;
  };

  try {
    const startAMin = toMinutes(startA);
    const endAMin = toMinutes(endA);
    const startBMin = toMinutes(startB);
    const endBMin = toMinutes(endB);

    // Ensure start time is before end time for each range
    if (startAMin >= endAMin) {
        // console.error(`Start time ${startA} is not before end time ${endA}`);
        throw new Error(`Start time ${startA} is not before end time ${endA}`);
    }
    if (startBMin >= endBMin) {
        // console.error(`Start time ${startB} is not before end time ${endB}`);
        throw new Error(`Start time ${startB} is not before end time ${endB}`);
    }

    return startAMin < endBMin && endAMin > startBMin;
  } catch (error) {
      // console.error("Error in timeRangesOverlap:", error); // Let caller handle logging
      // Instead of returning false, rethrow or let specific error propagate
      // For this use case, if time parsing fails, it's likely an input validation issue upstream
      // or a hard error that should be surfaced. For now, we'll let it propagate.
      throw error;
  }
}

// Helper function to check if two date ranges overlap
export const dateRangesOverlap = (startA: Date, endA: Date, startB: Date, endB: Date): boolean => {
  if (!(startA instanceof Date && !isNaN(startA.getTime())) ||
      !(endA instanceof Date && !isNaN(endA.getTime())) ||
      !(startB instanceof Date && !isNaN(startB.getTime())) ||
      !(endB instanceof Date && !isNaN(endB.getTime()))) {
    // console.error("Invalid date provided to dateRangesOverlap");
    throw new Error("Invalid date object provided to dateRangesOverlap");
  }
  // Ensure start date is not after end date for each range
  if (startA > endA) {
      throw new Error("Start date is after end date for the first range in dateRangesOverlap.");
  }
  if (startB > endB) {
      throw new Error("Start date is after end date for the second range in dateRangesOverlap.");
  }
  return startA <= endB && endA >= startB;
};

export function getCurrentShift(hour: number | null): PeriodOfDay | null {
  if (hour === null) return null;
  if (hour >= 6 && hour < 12) {
    return 'Manhã';
  } else if (hour >= 12 && hour < 18) {
    return 'Tarde';
  } else if (hour >= 18 && hour < 24) { // Adjusted to cover up to 23:59 for 'Noite'
    return 'Noite';
  }
  return null; // Return null if hour is outside expected ranges (e.g., 0-5)
}
