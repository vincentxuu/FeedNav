import { styled, Stack, Text, GetProps } from 'tamagui'

export const Card = styled(Stack, {
  name: 'Card',
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

export const CardHeader = styled(Stack, {
  name: 'CardHeader',
  flexDirection: 'column',
  gap: '$1.5',
  paddingBottom: '$3',
})

export const CardTitle = styled(Text, {
  name: 'CardTitle',
  fontSize: 18,
  fontWeight: '600',
  color: '$color',
})

export const CardDescription = styled(Text, {
  name: 'CardDescription',
  fontSize: 14,
  color: '$textMuted',
})

export const CardContent = styled(Stack, {
  name: 'CardContent',
})

export const CardFooter = styled(Stack, {
  name: 'CardFooter',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$3',
  paddingTop: '$3',
})

export type CardProps = GetProps<typeof Card>
