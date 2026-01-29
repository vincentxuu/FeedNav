import { styled, GetProps } from 'tamagui'

export const Button = styled('button', {
  name: 'Button',
  tag: 'button',
  role: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: '$2',
  borderRadius: '$4',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: 14,
  lineHeight: 1,
  borderWidth: 0,

  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary',
        color: 'white',
        hoverStyle: {
          backgroundColor: '$primaryDark',
        },
        pressStyle: {
          backgroundColor: '$primaryDark',
          opacity: 0.9,
        },
      },
      secondary: {
        backgroundColor: '$secondary',
        color: 'white',
        hoverStyle: {
          backgroundColor: '$secondaryDark',
        },
        pressStyle: {
          backgroundColor: '$secondaryDark',
          opacity: 0.9,
        },
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor',
        color: '$color',
        hoverStyle: {
          backgroundColor: '$backgroundHover',
          borderColor: '$borderColorHover',
        },
        pressStyle: {
          backgroundColor: '$backgroundPress',
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '$color',
        hoverStyle: {
          backgroundColor: '$backgroundHover',
        },
        pressStyle: {
          backgroundColor: '$backgroundPress',
        },
      },
      destructive: {
        backgroundColor: '$error',
        color: 'white',
        hoverStyle: {
          backgroundColor: '$errorDark',
        },
        pressStyle: {
          backgroundColor: '$errorDark',
          opacity: 0.9,
        },
      },
    },
    size: {
      sm: {
        paddingHorizontal: '$3',
        paddingVertical: '$2',
        fontSize: 12,
      },
      md: {
        paddingHorizontal: '$4',
        paddingVertical: '$2.5',
        fontSize: 14,
      },
      lg: {
        paddingHorizontal: '$5',
        paddingVertical: '$3',
        fontSize: 16,
      },
    },
    fullWidth: {
      true: {
        width: '100%',
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
        pointerEvents: 'none',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

export type ButtonProps = GetProps<typeof Button>
