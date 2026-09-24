import { createHash } from 'node:crypto';

import {
  RecoveryJournal,
  type RecoveryEvent,
  type RecoveryEventKind,
} from './recovery-journal';

export type FabricLifecycleKind =
  | 'ENQUEUED'
  | 'LEASED'
  | 'CHECKPOINTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'RECOVERED';

export interface FabricLifecycleInput {
  eventId: string;
  missionId: string;
  tenantId: string;
  kind: FabricLifecycleKind;
  actor: string;
  at: string;
  evidenceRef?: string;
}

export interface FabricLifecycleReceipt {
  version: 'xvi-agent-fabric-lifecycle-v1';
  sequence: number;
  eventId: string;
  missionId: string;
  tenantId: string;
  kind: FabricLifecycleKind;
  actor: string;
  at: string;
  evidenceRef: string | null;
  executesNothing: true;
  productionAuthority: false;
  digest: string;
}

export const XVI_FABRIC_DURABILITY_GUARDRAILS = Object.freeze({
  humanDecision: 'REQUIRED' as const,
  executesNothing: true,
  productionAuthority: false,
  secretsAllowed: false,
  appendOnly: true,
  claimsWorkDuringPowerOff: false,
});

const refuse = (): never => {
  throw new Error('XVI_AGENT_FABRIC_DURABILITY_REFUSED');
};

function boundedId(value: unknown): string {
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

function exactObject(
  value: unknown,
  required: readonly string[],
  optional: readonly string[] = [],
): asserts value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    refuse();
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);
  const allowed = new Set([...required, ...optional]);

  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !allowed.has(key)) {
      refuse();
    }
  }

  for (const key of required) {
    const descriptor = descriptors[key];

    if (
      !descriptor ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      refuse();
    }
  }

  for (const key of optional) {
    const descriptor = descriptors[key];

    if (
      descriptor &&
      (!('value' in descriptor) || descriptor.enumerable !== true)
    ) {
      refuse();
    }
  }
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

function canonicalInput(
  input: unknown,
): Readonly<FabricLifecycleInput> {
  exactObject(
    input,
    ['eventId', 'missionId', 'tenantId', 'kind', 'actor', 'at'],
    ['evidenceRef'],
  );

  const descriptors = Object.getOwnPropertyDescriptors(input);

  const read = (key: string): unknown => {
    const descriptor = descriptors[key];

    if (!descriptor || !('value' in descriptor)) {
      return undefined;
    }

    return descriptor.value;
  };

  const kind = read('kind');

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

  const evidenceValue = read('evidenceRef');

  return Object.freeze({
    eventId: boundedId(read('eventId')),
    missionId: boundedId(read('missionId')),
    tenantId: boundedId(read('tenantId')),
    kind,
    actor: boundedId(read('actor')),
    at: canonicalTimestamp(read('at')),
    ...(evidenceValue === undefined
      ? {}
      : { evidenceRef: boundedId(evidenceValue) }),
  });
}

export class XviAgentFabricDurability {
  readonly #journal: RecoveryJournal;
  #missionId: string | null = null;
  #tenantId: string | null = null;
  #state: FabricLifecycleKind | null = null;

  constructor(journal = new RecoveryJournal()) {
    this.#journal = journal;
  }

  #assertTransition(
    missionId: string,
    tenantId: string,
    next: FabricLifecycleKind,
  ): void {
    if (this.#missionId === null) {
      if (next !== 'ENQUEUED') {
        refuse();
      }

      this.#missionId = missionId;
      this.#tenantId = tenantId;
      return;
    }

    if (
      missionId !== this.#missionId ||
      tenantId !== this.#tenantId
    ) {
      refuse();
    }

    const current = this.#state;

    const allowed =
      current === 'ENQUEUED'
        ? next === 'LEASED'
        : current === 'LEASED'
          ? (
              next === 'CHECKPOINTED' ||
              next === 'COMPLETED' ||
              next === 'FAILED'
            )
          : current === 'CHECKPOINTED'
            ? (
                next === 'CHECKPOINTED' ||
                next === 'COMPLETED' ||
                next === 'FAILED'
              )
            : current === 'FAILED'
              ? next === 'RECOVERED'
              : false;

    if (!allowed) {
      refuse();
    }
  }

  append(
    input: FabricLifecycleInput,
  ): Readonly<FabricLifecycleReceipt> {
    const canonical = canonicalInput(input);

    this.#assertTransition(
      canonical.missionId,
      canonical.tenantId,
      canonical.kind,
    );

    const event: RecoveryEvent = this.#journal.append({
      eventId: canonical.eventId,
      workItemId: canonical.missionId,
      kind: canonical.kind as RecoveryEventKind,
      actor: canonical.actor,
      at: canonical.at,
      ...(canonical.evidenceRef !== undefined
        ? { evidence: canonical.evidenceRef }
        : {}),
    });

    this.#state = canonical.kind;

    const payload = Object.freeze({
      version: 'xvi-agent-fabric-lifecycle-v1' as const,
      sequence: event.sequence,
      eventId: canonical.eventId,
      missionId: canonical.missionId,
      tenantId: canonical.tenantId,
      kind: canonical.kind,
      actor: canonical.actor,
      at: canonical.at,
      evidenceRef: canonical.evidenceRef ?? null,
      executesNothing: true as const,
      productionAuthority: false as const,
    });

    const digest = createHash('sha256')
      .update(JSON.stringify(payload), 'utf8')
      .digest('hex');

    return Object.freeze({
      ...payload,
      digest,
    });
  }

  journalJsonLines(): string {
    return this.#journal.toJsonLines();
  }
}
