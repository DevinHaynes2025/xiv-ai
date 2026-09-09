import { FlatList, StyleSheet, View } from 'react-native';

import { PressScale } from '@/components/xiv/press-scale';
import { XivText } from '@/components/xiv/text';
import { Layout, Palette, Radius, Spacing } from '@/constants/theme';
import type { DataSurfaceState } from '@/lib/surface-state';

import { XivAvatar, XivGlassPanel, XivStatusPill } from '@/components/premium';
import { XivStatusIndicator } from './story';

export function XivListRow({
  title,
  body,
  meta,
  onPress,
}: {
  title: string;
  body?: string;
  meta?: string;
  onPress?: () => void;
}) {
  return (
    <PressScale
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      onPress={onPress}
      disabled={!onPress}
      style={styles.row}>
      <XivText variant="card">{title}</XivText>
      {body ? (
        <XivText variant="body" muted numberOfLines={2}>
          {body}
        </XivText>
      ) : null}
      {meta ? (
        <XivText variant="metadata" dim>
          {meta}
        </XivText>
      ) : null}
    </PressScale>
  );
}

export function XivDivider() {
  return <View style={styles.divider} />;
}

export function MessageBubble({
  kind,
  body,
  author,
}: {
  kind: 'human' | 'xiv_agent' | 'system' | 'workflow';
  body: string;
  author: string;
}) {
  const label =
    kind === 'xiv_agent' ? 'XIV agent' : kind === 'system' ? 'System' : kind === 'workflow' ? 'Workflow' : 'Human';
  return (
    <XivGlassPanel style={kind === 'human' ? styles.human : styles.other} accessibilityLabel={`${label}: ${body}`}>
      <XivStatusPill label={label} tone={kind === 'xiv_agent' ? 'success' : 'neutral'} />
      <XivText variant="metadata">{author}</XivText>
      <XivText variant="body">{body}</XivText>
    </XivGlassPanel>
  );
}

export function ConversationListItem({
  title,
  preview,
  kind,
  onPress,
}: {
  title: string;
  preview: string;
  kind: string;
  onPress?: () => void;
}) {
  return (
    <XivListRow title={title} body={preview} meta={`${kind} · transport NOT_CONFIGURED`} onPress={onPress} />
  );
}

export function ConversationList({
  items,
  onOpen,
}: {
  items: readonly { id: string; title: string; preview: string; kind: string }[];
  onOpen?: (id: string) => void;
}) {
  return (
    <FlatList
      data={[...items]}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <ConversationListItem
          title={item.title}
          preview={item.preview}
          kind={item.kind}
          onPress={onOpen ? () => onOpen(item.id) : undefined}
        />
      )}
    />
  );
}

export function ConversationHeader({
  title,
  kind,
}: {
  title: string;
  kind: string;
}) {
  return (
    <XivGlassPanel>
      <XivStatusIndicator state="NOT_CONFIGURED" />
      <XivText variant="card">{title}</XivText>
      <XivText variant="metadata" muted>
        {kind} · tenant scoped · transport not live
      </XivText>
    </XivGlassPanel>
  );
}

export function SystemMessage({ body }: { body: string }) {
  return <MessageBubble kind="system" author="XIV" body={body} />;
}

export function AgentMessage({ author, body }: { author: string; body: string }) {
  return <MessageBubble kind="xiv_agent" author={author} body={body} />;
}

export function ApprovalMessage({ body }: { body: string }) {
  return <MessageBubble kind="workflow" author="Approval" body={body} />;
}

export function SourceAttachment({ source, state }: { source: string; state: DataSurfaceState }) {
  return (
    <XivGlassPanel>
      <XivStatusIndicator state={state} />
      <XivText variant="metadata">Attachment · {source}</XivText>
    </XivGlassPanel>
  );
}

export function ActionItemMessage({ text }: { text: string }) {
  return <MessageBubble kind="workflow" author="Action item" body={text} />;
}

export function TypingIndicator() {
  return (
    <XivText variant="micro" dim>
      Typing indicator is visual-only. No live socket.
    </XivText>
  );
}

export function MessageComposer() {
  return (
    <View style={styles.composer} accessibilityRole="text" accessibilityLabel="Message composer prototype">
      <XivText variant="metadata" muted>
        Composer shell. Messages are not sent.
      </XivText>
    </View>
  );
}

export function ParticipantAvatarGroup({ names }: { names: readonly string[] }) {
  return (
    <View style={styles.avatars}>
      {names.slice(0, 4).map((name) => (
        <XivAvatar key={name} name={name} size={28} />
      ))}
    </View>
  );
}

export function ConnectionCard({
  name,
  expertise,
  context,
  state,
}: {
  name: string;
  expertise: string;
  context: string;
  state: DataSurfaceState;
}) {
  return (
    <XivGlassPanel>
      <XivStatusIndicator state={state} />
      <XivText variant="card">{name}</XivText>
      <XivText variant="body" muted>
        {expertise}
      </XivText>
      <XivText variant="metadata" dim>
        {context}
      </XivText>
    </XivGlassPanel>
  );
}

export function MixerCard({ title, topic, when }: { title: string; topic: string; when: string }) {
  return (
    <XivGlassPanel>
      <XivStatusIndicator state="DEMO" />
      <XivText variant="card">{title}</XivText>
      <XivText variant="metadata" muted>
        {topic} · {when}
      </XivText>
      <XivText variant="micro" dim>
        Video room visual-only. Transport not live.
      </XivText>
    </XivGlassPanel>
  );
}

export function EventCardV4({
  title,
  kind,
  when,
}: {
  title: string;
  kind: string;
  when: string;
}) {
  return (
    <XivGlassPanel>
      <XivStatusPill label={kind} />
      <XivText variant="card">{title}</XivText>
      <XivText variant="metadata" muted>
        {when}
      </XivText>
    </XivGlassPanel>
  );
}

export function SourceRow({
  name,
  owner,
  classification,
  state,
  lastSync,
  note,
}: {
  name: string;
  owner: string;
  classification: string;
  state: DataSurfaceState;
  lastSync: string;
  note: string;
}) {
  return (
    <XivGlassPanel accessibilityLabel={`${name} ${state}`}>
      <XivStatusIndicator state={state} />
      <XivText variant="card">{name}</XivText>
      <XivText variant="metadata" muted>
        Owner {owner} · {classification} · Universe scoped
      </XivText>
      <XivText variant="micro" dim>
        Last sync: {lastSync}
      </XivText>
      <XivText variant="body" muted>
        {note}
      </XivText>
    </XivGlassPanel>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 4,
    paddingVertical: Spacing.two,
    minHeight: Layout.minTapTarget,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.line,
  },
  human: {
    borderColor: Palette.lineStrong,
  },
  other: {
    backgroundColor: Palette.navyMid,
  },
  composer: {
    minHeight: Layout.minTapTarget,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    padding: Spacing.three,
  },
  avatars: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
});
