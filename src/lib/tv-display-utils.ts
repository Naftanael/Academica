/**
 * @file src/lib/tv-display-utils.ts
 * @description Provides robust utility functions for filtering class groups for the TV display.
 *              This includes the critical logic for handling the "after midnight" scenario for night shifts.
 */

import type { TvDisplayInfo, ClassGroupStatus, DayOfWeek, PeriodOfDay } from '@/types';
import { isWithinInterval, parseISO, endOfDay, getDay, getHours, subDays } from 'date-fns';
import { JS_DAYS_OF_WEEK_MAP_TO_PT } from '@/lib/constants';

/**
 * The primary data type used by the TV Display client components.
 * It combines the base TvDisplayInfo with the necessary `status` for filtering.
 */
export interface ClientTvDisplayInfo extends TvDisplayInfo {
  status: ClassGroupStatus;
}

/**
 * Determines the effective shift and date for filtering purposes.
 * This is the core logic that handles the "after midnight" case, which is a common source of bugs in displays like this.
 * If the current time is between midnight and 6 AM, the function correctly assumes
 * it's still part of the "Noite" shift of the *previous* day.
 *
 * @param {Date} currentTime - The current date and time.
 * @returns {{ effectiveDate: Date, effectiveShift: PeriodOfDay | null }} 
 *          An object containing the correct date and shift that should be used for all filtering logic.
 */
function getEffectiveShiftAndDate(currentTime: Date): { effectiveDate: Date; effectiveShift: PeriodOfDay | null } {
  const currentHour = getHours(currentTime);

  // SCENARIO 1: After midnight but before the morning shift starts (e.g., 00:00-05:59).
  // This is treated as an extension of the previous day's night shift.
  if (currentHour >= 0 && currentHour < 6) {
    return {
      effectiveDate: subDays(currentTime, 1), // The logical date is the day before.
      effectiveShift: 'Noite',                // The logical shift is "Noite".
    };
  }

  // SCENARIO 2: Standard daytime and evening hours.
  let shift: PeriodOfDay | null = null;
  if (currentHour >= 6 && currentHour < 12) shift = 'Manhã';
  else if (currentHour >= 12 && currentHour < 18) shift = 'Tarde';
  else if (currentHour >= 18 && currentHour <= 23) shift = 'Noite';

  return {
    effectiveDate: currentTime, // The logical date is today.
    effectiveShift: shift,      // The shift is determined by the hour.
  };
}

/**
 * Checks if a given date string is a valid, parseable ISO date.
 * This is a defensive check to prevent errors from malformed data.
 */
function isValidDate(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const date = parseISO(dateStr);
    return !isNaN(date.getTime());
}

/**
 * Filters a list of all class groups to find only the ones that should be actively displayed on the TV.
 * This function orchestrates the entire filtering process using the robust, time-aware logic.
 *
 * @param {ClientTvDisplayInfo[]} allGroups - An array of all available class groups (with dates adapted to the current year).
 * @param {Date} currentTime - The current date and time to filter against.
 * @returns {ClientTvDisplayInfo[]} An array of the groups that are active and should be displayed now.
 */
export function filterActiveGroups(allGroups: ClientTvDisplayInfo[], currentTime: Date): ClientTvDisplayInfo[] {
  // First, determine the correct logical date and shift to use for all checks.
  const { effectiveDate, effectiveShift } = getEffectiveShiftAndDate(currentTime);

  // If there's no valid shift (e.g., the function returned null), no classes can be active.
  if (!effectiveShift || !Array.isArray(allGroups)) {
    return [];
  }

  // Determine the correct day of the week based on the logical date.
  const effectiveDayName = JS_DAYS_OF_WEEK_MAP_TO_PT[getDay(effectiveDate)] as DayOfWeek;

  return allGroups.filter(group => {
    // Condition 1: The group must be marked as "Em Andamento".
    const isActive = group.status === 'Em Andamento';

    // Condition 2: The group's shift must match the current logical shift.
    const isCorrectShift = group.shift === effectiveShift;

    // Condition 3: The current logical day must be one of the group's scheduled class days.
    const isCorrectDay = Array.isArray(group.classDays) && group.classDays.includes(effectiveDayName);

    // Condition 4: The current logical date must be within the group's overall start and end date.
    const isInDateRange =
      isValidDate(group.startDate) &&
      isValidDate(group.endDate) &&
      isWithinInterval(effectiveDate, {
        start: parseISO(group.startDate),
        end: endOfDay(parseISO(group.endDate)), // Use endOfDay to include the entire last day.
      });

    // A group is displayed only if all four of these conditions are true.
    return isActive && isCorrectShift && isCorrectDay && isInDateRange;
  });
}
