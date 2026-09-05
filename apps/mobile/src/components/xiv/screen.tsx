import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, Layout, Palette, Spacing } from '@/constants/theme';

import { CinematicBackdrop, type Atmosphere } from './cinematic-backdrop';

type Props = {
  children: React.ReactNode;
  footer?: React.ReactNode;
  onBack?: () => void;
  tabbed?: boolean;
  scroll?: boolean;
  atmosphere?: Atmosphere;
};

export function Screen({
  children,
  footer,
  onBack,
  tabbed,
  scroll = true,
  atmosphere = 'restrained',
}: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = tabbed ? insets.bottom + BottomTabInset : Math.max(insets.bottom, Spacing.three);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CinematicBackdrop atmosphere={atmosphere} />
      <View style={[styles.inner, { paddingTop: Math.max(insets.top, Spacing.three) }]}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.back}>
            <View style={styles.backMark} />
          </Pressable>
        ) : null}
        {scroll ? (
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.fill, { paddingBottom: footer ? Spacing.two : bottomPad }]}>
            {children}
          </View>
        )}
        {footer ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}>
            {footer}
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
    backgroundColor: Palette.navy,
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
  fill: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: Layout.screenGutter,
    paddingTop: Spacing.two,
    gap: Spacing.two,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  back: {
    width: Layout.minTapTarget,
    height: Layout.minTapTarget,
    marginLeft: Spacing.three,
    marginBottom: Spacing.one,
    justifyContent: 'center',
  },
  backMark: {
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Palette.text,
    transform: [{ rotate: '45deg' }],
    marginLeft: Spacing.two,
  },
});
