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
      <Chip label="Devices" onPress={() => go('devices')} />
      <Chip label="Device Detail" onPress={() => go('device-detail')} />
      <Chip label="Location" onPress={() => go('location')} />
      <Chip label="Security Agents" onPress={() => go('security-agents')} />
      <Chip label="Incidents" onPress={() => go('security-incidents')} />
      <Chip label="Identity Security" onPress={() => go('identity-security')} />
      <Chip label="Access Governance" onPress={() => go('access-security')} />
      <Chip label="Agent Security" onPress={() => go('agent-security')} />
      <Chip label="Audit" onPress={() => go('audit')} />
      <Chip label="Cross-Device" onPress={() => go('cross-device')} />
      <Chip label="Research Mesh" onPress={() => go('knowledge')} />
      <Chip label="Articles" onPress={() => go('articles')} />
      <Chip label="Historical Library" onPress={() => go('history')} />
      <Chip label="Product Passport" onPress={() => go('product-passport')} />
      <Chip label="Suppliers" onPress={() => go('suppliers')} />
      <Chip label="XIV Parcel" onPress={() => go('parcel')} />
      <Chip label="Commerce Graph" onPress={() => go('commerce')} />
      <Chip label="Agent Foundry" onPress={() => go('agent-foundry')} />
      <Chip label="AI Boards" onPress={() => go('boards')} />
      <Chip label="Temporal Intelligence" onPress={() => go('temporal')} />
      <Chip label="Civilizations" onPress={() => go('civilizations')} />
      <Chip label="Global Thinkers" onPress={() => go('thinkers')} />
      <Chip label="Foresight Lab" onPress={() => go('foresight')} />
      <Chip label="Time Machine" onPress={() => go('time-machine')} />
      <Chip label="Business Atlas" onPress={() => go('atlas')} />
      <Chip label="Archives" onPress={() => go('archives')} />
      <Chip label="Pocket Brain" onPress={() => go('pocket')} />
      <Chip label="Pocket WMS" onPress={() => go('pocket-wms')} />
      <Chip label="Pocket TMS" onPress={() => go('pocket-tms')} />
      <Chip label="Supplier Connect" onPress={() => go('supplier-connect')} />
      <Chip label="Device Trust" onPress={() => go('device-trust')} />
      <Chip label="Mobile Security" onPress={() => go('pocket-security')} />
      <Chip label="Communities" onPress={() => go('communities')} />
      <Chip label="Groups" onPress={() => go('groups')} />
      <Chip label="XIV Places" onPress={() => go('places')} />
      <Chip label="XIV Answers" onPress={() => go('answers')} />
      <Chip label="Reviews" onPress={() => go('reviews')} />
      <Chip label="Live Rooms" onPress={() => go('live-rooms')} />
      <Chip label="Data Agents" onPress={() => go('data-agents')} />
      <Chip label="Supply Graph" onPress={() => go('supply-graph')} />
      <Chip label="Warehouse Twin" onPress={() => go('warehouse-twin')} />
      <Chip label="Earth Intelligence" onPress={() => go('earth')} />
      <Chip label="Pipeline Foundry" onPress={() => go('pipelines')} />
      <Chip label="Defense Mesh" onPress={() => go('defense-mesh')} />
      <Chip label="Location Fabric" onPress={() => go('location-fabric')} />
      <Chip label="Data Universes" onPress={() => go('universes')} />
      <Chip label="Transport Intel" onPress={() => go('transport')} />
      <Chip label="Ports & Trade" onPress={() => go('ports')} />
      <Chip label="Geospatial Agents" onPress={() => go('geospatial')} />
    </ExperienceScreen>
  );
}
