import { useState } from 'react';

import { MediaDraftCard } from '@/components/media/media-draft-card';
import { ActionCard } from '@/components/xiv/action-card';
import { Chip } from '@/components/xiv/chip';
import { ExperienceScreen } from '@/components/xiv/experience-screen';
import { PrototypeNotice } from '@/components/xiv/prototype-notice';
import { SectionHeader } from '@/components/xiv/section-header';
import { TenantDesk } from '@/components/tenant/tenant-desk';
import { useSession } from '@/context/session';
import { useTenant } from '@/context/tenant';
import { moreModules } from '@/data/operating-system';
import type { OsPath } from '@/lib/os-routes';
import type { MediaDraft } from '../../../../../services/ai/runtime/media';
import type { UniverseVisibility } from '../../../../../services/ai/runtime/universe';

import { useOsActions } from './use-os-actions';

export function MoreDesk() {
  const { emphasis, go } = useOsActions();
  const { session } = useSession();
  const { tenant } = useTenant();
  const [companyDraft, setCompanyDraft] = useState<MediaDraft | null>(null);
  const [visibility, setVisibility] = useState<UniverseVisibility>('organization');

  return (
    <ExperienceScreen
      title="More"
      subtitle={emphasis === 'chair' ? 'Chair emphasis. Same universe.' : 'Operating emphasis. Same universe.'}>
      <PrototypeNotice text="These desks are registered for every operator and chair. Hidden work is not invented. No private content is loaded." />
      <SectionHeader kicker="Tenant" title="Organization and Universe" />
      <TenantDesk />
      <SectionHeader kicker="Prepare" title="Company media" />
      <MediaDraftCard
        ownerId={session.userId || 'anonymous'}
        source="company"
        draft={companyDraft}
        onChange={(next) => setCompanyDraft(next)}
        visibility={visibility}
        onVisibility={setVisibility}
        organizationId={tenant.activeOrganization?.id}
        universeId={tenant.activeUniverse?.id}
        universeName={tenant.activeUniverse?.name}
        universeStatus={tenant.activeUniverse?.status}
      />
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
