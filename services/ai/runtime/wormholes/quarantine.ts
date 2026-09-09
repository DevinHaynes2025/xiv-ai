/**
 * 62L-EX18 — Black-hole quarantine / dead-letter.
 * Quarantined items cannot participate in active routing.
 */

import { createHash } from 'node:crypto';
import { EX18_LOCKS, ex18Deny, type Ex18Denial, type XivWormholeRoute } from './types.ts';

export type QuarantineRecord = {
  quarantineId: string;
  wormholeId: string;
  reason: string;
  integrityHashExpected: string | null;
  integrityHashActual: string | null;
  atIso: string;
  activeRoutingAllowed: false;
  deadLetter: true;
};

const quarantineStore = new Map<string, QuarantineRecord>();

export function quarantineIdFor(wormholeId: string, reason: string): string {
  return createHash('sha256')
    .update(`quarantine:${wormholeId}:${reason}`)
    .digest('hex')
    .slice(0, 24);
}

export function quarantineWormhole(input: {
  route: XivWormholeRoute;
  reason: string;
  expectedIntegrity?: string | null;
  actualIntegrity?: string | null;
  atIso: string;
}): QuarantineRecord {
  const record: QuarantineRecord = {
    quarantineId: quarantineIdFor(input.route.wormholeId, input.reason),
    wormholeId: input.route.wormholeId,
    reason: input.reason,
    integrityHashExpected: input.expectedIntegrity ?? input.route.integrityHash,
    integrityHashActual: input.actualIntegrity ?? null,
    atIso: input.atIso,
    activeRoutingAllowed: false,
    deadLetter: true,
  };
  quarantineStore.set(input.route.wormholeId, record);
  return record;
}

export function isQuarantined(wormholeId: string): boolean {
  return quarantineStore.has(wormholeId);
}

export function getQuarantine(wormholeId: string): QuarantineRecord | null {
  return quarantineStore.get(wormholeId) ?? null;
}

export function clearQuarantineStore(): void {
  quarantineStore.clear();
}

export function denyIfQuarantined(wormholeId: string): Ex18Denial | null {
  if (!isQuarantined(wormholeId)) return null;
  if (EX18_LOCKS.QUARANTINED_IN_ACTIVE_ROUTING === true) {
    return ex18Deny('Invariant broken: quarantined allowed in active routing.', 'QUARANTINED');
  }
  const q = getQuarantine(wormholeId)!;
  return ex18Deny(
    `Quarantined wormhole cannot participate in active routing: ${q.reason}`,
    'QUARANTINED',
  );
}

export function quarantineOnIntegrityMismatch(input: {
  route: XivWormholeRoute;
  expectedHash: string;
  actualHash: string;
  atIso: string;
}): QuarantineRecord | null {
  if (input.expectedHash === input.actualHash) return null;
  return quarantineWormhole({
    route: input.route,
    reason: 'Integrity hash mismatch → black-hole quarantine / dead-letter.',
    expectedIntegrity: input.expectedHash,
    actualIntegrity: input.actualHash,
    atIso: input.atIso,
  });
}
