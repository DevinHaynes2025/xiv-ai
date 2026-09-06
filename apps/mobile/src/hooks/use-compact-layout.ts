import { useWindowDimensions } from 'react-native';

import { Layout } from '@/constants/theme';

export function useCompactLayout() {
  const { width, height } = useWindowDimensions();
  const narrow = width < Layout.compactWidth;
  const short = height < Layout.shortHeight;
  const compact = height < Layout.compactHeight || narrow;

  return { width, height, narrow, short, compact };
}
