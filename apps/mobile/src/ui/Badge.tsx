import { styled, Text, GetProps } from 'tamagui'

export const Badge = styled(Text, {
  name: 'Badge',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 9999,
  fontSize: 12,
  fontWeight: '500',
  lineHeight: 1,

  variants: {
    variant: {
      default: {
        backgroundColor: '$backgroundPress',
        color: '$color',
      },
      primary: {
        backgroundColor: '$primary',
        color: 'white',
      },
      secondary: {
        backgroundColor: '$secondary',
        color: 'white',
      },
      success: {
        backgroundColor: '$success',
        color: 'white',
      },
      warning: {
        backgroundColor: '$warning',
        color: 'white',
      },
      error: {
        backgroundColor: '$error',
        color: 'white',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor',
        color: '$color',
      },
    },
    size: {
      sm: {
        paddingHorizontal: '$2',
        paddingVertical: '$1',
        fontSize: 10,
      },
      md: {
        paddingHorizontal: '$2.5',
        paddingVertical: '$1.5',
        fontSize: 12,
      },
      lg: {
        paddingHorizontal: '$3',
        paddingVertical: '$2',
        fontSize: 14,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
})

export type BadgeProps = GetProps<typeof Badge>
