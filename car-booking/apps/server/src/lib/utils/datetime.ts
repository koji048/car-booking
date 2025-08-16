/**
 * DateTime utility functions for consistent date/time handling
 * Handles timezone conversions and formatting
 */

/**
 * Combine date and time strings into a proper timestamp
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:MM format
 * @param timezone - Optional timezone (defaults to system timezone)
 */
export function combineDateTimeToTimestamp(date: string, time: string, timezone?: string): Date {
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  }
  
  // Validate time format
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new Error(`Invalid time format: ${time}. Expected HH:MM`);
  }
  
  // Combine date and time
  const dateTimeString = `${date}T${time}:00`;
  const timestamp = new Date(dateTimeString);
  
  // Check if date is valid
  if (isNaN(timestamp.getTime())) {
    throw new Error(`Invalid date/time combination: ${date} ${time}`);
  }
  
  return timestamp;
}

/**
 * Format a Date object to date string (YYYY-MM-DD)
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object to time string (HH:MM)
 */
export function formatTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Check if two date/time ranges overlap
 */
export function checkTimeRangeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  // Ranges overlap if:
  // - Start1 is between Start2 and End2, OR
  // - End1 is between Start2 and End2, OR
  // - Start2 and End2 are both between Start1 and End1
  return (
    (start1 >= start2 && start1 < end2) ||
    (end1 > start2 && end1 <= end2) ||
    (start2 >= start1 && end2 <= end1)
  );
}

/**
 * Add hours to a date/time
 */
export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

/**
 * Get the start of day for a given date
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of day for a given date
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date): boolean {
  return date < new Date();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Get number of days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * Validate booking date/time constraints
 */
export function validateBookingDateTime(
  departureDate: string,
  departureTime: string,
  returnDate?: string,
  returnTime?: string
): { valid: boolean; error?: string } {
  try {
    const departure = combineDateTimeToTimestamp(departureDate, departureTime);
    
    // Check if departure is in the past
    if (isPastDate(departure)) {
      return { valid: false, error: 'Departure date/time cannot be in the past' };
    }
    
    // Check if departure is too far in the future (e.g., max 90 days)
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + 90);
    if (departure > maxFutureDate) {
      return { valid: false, error: 'Booking cannot be more than 90 days in advance' };
    }
    
    // If return date/time provided, validate them
    if (returnDate && returnTime) {
      const returnDateTime = combineDateTimeToTimestamp(returnDate, returnTime);
      
      // Return must be after departure
      if (returnDateTime <= departure) {
        return { valid: false, error: 'Return date/time must be after departure' };
      }
      
      // Maximum booking duration (e.g., 7 days)
      const maxDuration = 7;
      if (daysBetween(departure, returnDateTime) > maxDuration) {
        return { valid: false, error: `Booking duration cannot exceed ${maxDuration} days` };
      }
    }
    
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid date/time format' 
    };
  }
}