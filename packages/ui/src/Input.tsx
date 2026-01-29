import { styled, GetProps } from 'tamagui'

export const Input = styled('input', {
  name: 'Input',
  tag: 'input',
  backgroundColor: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$4',
  color: '$color',
  fontSize: 14,
  paddingHorizontal: '$3',
  paddingVertical: '$2.5',
  outlineWidth: 0,
  width: '100%',

  placeholderTextColor: '$placeholderColor',

  focusStyle: {
    borderColor: '$borderColorFocus',
    outlineWidth: 2,
    outlineColor: '$primaryLight',
    outlineStyle: 'solid',
  },

  hoverStyle: {
    borderColor: '$borderColorHover',
  },

  variants: {
    size: {
      sm: {
        paddingHorizontal: '$2.5',
        paddingVertical: '$2',
        fontSize: 12,
      },
      md: {
        paddingHorizontal: '$3',
        paddingVertical: '$2.5',
        fontSize: 14,
      },
      lg: {
        paddingHorizontal: '$4',
        paddingVertical: '$3',
        fontSize: 16,
      },
    },
    error: {
      true: {
        borderColor: '$error',
        focusStyle: {
          borderColor: '$error',
          outlineColor: '$errorLight',
        },
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
        pointerEvents: 'none',
        backgroundColor: '$backgroundPress',
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
})

export type InputProps = GetProps<typeof Input>
