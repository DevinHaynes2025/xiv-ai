import { Text, type TextProps } from 'react-native';

import { Palette, TypeScale } from '@/constants/theme';

type Variant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label' | 'mono';

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  muted?: boolean;
};

export function XivText({ variant = 'body', color, muted, style, ...rest }: Props) {
  return (
    <Text
      style={[
        TypeScale[variant],
        { color: color ?? (muted ? Palette.textMuted : Palette.text) },
        style,
      ]}
      {...rest}
    />
  );
}
