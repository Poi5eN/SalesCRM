import { formatDistanceToNow } from 'date-fns';

/**
 * Format a value as currency using the locale-aware Intl API.
 * Falls back to 'USD' if no currency is provided.
 * Uses 'en-IN' locale for Indian number formatting (commas every 2 digits).
 */
export const formatCurrency = (value: number | string | any, currency?: string) => {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) return '$0';
  
  const safeCurrency = currency || 'USD';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: safeCurrency,
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatNumber = (value: number | string | any) => {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatRelativeTime = (date: string | Date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};
