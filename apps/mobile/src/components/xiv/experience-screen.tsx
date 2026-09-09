import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/context/session';
import { BottomTabInset, Layout, Palette, Radius, Spacing } from '@/constants/theme';
import { useAdaptiveSurface } from '@/lib/adaptive-surface';
import { experiences } from '@/data/mock';

import { type Atmosphere, CinematicBackdrop } from './cinematic-backdrop';
import { Header } from './header';
import { Icon } from './icon';
import { XivText } from './text';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  compactHeader?: boolean;
  atmosphere?: Atmosphere;
};

export function ExperienceScreen({
  title,
  subtitle,
  children,
  compactHeader = true,
  atmosphere = 'restrained',
}: Props) {
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { maxContentWidth } = useAdaptiveSurface();
  const current = experiences.find((item) => item.id === session.experience);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { maxWidth: maxContentWidth }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <CinematicBackdrop atmosphere={atmosphere} />
      <Header
        kicker={current?.title ?? 'XIV AI'}
        title={title}
        subtitle={subtitle}
        compact={compactHeader}
      />
      <ScrollView
        style={styles.body}
        contentContainerStyle={[
          styles.bodyContent,
          { paddingBottom: insets.bottom + BottomTabInset },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function ModuleCard({
  tag,
  title,
  body,
  meta,
  onPress,
}: {
  tag?: string;
  title: string;
  body: string;
  meta?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.module}>
      {tag ? (
        <XivText variant="label" color={Palette.accent}>
          {tag}
        </XivText>
      ) : null}
      <XivText variant="subtitle">{title}</XivText>
      <XivText variant="body" muted>
        {body}
      </XivText>
      {meta ? (
        <XivText variant="caption" color={Palette.textDim}>
          {meta}
        </XivText>
      ) : null}
    </Pressable>
  );
}

export function AssistantDock({ prompts }: { prompts: string[] }) {
  return (
    <View style={styles.assistant}>
      <View style={styles.assistantHead}>
        <Icon name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} />
        <XivText variant="subtitle">XIV Assistant</XivText>
      </View>
      <XivText variant="caption" muted>
        Responses in this preview are scripted. No model is called and no data leaves the device.
      </XivText>
      {prompts.map((prompt) => (
        <View key={prompt} style={styles.prompt}>
          <XivText variant="body">{prompt}</XivText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.navy,
    maxWidth: Layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: Layout.screenGutter,
    gap: Spacing.three,
  },
  module: {
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    backgroundColor: Palette.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
  },
  assistant: {
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  assistantHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  prompt: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: Palette.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
  },
});
