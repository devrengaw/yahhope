import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInYears, differenceInMonths, differenceInDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(dob: string | Date): string {
  if (!dob) return '--';
  const birthDate = typeof dob === 'string' ? parseLocalDate(dob) : dob;
  if (isNaN(birthDate.getTime())) return '--';
  
  const today = new Date();
  
  const years = differenceInYears(today, birthDate);
  const months = differenceInMonths(today, birthDate) % 12;
  const days = differenceInDays(today, birthDate) % 30; // Approximation for display
  
  if (years > 0) {
    return `${years}a ${months}m`;
  }
  if (months > 0) {
    return `${months}m ${days}d`;
  }
  return `${days}d`;
}

export function calculateAgeInMonths(dob: string | Date): number {
  if (!dob) return 0;
  const birthDate = typeof dob === 'string' ? parseLocalDate(dob) : dob;
  if (isNaN(birthDate.getTime())) return 0;
  return differenceInMonths(new Date(), birthDate);
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // Midday to avoid DST issues
}
