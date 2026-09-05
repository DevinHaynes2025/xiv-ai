import { Stack } from 'expo-router';

import { Palette } from '@/constants/theme';

export default function HubsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Palette.navy },
      }}
    />
  );
}
