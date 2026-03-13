import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInYears, differenceInMonths, differenceInDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(dob: string | Date): string {
  const birthDate = new Date(dob);
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
  return differenceInMonths(new Date(), new Date(dob));
}
