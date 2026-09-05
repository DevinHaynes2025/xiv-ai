import { ScrollView, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

import { Chip } from './chip';

type Props = {
  items: readonly string[];
  selected: string;
  onSelect: (item: string) => void;
};

export function OsModuleChips({ items, selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => (
        <Chip key={item} label={item} compact selected={selected === item} onPress={() => onSelect(item)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.two,
    paddingRight: Spacing.two,
  },
});
