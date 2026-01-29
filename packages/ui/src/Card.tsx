import { styled, GetProps } from 'tamagui'

export const Card = styled('div', {
  name: 'Card',
  tag: 'div',
  backgroundColor: '$surface',
  borderRadius: '$4',
  borderWidth: 1,
  borderColor: '$borderColor',
  overflow: 'hidden',

  variants: {
    elevated: {
      true: {
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
    },
    pressable: {
      true: {
        cursor: 'pointer',
        hoverStyle: {
          backgroundColor: '$surfaceHover',
        },
        pressStyle: {
          backgroundColor: '$surfacePress',
          scale: 0.98,
        },
      },
    },
    padding: {
      none: {
        padding: 0,
      },
      sm: {
        padding: '$3',
      },
      md: {
        padding: '$4',
      },
      lg: {
        padding: '$6',
      },
    },
  } as const,

  defaultVariants: {
    padding: 'md',
  },
})

export const CardHeader = styled('div', {
  name: 'CardHeader',
  tag: 'div',
  flexDirection: 'column',
  gap: '$1.5',
  paddingBottom: '$3',
})

export const CardTitle = styled('h3', {
  name: 'CardTitle',
  tag: 'h3',
  fontSize: 18,
  fontWeight: '600',
  color: '$color',
  margin: 0,
})

export const CardDescription = styled('p', {
  name: 'CardDescription',
  tag: 'p',
  fontSize: 14,
  color: '$textMuted',
  margin: 0,
})

export const CardContent = styled('div', {
  name: 'CardContent',
  tag: 'div',
})

export const CardFooter = styled('div', {
  name: 'CardFooter',
  tag: 'div',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$3',
  paddingTop: '$3',
})

export type CardProps = GetProps<typeof Card>
