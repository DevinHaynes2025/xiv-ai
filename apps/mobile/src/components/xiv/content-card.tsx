import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Layout, Palette, Radius, Spacing } from '@/constants/theme';
import type { NetworkContentKind, NetworkPreview } from '@/data/mock';

import { Card } from './card';
import { Icon } from './icon';
import { PressScale } from './press-scale';
import { SampleMark } from './sample-mark';
import { XivText } from './text';
import { XivCreatorHeader } from './xiv-creator-header';
import { XivMediaPreview } from './xiv-media-preview';

export type XivContentCardProps = {
  author: string;
  role: string;
  company: string;
  industry?: string;
  title: string;
  description: string;
  tags: string[];
  kind: NetworkContentKind;
  preview?: NetworkPreview;
  duration?: string;
  readingTime?: string;
  timestamp?: string;
  pollOptions?: string[];
  trustLabel?: string;
  onPress?: () => void;
  onDiscuss?: () => void;
  onShare?: () => void;
};

export function XivContentCard(props: XivContentCardProps) {
  if (props.kind === 'video') return <VideoLayout {...props} />;
  if (props.kind === 'article') return <ArticleLayout {...props} />;
  if (props.kind === 'idea' || props.kind === 'text') return <InsightLayout {...props} />;
  if (props.kind === 'product') return <CompanyLayout {...props} />;
  if (props.kind === 'project') return <ProjectLayout {...props} />;
  return <DefaultLayout {...props} />;
}

function VideoLayout(props: XivContentCardProps) {
  return (
    <Card padded={false} variant="hero" style={styles.card}>
      {props.preview ? (
        <XivMediaPreview kind="video" preview={props.preview} duration={props.duration} />
      ) : null}
      <View style={styles.body}>
        <XivCreatorHeader
          author={props.author}
          role={props.role}
          company={props.company}
          industry={props.industry}
          kind="video"
          timestamp={props.timestamp}
          trustLabel={props.trustLabel}
        />
        <XivText variant="title">{props.title}</XivText>
        <XivText variant="body" muted numberOfLines={2}>
          {props.description}
        </XivText>
        <TagRow tags={props.tags} />
      </View>
      <ActionBar {...props} />
    </Card>
  );
}

function ArticleLayout(props: XivContentCardProps) {
  return (
    <Card padded={false} variant="elevated" style={styles.card}>
      <PressScale disabled={!props.onPress} onPress={props.onPress} style={styles.hit}>
        <View style={styles.articleRow}>
          <View style={styles.articleCopy}>
            <XivText variant="label" color={Palette.intelligence}>
              Article · {props.readingTime ?? 'Read'}
            </XivText>
            <XivText variant="subtitle">{props.title}</XivText>
            <XivText variant="caption" muted numberOfLines={3}>
              {props.description}
            </XivText>
          </View>
          {props.preview ? (
            <View style={styles.articleThumb}>
              <XivMediaPreview kind="article" preview={props.preview} readingTime={props.readingTime} />
            </View>
          ) : null}
        </View>
        <View style={styles.body}>
          <XivCreatorHeader
            author={props.author}
            role={props.role}
            company={props.company}
            industry={props.industry}
            kind="article"
            timestamp={props.timestamp}
            trustLabel={props.trustLabel}
          />
          <TagRow tags={props.tags} />
        </View>
      </PressScale>
      <ActionBar {...props} />
    </Card>
  );
}

function InsightLayout(props: XivContentCardProps) {
  return (
    <Card padded={false} variant="accent" style={styles.card}>
      <View style={styles.insight}>
        <View style={styles.insightBar} />
        <View style={styles.insightCopy}>
          <View style={styles.head}>
            <XivText variant="label" color={Palette.accent}>
              Insight
            </XivText>
            <SampleMark text="DEMO" />
          </View>
          <XivText variant="subtitle">{props.title}</XivText>
          <XivText variant="body" muted>
            {props.description}
          </XivText>
          <XivText variant="caption" color={Palette.textDim}>
            {props.author} · {props.role} · {props.company}
          </XivText>
          <TagRow tags={props.tags} />
        </View>
      </View>
      <ActionBar {...props} />
    </Card>
  );
}

function CompanyLayout(props: XivContentCardProps) {
  return (
    <Card variant="elevated" style={styles.company}>
      <View style={styles.companyMark}>
        <XivText variant="title" color={Palette.accent}>
          {(props.company || props.author).slice(0, 2).toUpperCase()}
        </XivText>
      </View>
      <View style={styles.companyCopy}>
        <XivText variant="label" color={Palette.success}>
          Company
        </XivText>
        <XivText variant="subtitle">{props.company || props.title}</XivText>
        <XivText variant="body">{props.title}</XivText>
        <XivText variant="caption" muted>
          {props.industry} · {props.role}
        </XivText>
        <XivText variant="body" muted numberOfLines={2}>
          {props.description}
        </XivText>
      </View>
      <ActionBar {...props} />
    </Card>
  );
}

