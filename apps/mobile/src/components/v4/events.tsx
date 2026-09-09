import { XivGlassPanel, XivStatusPill } from '@/components/premium';
import { SampleMark } from '@/components/xiv/sample-mark';
import { XivText } from '@/components/xiv/text';
import { Palette } from '@/constants/theme';

import { XivStatusIndicator } from './story';

export function MixerRoom({ title, topic }: { title: string; topic: string }) {
  return (
    <XivGlassPanel>
      <XivStatusIndicator state="NOT_CONFIGURED" />
      <XivText variant="card">{title}</XivText>
      <XivText variant="metadata" muted>
        Topic: {topic}
      </XivText>
      <XivText variant="micro" dim>
        Mixer room is a business shell. Video is not live.
      </XivText>
      <SampleMark text="DEMONSTRATION ROOM" />
    </XivGlassPanel>
  );
}

export function EventDetail({
  title,
  kind,
  when,
}: {
  title: string;
  kind: string;
  when: string;
}) {
  return (
    <XivGlassPanel>
      <XivStatusPill label={kind} />
      <XivText variant="card">{title}</XivText>
      <XivText variant="metadata" muted>
        {when}
      </XivText>
      <XivText variant="body" muted>
        Business content only. Not an entertainment feed.
      </XivText>
    </XivGlassPanel>
  );
}

export function EventAgenda({ items }: { items: readonly string[] }) {
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

export function SpeakerCard({ name, role }: { name: string; role: string }) {
  return (
    <XivGlassPanel>
      <XivText variant="card">{name}</XivText>
      <XivText variant="metadata" muted>
        {role}
      </XivText>
    </XivGlassPanel>
  );
}

export function RSVPState({ state }: { state: 'none' | 'going' | 'maybe' | 'not_going' }) {
  return <XivStatusPill label={`RSVP ${state}`} tone="neutral" />;
}

export function EventDiscussion() {
  return (
    <XivGlassPanel>
      <XivStatusIndicator state="NOT_CONFIGURED" />
      <XivText variant="card">Discussion</XivText>
      <XivText variant="body" muted>
        Event conversation is a shell. Messaging transport is not live.
      </XivText>
    </XivGlassPanel>
  );
}

export function AttendeeDiscovery({ names }: { names: readonly string[] }) {
  return (
    <XivGlassPanel>
      <XivText variant="label" color={Palette.accent}>
        Attendee discovery
      </XivText>
      <XivText variant="body" muted>
        {names.join(' · ')}
      </XivText>
      <XivText variant="micro" dim>
        Declared professional context only. No sensitive-trait targeting.
      </XivText>
    </XivGlassPanel>
  );
}
