import { type ReactNode } from 'react';

import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { DEMO_NOTICE } from '@/data/premium-demo';

export function PremiumDesk({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <ExperienceScreen title={title} subtitle={subtitle} atmosphere="restrained">
      <PrototypeNotice text={DEMO_NOTICE} />
      {children}
    </ExperienceScreen>
  );
}
