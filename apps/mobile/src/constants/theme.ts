import '@/global.css';

import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const Palette = {
  void: '#011827',
  navy: '#021D30',
  navyDeep: '#011827',
  navyMid: '#043451',
  navyBand: '#075077',
  navyElevated: '#075077',
  navyCard: '#043451',
  navySoft: '#043451',
  line: 'rgba(212, 228, 240, 0.10)',
  lineStrong: 'rgba(42, 185, 243, 0.28)',
  accent: '#2AB9F3',
  accentDeep: '#148FC4',
  accentMuted: 'rgba(42, 185, 243, 0.16)',
  glow: 'rgba(42, 185, 243, 0.38)',
  intelligence: '#4285FF',
  text: '#FFFFFF',
  textMuted: '#D4E4F0',
  textDim: '#89A8BC',
  white: '#FFFFFF',
  success: '#25E5BC',
  warning: '#F1C54B',
  danger: '#FF6276',
  critical: '#FF6276',
  overlay: 'rgba(1, 24, 39, 0.78)',
  glass: 'rgba(5, 49, 77, 0.56)',
  glassRaised: 'rgba(7, 59, 91, 0.68)',
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
} as const;

export const Radius = {
  sm: 14,
  md: 18,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const IconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const Layout = {
  maxContentWidth: 560,
  screenGutter: Spacing.four,
  cardGap: Spacing.three,
  minTapTarget: 44,
  headerHeight: 56,
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

const iosShadow = (color: string, opacity: number, radius: number, dy: number): ViewStyle => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: dy },
  shadowOpacity: opacity,
  shadowRadius: radius,
});

export const Shadows = {
  card: Platform.select<ViewStyle>({
    ios: iosShadow('#000000', 0.22, 18, 8),
    android: { elevation: Elevation.card },
    default: {},
  }),
  raised: Platform.select<ViewStyle>({
    ios: iosShadow('#000000', 0.28, 22, 10),
    android: { elevation: Elevation.raised },
    default: {},
  }),
  glow: Platform.select<ViewStyle>({
    ios: iosShadow(Palette.accent, 0.36, 16, 0),
    android: { elevation: Elevation.raised },
    default: {},
  }),
} as const;

const hairline = Platform.select({ ios: 0.5, android: 1, default: 1 }) ?? 1;

export const Glass: ViewStyle = {
  backgroundColor: Palette.glass,
  borderRadius: Radius.lg,
  borderWidth: hairline,
  borderColor: Palette.line,
  overflow: 'hidden',
};

export const TypeScale: Record<string, TextStyle> = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '600', letterSpacing: -0.6 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.3 },
  subtitle: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  mono: { fontSize: 12, lineHeight: 16, fontFamily: Fonts.mono, fontWeight: '500' },
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
