import { type Href, useRouter } from 'expo-router';

import { SponsoredCard, XivEmptyState, XivPremiumButton, XivSectionHeader, XivStatusPill } from '@/components/premium';
import {
  ConnectionCard,
  ConversationHeader,
  ConversationList,
  EventCardV4,
  EventAgenda,
  EventDiscussion,
  EventDetail,
  IntroductionCard,
  MeetingDetail,
  MeetingPreparation,
  MeetingRoomShell,
  MessageBubble,
  MessageComposer,
  MixerCard,
  MixerRoom,
  NetworkActivityCard,
  ParticipantList,
  RecommendedRelationship,
  RSVPState,
  SpeakerCard,
  AttendeeDiscovery,
  TypingIndicator,
  UpcomingMeetingCard,
} from '@/components/v4';
import { useSession } from '@/context/session';
import { premiumAd, premiumHome } from '@/data/premium-demo';
import {
  CONVERSATIONS,
  EVENTS,
  INTRODUCTIONS,
  MEETING_KINDS,
  MEETING_PREP,
  MIXERS,
  NETWORK_PEOPLE,
  THREAD,
} from '@/data/premium-experience';
import { osHome } from '@/lib/os-routes';

import { PremiumDesk } from './desk';

export function PremiumNetwork() {
  return (
    <PremiumDesk title="Network" subtitle="Problems, expertise, projects — not a follower graph.">
      <XivSectionHeader kicker="People" title="Professional context" />
      {NETWORK_PEOPLE.map((person) => (
        <ConnectionCard key={person.name} {...person} />
      ))}
      <XivSectionHeader kicker="Intros" title="Introductions" />
      {INTRODUCTIONS.map((item) => (
        <IntroductionCard key={`${item.from}-${item.to}`} {...item} />
      ))}
      <XivSectionHeader kicker="Recommend" title="Recommended relationships" />
      <RecommendedRelationship
        name="Amira Diallo"
        why="Declared collaboration interest: logistics visibility. Not a job board."
        state="DEMO"
      />
      <NetworkActivityCard
        title="Industry discussion"
        body="Operator rooms stay business-only. No entertainment ranking."
        state="DEMO"
      />
      <XivPremiumButton label="Request introduction" />
      <XivSectionHeader kicker="Paid" title="Promoted visibility" />
      <SponsoredCard {...premiumAd} />
    </PremiumDesk>
  );
}

export function PremiumMessages() {
  const router = useRouter();
  const { session } = useSession();
  const home = osHome(session.experience);

  return (
    <PremiumDesk title="Messages" subtitle="Human · agent · system · workflow. Transport is NOT_CONFIGURED.">
      <XivStatusPill label="Realtime NOT_CONFIGURED" tone="warning" />
      <ConversationList
        items={CONVERSATIONS}
        onOpen={() => router.navigate(`${home}/conversation` as Href)}
      />
    </PremiumDesk>
  );
}

export function PremiumConversation() {
  return (
    <PremiumDesk title="Conversation" subtitle="Thread shell. Nothing is delivered.">
      <ConversationHeader title="Company ops" kind="company_channel" />
      {THREAD.map((item) => (
        <MessageBubble key={`${item.kind}-${item.body}`} {...item} />
      ))}
      <TypingIndicator />
      <MessageComposer />
    </PremiumDesk>
  );
}

export function PremiumMeetings() {
  const router = useRouter();
  const { session } = useSession();
  const home = osHome(session.experience);

  return (
    <PremiumDesk title="Meetings" subtitle="Preparation intelligence. Video is visual-only.">
      <XivStatusPill label="Video provider NOT_CONFIGURED" tone="warning" />
      <UpcomingMeetingCard title={MEETING_PREP.title} when={MEETING_PREP.when} kind={MEETING_PREP.kind} />
      <XivSectionHeader kicker="Kinds" title="Meeting types" />
      {MEETING_KINDS.map((kind) => (
        <XivStatusPill key={kind} label={kind} />
      ))}
      <MeetingPreparation summary={MEETING_PREP.summary} agenda={MEETING_PREP.agenda} />
      <ParticipantList names={['Avery Chen', 'Jordan Hale', 'Ops lead']} />
      <XivPremiumButton label="Open room" onPress={() => router.navigate(`${home}/meeting-room` as Href)} />
      {premiumHome.meetings.map((item) => (
        <UpcomingMeetingCard key={item.title} title={item.title} when={item.when} kind={item.mode} />
      ))}
    </PremiumDesk>
  );
}

export function PremiumMeetingRoom() {
  return (
    <PremiumDesk title="Meeting Room" subtitle="Visual foundation. Transport is not live.">
      <MeetingRoomShell />
      <MeetingDetail
        title={MEETING_PREP.title}
        when={MEETING_PREP.when}
        kind={MEETING_PREP.kind}
        notes={MEETING_PREP.notes}
        actions={MEETING_PREP.actions}
        decisions={MEETING_PREP.decisions}
        intelligence={MEETING_PREP.intelligence}
      />
    </PremiumDesk>
  );
}

export function PremiumEvents() {
  return (
    <PremiumDesk title="Events" subtitle="Business sessions. No entertainment feed.">
      {EVENTS.map((item) => (
        <EventCardV4 key={item.title} {...item} />
      ))}
      <EventDetail title={EVENTS[0].title} kind={EVENTS[0].kind} when={EVENTS[0].when} />
      <EventAgenda items={['Provenance briefing', 'Q&A — no live stream claimed']} />
      <SpeakerCard name="Avery Chen" role="Operator (DEMO)" />
      <RSVPState state="none" />
      <EventDiscussion />
      <AttendeeDiscovery names={NETWORK_PEOPLE.map((person) => person.name)} />
      <XivPremiumButton label="RSVP (prototype)" />
    </PremiumDesk>
  );
}

export function PremiumMixer() {
  return (
    <PremiumDesk title="XIV Mixers" subtitle="Founder, operator, investor, supply-chain rooms.">
      {MIXERS.map((item) => (
        <MixerCard key={item.title} {...item} />
      ))}
      <MixerRoom title="Founders Mixer" topic="founders" />
      <XivEmptyState title="Video not live" body="Mixer rooms are professional shells. Conferencing infrastructure is not connected." />
    </PremiumDesk>
  );
}
