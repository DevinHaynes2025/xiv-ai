import { TextInput, StyleSheet, type TextInputProps, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

import { XivText } from './text';

type Props = TextInputProps & {
  label: string;
};

export function Field({ label, style, ...rest }: Props) {
  return (
    <View style={styles.field}>
      <XivText variant="caption" muted>
        {label}
      </XivText>
      <TextInput
        placeholderTextColor={Palette.textDim}
        {...rest}
        style={[styles.input, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  input: {
    minHeight: 54,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineStrong,
    backgroundColor: Palette.glass,
    color: Palette.text,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
});
