import { CURRENCY_SYMBOL } from '@/theme/colors';

/** Format a number as a peso amount with thousands separators, e.g. ₱1,234.50. */
export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return (
    CURRENCY_SYMBOL +
    safe.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/**
 * A short relative phrase for the due date:
 * "Due today", "Due tomorrow", "Due in 3 days", "Overdue by 2 days".
 * Returns "Paid" when the bill is settled.
 */
export function relativeDueDate(iso: string, isPaid: boolean): string {
  if (isPaid) return 'Paid';
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return '';

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startOfDay(due).getTime() - startOfDay(new Date()).getTime()) / 86400000
  );

  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays > 1) return `Due in ${diffDays} days`;
  if (diffDays === -1) return 'Overdue by 1 day';
  return `Overdue by ${Math.abs(diffDays)} days`;
}
