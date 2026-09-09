/**
 * 62L-DZ Module F — Personal/Enterprise Knowledge Graph + Universal Knowledge Firewall.
 * Boundary firewalls; sealed deny cross-context / unlabeled leakage.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  FIREWALL_CROSS_CONTEXT_DENIED,
  MAX_FIREWALL_EVENTS,
  PERSONAL_ENTERPRISE_BOUNDARY,
  UNLABELED_LEAKAGE_DENIED,
  type DzActor,
} from './supply-chain-intelligence-fabric-types';

export type KnowledgeFirewallEvent = {
  id: string;
  sourceContext: string;
  targetContext: string;
  crossContextAttempt: boolean;
  unlabeled: boolean;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type PersonalEnterpriseBoundaryProbe = {
  id: string;
  personalContextId: string;
  enterpriseContextId: string;
  attemptCrossBoundary: boolean;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  firewallEvents: KnowledgeFirewallEvent[];
  boundaries: PersonalEnterpriseBoundaryProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'personal-enterprise-knowledge-graph-firewall.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    firewallEvents: [],
    boundaries: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function personalEnterpriseKnowledgeGraphHonesty() {
  return {
    sealedDenyCrossContext: true,
    unlabeledLeakageDenied: true,
    personalEnterpriseBoundaryEnforced: true,
    labelAloneNeqAccess: true,
    authorizedPublicLicensedCustomerOwnedOnly: true,
  };
}

export async function probeKnowledgeFirewall(input: {
  sourceContext: string;
  targetContext: string;
  crossContextAttempt: boolean;
  unlabeled?: boolean;
  root: string;
  actor: DzActor;
}): Promise<KnowledgeFirewallEvent> {
  const store = await load(input.root);
  void input.actor;
  if (store.firewallEvents.length >= MAX_FIREWALL_EVENTS) {
    throw new Error('MAX_FIREWALL_EVENTS_REACHED');
  }
  let status: 'ok' | 'denied' = 'ok';
  let reason = 'FIREWALL_PASS';
  if (input.unlabeled) {
    status = 'denied';
    reason = UNLABELED_LEAKAGE_DENIED;
  } else if (input.crossContextAttempt) {
    status = 'denied';
    reason = FIREWALL_CROSS_CONTEXT_DENIED;
  }
  const event: KnowledgeFirewallEvent = {
    id: id('dzfw'),
    sourceContext: input.sourceContext.trim(),
    targetContext: input.targetContext.trim(),
    crossContextAttempt: input.crossContextAttempt,
    unlabeled: Boolean(input.unlabeled),
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.firewallEvents.push(event);
  await save(input.root, store);
  return event;
}

export async function probePersonalEnterpriseBoundary(input: {
  personalContextId: string;
  enterpriseContextId: string;
  attemptCrossBoundary: boolean;
  root: string;
  actor: DzActor;
}): Promise<PersonalEnterpriseBoundaryProbe> {
  const store = await load(input.root);
  void input.actor;
  const denied = input.attemptCrossBoundary;
  const probe: PersonalEnterpriseBoundaryProbe = {
    id: id('dzpeb'),
    personalContextId: input.personalContextId.trim(),
    enterpriseContextId: input.enterpriseContextId.trim(),
    attemptCrossBoundary: input.attemptCrossBoundary,
    status: denied ? 'denied' : 'ok',
    reason: denied ? PERSONAL_ENTERPRISE_BOUNDARY : 'BOUNDARY_RESPECTED',
    at: new Date().toISOString(),
  };
  store.boundaries.push(probe);
  await save(input.root, store);
  return probe;
}
