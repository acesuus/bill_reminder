// Color palette ported 1:1 from the original Flutter app so the look stays identical.
export const colors = {
  bg: '#E5F6FD',
  primaryBlue: '#6C8CB0',
  gradientStart: '#7A9BBF',
  gradientEnd: '#B1C6D9',
  headerGradientStart: '#91B8D1',
  headerGradientEnd: '#B3D0E3', // Color.fromARGB(255, 179, 208, 227)
  white: '#FFFFFF',
  black: '#000000',
  red: '#F44336',
  redSurface: '#FFEBEE', // Colors.red.shade50
  green: '#4CAF50',
  greenTrack: '#A5D6A7',
  grey: '#9E9E9E',
  greyLight: '#EEEEEE',
  greyBorder: '#BDBDBD',
  greySubtitle: '#757575',
  hint: '#BDBDBD',
} as const;

// Peso currency symbol (matches \u20B1 used in the Flutter UI).
export const CURRENCY_SYMBOL = '\u20B1';
