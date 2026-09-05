import {
  StyleSheet,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import {
  Palette,
  Radius,
  Shadows,
  Spacing,
} from '@/constants/theme';

import { PressScale } from './press-scale';
import { XivText } from './text';

type Props = PressableProps & {
  label: string;
  variant?:
    | 'primary'
    | 'ghost'
    | 'subtle'
    | 'danger'
    | 'secondary'
    | 'success';
  style?: ViewStyle;
};

export function Button({
  label,
  variant = 'primary',
  style,
  disabled,
  ...rest
}: Props) {
  const ghost = variant === 'ghost';
  const danger = variant === 'danger';
  const success = variant === 'success';

  const secondary =
    variant === 'secondary' ||
    variant === 'subtle';

  const labelColor = ghost
    ? Palette.accentBright
    : danger
      ? Palette.danger
      : success || variant === 'primary'
        ? Palette.white
        : Palette.text;

  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        ghost && styles.ghost,
        secondary && styles.secondary,
        danger && styles.danger,
        success && styles.success,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <XivText
        variant="subtitle"
        color={labelColor}
        style={styles.label}
      >
        {label}
      </XivText>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },

  label: {
    fontWeight: '700',
  },

  primary: {
    backgroundColor: Palette.accentDeep,
    experimental_backgroundImage:
      `linear-gradient(135deg, ${Palette.accentBright}, ${Palette.accent}, ${Palette.accentDeep})`,
    ...Shadows.glow,
  },

  ghost: {
    backgroundColor: 'transparent',
  },

  secondary: {
    backgroundColor: Palette.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineStrong,
  },

  danger: {
    backgroundColor: Palette.dangerSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 102, 122, 0.38)',
  },

  success: {
    backgroundColor: Palette.success,
  },

  disabled: {
    opacity: 0.42,
  },
});
