import { formatDistanceToNow } from 'date-fns';

export const formatCurrency = (value: number | string | any, currency = 'INR') => {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
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
