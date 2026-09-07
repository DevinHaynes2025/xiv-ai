import {
  SponsoredCard,
  XivEmptyState,
  XivEventCard,
  XivMeetingCard,
  XivNetworkCard,
  XivPremiumButton,
  XivSectionHeader,
  XivStatusPill,
} from '@/components/premium';
import { premiumAd, premiumHome, premiumMessages } from '@/data/premium-demo';
import { XivText } from '@/components/xiv/text';

import { PremiumDesk } from './desk';

export function PremiumNetwork() {
  return (
    <PremiumDesk title="Network" subtitle="Professional graph. Not a social clone.">
      {premiumHome.opportunities.map((item) => (
        <XivNetworkCard key={item.name} {...item} />
      ))}
      <XivPremiumButton label="Request introduction" />
      <XivSectionHeader kicker="Paid" title="Promoted visibility" />
      <SponsoredCard {...premiumAd} />
    </PremiumDesk>
  );
}

export function PremiumMessages() {
  return (
    <PremiumDesk title="Messages" subtitle="Business inbox. Realtime is NOT CONNECTED.">
      <XivStatusPill label="Realtime NOT CONNECTED" tone="warning" />
      {premiumMessages.map((item) => (
        <XivNetworkCard key={item.id} name={item.from} title={item.kind} reason={item.preview} />
      ))}
    </PremiumDesk>
  );
}

export function PremiumConversation() {
  return (
    <PremiumDesk title="Conversation" subtitle="Thread, reply, and meeting invite — prototype UI.">
      <XivStatusPill label="DM · tenant scoped" />
      <XivText variant="body" muted>
        Typing, read state, reactions, attachments, and voice notes are designed. No live message bus.
      </XivText>
      <XivPremiumButton label="Schedule meeting" />
      <XivPremiumButton label="AI summary" variant="ghost" />
    </PremiumDesk>
  );
}

export function PremiumMeetings() {
  return (
    <PremiumDesk title="Meetings" subtitle="1:1, group, investor, and demo rooms.">
      <XivStatusPill label="Video provider not_configured" tone="warning" />
      {premiumHome.meetings.map((item) => (
        <XivMeetingCard key={item.title} {...item} />
      ))}
      <XivEmptyState title="No live call" body="WebRTC / LiveKit / Daily / Twilio / Agora are not connected." />
    </PremiumDesk>
  );
}

export function PremiumMeetingRoom() {
  return (
    <PremiumDesk title="Meeting Room" subtitle="Provider-neutral room. Not LIVE.">
      <XivMeetingCard title="Team room" when="Waiting" mode="group video" />
      <XivEmptyState title="NOT CONNECTED" body="Join controls stay disabled until a real video provider is configured and tested." />
    </PremiumDesk>
  );
}

export function PremiumEvents() {
  return (
    <PremiumDesk title="Events" subtitle="Calendar, discovery, company events.">
      {premiumHome.events.map((item) => (
        <XivEventCard key={item.title} {...item} />
      ))}
      <XivPremiumButton label="RSVP (prototype)" />
    </PremiumDesk>
  );
}

export function PremiumMixer() {
  return (
    <PremiumDesk title="XIV Mixers" subtitle="Scheduled professional rooms. Video not live.">
      <XivEventCard title="Founders Mixer" when="Fri 5:00 PM" kind="mixer" />
      <XivEventCard title="Africa Business Mixer" when="Next week" kind="mixer" />
      <XivNetworkCard
        name="Suggested match"
        title="Declared industry + event topic"
        reason="No sensitive-personal-trait targeting."
        company="XIV Mixers"
      />
    </PremiumDesk>
  );
}
