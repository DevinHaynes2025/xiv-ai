import { Platform, useWindowDimensions } from 'react-native';

import { Layout } from '@/constants/theme';
import {
  adaptivePriorities,
  classifyMobileSurface,
  type AdaptivePriority,
  type MobileSurface,
} from '../../../../services/ai/runtime/opsbrain';

export function useAdaptiveSurface(): {
  surface: MobileSurface;
  tablet: boolean;
  priorities: readonly AdaptivePriority[];
  maxContentWidth: number;
} {
  const { width } = useWindowDimensions();
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
  const surface = classifyMobileSurface({ platform, width });
  const tablet = width >= Layout.tabletWidth;
  return {
    surface,
    tablet,
    priorities: adaptivePriorities(surface),
    maxContentWidth: tablet ? Layout.tabletMaxContentWidth : Layout.maxContentWidth,
  };
}
