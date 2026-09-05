import { StyleSheet, View } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

import { XivText } from './text';

export type SystemStatusKind = 'ACTIVE' | 'CONFIGURED' | 'NEEDS ATTENTION' | 'COMING SOON';

const tone: Record<SystemStatusKind, string> = {
  ACTIVE: Palette.success,
  CONFIGURED: Palette.intelligence,
  'NEEDS ATTENTION': Palette.warning,
  'COMING SOON': Palette.textDim,
};

type Props = {
  status: SystemStatusKind;
};

export function SystemStatus({ status }: Props) {
  return (
    <View style={[styles.pill, { borderColor: tone[status] }]}>
      <View style={[styles.dot, { backgroundColor: tone[status] }]} />
      <XivText variant="label" color={tone[status]}>
        {status}
      </XivText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: Palette.navyDeep,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
