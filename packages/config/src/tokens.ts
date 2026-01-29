import { createTokens } from '@tamagui/core'

export const tokens = createTokens({
  color: {
    // Brand colors (matching TailwindCSS)
    primary: '#f97316', // orange-500 (food theme)
    primaryLight: '#fb923c', // orange-400
    primaryDark: '#ea580c', // orange-600
    primaryDarker: '#c2410c', // orange-700

    secondary: '#10b981', // emerald-500
    secondaryLight: '#34d399', // emerald-400
    secondaryDark: '#059669', // emerald-600

    // Background colors
    background: '#ffffff',
    backgroundHover: '#f9fafb', // gray-50
    backgroundPress: '#f3f4f6', // gray-100
    backgroundFocus: '#f3f4f6', // gray-100
    backgroundDark: '#1f2937', // gray-800
    backgroundDarkHover: '#374151', // gray-700

    // Surface colors (for cards, etc.)
    surface: '#ffffff',
    surfaceHover: '#f9fafb',
    surfacePress: '#f3f4f6',
    surfaceDark: '#111827', // gray-900

    // Text colors
    text: '#111827', // gray-900
    textSecondary: '#4b5563', // gray-600
    textMuted: '#6b7280', // gray-500
    textDisabled: '#9ca3af', // gray-400
    textInverse: '#ffffff',

    // Border colors
    border: '#e5e7eb', // gray-200
    borderHover: '#d1d5db', // gray-300
    borderFocus: '#f97316', // primary

    // Status colors
    success: '#22c55e', // green-500
    successLight: '#86efac', // green-300
    successDark: '#16a34a', // green-600

    warning: '#f59e0b', // amber-500
    warningLight: '#fcd34d', // amber-300
    warningDark: '#d97706', // amber-600

    error: '#ef4444', // red-500
    errorLight: '#fca5a5', // red-300
    errorDark: '#dc2626', // red-600

    info: '#3b82f6', // blue-500
    infoLight: '#93c5fd', // blue-300
    infoDark: '#2563eb', // blue-600

    // Rating color (star)
    rating: '#fbbf24', // amber-400

    // Transparent
    transparent: 'transparent',
  },
  space: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    true: 16, // default
  },
  size: {
    0: 0,
    0.25: 2,
    0.5: 4,
    0.75: 8,
    1: 20,
    1.5: 24,
    2: 28,
    3: 32,
    4: 36,
    5: 40,
    6: 44,
    7: 48,
    8: 52,
    9: 56,
    10: 60,
    11: 64,
    12: 68,
    true: 44, // default (touch target)
  },
  radius: {
    0: 0,
    1: 2,
    2: 4,
    3: 6,
    4: 8,
    5: 10,
    6: 12,
    7: 14,
    8: 16,
    9: 18,
    10: 20,
    11: 22,
    12: 24,
    full: 9999,
    true: 8, // default
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
  },
})

export type Tokens = typeof tokens
