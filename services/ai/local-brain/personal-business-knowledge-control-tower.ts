/**
 * 62L-ED Module G — Personal/Business Knowledge Control Tower.
 * Unified tower; personal↔business firewall; ACL; sealed deny cross-context.
 * Label alone ≠ access.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CROSS_CONTEXT_SEALED_DENY,
  KNOWLEDGE_TOWER_ACL_DENIED,
  MAX_TOWER_EVENTS,
  PERSONAL_BUSINESS_FIREWALL,
  type EdActor,
  type EdEvidenceState,
} from './data-galaxy-industry-memory-os-types';

export type KnowledgeTowerAccess = {
  id: string;
  knowledgeId: string;
  context: 'personal' | 'business';
  aclGranted: boolean;
  labelPresent: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type FirewallProbe = {
  id: string;
  sourceContext: 'personal' | 'business';
  targetContext: 'personal' | 'business';
  crossContextAttempt: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  accesses: KnowledgeTowerAccess[];
  firewalls: FirewallProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'personal-business-knowledge-control-tower.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    accesses: [],
    firewalls: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function personalBusinessKnowledgeControlTowerHonesty() {
  return {
    unifiedControlTower: true,
    personalBusinessFirewall: true,
    aclDenyByDefault: true,
    sealedDenyCrossContext: true,
    labelAloneNeqAccess: true,
    l4AutonomyEnabled: false,
  };
}

export async function accessKnowledgeControlTower(input: {
  knowledgeId: string;
  context: 'personal' | 'business';
  aclGranted: boolean;
  labelPresent?: boolean;
  root: string;
  actor: EdActor;
}): Promise<KnowledgeTowerAccess> {
  const store = await load(input.root);
  void input.actor;
  if (store.accesses.length >= MAX_TOWER_EVENTS) {
    throw new Error('MAX_TOWER_EVENTS');
  }
  const denied = !input.aclGranted;
  const row: KnowledgeTowerAccess = {
    id: id('edtower'),
    knowledgeId: input.knowledgeId,
    context: input.context,
    aclGranted: input.aclGranted,
    labelPresent: Boolean(input.labelPresent),
    status: denied ? 'denied' : 'ok',
    state: denied ? 'DENIED' : 'AUTHORIZED',
    reason: denied ? KNOWLEDGE_TOWER_ACL_DENIED : 'KNOWLEDGE_TOWER_ACL_OK',
    at: new Date().toISOString(),
  };
  store.accesses.push(row);
  await save(input.root, store);
  return row;
}

export async function probePersonalBusinessFirewall(input: {
  sourceContext: 'personal' | 'business';
  targetContext: 'personal' | 'business';
  crossContextAttempt: boolean;
  root: string;
  actor: EdActor;
}): Promise<FirewallProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.firewalls.length >= MAX_TOWER_EVENTS) {
    throw new Error('MAX_TOWER_EVENTS');
  }
  const cross =
    input.crossContextAttempt ||
    input.sourceContext !== input.targetContext;
  const row: FirewallProbe = {
    id: id('edfw'),
    sourceContext: input.sourceContext,
    targetContext: input.targetContext,
    crossContextAttempt: cross,
    status: cross ? 'denied' : 'ok',
    state: cross ? 'DENIED' : 'AUTHORIZED',
    reason: cross
      ? input.crossContextAttempt
        ? CROSS_CONTEXT_SEALED_DENY
        : PERSONAL_BUSINESS_FIREWALL
      : PERSONAL_BUSINESS_FIREWALL,
    at: new Date().toISOString(),
  };
  if (cross) {
    row.status = 'denied';
    row.state = 'DENIED';
    row.reason = CROSS_CONTEXT_SEALED_DENY;
  } else {
    row.reason = PERSONAL_BUSINESS_FIREWALL;
  }
  store.firewalls.push(row);
  await save(input.root, store);
  return row;
}
