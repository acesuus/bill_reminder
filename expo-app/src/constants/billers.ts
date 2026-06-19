// Brand data for common Philippine billers.
// Each entry can show either a TEXT mark (like "N" for Netflix) or an ICON
// (like a lightning bolt for electricity providers).

import { MaterialCommunityIcons } from '@expo/vector-icons';

type MCIconName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface BillerBrand {
  /** Display type: 'icon' shows an icon glyph, 'text' shows a letter mark. */
  type: 'icon' | 'text';
  /** Icon name (when type === 'icon'). */
  icon?: MCIconName;
  /** Short mark (when type === 'text'). */
  mark?: string;
  /** Primary brand color for the badge background. */
  color: string;
  /** Text/icon color (defaults to white). */
  fgColor?: string;
}

const BILLER_BRANDS: Record<string, BillerBrand> = {
  // --- Electricity (lightning bolt icon) ---
  MERALCO: { type: 'icon', icon: 'flash', color: '#F57C00' },
  PALECO: { type: 'icon', icon: 'flash', color: '#2E7D32' },
  VECO: { type: 'icon', icon: 'flash', color: '#1565C0' },
  BENECO: { type: 'icon', icon: 'flash', color: '#00838F' },
  CEPALCO: { type: 'icon', icon: 'flash', color: '#AD1457' },

  // --- Water (water drop icon) ---
  Maynilad: { type: 'icon', icon: 'water', color: '#0277BD' },
  'Manila Water': { type: 'icon', icon: 'water', color: '#00695C' },
  'Local Water District': { type: 'icon', icon: 'water', color: '#0288D1' },
  'Prime Water': { type: 'icon', icon: 'water', color: '#1976D2' },

  // --- Internet (keep text marks — brand names matter) ---
  'PLDT Home': { type: 'text', mark: 'PLDT', color: '#D32F2F' },
  Globe: { type: 'text', mark: 'GLB', color: '#6A1B9A' },
  Converge: { type: 'text', mark: 'CVG', color: '#E65100' },
  Sky: { type: 'text', mark: 'SKY', color: '#0D47A1' },
  DITO: { type: 'text', mark: 'DITO', color: '#1B5E20' },

  // --- Mobile (keep text marks) ---
  Smart: { type: 'text', mark: 'SMT', color: '#4CAF50' },
  TM: { type: 'text', mark: 'TM', color: '#FF6F00' },
  TNT: { type: 'text', mark: 'TNT', color: '#F9A825' },

  // --- Streaming (keep text marks — brand identity matters) ---
  Netflix: { type: 'text', mark: 'N', color: '#E50914' },
  Spotify: { type: 'text', mark: 'S', color: '#1DB954' },
  'YouTube Premium': { type: 'text', mark: 'YT', color: '#FF0000' },
  'Disney+': { type: 'text', mark: 'D+', color: '#113CCF' },
  'HBO Max': { type: 'text', mark: 'HBO', color: '#5822B4' },

  // --- Credit Card (keep text marks) ---
  BPI: { type: 'text', mark: 'BPI', color: '#9C1D1D' },
  BDO: { type: 'text', mark: 'BDO', color: '#003B71' },
  Metrobank: { type: 'text', mark: 'MB', color: '#003399' },
  UnionBank: { type: 'text', mark: 'UB', color: '#F57C00' },
  RCBC: { type: 'text', mark: 'RC', color: '#1A237E' },
  Citi: { type: 'text', mark: 'CITI', color: '#003B70' },

  // --- Loans (keep text marks) ---
  'Home Credit': { type: 'text', mark: 'HC', color: '#E53935' },
  'Pag-IBIG Loan': { type: 'text', mark: 'PAG', color: '#1565C0' },
  'SSS Loan': { type: 'text', mark: 'SSS', color: '#0D47A1' },
  'GCash GLoan': { type: 'text', mark: 'GC', color: '#007BFF' },

  // --- Insurance (shield icon) ---
  PhilHealth: { type: 'icon', icon: 'shield-check', color: '#388E3C' },
  'Pru Life UK': { type: 'icon', icon: 'shield-check', color: '#D32F2F' },
  'Sun Life': { type: 'icon', icon: 'shield-check', color: '#FBC02D' },
  AXA: { type: 'icon', icon: 'shield-check', color: '#003B8E' },
  Manulife: { type: 'icon', icon: 'shield-check', color: '#00695C' },

  // --- Government (keep text marks) ---
  SSS: { type: 'text', mark: 'SSS', color: '#0D47A1' },
  'Pag-IBIG': { type: 'text', mark: 'PAG', color: '#1565C0' },
  BIR: { type: 'text', mark: 'BIR', color: '#B71C1C' },

  // --- Rent (house icon) ---
  Apartment: { type: 'icon', icon: 'home-city', color: '#F97316' },
  Condo: { type: 'icon', icon: 'office-building', color: '#D97706' },
  'Boarding House': { type: 'icon', icon: 'home', color: '#EA580C' },

  // --- Education (school icon) ---
  Tuition: { type: 'icon', icon: 'school', color: '#DB2777' },
  'School Fees': { type: 'icon', icon: 'school', color: '#BE185D' },
  Tutorial: { type: 'icon', icon: 'book-open-variant', color: '#9D174D' },
};

/**
 * Look up brand info for a biller name.
 * Falls back based on common keywords → generic icon, or letter mark.
 */
export function getBillerBrand(name: string): BillerBrand {
  // Exact match
  const exact = BILLER_BRANDS[name];
  if (exact) return exact;

  // Keyword-based fallback (case-insensitive)
  const lower = name.toLowerCase();
  if (lower.includes('electric') || lower.includes('power'))
    return { type: 'icon', icon: 'flash', color: '#F59E0B' };
  if (lower.includes('water'))
    return { type: 'icon', icon: 'water', color: '#0EA5E9' };
  if (lower.includes('internet') || lower.includes('wifi') || lower.includes('fiber'))
    return { type: 'icon', icon: 'wifi', color: '#8B5CF6' };
  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('load'))
    return { type: 'icon', icon: 'cellphone', color: '#14B8A6' };
  if (lower.includes('rent') || lower.includes('house') || lower.includes('apartment') || lower.includes('condo'))
    return { type: 'icon', icon: 'home', color: '#F97316' };
  if (lower.includes('loan') || lower.includes('credit'))
    return { type: 'icon', icon: 'hand-coin', color: '#10B981' };
  if (lower.includes('insurance'))
    return { type: 'icon', icon: 'shield-check', color: '#06B6D4' };
  if (lower.includes('school') || lower.includes('tuition') || lower.includes('education'))
    return { type: 'icon', icon: 'school', color: '#DB2777' };
  if (lower.includes('gas') || lower.includes('fuel'))
    return { type: 'icon', icon: 'gas-station', color: '#EF4444' };
  if (lower.includes('grocery') || lower.includes('food'))
    return { type: 'icon', icon: 'cart', color: '#84CC16' };

  // Final fallback: text mark from first 3 characters
  const mark = name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || '?';
  return { type: 'text', mark, color: '#546E7A' };
}
