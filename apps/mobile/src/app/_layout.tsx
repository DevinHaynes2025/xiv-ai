import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { SessionProvider } from '@/context/session';
import { TenantProvider } from '@/context/tenant';
import { Palette } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessionProvider>
      <TenantProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Palette.void },
          }}
        />
      </TenantProvider>
    </SessionProvider>
  );
}
