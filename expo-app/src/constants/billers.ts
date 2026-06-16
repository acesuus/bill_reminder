// Brand colors and short marks for common Philippine billers.
// Used by the BillerLogo component to render app-style logo badges offline.

export interface BillerBrand {
  /** Short mark shown inside the badge (2-4 chars). */
  mark: string;
  /** Primary brand color for the badge background. */
  color: string;
  /** Text color (defaults to white if not provided). */
  textColor?: string;
}

const BILLER_BRANDS: Record<string, BillerBrand> = {
  // Electricity
  MERALCO: { mark: 'MER', color: '#F57C00' },
  PALECO: { mark: 'PAL', color: '#2E7D32' },
  VECO: { mark: 'VEC', color: '#1565C0' },
  BENECO: { mark: 'BEN', color: '#00838F' },
  CEPALCO: { mark: 'CEP', color: '#AD1457' },

  // Water
  Maynilad: { mark: 'MAY', color: '#0277BD' },
  'Manila Water': { mark: 'MW', color: '#00695C' },
  'Local Water District': { mark: 'LWD', color: '#0288D1' },
  'Prime Water': { mark: 'PW', color: '#1976D2' },

  // Internet
  'PLDT Home': { mark: 'PLDT', color: '#D32F2F' },
  Globe: { mark: 'GLB', color: '#6A1B9A' },
  Converge: { mark: 'CVG', color: '#E65100' },
  Sky: { mark: 'SKY', color: '#0D47A1' },
  DITO: { mark: 'DITO', color: '#1B5E20' },

  // Mobile
  Smart: { mark: 'SMT', color: '#4CAF50' },
  TM: { mark: 'TM', color: '#FF6F00' },
  TNT: { mark: 'TNT', color: '#F9A825' },

  // Streaming
  Netflix: { mark: 'N', color: '#E50914' },
  Spotify: { mark: 'S', color: '#1DB954' },
  'YouTube Premium': { mark: 'YT', color: '#FF0000' },
  'Disney+': { mark: 'D+', color: '#113CCF' },
  'HBO Max': { mark: 'HBO', color: '#5822B4' },

  // Credit Card
  BPI: { mark: 'BPI', color: '#9C1D1D' },
  BDO: { mark: 'BDO', color: '#003B71' },
  Metrobank: { mark: 'MB', color: '#003399' },
  UnionBank: { mark: 'UB', color: '#F57C00' },
  RCBC: { mark: 'RC', color: '#1A237E' },
  Citi: { mark: 'CITI', color: '#003B70' },

  // Loans
  'Home Credit': { mark: 'HC', color: '#E53935' },
  'Pag-IBIG Loan': { mark: 'PAG', color: '#1565C0' },
  'SSS Loan': { mark: 'SSS', color: '#0D47A1' },
  'GCash GLoan': { mark: 'GC', color: '#007BFF' },

  // Insurance
  PhilHealth: { mark: 'PH', color: '#388E3C' },
  'Pru Life UK': { mark: 'PRU', color: '#D32F2F' },
  'Sun Life': { mark: 'SUN', color: '#FBC02D' },
  AXA: { mark: 'AXA', color: '#003B8E' },
  Manulife: { mark: 'MAN', color: '#00695C' },

  // Government
  SSS: { mark: 'SSS', color: '#0D47A1' },
  'Pag-IBIG': { mark: 'PAG', color: '#1565C0' },
  BIR: { mark: 'BIR', color: '#B71C1C' },
};

/**
 * Look up brand info for a biller name.
 * Falls back to a generated badge from the first 2-3 characters.
 */
export function getBillerBrand(name: string): BillerBrand {
  const exact = BILLER_BRANDS[name];
  if (exact) return exact;

  // Fallback: use the first 3 uppercase chars and a neutral grey.
  const mark = name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || '?';
  return { mark, color: '#546E7A' };
}
