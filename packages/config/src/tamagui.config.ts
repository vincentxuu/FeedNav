import { createTamagui } from '@tamagui/core'
import { shorthands } from '@tamagui/shorthands'
import { createInterFont } from '@tamagui/font-inter'

import { tokens } from './tokens'
import { themes } from './themes'

const interFont = createInterFont()

const fonts = {
  heading: interFont,
  body: interFont,
}

export const config = createTamagui({
  defaultFont: 'body',
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts,
  tokens,
  themes,
  media: {
    xs: { maxWidth: 480 },
    sm: { maxWidth: 640 },
    md: { maxWidth: 768 },
    lg: { maxWidth: 1024 },
    xl: { maxWidth: 1280 },
    xxl: { maxWidth: 1536 },
    gtXs: { minWidth: 481 },
    gtSm: { minWidth: 641 },
    gtMd: { minWidth: 769 },
    gtLg: { minWidth: 1025 },
    gtXl: { minWidth: 1281 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  },
})

export type TamaguiConfig = typeof config

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends TamaguiConfig {}
}
