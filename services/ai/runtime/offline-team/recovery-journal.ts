export type RecoveryEventKind = 'ENQUEUED' | 'LEASED' | 'CHECKPOINTED' | 'COMPLETED' | 'FAILED' | 'RECOVERED';

export interface RecoveryEvent {
  sequence: number;
  eventId: string;
  workItemId: string;
  kind: RecoveryEventKind;
  actor: string;
  at: string;
  evidence?: string;
}

export class RecoveryJournal {
  private readonly events: RecoveryEvent[] = [];

  append(input: Omit<RecoveryEvent, 'sequence'>): RecoveryEvent {
    if (!input.eventId || !input.workItemId || !input.actor) throw new Error('eventId, workItemId and actor are required');
    if (this.events.some((e) => e.eventId === input.eventId)) throw new Error(`duplicate event: ${input.eventId}`);
    const event = Object.freeze({ ...input, sequence: this.events.length + 1 });
    this.events.push(event);
    return event;
  }

  list(): readonly RecoveryEvent[] {
    return Object.freeze([...this.events]);
  }

  toJsonLines(): string {
    return this.events.map((e) => JSON.stringify(e)).join('\n') + (this.events.length ? '\n' : '');
  }

  restoreJsonLines(text: string): void {
    this.events.length = 0;
    const lines = text.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      const parsed = JSON.parse(line) as RecoveryEvent;
      if (parsed.sequence !== this.events.length + 1) throw new Error('journal sequence gap');
      if (this.events.some((e) => e.eventId === parsed.eventId)) throw new Error('duplicate journal event');
      this.events.push(Object.freeze({ ...parsed }));
    }
  }
}

export const RECOVERY_JOURNAL_GUARDRAILS = {
  appendOnly: true,
  productionControlPlane: false,
  secretsAllowed: false,
  resumesAfterRestart: true,
  claimsWorkDuringPowerOff: false,
} as const;
