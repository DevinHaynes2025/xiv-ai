import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BP_LOCKS,
  LEARNING_NOT_AUTHORITY,
  SKILL_NOT_PERMISSION,
} from './cognitive-homeostasis-types';

/**
 * Multi-Agent Skill Exchange — governed exchange of evidence-backed skills /
 * templates between agents. Skill exchange ≠ permission grant; learning ≠
 * authority. Permissions and authority levels never escalate via exchange.
 */

export const SKILL_EXCHANGE_STORE = 'multi-agent-skill-exchange.json';

export type SkillTemplate = {
  id: string;
  skillKey: string;
  label: string;
  evidenceRefs: string[];
  version: number;
  /** Explicit non-authority markers. */
  skillIsPermissionGrant: false;
  learningIsAuthority: false;
};

export type SkillExchangeRecord = {
  id: string;
  at: string;
  fromOrgId: string;
  toOrgId: string;
  fromAgentId: string;
  toAgentId: string;
  tenantId: string;
  universeId: string;
  skill: SkillTemplate;
  fromPermissionLevel: number;
  toPermissionLevelBefore: number;
  toPermissionLevelAfter: number;
  fromAuthorityLevel: number;
  toAuthorityLevelBefore: number;
  toAuthorityLevelAfter: number;
  permissionEscalated: false;
  authorityEscalated: false;
  productionAuthorized: false;
};

type ExchangeStore = {
  exchanges: SkillExchangeRecord[];
  denials: Array<{ id: string; at: string; reason: string; fromAgentId: string; toAgentId: string }>;
};

const MAX_EXCHANGES = 5_000;
const MAX_DENIALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, SKILL_EXCHANGE_STORE);
}

async function load(root: string): Promise<ExchangeStore> {
  const parsed = await readJsonFile<ExchangeStore>(storePath(root), {
    exchanges: [],
    denials: [],
  });
  return {
    exchanges: Array.isArray(parsed.exchanges) ? parsed.exchanges : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: ExchangeStore) {
  await writeJsonFileAtomic(storePath(root), {
    exchanges: store.exchanges.slice(-MAX_EXCHANGES),
    denials: store.denials.slice(-MAX_DENIALS),
  });
}

export type SkillExchangeInput = {
  fromOrgId: string;
  toOrgId: string;
  fromAgentId: string;
  toAgentId: string;
  tenantId: string;
  universeId: string;
  skillKey: string;
  label: string;
  evidenceRefs?: string[];
  version?: number;
  fromPermissionLevel?: number;
  toPermissionLevel?: number;
  fromAuthorityLevel?: number;
  toAuthorityLevel?: number;
  /** Hard-deny probes. */
  attemptPermissionGrantViaExchange?: boolean;
  attemptAuthorityEscalation?: boolean;
  /** Require evidence — exchange denied without it. */
  requireEvidence?: boolean;
  root?: string;
};

export type SkillExchangeResult = {
  accepted: boolean;
  reason: string;
  exchange: SkillExchangeRecord | null;
  permissionEscalated: false;
  authorityEscalated: false;
  skillIsPermissionGrant: false;
  learningIsAuthority: false;
  productionAuthorization: false;
};

export async function exchangeAgentSkill(input: SkillExchangeInput): Promise<SkillExchangeResult> {
  const root = input.root ?? process.cwd();
  const fromPerm = input.fromPermissionLevel ?? 0;
  const toPerm = input.toPermissionLevel ?? 0;
  const fromAuth = input.fromAuthorityLevel ?? 0;
  const toAuth = input.toAuthorityLevel ?? 0;

  const deny = async (reason: string): Promise<SkillExchangeResult> => {
    const store = await load(root);
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason,
      fromAgentId: input.fromAgentId,
      toAgentId: input.toAgentId,
    });
    await save(root, store);
    return {
      accepted: false,
      reason,
      exchange: null,
      permissionEscalated: false,
      authorityEscalated: false,
      skillIsPermissionGrant: false,
      learningIsAuthority: false,
      productionAuthorization: false,
    };
  };

  if (!input.fromOrgId || !input.toOrgId || !input.fromAgentId || !input.toAgentId) {
    return deny('AGENTS_AND_ORGS_REQUIRED');
  }
  if (!input.tenantId || !input.universeId || !input.skillKey) {
    return deny('TENANT_UNIVERSE_SKILL_REQUIRED');
  }

  if (input.attemptPermissionGrantViaExchange === true) {
    return deny(SKILL_NOT_PERMISSION);
  }
  if (input.attemptAuthorityEscalation === true) {
    return deny(LEARNING_NOT_AUTHORITY);
  }

  const evidenceRefs = input.evidenceRefs ?? [];
  if (input.requireEvidence !== false && evidenceRefs.length === 0) {
    return deny('SKILL_EXCHANGE_REQUIRES_EVIDENCE');
  }

  const skill: SkillTemplate = {
    id: randomUUID(),
    skillKey: input.skillKey,
    label: input.label,
    evidenceRefs,
    version: input.version ?? 1,
    skillIsPermissionGrant: false,
    learningIsAuthority: false,
  };

  // Receiver keeps their existing permission/authority — exchange never raises them.
  const exchange: SkillExchangeRecord = {
    id: randomUUID(),
    at: new Date().toISOString(),
    fromOrgId: input.fromOrgId,
    toOrgId: input.toOrgId,
    fromAgentId: input.fromAgentId,
    toAgentId: input.toAgentId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    skill,
    fromPermissionLevel: fromPerm,
    toPermissionLevelBefore: toPerm,
    toPermissionLevelAfter: toPerm,
    fromAuthorityLevel: fromAuth,
    toAuthorityLevelBefore: toAuth,
    toAuthorityLevelAfter: toAuth,
    permissionEscalated: false,
    authorityEscalated: false,
    productionAuthorized: false,
  };

  const store = await load(root);
  store.exchanges.push(exchange);
  await save(root, store);

  return {
    accepted: true,
    reason: `${SKILL_NOT_PERMISSION}; ${LEARNING_NOT_AUTHORITY}; evidence-backed template exchanged.`,
    exchange,
    permissionEscalated: false,
    authorityEscalated: false,
    skillIsPermissionGrant: false,
    learningIsAuthority: false,
    productionAuthorization: false,
  };
}

export async function listSkillExchanges(root = process.cwd()) {
  const store = await load(root);
  return store.exchanges;
}

export function skillExchangeHonesty() {
  return {
    locks: BP_LOCKS,
    skillExchangeIsPermissionGrant: BP_LOCKS.SKILL_EXCHANGE_IS_PERMISSION_GRANT,
    learningIsAuthority: BP_LOCKS.LEARNING_IS_AUTHORITY,
    productionAuthorization: false as const,
  };
}
