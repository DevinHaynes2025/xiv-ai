import {
  createFabricRuntimeEvent,
  type FabricRuntimeEvent,
  type FabricRuntimeEventInput,
  type FabricRuntimeEventKind,
  type FabricRuntimeStatus,
} from './xvi-agent-fabric-runtime-event';

export interface FabricRuntimeSnapshot {
  version: 'xvi-runtime-snapshot-v1';

  tenantId: string;
  missionId: string;

  sequence: number;
  occurredAtMs: number;

  lastEvent: FabricRuntimeEventKind;
  status: FabricRuntimeStatus;

  eventCount: number;

  providerCalls: 0;
  processSpawns: 0;
  productionAuthority: false;
  secretMaterialIncluded: false;
}

export const XVI_RUNTIME_STREAM_GUARDRAILS =
  Object.freeze({
    providerCalls: 0,
    processSpawns: 0,
    productionAuthority: false,
    secretMaterialIncluded: false,
    maximumEvents: 100_000,
    automaticExecution: false,
  });

const refuse = (): never => {
  throw new Error('XVI_RUNTIME_STREAM_REFUSED');
};

const TRANSITIONS: Readonly<
  Record<
    FabricRuntimeEventKind,
    readonly FabricRuntimeEventKind[]
  >
> = Object.freeze({
  MISSION_STARTED: [
    'TICK_STARTED',
    'REVIEW_REQUIRED',
    'MISSION_STOPPED',
  ],

  TICK_STARTED: [
    'WORK_STARTED',
    'FAILURE_RECORDED',
    'OWNERSHIP_LOST',
  ],

  WORK_STARTED: [
    'WORK_COMPLETED',
    'FAILURE_RECORDED',
    'OWNERSHIP_LOST',
  ],

  WORK_COMPLETED: [
    'CHECKPOINT_STARTED',
    'HEARTBEAT_RENEWED',
    'TICK_STARTED',
    'MISSION_STOPPED',
    'FAILURE_RECORDED',
    'OWNERSHIP_LOST',
  ],

  CHECKPOINT_STARTED: [
    'CHECKPOINT_COMPLETED',
    'FAILURE_RECORDED',
    'OWNERSHIP_LOST',
  ],

  CHECKPOINT_COMPLETED: [
    'HEARTBEAT_RENEWED',
    'TICK_STARTED',
    'MISSION_STOPPED',
    'FAILURE_RECORDED',
    'OWNERSHIP_LOST',
  ],

  HEARTBEAT_RENEWED: [
    'TICK_STARTED',
    'MISSION_STOPPED',
    'FAILURE_RECORDED',
    'OWNERSHIP_LOST',
  ],

  FAILURE_RECORDED: [
    'TICK_STARTED',
    'REVIEW_REQUIRED',
    'MISSION_STOPPED',
    'OWNERSHIP_LOST',
  ],

  OWNERSHIP_LOST: [
    'REVIEW_REQUIRED',
    'MISSION_STOPPED',
  ],

  REVIEW_REQUIRED: [
    'MISSION_STOPPED',
  ],

  MISSION_STOPPED: [],
});

export class XviFabricRuntimeStream {
  readonly #tenantId: string;
  readonly #missionId: string;

  #events: Readonly<FabricRuntimeEvent>[] = [];

  constructor(
    tenantId: string,
    missionId: string,
  ) {
    /*
     * Reuse the already hardened event admission
     * boundary to validate stream identity.
     */
    const identity =
      createFabricRuntimeEvent({
        tenantId,
        missionId,
        sequence: 1,
        occurredAtMs: 0,
        kind: 'MISSION_STARTED',
      });

    this.#tenantId = identity.tenantId;
    this.#missionId = identity.missionId;
  }

  append(
    input: FabricRuntimeEventInput,
  ): Readonly<FabricRuntimeEvent> {
    if (
      this.#events.length >=
      XVI_RUNTIME_STREAM_GUARDRAILS.maximumEvents
    ) {
      refuse();
    }

    const event =
      createFabricRuntimeEvent(input);

    if (
      event.tenantId !== this.#tenantId ||
      event.missionId !== this.#missionId
    ) {
      refuse();
    }

    const previous =
      this.#events.at(-1);

    if (!previous) {
      if (
        event.sequence !== 1 ||
        event.kind !== 'MISSION_STARTED'
      ) {
        refuse();
      }
    } else {
      if (
        event.sequence !== previous.sequence + 1 ||
        event.occurredAtMs < previous.occurredAtMs
      ) {
        refuse();
      }

      const allowed =
        TRANSITIONS[previous.kind];

      if (!allowed.includes(event.kind)) {
        refuse();
      }
    }

    this.#events = [
      ...this.#events,
      event,
    ];

    return event;
  }

  snapshot(): Readonly<FabricRuntimeSnapshot> {
    const last =
      this.#events.at(-1);

    if (!last) {
      refuse();
    }

    return Object.freeze({
      version:
        'xvi-runtime-snapshot-v1' as const,

      tenantId: this.#tenantId,
      missionId: this.#missionId,

      sequence: last.sequence,
      occurredAtMs: last.occurredAtMs,

      lastEvent: last.kind,
      status: last.status,

      eventCount: this.#events.length,

      providerCalls: 0 as const,
      processSpawns: 0 as const,
      productionAuthority: false as const,
      secretMaterialIncluded: false as const,
    });
  }

  events():
    readonly Readonly<FabricRuntimeEvent>[] {
    return Object.freeze(
      [...this.#events],
    );
  }
}
