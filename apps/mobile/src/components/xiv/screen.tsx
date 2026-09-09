import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomTabInset,
  Layout,
  Palette,
  Radius,
  Spacing,
} from '@/constants/theme';

import {
  CinematicBackdrop,
  type Atmosphere,
} from './cinematic-backdrop';

type Props = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  onBack?: () => void;
  tabbed?: boolean;
  scroll?: boolean;
  distribute?: boolean;
  atmosphere?: Atmosphere;
};

export function Screen({
  children,
  footer,
  onBack,
  tabbed,
  scroll = true,
  distribute = false,
  atmosphere = 'restrained',
}: Props) {
  const insets = useSafeAreaInsets();

  const bottomPad = tabbed
    ? insets.bottom + BottomTabInset
    : Math.max(insets.bottom, Spacing.three);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <CinematicBackdrop atmosphere={atmosphere} />

      <View
        style={[
          styles.inner,
          {
            paddingTop: Math.max(insets.top, Spacing.three),
          },
        ]}
      >
        {onBack ? (
          <View style={styles.backRow}>
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              style={({ pressed }) => [
                styles.back,
                pressed && styles.backPressed,
              ]}
            >
              <View style={styles.backMark} />
            </Pressable>
          </View>
        ) : null}

        {scroll ? (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              distribute && styles.distribute,
              {
                paddingBottom: footer
                  ? Spacing.four
                  : bottomPad,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.content,
              styles.fill,
              {
                paddingBottom: footer
                  ? Spacing.two
                  : bottomPad,
              },
            ]}
          >
            {children}
          </View>
        )}

        {footer ? (
          <View
            style={[
              styles.footerShell,
              {
                paddingBottom: Math.max(
                  insets.bottom,
                  Spacing.three
                ),
              },
            ]}
          >
            <View style={styles.footer}>{footer}</View>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

export const XivScreen = Screen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.void,
  },

  inner: {
    flex: 1,
  },

  content: {
    paddingHorizontal: Layout.screenGutter,
    gap: Spacing.three,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },

  distribute: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  fill: {
    flex: 1,
  },

  backRow: {
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Layout.screenGutter,
    marginBottom: Spacing.one,
  },

  back: {
    width: Layout.minTapTarget,
    height: Layout.minTapTarget,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
  },

  backPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },

  backMark: {
    width: 11,
    height: 11,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Palette.text,
    transform: [
      { rotate: '45deg' },
      { translateX: 2 },
    ],
  },

  footerShell: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.lineSoft,
    backgroundColor: 'rgba(2, 8, 18, 0.86)',
    paddingTop: Spacing.three,
  },

  footer: {
    paddingHorizontal: Layout.screenGutter,
    gap: Spacing.two,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
});
