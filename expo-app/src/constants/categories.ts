// Bill categories with common Philippine billers — GCash-style.
// Each category has an icon, an accent color, and a list of suggested billers.

import { MaterialCommunityIcons } from '@expo/vector-icons';

type MCIconName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface BillCategory {
  id: string;
  label: string;
  icon: MCIconName;
  color: string;
  /** Common providers shown as quick-select chips. */
  billers: string[];
}

export const CATEGORIES: BillCategory[] = [
  {
    id: 'electricity',
    label: 'Electricity',
    icon: 'flash',
    color: '#F59E0B',
    billers: ['MERALCO', 'PALECO', 'VECO', 'BENECO', 'CEPALCO'],
  },
  {
    id: 'water',
    label: 'Water',
    icon: 'water',
    color: '#0EA5E9',
    billers: ['Maynilad', 'Manila Water', 'Local Water District', 'Prime Water'],
  },
  {
    id: 'internet',
    label: 'Internet',
    icon: 'wifi',
    color: '#8B5CF6',
    billers: ['PLDT Home', 'Globe', 'Converge', 'Sky', 'DITO'],
  },
  {
    id: 'mobile',
    label: 'Mobile / Load',
    icon: 'cellphone',
    color: '#14B8A6',
    billers: ['Globe', 'Smart', 'DITO', 'TM', 'TNT'],
  },
  {
    id: 'streaming',
    label: 'Streaming',
    icon: 'play-circle',
    color: '#EF4444',
    billers: ['Netflix', 'Spotify', 'YouTube Premium', 'Disney+', 'HBO Max'],
  },
  {
    id: 'creditcard',
    label: 'Credit Card',
    icon: 'credit-card',
    color: '#6366F1',
    billers: ['BPI', 'BDO', 'Metrobank', 'UnionBank', 'RCBC', 'Citi'],
  },
  {
    id: 'loan',
    label: 'Loan',
    icon: 'cash-multiple',
    color: '#10B981',
    billers: ['Home Credit', 'Pag-IBIG Loan', 'SSS Loan', 'GCash GLoan'],
  },
  {
    id: 'rent',
    label: 'Rent',
    icon: 'home-city',
    color: '#F97316',
    billers: ['Apartment', 'Condo', 'Boarding House'],
  },
  {
    id: 'insurance',
    label: 'Insurance',
    icon: 'shield-check',
    color: '#06B6D4',
    billers: ['PhilHealth', 'Pru Life UK', 'Sun Life', 'AXA', 'Manulife'],
  },
  {
    id: 'government',
    label: 'Government',
    icon: 'bank',
    color: '#64748B',
    billers: ['SSS', 'Pag-IBIG', 'BIR', 'PhilHealth'],
  },
  {
    id: 'education',
    label: 'Education',
    icon: 'school',
    color: '#DB2777',
    billers: ['Tuition', 'School Fees', 'Tutorial'],
  },
  {
    id: 'other',
    label: 'Other',
    icon: 'dots-horizontal',
    color: '#6B7280',
    billers: [],
  },
];

const CATEGORY_MAP: Record<string, BillCategory> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<string, BillCategory>
);

/** Always returns a category; falls back to "Other" for unknown ids. */
export function getCategory(id: string | null | undefined): BillCategory {
  return (id && CATEGORY_MAP[id]) || CATEGORY_MAP.other;
}
