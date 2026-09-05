import { Palette } from '@/constants/theme';

import { XivText } from './text';

export function SampleMark({ text = 'Sample' }: { text?: string }) {
  return (
    <XivText variant="label" color={Palette.warning}>
      {text}
    </XivText>
  );
}
