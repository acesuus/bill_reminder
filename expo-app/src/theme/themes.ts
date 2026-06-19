// Light and dark theme definitions.

export interface AppTheme {
  mode: 'light' | 'dark';
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primaryDark: string;
  white: string;
  black: string;
  // Status
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  danger: string;
  dangerSurface: string;
  info: string;
  infoSurface: string;
  // Header gradient
  headerGradientStart: string;
  headerGradientEnd: string;
  // Misc
  shadow: string;
  hint: string;
}

export const lightTheme: AppTheme = {
  mode: 'light',
  bg: '#EAF4FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F6FB',
  border: '#E2E8F0',
  text: '#1F2A37',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  primary: '#4E7AA6',
  primaryDark: '#3C6189',
  white: '#FFFFFF',
  black: '#0F172A',
  success: '#16A34A',
  successSurface: '#E7F6EC',
  warning: '#D97706',
  warningSurface: '#FEF3E2',
  danger: '#DC2626',
  dangerSurface: '#FCEBEB',
  info: '#2563EB',
  infoSurface: '#E8F0FE',
  headerGradientStart: '#4E7AA6',
  headerGradientEnd: '#6FA0C8',
  shadow: '#0F172A',
  hint: '#A8B4C2',
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  bg: '#0F1A2E',
  surface: '#1A2744',
  surfaceAlt: '#1E2D4A',
  border: '#2D3F5E',
  text: '#E8EDF5',
  textMuted: '#94A3B8',
  textFaint: '#64748B',
  primary: '#6FA0C8',
  primaryDark: '#5B8AB5',
  white: '#FFFFFF',
  black: '#0F172A',
  success: '#4ADE80',
  successSurface: '#0F2A1A',
  warning: '#FBBF24',
  warningSurface: '#2A2010',
  danger: '#F87171',
  dangerSurface: '#2A1010',
  info: '#60A5FA',
  infoSurface: '#10182A',
  headerGradientStart: '#1A3556',
  headerGradientEnd: '#2A4D72',
  shadow: '#000000',
  hint: '#4A5E78',
};
