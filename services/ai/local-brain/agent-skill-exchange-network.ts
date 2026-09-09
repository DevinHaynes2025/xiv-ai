/**
 * 62L-DO Agent Skill Exchange Network —
 * Evidence-backed skill exchange; skill ≠ permission grant.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DO_LOCKS,
  HONESTY_BANNER,
  MAX_SKILL_EXCHANGES,
  SKILL_NO_PERMISSION_ESCALATION,
  type DoActor,
} from './distributed-cognitive-runtime-plugin-mesh-types';

export type SkillExchangeRecord = {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  skillId: string;
  evidenceRef: string | null;
  fromPermissionLevel: number;
  toPermissionLevelBefore: number;
  toPermissionLevelAfter: number;
  permissionEscalated: false;
  status: 'exchanged' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  exchanges: SkillExchangeRecord[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-skill-exchange-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { exchanges: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentSkillExchangeNetworkHonesty() {
  return {
    banner: HONESTY_BANNER,
    skillExchangeEscalatesPermissions: DO_LOCKS.SKILL_EXCHANGE_ESCALATES_PERMISSIONS,
    skillExchangeEqPermissionGrant: DO_LOCKS.SKILL_EXCHANGE_EQ_PERMISSION_GRANT,
  };
}

export async function exchangeSkillWithEvidence(input: {
  fromAgentId: string;
  toAgentId: string;
  skillId: string;
  evidenceRef?: string | null;
  fromPermissionLevel: number;
  toPermissionLevel: number;
  attemptEscalateTo?: number;
  root: string;
  actor: DoActor;
}): Promise<SkillExchangeRecord> {
  const store = await load(input.root);
  void input.actor;
  if (store.exchanges.length >= MAX_SKILL_EXCHANGES) {
    throw new Error('MAX_SKILL_EXCHANGES_REACHED');
  }

  const evidenceRef = input.evidenceRef?.trim() || null;
  const attemptEscalate = typeof input.attemptEscalateTo === 'number';
  const escalateAbove = attemptEscalate && input.attemptEscalateTo! > input.toPermissionLevel;

  if (!evidenceRef || escalateAbove) {
    const denied: SkillExchangeRecord = {
      id: id('doskill'),
      fromAgentId: input.fromAgentId,
      toAgentId: input.toAgentId,
      skillId: input.skillId,
      evidenceRef,
      fromPermissionLevel: input.fromPermissionLevel,
      toPermissionLevelBefore: input.toPermissionLevel,
      toPermissionLevelAfter: input.toPermissionLevel,
      permissionEscalated: false,
      status: 'denied',
      reason: !evidenceRef
        ? 'SKILL_EXCHANGE_REQUIRES_EVIDENCE'
        : SKILL_NO_PERMISSION_ESCALATION,
      at: new Date().toISOString(),
    };
    store.exchanges.push(denied);
    await save(input.root, store);
    return denied;
  }

  const record: SkillExchangeRecord = {
    id: id('doskill'),
    fromAgentId: input.fromAgentId,
    toAgentId: input.toAgentId,
    skillId: input.skillId,
    evidenceRef,
    fromPermissionLevel: input.fromPermissionLevel,
    toPermissionLevelBefore: input.toPermissionLevel,
    toPermissionLevelAfter: input.toPermissionLevel,
    permissionEscalated: false,
    status: 'exchanged',
    reason: `${SKILL_NO_PERMISSION_ESCALATION}; evidence-backed template exchanged`,
    at: new Date().toISOString(),
  };
  store.exchanges.push(record);
  await save(input.root, store);
  return record;
}
