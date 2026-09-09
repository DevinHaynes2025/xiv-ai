/**
 * 62L-EA Module H — Secure OS Integration Foundation.
 * Cross-OS install: explicit, consented, revocable, auditable.
 * Denies: stealth install, unauthorized takeover, permission bypass,
 * silent persistence. Soft-wire DZ promotion gate. Twin ≠ founder.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CROSS_OS_CONSENT_REQUIRED,
  DZ_PROMOTION_GATE_SOFT_WIRE,
  MAX_OS_EVENTS,
  PERMISSION_BYPASS_DENIED,
  PROMOTION_GATE,
  SILENT_PERSISTENCE_DENIED,
  STEALTH_INSTALL_DENIED,
  TWIN_NEQ_FOUNDER,
  UNAUTHORIZED_TAKEOVER_DENIED,
  detectPredecessorLayer,
  predecessorMap,
  type EaActor,
} from './global-operations-intelligence-grid-types';

export type OsIntegrationDenial = {
  id: string;
  action:
    | 'stealth_install'
    | 'unauthorized_takeover'
    | 'permission_bypass'
    | 'silent_persistence';
  status: 'denied';
  reason: string;
  at: string;
};

export type CrossOsInstall = {
  id: string;
  targetOs: string;
  explicit: boolean;
  consented: boolean;
  revocable: boolean;
  auditable: boolean;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type DzPromotionGateSoftWire = {
  id: string;
  dzPresent: boolean;
  selfPromotionAttempted: boolean;
  productionAuthorized: false;
  status: 'denied' | 'gated';
  reason: string;
  at: string;
};

export type TwinAuthorityProbe = {
  id: string;
  claimFounderAuthority: boolean;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  denials: OsIntegrationDenial[];
  installs: CrossOsInstall[];
  promotions: DzPromotionGateSoftWire[];
  twinProbes: TwinAuthorityProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'secure-os-integration-foundation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    denials: [],
    installs: [],
    promotions: [],
    twinProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const ANTI_MALWARE_REASON: Record<OsIntegrationDenial['action'], string> = {
  stealth_install: STEALTH_INSTALL_DENIED,
  unauthorized_takeover: UNAUTHORIZED_TAKEOVER_DENIED,
  permission_bypass: PERMISSION_BYPASS_DENIED,
  silent_persistence: SILENT_PERSISTENCE_DENIED,
};

export function secureOsIntegrationFoundationHonesty(repoRoot?: string) {
  const preds = predecessorMap(repoRoot);
  return {
    antiMalwareHardRules: true,
    stealthInstallForbidden: true,
    unauthorizedTakeoverForbidden: true,
    permissionBypassForbidden: true,
    silentPersistenceForbidden: true,
    crossOsInstallExplicitConsentedRevocableAuditable: true,
    digitalTwinNeqFounder: true,
    promotionGate: PROMOTION_GATE,
    softWiredPredecessors: Object.entries(preds)
      .filter(([, v]) => v.tipProbe === 'PRESENT')
      .map(([k]) => k),
    predecessorLayer: detectPredecessorLayer(repoRoot),
    predecessors: preds,
  };
}

export async function denyOsMaliciousAction(input: {
  action: OsIntegrationDenial['action'];
  root: string;
  actor: EaActor;
}): Promise<OsIntegrationDenial> {
  const store = await load(input.root);
  void input.actor;
  if (store.denials.length >= MAX_OS_EVENTS) {
    throw new Error('MAX_OS_EVENTS_REACHED');
  }
  const denial: OsIntegrationDenial = {
    id: id('eaos'),
    action: input.action,
    status: 'denied',
    reason: ANTI_MALWARE_REASON[input.action],
    at: new Date().toISOString(),
  };
  store.denials.push(denial);
  await save(input.root, store);
  return denial;
}

export async function requestCrossOsInstall(input: {
  targetOs: string;
  explicit: boolean;
  consented: boolean;
  revocable: boolean;
  auditable: boolean;
  root: string;
  actor: EaActor;
}): Promise<CrossOsInstall> {
  const store = await load(input.root);
  void input.actor;
  const complete =
    input.explicit &&
    input.consented &&
    input.revocable &&
    input.auditable;
  const install: CrossOsInstall = {
    id: id('eacos'),
    targetOs: input.targetOs.trim(),
    explicit: input.explicit,
    consented: input.consented,
    revocable: input.revocable,
    auditable: input.auditable,
    status: complete ? 'ok' : 'denied',
    reason: complete
      ? 'CROSS_OS_INSTALL_EXPLICIT_CONSENTED_REVOCABLE_AUDITABLE'
      : CROSS_OS_CONSENT_REQUIRED,
    at: new Date().toISOString(),
  };
  store.installs.push(install);
  await save(input.root, store);
  return install;
}

export async function softWireDzPromotionGate(input: {
  selfPromotionAttempted?: boolean;
  evidencePresent?: boolean;
  testingPassed?: boolean;
  permissionsGranted?: boolean;
  rollbackPlanPresent?: boolean;
  explicitAuthorization?: boolean;
  root: string;
  actor: EaActor;
  repoRoot?: string;
}): Promise<DzPromotionGateSoftWire> {
  const store = await load(input.root);
  void input.actor;
  const preds = predecessorMap(input.repoRoot);
  const dzPresent = preds.DZ.tipProbe === 'PRESENT';
  const complete =
    Boolean(input.evidencePresent) &&
    Boolean(input.testingPassed) &&
    Boolean(input.permissionsGranted) &&
    Boolean(input.rollbackPlanPresent) &&
    Boolean(input.explicitAuthorization) &&
    !input.selfPromotionAttempted;
  const result: DzPromotionGateSoftWire = {
    id: id('eadzpg'),
    dzPresent,
    selfPromotionAttempted: Boolean(input.selfPromotionAttempted),
    productionAuthorized: false,
    status: complete && !input.selfPromotionAttempted ? 'gated' : 'denied',
    reason: DZ_PROMOTION_GATE_SOFT_WIRE,
    at: new Date().toISOString(),
  };
  store.promotions.push(result);
  await save(input.root, store);
  return result;
}

export async function probeDigitalTwinAuthority(input: {
  actor: EaActor;
  claimFounderAuthority: boolean;
  root: string;
}): Promise<TwinAuthorityProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: TwinAuthorityProbe = {
    id: id('eatwin'),
    claimFounderAuthority: input.claimFounderAuthority,
    status: 'denied',
    reason: TWIN_NEQ_FOUNDER,
    at: new Date().toISOString(),
  };
  store.twinProbes.push(probe);
  await save(input.root, store);
  return probe;
}