function ProjectLayout(props: XivContentCardProps) {
  return (
    <Card variant="hero" style={styles.project}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.intelligence}>
          Project
        </XivText>
        <SampleMark text="DEMO" />
      </View>
      <XivText variant="subtitle">{props.title}</XivText>
      <XivText variant="body" muted>
        {props.description}
      </XivText>
      <View style={styles.track}>
        <View style={styles.trackFill} />
      </View>
      <XivText variant="caption" color={Palette.textDim}>
        {props.author} · {props.company} · milestone preview only
      </XivText>
      <TagRow tags={props.tags} />
      <ActionBar {...props} />
    </Card>
  );
}

function DefaultLayout(props: XivContentCardProps) {
  const [vote, setVote] = useState<string | null>(null);
  const media =
    (props.kind === 'image' || props.kind === 'question') && props.preview ? props.preview : undefined;

  return (
    <Card padded={false} variant="elevated" style={styles.card}>
      <PressScale disabled={!props.onPress} onPress={props.onPress} style={styles.hit}>
        <XivCreatorHeader
          author={props.author}
          role={props.role}
          company={props.company}
          industry={props.industry}
          kind={props.kind}
          timestamp={props.timestamp}
          trustLabel={props.trustLabel}
        />
        {media ? <XivMediaPreview kind={props.kind} preview={media} /> : null}
        <View style={styles.body}>
          <XivText variant="subtitle">{props.title}</XivText>
          <XivText variant="body" muted>
            {props.description}
          </XivText>
          {props.kind === 'poll' && props.pollOptions?.length ? (
            <View style={styles.poll}>
              {props.pollOptions.map((option) => (
                <PressScale
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={option}
                  onPress={() => setVote(option)}
                  style={[styles.pollOption, vote === option && styles.pollSelected]}>
                  <XivText variant="caption" color={vote === option ? Palette.accent : Palette.textMuted}>
                    {option}
                  </XivText>
                </PressScale>
              ))}
              <XivText variant="caption" color={Palette.textDim}>
                Local preview vote only. No poll table is written.
              </XivText>
            </View>
          ) : null}
          <TagRow tags={props.tags} />
        </View>
      </PressScale>
      <ActionBar {...props} />
    </Card>
  );
}

function TagRow({ tags }: { tags: string[] }) {
  return (
    <View style={styles.tags}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tag}>
          <XivText variant="caption" color={Palette.accent}>
            {tag}
          </XivText>
        </View>
      ))}
    </View>
  );
}

function ActionBar({
  onDiscuss,
  onShare,
}: Pick<XivContentCardProps, 'onDiscuss' | 'onShare'>) {
  const [appreciated, setAppreciated] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <View style={styles.actions}>
      <Action
        label={appreciated ? 'Appreciated' : 'Appreciate'}
        ios={appreciated ? 'hand.thumbsup.fill' : 'hand.thumbsup'}
        android={appreciated ? 'thumb_up' : 'thumb_up_off_alt'}
        active={appreciated}
        onPress={() => setAppreciated((value) => !value)}
      />
      <Action label="Discuss" ios="bubble.left" android="chat_bubble_outline" onPress={onDiscuss} />
      <Action
        label={saved ? 'Saved' : 'Save'}
        ios={saved ? 'bookmark.fill' : 'bookmark'}
        android={saved ? 'bookmark' : 'bookmark_border'}
        active={saved}
        onPress={() => setSaved((value) => !value)}
      />
      <Action label="Share" ios="square.and.arrow.up" android="share" onPress={onShare} />
    </View>
  );
}

function Action({
  label,
  ios,
  android,
  active,
  onPress,
}: {
  label: string;
  ios: string;
  android: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const color = active ? Palette.accent : Palette.textDim;
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(active) }}
      onPress={onPress}
      style={styles.action}>
      <Icon name={{ ios, android, web: android }} color={color} size={16} />
      <XivText variant="caption" color={color} numberOfLines={1}>
        {label}
      </XivText>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 0,
  },
  hit: {
    gap: 0,
  },
  body: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  articleRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  articleCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  articleThumb: {
    width: 96,
    height: 96,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  insight: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  insightBar: {
    width: 4,
    backgroundColor: Palette.accent,
  },
  insightCopy: {
    flex: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  company: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  companyMark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.navyDeep,
    borderWidth: 2,
    borderColor: Palette.accent,
  },
  companyCopy: {
    width: '100%',
    gap: Spacing.one,
    alignItems: 'center',
  },
  project: {
    gap: Spacing.two,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.navyDeep,
    overflow: 'hidden',
  },
  trackFill: {
    width: '42%',
    height: '100%',
    backgroundColor: Palette.intelligence,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  poll: {
    gap: Spacing.two,
  },
  pollOption: {
    minHeight: Layout.minTapTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    backgroundColor: Palette.glass,
  },
  pollSelected: {
    borderColor: Palette.accent,
    backgroundColor: Palette.accentMuted,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.accentMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineStrong,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.line,
  },
  action: {
    flex: 1,
    minHeight: Layout.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.two,
  },
});
