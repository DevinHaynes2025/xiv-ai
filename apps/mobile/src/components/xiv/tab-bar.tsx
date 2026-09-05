import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSize, Layout, Palette, Radius, Spacing } from '@/constants/theme';

import { Icon } from './icon';
import { XivText } from './text';

export type TabSpec = {
  name: string;
  label: string;
  ios: string;
  android: string;
};

type RouteLike = {
  key: string;
  name: string;
};

type Props = {
  state: {
    index: number;
    routes: RouteLike[];
  };
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
  tabs: TabSpec[];
};

export function XivTabBar({ state, navigation, tabs }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, Spacing.two) }]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {tabs.map((spec) => {
          const index = state.routes.findIndex((route) => route.name === spec.name);
          if (index < 0) return null;
          const route = state.routes[index];
          const focused = state.index === index;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={spec.label}
              accessibilityState={{ selected: focused }}
              hitSlop={4}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={styles.item}>
              <View style={[styles.capsule, focused && styles.capsuleOn]}>
                <Icon
                  name={{ ios: spec.ios, android: spec.android, web: spec.android }}
                  color={focused ? Palette.accent : Palette.textDim}
                  size={IconSize.md}
                />
              </View>
              <XivText
                variant="label"
                color={focused ? Palette.accent : Palette.textDim}
                numberOfLines={1}
                style={styles.label}>
                {spec.label}
              </XivText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(1, 24, 39, 0.92)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.line,
  },
  bar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
    gap: 2,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: Layout.minTapTarget + 12,
    paddingVertical: 4,
  },
  capsule: {
    minWidth: 44,
    minHeight: 32,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleOn: {
    backgroundColor: Palette.accentMuted,
    shadowColor: Palette.accent,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
