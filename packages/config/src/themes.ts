import { tokens } from './tokens'

const lightTheme = {
  background: tokens.color.background,
  backgroundHover: tokens.color.backgroundHover,
  backgroundPress: tokens.color.backgroundPress,
  backgroundFocus: tokens.color.backgroundFocus,

  color: tokens.color.text,
  colorHover: tokens.color.text,
  colorPress: tokens.color.textSecondary,
  colorFocus: tokens.color.text,

  borderColor: tokens.color.border,
  borderColorHover: tokens.color.borderHover,
  borderColorFocus: tokens.color.borderFocus,
  borderColorPress: tokens.color.border,

  placeholderColor: tokens.color.textMuted,

  // Semantic colors
  primary: tokens.color.primary,
  primaryLight: tokens.color.primaryLight,
  primaryDark: tokens.color.primaryDark,

  secondary: tokens.color.secondary,
  secondaryLight: tokens.color.secondaryLight,
  secondaryDark: tokens.color.secondaryDark,

  success: tokens.color.success,
  warning: tokens.color.warning,
  error: tokens.color.error,
  info: tokens.color.info,

  textMuted: tokens.color.textMuted,
  textSecondary: tokens.color.textSecondary,
  textDisabled: tokens.color.textDisabled,

  surface: tokens.color.surface,
  surfaceHover: tokens.color.surfaceHover,
  surfacePress: tokens.color.surfacePress,

  rating: tokens.color.rating,
}

const darkTheme: typeof lightTheme = {
  background: tokens.color.backgroundDark,
  backgroundHover: tokens.color.backgroundDarkHover,
  backgroundPress: '#4b5563', // gray-600
  backgroundFocus: tokens.color.backgroundDarkHover,

  color: tokens.color.textInverse,
  colorHover: tokens.color.textInverse,
  colorPress: '#d1d5db', // gray-300
  colorFocus: tokens.color.textInverse,

  borderColor: '#374151', // gray-700
  borderColorHover: '#4b5563', // gray-600
  borderColorFocus: tokens.color.primaryLight,
  borderColorPress: '#374151',

  placeholderColor: '#9ca3af', // gray-400

  // Semantic colors (slightly adjusted for dark mode)
  primary: tokens.color.primaryLight,
  primaryLight: tokens.color.primary,
  primaryDark: tokens.color.primaryDarker,

  secondary: tokens.color.secondaryLight,
  secondaryLight: tokens.color.secondary,
  secondaryDark: tokens.color.secondaryDark,

  success: tokens.color.successLight,
  warning: tokens.color.warningLight,
  error: tokens.color.errorLight,
  info: tokens.color.infoLight,

  textMuted: '#9ca3af', // gray-400
  textSecondary: '#d1d5db', // gray-300
  textDisabled: '#6b7280', // gray-500

  surface: tokens.color.surfaceDark,
  surfaceHover: '#1f2937', // gray-800
  surfacePress: '#374151', // gray-700

  rating: tokens.color.rating,
}

export const themes = {
  light: lightTheme,
  dark: darkTheme,
}

export type Theme = typeof lightTheme
