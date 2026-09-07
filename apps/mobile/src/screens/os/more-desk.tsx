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
      <Chip label="Business Live" onPress={() => go('live')} />
      <Chip label="Business Cases" onPress={() => go('cases')} />
      <Chip label="Africa Business" onPress={() => go('africa')} />
      <Chip label="Global Business" onPress={() => go('global')} />
      <Chip label="Operations Center" onPress={() => go('ops')} />
      <Chip label="Messages" onPress={() => go('messages')} />
      <Chip label="Events" onPress={() => go('events')} />
      <Chip label="Mixers" onPress={() => go('mixer')} />
      <Chip label="Marketplace" onPress={() => go('marketplace')} />
      <Chip label="Promote" onPress={() => go('promote')} />
      <Chip label="Business Ads" onPress={() => go('ads')} />
      <Chip label="Story Engine" onPress={() => go('story')} />
      <Chip label="Data Sources" onPress={() => go('sources')} />
      <Chip label="Agent Room" onPress={() => go('agent-room')} />
      <Chip label="Command" onPress={() => go('sales')} />
      <Chip label="Profile" onPress={() => go('profile')} />
      <Chip label="Health" onPress={() => go('health')} />
      <Chip label="Offline Center" onPress={() => go('offline')} />
      <Chip label="Global Discover" onPress={() => go('discover')} />
      <Chip label="Startup Discover" onPress={() => go('startups')} />
      <Chip label="Company Research" onPress={() => go('company-research')} />
      <Chip label="Company Timeline" onPress={() => go('company-timeline')} />
      <Chip label="Watchlist" onPress={() => go('watchlist')} />
      <Chip label="Research Room" onPress={() => go('research-room')} />
      <Chip label="Research Packet" onPress={() => go('research')} />
      <Chip label="Company Comparison" onPress={() => go('company-comparison')} />
      <Chip label="Documentary Research" onPress={() => go('documentary')} />
      <Chip label="Company Profile" onPress={() => go('company-profile')} />
      <Chip label="XIV Sheets" onPress={() => go('sheets')} />
      <Chip label="XIV Charts" onPress={() => go('charts')} />
      <Chip label="XIV Stories" onPress={() => go('originals')} />
      <Chip label="XIV Daily" onPress={() => go('daily')} />
      <Chip label="Idea Room" onPress={() => go('idea-room')} />
      <Chip label="Privacy Center" onPress={() => go('privacy')} />
    </ExperienceScreen>
  );
}
