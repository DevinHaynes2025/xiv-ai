import { createHash } from 'node:crypto';

import {
  RecoveryJournal,
  type RecoveryEvent,
  type RecoveryEventKind,
} from './recovery-journal';

import {
  verifyFabricRestartEnvelope,
  type FabricRestartEnvelope,
} from './xvi-agent-fabric-restart-envelope';

export type FabricReplayState =
  | 'ENQUEUED'
  | 'LEASED'
  | 'CHECKPOINTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'RECOVERED';

export interface FabricReplayResult {
  version: 'xvi-agent-fabric-replay-v1';
  tenantId: string;
  missionId: string;
  state: FabricReplayState;
  eventCount: number;
  lastSequence: number;
  envelopeVerified: true;
  journalVerified: true;
  executesNothing: true;
  productionAuthority: false;
  verification: 'RESTORED_FOR_RECOVERY_EVALUATION';
}

export const XVI_FABRIC_REPLAY_GUARDRAILS = Object.freeze({
  humanDecision: 'REQUIRED' as const,
  executesNothing: true,
  productionAuthority: false,
  providerCalls: 0,
  processSpawns: 0,
  acquiresLease: false,
  startsWorker: false,
  recoveryEvaluationOnly: true,
});

const refuse = (): never => {
  throw new Error('XVI_FABRIC_REPLAY_REFUSED');
};

function sha256(text: string): string {
  return createHash('sha256')
    .update(text, 'utf8')
    .digest('hex');
}

function legalTransition(
  current: FabricReplayState | null,
  next: RecoveryEventKind,
): boolean {
  if (current === null) {
    return next === 'ENQUEUED';
  }

  if (current === 'ENQUEUED') {
    return next === 'LEASED';
  }

  if (current === 'LEASED') {
    return (
      next === 'CHECKPOINTED' ||
      next === 'COMPLETED' ||
      next === 'FAILED'
    );
  }

  if (current === 'CHECKPOINTED') {
    return (
      next === 'CHECKPOINTED' ||
      next === 'COMPLETED' ||
      next === 'FAILED'
    );
  }

  if (current === 'FAILED') {
    return next === 'RECOVERED';
  }

  return false;
}

function boundedEventId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > 128 ||
    !/^[A-Za-z0-9_.:@-]+$/.test(value)
  ) {
    refuse();
  }

  return value;
}

function canonicalTimestamp(value: unknown): string {
  if (typeof value !== 'string') {
    refuse();
  }

  const parsed = Date.parse(value);

  if (
    !Number.isFinite(parsed) ||
    new Date(parsed).toISOString() !== value
  ) {
    refuse();
  }

  return value;
}

function canonicalRecoveryEvent(
  input: unknown,
): Readonly<RecoveryEvent> {
  if (
    input === null ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !== Object.prototype
  ) {
    refuse();
  }

  const descriptors = Object.getOwnPropertyDescriptors(input);

  const required = [
    'sequence',
    'eventId',
    'workItemId',
    'kind',
    'actor',
    'at',
  ] as const;

  const optional = [
    'evidence',
  ] as const;

  const allowed = new Set<string>([
    ...required,
    ...optional,
  ]);

  for (const key of Reflect.ownKeys(input)) {
    if (
      typeof key !== 'string' ||
      !allowed.has(key)
    ) {
      refuse();
    }
  }

  const readRequired = (key: string): unknown => {
    const descriptor = descriptors[key];

    if (
      !descriptor ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      refuse();
    }

    return descriptor.value;
  };

  const readOptional = (key: string): unknown => {
    const descriptor = descriptors[key];

    if (!descriptor) {
      return undefined;
    }

    if (
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      refuse();
    }

    return descriptor.value;
  };

  const sequence = readRequired('sequence');

  if (
    typeof sequence !== 'number' ||
    !Number.isSafeInteger(sequence) ||
    sequence < 1
  ) {
    refuse();
  }

  const kind = readRequired('kind');

  if (
    kind !== 'ENQUEUED' &&
    kind !== 'LEASED' &&
    kind !== 'CHECKPOINTED' &&
    kind !== 'COMPLETED' &&
    kind !== 'FAILED' &&
    kind !== 'RECOVERED'
  ) {
    refuse();
  }

  const evidence = readOptional('evidence');

  return Object.freeze({
    sequence,
    eventId: boundedEventId(readRequired('eventId')),
    workItemId: boundedEventId(readRequired('workItemId')),
    kind,
    actor: boundedEventId(readRequired('actor')),
    at: canonicalTimestamp(readRequired('at')),
    ...(evidence === undefined
      ? {}
      : { evidence: boundedEventId(evidence) }),
  });
}

function replayEvents(
  events: readonly RecoveryEvent[],
  missionId: string,
): FabricReplayState {
  let state: FabricReplayState | null = null;

  for (const event of events) {
    if (
      event.workItemId !== missionId ||
      !legalTransition(state, event.kind)
    ) {
      refuse();
    }

    state = event.kind;
  }

  if (state === null) {
    refuse();
  }

  return state;
}

export function restoreFabricMissionForRecovery(
  envelope: Readonly<FabricRestartEnvelope>,
  journalText: string,
): Readonly<FabricReplayResult> {
  if (
    typeof journalText !== 'string' ||
    journalText.length === 0
  ) {
    refuse();
  }

  /*
   * Recreate an expected canonical envelope from the envelope itself
   * only through the hardened verifier. This operation establishes
   * integrity eligibility, never execution authority.
   */
  const envelopeVerification =
    verifyFabricRestartEnvelope(envelope, envelope);

  if (
    envelopeVerification !==
    'VERIFIED_FOR_RECOVERY_EVALUATION'
  ) {
    refuse();
  }

  if (sha256(journalText) !== envelope.journalDigest) {
    refuse();
  }

  const journal = new RecoveryJournal();

  try {
    journal.restoreJsonLines(journalText);
  } catch {
    refuse();
  }

  /*
   * Use the journal's serialized representation after restoration.
   * Parsing here is only for lifecycle projection; sequence and
   * duplicate-event integrity were already checked by RecoveryJournal.
   */
  let events: RecoveryEvent[];

  try {
    events = journal
      .toJsonLines()
      .split(/\r?\n/)
      .filter(Boolean)
      .map(line =>
        canonicalRecoveryEvent(JSON.parse(line)),
      );
  } catch {
    refuse();
  }

  if (events.length === 0) {
    refuse();
  }

  const state = replayEvents(
    events,
    envelope.missionId,
  );

  const last = events[events.length - 1];

  if (!last) {
    refuse();
  }

  return Object.freeze({
    version: 'xvi-agent-fabric-replay-v1' as const,
    tenantId: envelope.tenantId,
    missionId: envelope.missionId,
    state,
    eventCount: events.length,
    lastSequence: last.sequence,
    envelopeVerified: true as const,
    journalVerified: true as const,
    executesNothing: true as const,
    productionAuthority: false as const,
    verification:
      'RESTORED_FOR_RECOVERY_EVALUATION' as const,
  });
}
