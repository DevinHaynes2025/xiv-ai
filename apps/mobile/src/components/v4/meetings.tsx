import { XivEmptyState, XivGlassPanel, XivStatusPill } from '@/components/premium';
import { SampleMark } from '@/components/xiv/sample-mark';
import { XivText } from '@/components/xiv/text';
import { Palette } from '@/constants/theme';

import { ParticipantAvatarGroup } from './comms';
import { XivStatusIndicator } from './story';

export function UpcomingMeetingCard({
  title,
  when,
  kind,
}: {
  title: string;
  when: string;
  kind: string;
}) {
  return (
    <XivGlassPanel accessibilityLabel={`${title} ${when}`}>
      <XivStatusIndicator state="DEMO" />
      <XivText variant="card">{title}</XivText>
      <XivText variant="metadata" muted>
        {kind} · {when}
      </XivText>
      <XivText variant="micro" dim>
        Calendar is a prototype. Video transport NOT_CONFIGURED.
      </XivText>
    </XivGlassPanel>
  );
}

export function MeetingAgenda({ items }: { items: readonly string[] }) {
  return (
    <XivGlassPanel>
      <XivText variant="label" color={Palette.accent}>
        Agenda
      </XivText>
      {items.map((item) => (
        <XivText key={item} variant="body" muted>
          · {item}
        </XivText>
      ))}
    </XivGlassPanel>
  );
}

export function MeetingNotes({ text }: { text: string }) {
  return (
    <XivGlassPanel>
      <XivText variant="label" color={Palette.accent}>
        Notes
      </XivText>
      <XivText variant="body" muted>
        {text}
      </XivText>
      <XivText variant="micro" dim>
        Not a transcript. Transcription is not live.
      </XivText>
    </XivGlassPanel>
  );
}

export function MeetingActionItems({ items }: { items: readonly string[] }) {
  return (
    <XivGlassPanel>
      <XivText variant="label" color={Palette.accent}>
        Action items
      </XivText>
      {items.map((item) => (
        <XivText key={item} variant="body">
          · {item}
        </XivText>
      ))}
    </XivGlassPanel>
  );
}

export function MeetingIntelligence({ text }: { text: string }) {
  return (
    <XivGlassPanel>
      <XivText variant="label" color={Palette.accent}>
        Meeting intelligence
      </XivText>
      <XivText variant="body" muted>
        {text}
      </XivText>
    </XivGlassPanel>
  );
}

export function MeetingSourcePanel() {
  return (
    <XivGlassPanel>
      <XivStatusPill label="NOT_CONFIGURED" tone="warning" />
      <XivText variant="card">Company Brain</XivText>
      <XivText variant="body" muted>
        Contextual company intelligence requires an authorized source. This panel does not invent one.
      </XivText>
    </XivGlassPanel>
  );
}

export function MeetingPreparation({
  summary,
  agenda,
}: {
  summary: string;
  agenda: readonly string[];
}) {
  return (
    <XivGlassPanel>
      <XivText variant="label" color={Palette.accent}>
        Preparation
      </XivText>
      <XivText variant="body">{summary}</XivText>
      <MeetingAgenda items={agenda} />
    </XivGlassPanel>
  );
}

export function ParticipantList({ names }: { names: readonly string[] }) {
  return (
    <XivGlassPanel>
      <XivText variant="label" color={Palette.accent}>
        Participants
      </XivText>
      <ParticipantAvatarGroup names={names} />
      <XivText variant="metadata" muted>
        {names.join(', ')}
      </XivText>
    </XivGlassPanel>
  );
}

export function MeetingRoomShell() {
  return (
    <XivGlassPanel accessibilityLabel="Meeting room visual foundation">
      <XivStatusIndicator state="NOT_CONFIGURED" />
      <XivText variant="card">Meeting room</XivText>
      <XivText variant="body" muted>
        Visual-only foundation. No WebRTC, LiveKit, Daily, Twilio, or Agora.
      </XivText>
      <XivEmptyState title="Join disabled" body="Recording, transcription, and video stay unavailable until a proven provider exists." />
      <SampleMark text="VISUAL FOUNDATION · TRANSPORT NOT LIVE" />
    </XivGlassPanel>
  );
}

export function MeetingDetail({
  title,
  when,
  kind,
  notes,
  actions,
  decisions,
  intelligence,
}: {
  title: string;
  when: string;
  kind: string;
  notes: string;
  actions: readonly string[];
  decisions: readonly string[];
  intelligence: string;
}) {
  return (
    <>
      <UpcomingMeetingCard title={title} when={when} kind={kind} />
      <MeetingNotes text={notes} />
      <MeetingActionItems items={actions} />
      <XivGlassPanel>
        <XivText variant="label" color={Palette.accent}>
          Decisions
        </XivText>
        {decisions.map((item) => (
          <XivText key={item} variant="body" muted>
            · {item}
          </XivText>
        ))}
      </XivGlassPanel>
      <MeetingIntelligence text={intelligence} />
      <MeetingSourcePanel />
    </>
  );
}
