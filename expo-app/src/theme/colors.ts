// Design tokens for the app. Builds on the original Flutter palette
// (light blue identity) but adds a fuller, more modern set for a polished UI.
export const colors = {
  // --- App identity (kept from the original Flutter app) ---
  bg: '#EAF4FB',
  primaryBlue: '#5B82AB',
  gradientStart: '#5B82AB',
  gradientEnd: '#7FA8CC',
  headerGradientStart: '#4E7AA6',
  headerGradientEnd: '#6FA0C8',

  // --- Surfaces ---
  white: '#FFFFFF',
  black: '#0F172A',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F6FB',
  border: '#E2E8F0',

  // --- Brand ---
  primary: '#4E7AA6',
  primaryDark: '#3C6189',

  // --- Text ---
  text: '#1F2A37',
  textMuted: '#64748B',
  textFaint: '#94A3B8',

  // --- Status ---
  success: '#16A34A',
  successSurface: '#E7F6EC',
  warning: '#D97706',
  warningSurface: '#FEF3E2',
  danger: '#DC2626',
  dangerSurface: '#FCEBEB',
  info: '#2563EB',
  infoSurface: '#E8F0FE',

  // --- Legacy keys kept for compatibility ---
  red: '#DC2626',
  redSurface: '#FCEBEB',
  green: '#16A34A',
  greenTrack: '#A5D6A7',
  grey: '#94A3B8',
  greyLight: '#EEF2F6',
  greyBorder: '#E2E8F0',
  greySubtitle: '#64748B',
  hint: '#A8B4C2',

  shadow: '#0F172A',
} as const;

// Peso currency symbol (matches \u20B1 used in the original Flutter UI).
export const CURRENCY_SYMBOL = '\u20B1';
