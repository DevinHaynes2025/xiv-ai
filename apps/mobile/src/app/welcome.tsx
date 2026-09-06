import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { BrandMark } from '@/components/xiv/brand-mark';
import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Icon } from '@/components/xiv/icon';
import { Screen } from '@/components/xiv/screen';
import { XivText } from '@/components/xiv/text';
import { TrustStrip } from '@/components/xiv/trust-strip';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useCompactLayout } from '@/hooks/use-compact-layout';

const THEMES = [
  {
    key: 'business',
    label: 'Business',
    detail: 'Diagnose operations, understand performance, and coordinate intelligent action.',
    ios: 'building.2.fill',
    android: 'apartment',
  },
  {
    key: 'people',
    label: 'People',
    detail: 'Learn, contribute ideas, communicate, and participate in the network.',
    ios: 'person.2.fill',
    android: 'groups',
  },
  {
    key: 'ai',
    label: 'AI',
    detail: 'Work with specialized agents that understand your role and context.',
    ios: 'sparkles',
    android: 'auto_awesome',
  },
] as const;

export default function Welcome() {
  const router = useRouter();
  const { compact, short, narrow } = useCompactLayout();

  return (
    <Screen
      atmosphere="cinematic"
      distribute={!short}
      footer={
        <>
          <Button
            label="Create Account"
            onPress={() => router.push({ pathname: '/auth', params: { mode: 'create' } })}
          />
          <Button
            label="Sign In"
            variant="subtle"
            onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin' } })}
          />
        </>
      }>
      <Animated.View entering={FadeIn.duration(480)} style={[styles.brand, compact && styles.brandCompact]}>
        <View accessible accessibilityRole="image" accessibilityLabel="XIV AI">
          <BrandMark size={compact ? 44 : 52} />
        </View>
        <XivText variant="label" color={Palette.accent}>
          XIV AI
        </XivText>
        <XivText variant="label" color={Palette.textDim} style={styles.network}>
          The Business Intelligence Network
        </XivText>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(540).delay(80)} style={[styles.hero, compact && styles.heroCompact]}>
        <XivText
          variant="display"
          maxFontSizeMultiplier={1.15}
          style={[
            styles.heroTitle,
            { fontSize: narrow ? 26 : compact ? 28 : 32, lineHeight: narrow ? 32 : compact ? 34 : 38 },
          ]}>
          One World. One Platform. Infinite Opportunities.
        </XivText>
        <XivText variant="body" muted style={styles.centerText}>
          The intelligent operating ecosystem for business and people.
        </XivText>
        <XivText variant="caption" dim style={styles.centerText}>
          Connect your work, intelligence, people, and opportunities inside one secure network.
        </XivText>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(520).delay(160)}>
        <Card variant="elevated" style={[styles.themes, compact && styles.themesCompact]}>
          {THEMES.map((theme, index) => (
            <View key={theme.key}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <View style={[styles.theme, compact && styles.themeCompact]}>
                <View style={styles.themeIcon}>
                  <Icon
                    name={{ ios: theme.ios, android: theme.android, web: theme.android }}
                    size={18}
                  />
                </View>
                <View style={styles.themeCopy}>
                  <XivText variant="label" color={Palette.accent}>
                    {theme.label}
                  </XivText>
                  <XivText variant="caption" muted>
                    {theme.detail}
                  </XivText>
                </View>
              </View>
            </View>
          ))}
        </Card>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(480).delay(240)}>
        <TrustStrip />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  brandCompact: {
    paddingTop: Spacing.one,
  },
  network: {
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  hero: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  heroCompact: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  heroTitle: {
    textAlign: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  themes: {
    gap: 0,
    paddingVertical: Spacing.three,
  },
  themesCompact: {
    paddingVertical: Spacing.two,
  },
  theme: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  themeCompact: {
    paddingVertical: Spacing.two,
  },
  themeIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.accentMuted,
  },
  themeCopy: {
    flex: 1,
    gap: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.line,
  },
});
