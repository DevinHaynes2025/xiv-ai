import { ActionCard } from '@/components/xiv/action-card';
import { Chip } from '@/components/xiv/chip';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { moreModules } from '@/data/operating-system';
import type { OsPath } from '@/lib/os-routes';

import { useOsActions } from './use-os-actions';

export function MoreDesk() {
  const { emphasis, go } = useOsActions();

  return (
    <ExperienceScreen
      title="More"
      subtitle={emphasis === 'chair' ? 'Chair emphasis. Same universe.' : 'Operating emphasis. Same universe.'}>
      <PrototypeNotice text="These desks are registered for every operator and chair. Hidden work is not invented. No private content is loaded." />
      <SectionHeader kicker="Modules" title="Operating system" />
      {moreModules.map((item) => (
        <ActionCard
          key={item.id}
          kicker="Module"
          title={item.title}
          body={item.body}
          sample
          onPress={() => go(item.id as OsPath)}
        />
      ))}
      <Chip label="Profile" onPress={() => go('profile')} />
      <Chip label="Health" onPress={() => go('health')} />
    </ExperienceScreen>
  );
}
