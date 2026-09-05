import { Tabs } from 'expo-router';

import { XivTabBar, type TabSpec } from '@/components/xiv/tab-bar';
import { Palette } from '@/constants/theme';

type Props = {
  tabs: TabSpec[];
  hidden?: string[];
};

export function ExperienceTabs({ tabs, hidden = [] }: Props) {
  return (
    <Tabs
      tabBar={(props) => (
        <XivTabBar state={props.state} navigation={props.navigation} tabs={tabs} />
      )}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: { backgroundColor: Palette.navy, borderTopWidth: 0, elevation: 0 },
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
      {hidden.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            href: null,
            title: name,
          }}
        />
      ))}
    </Tabs>
  );
}
