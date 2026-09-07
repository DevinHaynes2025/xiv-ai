import { type Href, useRouter } from 'expo-router';

import {
  CardRow,
  SponsoredCard,
  XivAgentCard,
  XivEventCard,
  XivIntelligenceCard,
  XivMeetingCard,
  XivMetricCard,
  XivNetworkCard,
  XivPremiumButton,
  XivSearchCommandBar,
  XivSectionHeader,
  XivStoryCard,
} from '@/components/premium';
import { useSession } from '@/context/session';
import { premiumAd, premiumHome } from '@/data/premium-demo';
import { dayGreeting } from '@/lib/greeting';
import { osHome } from '@/lib/os-routes';

import { PremiumDesk } from './desk';

export function PremiumHome() {
  const router = useRouter();
  const { session } = useSession();
  const home = osHome(session.experience);
  const go = (path: string) => router.navigate(`${home}/${path}` as Href);

  return (
    <PremiumDesk title={dayGreeting(session.displayName)} subtitle="Executive home. Premium, not a feed.">
      <XivSearchCommandBar placeholder="Ask XIV or jump to a desk" />
      <XivSectionHeader kicker="Today" title="Morning Executive Brief" />
      <XivIntelligenceCard
        title="Brief"
        body={premiumHome.brief}
        source="No live operator source"
        connected={false}
        confidence="unknown"
      />
      <XivSectionHeader kicker="Health" title="Business Health" action="Open" onAction={() => go('health')} />
      <CardRow>
        <XivMetricCard title={premiumHome.health.title} value={premiumHome.health.value} detail={premiumHome.health.detail} />
      </CardRow>
      <XivSectionHeader kicker="Calendar" title="Today's Meetings" action="Meetings" onAction={() => go('meetings')} />
      {premiumHome.meetings.map((item) => (
        <XivMeetingCard key={item.title} {...item} />
      ))}
      <XivSectionHeader kicker="Network" title="Network Opportunities" action="Network" onAction={() => go('network')} />
      {premiumHome.opportunities.map((item) => (
        <XivNetworkCard key={item.name} {...item} />
      ))}
      <XivSectionHeader kicker="Agents" title="Agent Activity" action="AI" onAction={() => go('agents')} />
      {premiumHome.agents.map((item) => (
        <XivAgentCard key={item.name} {...item} />
      ))}
      <XivSectionHeader kicker="Markets" title="Market Intelligence" action="Intel" onAction={() => go('intelligence')} />
      <XivIntelligenceCard {...premiumHome.market} />
      <XivSectionHeader kicker="Company" title="Company Alerts" />
      <XivIntelligenceCard
        title="Alerts"
        body={premiumHome.alerts}
        source="Company Brain"
        connected={false}
        confidence="unknown"
      />
      <XivSectionHeader kicker="People" title="Recommended Connections" />
      {premiumHome.opportunities.map((item) => (
        <XivNetworkCard key={`rec-${item.name}`} {...item} />
      ))}
      <XivSectionHeader kicker="Events" title="Upcoming Events" action="Events" onAction={() => go('events')} />
      {premiumHome.events.map((item) => (
        <XivEventCard key={item.title} {...item} />
      ))}
      <XivSectionHeader kicker="Stories" title="Opportunity Stories" action="Story" onAction={() => go('story')} />
      <XivStoryCard {...premiumHome.story} />
      <XivSectionHeader kicker="Advertising" title="Paid placement" />
      <SponsoredCard {...premiumAd} />
      <XivSectionHeader kicker="OS" title="More desks" action="More" onAction={() => go('more')} />
      <XivPremiumButton label="Messages" onPress={() => go('messages')} variant="ghost" />
      <XivPremiumButton label="Marketplace" onPress={() => go('marketplace')} variant="ghost" />
    </PremiumDesk>
  );
}
