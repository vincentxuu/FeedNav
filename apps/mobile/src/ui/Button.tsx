import { styled, Stack, Text, GetProps } from 'tamagui'
import type { ReactNode } from 'react'

const ButtonFrame = styled(Stack, {
  name: 'Button',
  role: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: '$2',
  borderRadius: '$4',
  cursor: 'pointer',
  borderWidth: 0,

  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary',
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
        hoverStyle: {
          backgroundColor: '$backgroundHover',
        },
        pressStyle: {
          backgroundColor: '$backgroundPress',
        },
      },
      destructive: {
        backgroundColor: '$error',
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
      },
      md: {
        paddingHorizontal: '$4',
        paddingVertical: '$2.5',
      },
      lg: {
        paddingHorizontal: '$5',
        paddingVertical: '$3',
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

const ButtonText = styled(Text, {
  name: 'ButtonText',
  fontWeight: '600',

  variants: {
    variant: {
      primary: { color: 'white' },
      secondary: { color: 'white' },
      outline: { color: '$color' },
      ghost: { color: '$color' },
      destructive: { color: 'white' },
    },
    size: {
      sm: { fontSize: 12 },
      md: { fontSize: 14 },
      lg: { fontSize: 16 },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

export interface ButtonProps extends GetProps<typeof ButtonFrame> {
  children?: ReactNode
}

export function Button({ children, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonFrame variant={variant} size={size} {...props}>
      {typeof children === 'string' ? (
        <ButtonText variant={variant} size={size}>{children}</ButtonText>
      ) : (
        children
      )}
    </ButtonFrame>
  )
}
