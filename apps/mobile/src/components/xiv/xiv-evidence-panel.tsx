import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';
import { DEMO_MARK, type OsStory } from '@/data/operating-system';

import { Expandable } from './expandable';
import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Props = {
  items: OsStory['evidence'];
  open?: boolean;
};

export function XivEvidencePanel({ items, open = true }: Props) {
  return (
    <Expandable title="Evidence" subtitle={`${items.length} DEMO traces`} defaultOpen={open} surface>
      <SampleMark text={DEMO_MARK} />
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <XivText variant="caption" color={Palette.accent}>
            {item.label}
          </XivText>
          <XivText variant="body" muted>
            {item.detail}
          </XivText>
        </View>
      ))}
    </Expandable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.one,
  },
});
