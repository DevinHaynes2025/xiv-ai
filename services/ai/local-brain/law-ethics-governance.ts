/**
 * 62L-BW Law / Ethics Governance — enforcement gates for consent, licensing,
 * jurisdiction, ownership, provider access, device enrollment, hardware support.
 * Unknown → DENIED or WAITING_DATA (never silent pass).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BW_LOCKS,
  HONESTY_BANNER,
  UNKNOWN_CONSENT_DENIED,
  UNKNOWN_DEVICE_ENROLLMENT_DENIED,
  UNKNOWN_HARDWARE_SUPPORT_DENIED,
  UNKNOWN_JURISDICTION_DENIED,
  UNKNOWN_LICENSE_DENIED,
  UNKNOWN_OWNERSHIP_DENIED,
  UNKNOWN_PROVIDER_ACCESS_DENIED,
  type BwActor,
} from './planetary-chip-founder-avatar-ethics-types';

export type EthicsDimension =
  | 'consent'
  | 'licensing'
  | 'jurisdiction'
  | 'ownership'
  | 'provider_access'
  | 'device_enrollment'
  | 'hardware_support';

export type EthicsKnowledge = 'known_allowed' | 'known_denied' | 'unknown' | 'waiting_data';

export type EthicsGateResult = {
  id: string;
  dimension: EthicsDimension;
  knowledge: EthicsKnowledge;
  decision: 'ALLOWED' | 'DENIED' | 'WAITING_DATA';
  reason: string;
  silentPass: false;
  at: string;
  actorId: string;
};

type Store = { gates: EthicsGateResult[] };

function storePath(root: string) {
  return xivLocalPath(root, 'law-ethics-governance.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { gates: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const UNKNOWN_REASONS: Record<EthicsDimension, string> = {
  consent: UNKNOWN_CONSENT_DENIED,
  licensing: UNKNOWN_LICENSE_DENIED,
  jurisdiction: UNKNOWN_JURISDICTION_DENIED,
  ownership: UNKNOWN_OWNERSHIP_DENIED,
  provider_access: UNKNOWN_PROVIDER_ACCESS_DENIED,
  device_enrollment: UNKNOWN_DEVICE_ENROLLMENT_DENIED,
  hardware_support: UNKNOWN_HARDWARE_SUPPORT_DENIED,
};

export function lawEthicsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BW_LOCKS.L4_AUTONOMY_ENABLED,
    unknownConsentSilentPass: BW_LOCKS.UNKNOWN_CONSENT_SILENT_PASS,
    unknownLicenseSilentPass: BW_LOCKS.UNKNOWN_LICENSE_SILENT_PASS,
    unknownJurisdictionSilentPass: BW_LOCKS.UNKNOWN_JURISDICTION_SILENT_PASS,
    unknownOwnershipSilentPass: BW_LOCKS.UNKNOWN_OWNERSHIP_SILENT_PASS,
    founderSealedDenyByDefault: BW_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
  };
}

/**
 * Evaluate an ethics dimension. Unknown / waiting_data never silently allow.
 */
export async function evaluateLawEthicsGate(input: {
  dimension: EthicsDimension;
  knowledge: EthicsKnowledge;
  /** Prefer WAITING_DATA over DENIED when knowledge is waiting_data. */
  preferWaitingData?: boolean;
  actor: BwActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  let decision: EthicsGateResult['decision'];
  let reason: string;

  if (input.knowledge === 'known_allowed') {
    decision = 'ALLOWED';
    reason = `ETHICS_${input.dimension.toUpperCase()}_KNOWN_ALLOWED`;
  } else if (input.knowledge === 'known_denied') {
    decision = 'DENIED';
    reason = `ETHICS_${input.dimension.toUpperCase()}_KNOWN_DENIED`;
  } else if (input.knowledge === 'waiting_data' || input.preferWaitingData) {
    decision = 'WAITING_DATA';
    reason = UNKNOWN_REASONS[input.dimension];
  } else {
    // unknown → DENIED (or WAITING_DATA) — never silent pass
    decision = 'DENIED';
    reason = UNKNOWN_REASONS[input.dimension];
  }

  const gate: EthicsGateResult = {
    id: id('ethics'),
    dimension: input.dimension,
    knowledge: input.knowledge,
    decision,
    reason,
    silentPass: false,
    at: new Date().toISOString(),
    actorId: input.actor.id,
  };
  store.gates.push(gate);
  await save(root, store);

  return {
    accepted: decision === 'ALLOWED',
    gate,
    decision,
    reason,
    silentPass: false as const,
  };
}

export async function listLawEthicsGates(root?: string) {
  const store = await load(root ?? process.cwd());
  return store.gates;
}
