import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * XIV AI uses a dark-first interface.
 *
 * On web, React Native's color-scheme hook provides the current
 * client preference. During static rendering, fall back to dark
 * rather than introducing hydration-only React state.
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();

  return colorScheme ?? 'dark';
}
