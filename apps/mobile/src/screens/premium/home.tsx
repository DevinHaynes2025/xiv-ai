import { type Href, useRouter } from 'expo-router';

import { CardRow, SponsoredCard, XivAgentCard, XivMeetingCard, XivMetricCard, XivPremiumButton, XivSearchCommandBar, XivSectionHeader } from '@/components/premium';
import { IntelligenceStoryCard, RiskOpportunityPanel, XivListRow } from '@/components/v4';
import { useSession } from '@/context/session';
import { premiumAd, premiumHome } from '@/data/premium-demo';
import { EXPERIENCE_STORY, HEALTH_DOMAINS } from '@/data/premium-experience';
import { useAdaptiveSurface } from '@/lib/adaptive-surface';
import { dayGreeting } from '@/lib/greeting';
import { osHome } from '@/lib/os-routes';

import { PremiumDesk } from './desk';

export function PremiumHome() {
  const router = useRouter();
  const { session } = useSession();
  const { tablet, surface } = useAdaptiveSurface();
  const home = osHome(session.experience);
  const go = (path: string) => router.navigate(`${home}/${path}` as Href);

  return (
    <PremiumDesk
      title={dayGreeting(session.displayName)}
      subtitle={
        tablet
          ? 'Tablet workspace: command, documents, and multi-agent rooms — still a window into XIV.'
          : 'Phone window: alerts, approvals, agents, and meetings — without fake live ops.'
      }>
      <XivSearchCommandBar placeholder="Jump to Intelligence, Network, Meetings, AI" />
      <XivListRow
        title={tablet ? 'Expanded surface' : 'Pocket surface'}
        body={
          tablet
            ? 'Warehouse, maps, charts, and command centers are one tap closer on this width.'
            : 'The phone is the secure window. The governed intelligence network stays behind it.'
        }
        meta={surface}
        onPress={() => go('install')}
      />

      <XivSectionHeader kicker="A" title="Executive Brief" action="Intel" onAction={() => go('intelligence')} />
      <IntelligenceStoryCard {...EXPERIENCE_STORY} />
      <RiskOpportunityPanel
        risk="No authorized Company Brain feed is connected. Missing values are not invented."
        opportunity="Public World Bank and SEC adapters can inform historical context when opened from Intelligence."
      />

      <XivSectionHeader kicker="B" title="Business Health" action="Health" onAction={() => go('health')} />
      <CardRow>
        {HEALTH_DOMAINS.map((item) => (
          <XivMetricCard key={item.id} title={item.title} value={item.value} detail={item.note} demo />
        ))}
      </CardRow>

      <XivSectionHeader kicker="C" title="Active Stories" action="Story" onAction={() => go('story')} />
      <IntelligenceStoryCard {...EXPERIENCE_STORY} />

      <XivSectionHeader kicker="D" title="Agent Activity" action="AI" onAction={() => go('agents')} />
      {premiumHome.agents.map((item) => (
        <XivAgentCard key={item.name} {...item} />
      ))}
      <XivListRow title="Approvals" body="No pending consequential action. L4 disabled." meta="Denied actions stay denied." />

      <XivSectionHeader kicker="E" title="Network Activity" action="Network" onAction={() => go('network')} />
      <XivListRow title="Introductions" body="Recommended relationships require declared context." onPress={() => go('network')} />
      <XivListRow title="Events & mixers" body="Business rooms only. No entertainment feed." onPress={() => go('events')} />

      <XivSectionHeader kicker="F" title="Meetings" action="Open" onAction={() => go('meetings')} />
      {premiumHome.meetings.map((item) => (
        <XivMeetingCard key={item.title} {...item} />
      ))}
      <XivListRow title="Action items" body="Outstanding tasks stay local to this prototype." meta="Video transport NOT_CONFIGURED" />

      <XivSectionHeader kicker="Paid" title="Sponsored" />
      <SponsoredCard {...premiumAd} />
      {tablet ? (
        <>
          <XivSectionHeader kicker="Tablet" title="Expanded operations" />
          <XivPremiumButton label="Warehouse" onPress={() => go('warehouse')} />
          <XivPremiumButton label="Command Center" onPress={() => go('command-center')} variant="ghost" />
          <XivPremiumButton label="Operations Brain" onPress={() => go('ops-brain')} variant="ghost" />
          <XivPremiumButton label="Device Fleet" onPress={() => go('device-fleet')} variant="ghost" />
        </>
      ) : (
        <>
          <XivPremiumButton label="Get XIV on this phone" onPress={() => go('install')} />
          <XivPremiumButton label="Approvals" onPress={() => go('agents')} variant="ghost" />
        </>
      )}
      <XivPremiumButton label="Messages" onPress={() => go('messages')} variant="ghost" />
      <XivPremiumButton label="Sources" onPress={() => go('sources')} variant="ghost" />
      <XivPremiumButton label="More desks" onPress={() => go('more')} variant="ghost" />
    </PremiumDesk>
  );
}
