import { Bill } from '@/types/bill';
import { colors } from '@/theme/colors';

export type BillStatus = 'paid' | 'overdue' | 'dueSoon' | 'pending';

/** Derive a bill's status from paid flag and due date (due soon = within 3 days). */
export function getBillStatus(bill: Bill): BillStatus {
  if (bill.isPaid) return 'paid';
  const due = new Date(bill.dueDate).getTime();
  const now = Date.now();
  if (due < now) return 'overdue';
  if (due - now <= 3 * 86400000) return 'dueSoon';
  return 'pending';
}

interface StatusStyle {
  label: string;
  color: string;
  surface: string;
}

export function getStatusStyle(status: BillStatus): StatusStyle {
  switch (status) {
    case 'paid':
      return { label: 'Paid', color: colors.success, surface: colors.successSurface };
    case 'overdue':
      return { label: 'Overdue', color: colors.danger, surface: colors.dangerSurface };
    case 'dueSoon':
      return { label: 'Due soon', color: colors.warning, surface: colors.warningSurface };
    default:
      return { label: 'Pending', color: colors.info, surface: colors.infoSurface };
  }
}
