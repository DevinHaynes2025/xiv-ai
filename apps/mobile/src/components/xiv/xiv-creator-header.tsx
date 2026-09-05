import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import type { NetworkContentKind } from '@/data/mock';

import { Avatar } from './avatar';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

const KIND_LABEL: Record<NetworkContentKind, string> = {
  text: 'TEXT',
  image: 'IMAGE',
  video: 'VIDEO',
  article: 'ARTICLE',
  poll: 'POLL',
  question: 'QUESTION',
  idea: 'IDEA',
  project: 'PROJECT',
  product: 'PRODUCT',
};

type Props = {
  author: string;
  role: string;
  company: string;
  industry?: string;
  kind: NetworkContentKind;
  timestamp?: string;
  trustLabel?: string;
};

export function XivCreatorHeader({
  author,
  role,
  company,
  industry,
  kind,
  timestamp,
  trustLabel = 'Identity checked',
}: Props) {
  return (
    <View style={styles.head}>
      <Avatar name={author} size={40} />
      <View style={styles.identity}>
        <XivText variant="subtitle" numberOfLines={1}>
          {author}
        </XivText>
        <XivText variant="caption" muted numberOfLines={1}>
          {[role, company, industry].filter(Boolean).join(' · ')}
        </XivText>
        {timestamp ? (
          <XivText variant="caption" color={Palette.textDim}>
            {timestamp} · DEMO
          </XivText>
        ) : null}
      </View>
      <View style={styles.trust}>
        <XivText variant="label" color={Palette.intelligence} numberOfLines={1}>
          {KIND_LABEL[kind]}
        </XivText>
        <XivText variant="caption" color={Palette.textDim} numberOfLines={1}>
          {trustLabel}
        </XivText>
        <SampleMark text="DEMO" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  identity: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  trust: {
    alignItems: 'flex-end',
    gap: 2,
    maxWidth: 110,
  },
});
