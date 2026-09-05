import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

import { Avatar } from './avatar';
import { Button } from './button';
import { Card } from './card';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Props = {
  name: string;
  detail: string;
  meta: string;
  followed?: boolean;
  onFollow?: () => void;
  onExplore?: () => void;
  sampleText?: string;
};

export function XivEntityCard({
  name,
  detail,
  meta,
  followed,
  onFollow,
  onExplore,
  sampleText = 'DEMO',
}: Props) {
  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.head}>
        <Avatar name={name} size={48} />
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <XivText variant="subtitle" numberOfLines={1} style={styles.title}>
              {name}
            </XivText>
            <SampleMark text={sampleText} />
          </View>
          <XivText variant="caption" color={Palette.textDim} numberOfLines={1}>
            {meta}
          </XivText>
        </View>
      </View>
      <XivText variant="body" muted>
        {detail}
      </XivText>
      <View style={styles.actions}>
        {onFollow ? (
          <Button
            label={followed ? 'Following' : 'Follow'}
            variant={followed ? 'secondary' : 'primary'}
            onPress={onFollow}
            style={styles.action}
          />
        ) : null}
        {onExplore ? (
          <Button label="Explore" variant="subtle" onPress={onExplore} style={styles.action} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
  },
});
