import '@/global.css';

import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/**
 * XIV AI Design System V2
 *
 * Philosophy:
 * - Intelligence over decoration
 * - Deep-space executive aesthetic
 * - High contrast and legibility
 * - Restrained glass
 * - Electric blue reserved for intelligence/action
 * - Security/status colors carry semantic meaning
 */

export const Palette = {
  // Core space
  void: '#020812',
  black: '#00040A',
  navy: '#04101F',
  navyDeep: '#020A14',
  navyMid: '#071A2D',
  navyBand: '#0A2742',
  navyElevated: '#0B2138',
  navyCard: '#08192B',
  navySoft: '#102A45',

  // Surfaces
  surface: 'rgba(8, 25, 43, 0.82)',
  surfaceSoft: 'rgba(10, 32, 54, 0.68)',
  surfaceRaised: 'rgba(12, 38, 64, 0.88)',
  glass: 'rgba(7, 27, 47, 0.72)',
  glassRaised: 'rgba(10, 38, 65, 0.82)',

  // Borders
  line: 'rgba(190, 220, 244, 0.10)',
  lineSoft: 'rgba(190, 220, 244, 0.06)',
  lineStrong: 'rgba(74, 177, 255, 0.30)',

  // XIV Intelligence
  accent: '#3DA9FF',
  accentBright: '#6EC5FF',
  accentDeep: '#1479D2',
  accentMuted: 'rgba(61, 169, 255, 0.14)',
  accentSoft: 'rgba(61, 169, 255, 0.08)',
  intelligence: '#5A8CFF',
  intelligenceSoft: 'rgba(90, 140, 255, 0.16)',
  glow: 'rgba(61, 169, 255, 0.42)',

  // Typography
  text: '#F7FBFF',
  textMuted: '#B7C9D8',
  textDim: '#71889B',
  textFaint: '#506577',
  white: '#FFFFFF',

  // Semantic states
  success: '#2CE6B7',
  successSoft: 'rgba(44, 230, 183, 0.12)',
  warning: '#F4C95D',
  warningSoft: 'rgba(244, 201, 93, 0.12)',
  danger: '#FF667A',
  dangerSoft: 'rgba(255, 102, 122, 0.12)',
  critical: '#FF667A',

  // Layers
  overlay: 'rgba(1, 7, 14, 0.82)',
  overlayStrong: 'rgba(1, 7, 14, 0.92)',
} as const;

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.navy,
    backgroundElement: Palette.navyCard,
    backgroundSelected: Palette.navySoft,
    textSecondary: Palette.textMuted,
  },
  dark: {
    text: Palette.text,
    background: Palette.navy,
    backgroundElement: Palette.navyCard,
    backgroundSelected: Palette.navySoft,
    textSecondary: Palette.textMuted,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
  eight: 80,
} as const;

export const Radius = {
  xs: 10,
  sm: 14,
  md: 18,
  lg: 22,
  xl: 28,
  xxl: 34,
  pill: 999,
} as const;

export const IconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  hero: 40,
} as const;

export const Layout = {
  maxContentWidth: 600,
  screenGutter: Spacing.four,
  cardGap: Spacing.three,
  minTapTarget: 44,
  headerHeight: 58,
} as const;

export const Borders = {
  hairline: 1,
  strong: 1.5,
  color: Palette.line,
  colorStrong: Palette.lineStrong,
  colorAccent: Palette.accent,
} as const;

export const Elevation = {
  none: 0,
  card: 4,
  raised: 8,
  overlay: 16,
} as const;

const iosShadow = (
  color: string,
  opacity: number,
  radius: number,
  dy: number
): ViewStyle => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: dy },
  shadowOpacity: opacity,
  shadowRadius: radius,
});

export const Shadows = {
  card: Platform.select<ViewStyle>({
    ios: iosShadow('#000000', 0.26, 22, 10),
    android: { elevation: Elevation.card },
    default: {},
  }),

  raised: Platform.select<ViewStyle>({
    ios: iosShadow('#000000', 0.34, 28, 12),
    android: { elevation: Elevation.raised },
    default: {},
  }),

  glow: Platform.select<ViewStyle>({
    ios: iosShadow(Palette.accent, 0.32, 20, 0),
    android: { elevation: Elevation.raised },
    default: {},
  }),

  intelligence: Platform.select<ViewStyle>({
    ios: iosShadow(Palette.intelligence, 0.28, 24, 0),
    android: { elevation: Elevation.raised },
    default: {},
  }),
} as const;

const hairline =
  Platform.select({
    ios: 0.5,
    android: 1,
    default: 1,
  }) ?? 1;

export const Glass: ViewStyle = {
  backgroundColor: Palette.glass,
  borderRadius: Radius.lg,
  borderWidth: hairline,
  borderColor: Palette.line,
  overflow: 'hidden',
};

export const TypeScale: Record<string, TextStyle> = {
  hero: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: -1.2,
  },

  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.8,
  },

  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.35,
  },

  subtitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '600',
  },

  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },

  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.45,
    textTransform: 'uppercase',
  },

  mono: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.mono,
    fontWeight: '500',
  },
};

export const BottomTabInset = 84;
export const MaxContentWidth = Layout.maxContentWidth;

export const StatusTone = {
  ready: Palette.success,
  thinking: Palette.intelligence,
  analyzing: Palette.intelligence,
  waiting: Palette.warning,
  completed: Palette.success,
  offline: Palette.textDim,
  success: Palette.success,
  warning: Palette.warning,
  critical: Palette.critical,
} as const;
