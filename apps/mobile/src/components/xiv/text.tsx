import { Text, type TextProps } from 'react-native';

import { Palette, TypeScale } from '@/constants/theme';

type Variant =
  | 'hero'
  | 'display'
  | 'title'
  | 'pageTitle'
  | 'section'
  | 'card'
  | 'subtitle'
  | 'body'
  | 'caption'
  | 'metadata'
  | 'micro'
  | 'label'
  | 'mono';

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  muted?: boolean;
  dim?: boolean;
};

export function XivText({
  variant = 'body',
  color,
  muted,
  dim,
  style,
  ...rest
}: Props) {
  const resolvedColor =
    color ??
    (dim
      ? Palette.textDim
      : muted
        ? Palette.textMuted
        : Palette.text);

  return (
    <Text
      style={[
        TypeScale[variant],
        { color: resolvedColor },
        style,
      ]}
      {...rest}
    />
  );
}
