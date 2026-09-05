import { ScrollView, StyleSheet, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';
import { DEMO_MARK } from '@/data/operating-system';

import { SampleMark } from './sample-mark';
import { XivText } from './text';

type Props = {
  nodes: string[];
};

export function XivCausalChain({ nodes }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <XivText variant="label" color={Palette.accent}>
          Causal chain
        </XivText>
        <SampleMark text={DEMO_MARK} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {nodes.map((node, index) => (
          <View key={`${node}-${index}`} style={styles.item}>
            <View style={styles.node}>
              <XivText variant="caption" color={Palette.textMuted} numberOfLines={2} style={styles.nodeCopy}>
                {node}
              </XivText>
            </View>
            {index < nodes.length - 1 ? <View style={styles.arrow} /> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingRight: Spacing.two,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  node: {
    minWidth: 88,
    maxWidth: 110,
    minHeight: 52,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    backgroundColor: Palette.navyDeep,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.lineStrong,
    justifyContent: 'center',
  },
  nodeCopy: {
    textAlign: 'center',
  },
  arrow: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: Palette.accent,
    opacity: 0.7,
  },
});
