/**
 * XIV Business Events. Planner and discovery contracts. Not LIVE conferencing.
 */
export type BusinessEventKind =
  | 'networking'
  | 'conference'
  | 'workshop'
  | 'webinar'
  | 'pitch'
  | 'product_launch'
  | 'investor'
  | 'training'
  | 'company';

export type BusinessEvent = {
  eventId: string;
  organizationId: string | null;
  kind: BusinessEventKind;
  title: string;
  startsAt: string;
  liveVideo: false;
};

export type NetworkingEvent = BusinessEvent & { kind: 'networking' };
export type Conference = BusinessEvent & { kind: 'conference' };
export type Workshop = BusinessEvent & { kind: 'workshop' };
export type Webinar = BusinessEvent & { kind: 'webinar' };
export type PitchEvent = BusinessEvent & { kind: 'pitch' };
export type ProductLaunch = BusinessEvent & { kind: 'product_launch' };
export type InvestorEvent = BusinessEvent & { kind: 'investor' };
export type TrainingEvent = BusinessEvent & { kind: 'training' };
export type CompanyEvent = BusinessEvent & { kind: 'company' };

export type EventRsvp = { eventId: string; professionalId: string; status: 'invited' | 'accepted' | 'declined' };
export type EventAgenda = { eventId: string; items: readonly string[] };
export type EventSpeaker = { speakerId: string; name: string; eventId: string };
export type EventResource = { resourceId: string; eventId: string; title: string };

export function createBusinessEvent(input: {
  eventId: string;
  organizationId?: string | null;
  kind: BusinessEventKind;
  title: string;
  startsAt: string;
}): BusinessEvent {
  return {
    eventId: input.eventId,
    organizationId: input.organizationId ?? null,
    kind: input.kind,
    title: input.title,
    startsAt: input.startsAt,
    liveVideo: false,
  };
}

export function eventVideoLive() {
  return false;
}
