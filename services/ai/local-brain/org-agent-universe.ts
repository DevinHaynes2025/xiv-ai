import { createHash, randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BL_LOCKS,
  CROSS_ORG_ACCESS_DENIED,
  type BlActor,
  type DepartmentId,
  type ExecutionProfile,
} from './org-agent-universe-types';

export const ORG_UNIVERSE_FILE = 'org-agent-universes.json';

export type OrgKnowledgePack = {
  id: string;
  label: string;
  /** Label alone never grants access. */
  labelIsAccess: false;
  sealed: boolean;
};

export type OrgToolBinding = {
  id: string;
  name: string;
  leastPrivilege: true;
  productionAuthorized: false;
};

export type OrgWorkflow = {
  id: string;
  name: string;
  recommendationOnly: true;
  chargeOrDeploy: false;
};

export type OrgAuthorityBoundary = {
  orgId: string;
  universeId: string;
  maxAuthorityLevel: number;
  /** Learning outcomes never elevate authority. */
  learningIsAuthority: false;
  /** Synapse connect does not swallow sealed data or transfer authority. */
  connectEqualsSwallow: false;
  connectEqualsLeakSealed: false;
};

export type OrgAgentUniverse = {
  id: string;
  orgId: string;
  tenantId: string;
  name: string;
  isolated: true;
  departments: DepartmentId[];
  memoryNotes: string[];
  executionProfile: ExecutionProfile;
  knowledgePacks: OrgKnowledgePack[];
  tools: OrgToolBinding[];
  workflows: OrgWorkflow[];
  authority: OrgAuthorityBoundary;
  /** Governed synapse target — connect ≠ swallow; connect ≠ leak. */
  globalOpsSynapseAllowed: boolean;
  createdAt: string;
  productionAuthorized: false;
};

export type CrossOrgAccessAttempt = {
  id: string;
  at: string;
  fromOrgId: string;
  toOrgId: string;
  fromUniverseId: string;
  toUniverseId: string;
  actorId: string;
  allowed: false;
  reason: string;
};

type UniverseStore = {
  universes: OrgAgentUniverse[];
  crossOrgDenials: CrossOrgAccessAttempt[];
};

const MAX_UNIVERSES = 2_000;
const MAX_DENIALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, ORG_UNIVERSE_FILE);
}

async function load(root: string): Promise<UniverseStore> {
  const parsed = await readJsonFile<UniverseStore>(storePath(root), {
    universes: [],
    crossOrgDenials: [],
  });
  return {
    universes: Array.isArray(parsed.universes) ? parsed.universes : [],
    crossOrgDenials: Array.isArray(parsed.crossOrgDenials) ? parsed.crossOrgDenials : [],
  };
}

async function save(root: string, store: UniverseStore) {
  await writeJsonFileAtomic(storePath(root), {
    universes: store.universes.slice(-MAX_UNIVERSES),
    crossOrgDenials: store.crossOrgDenials.slice(-MAX_DENIALS),
  });
}

function universeIdFor(orgId: string) {
  const digest = createHash('sha256').update(`org-universe:${orgId}`).digest('hex').slice(0, 16);
  return `org_univ_${digest}`;
}

/**
 * Each organization gets an isolated AI Universe with department councils,
 * org memory, local/cloud profiles, knowledge packs, tools, workflows,
 * and authority boundaries. Cross-org access is deny-by-default.
 */
export async function declareOrgAgentUniverse(input: {
  orgId: string;
  tenantId: string;
  name: string;
  departments?: DepartmentId[];
  executionProfile?: ExecutionProfile;
  actor: BlActor;
  root?: string;
  now?: number;
}) {
  if (!input.orgId || !input.tenantId) {
    return { accepted: false as const, reason: 'ORG_AND_TENANT_REQUIRED' };
  }
  if (input.actor.orgId !== input.orgId) {
    return { accepted: false as const, reason: CROSS_ORG_ACCESS_DENIED };
  }
  if (input.executionProfile === 'cloud_verified') {
    // Unverified cloud remains unavailable; profile may be declared but routes stay UNAVAILABLE until verified.
  }

  const root = input.root ?? process.cwd();
  const store = await load(root);
  const existing = store.universes.find((item) => item.orgId === input.orgId);
  if (existing) {
    return { accepted: true as const, universe: existing, reason: 'ORG_UNIVERSE_ALREADY_DECLARED' };
  }

  const id = universeIdFor(input.orgId);
  const universe: OrgAgentUniverse = {
    id,
    orgId: input.orgId,
    tenantId: input.tenantId,
    name: input.name,
    isolated: true,
    departments: input.departments ?? ['engineering', 'operations', 'security'],
    memoryNotes: [],
    executionProfile: input.executionProfile ?? 'local_only',
    knowledgePacks: [],
    tools: [],
    workflows: [],
    authority: {
      orgId: input.orgId,
      universeId: id,
      maxAuthorityLevel: 1,
      learningIsAuthority: false,
      connectEqualsSwallow: false,
      connectEqualsLeakSealed: false,
    },
    globalOpsSynapseAllowed: true,
    createdAt: new Date(input.now ?? Date.now()).toISOString(),
    productionAuthorized: false,
  };

  store.universes.push(universe);
  await save(root, store);
  return {
    accepted: true as const,
    universe,
    reason: 'Isolated Organization AI Agent Universe declared (deny-by-default cross-org).',
  };
}

export async function appendOrgMemory(input: {
  orgId: string;
  note: string;
  actor: BlActor;
  sealed?: boolean;
  root?: string;
}) {
  if (input.actor.orgId !== input.orgId) {
    return { accepted: false as const, reason: CROSS_ORG_ACCESS_DENIED, learningIsAuthority: false as const };
  }
  if (input.sealed) {
    return {
      accepted: false as const,
      reason: 'SEALED_MEMORY_REQUIRES_TRUST_SURFACE',
      learningIsAuthority: false as const,
    };
  }
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const universe = store.universes.find((item) => item.orgId === input.orgId);
  if (!universe) return { accepted: false as const, reason: 'ORG_UNIVERSE_NOT_FOUND', learningIsAuthority: false as const };
  if (!input.note.trim()) return { accepted: false as const, reason: 'NOTE_REQUIRED', learningIsAuthority: false as const };

  universe.memoryNotes.push(input.note.slice(0, 4_000));
  universe.memoryNotes = universe.memoryNotes.slice(-500);
  // Learning ≠ authority — maxAuthorityLevel never bumps from memory writes.
  universe.authority.learningIsAuthority = false;
  await save(root, store);
  return {
    accepted: true as const,
    reason: 'Org memory note appended; learningIsAuthority=false.',
    learningIsAuthority: false as const,
    maxAuthorityLevel: universe.authority.maxAuthorityLevel,
  };
}

export async function attachKnowledgePack(input: {
  orgId: string;
  label: string;
  sealed?: boolean;
  actor: BlActor;
  root?: string;
}) {
  if (input.actor.orgId !== input.orgId) {
    return { accepted: false as const, reason: CROSS_ORG_ACCESS_DENIED };
  }
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const universe = store.universes.find((item) => item.orgId === input.orgId);
  if (!universe) return { accepted: false as const, reason: 'ORG_UNIVERSE_NOT_FOUND' };

  const pack: OrgKnowledgePack = {
    id: `pack_${randomUUID()}`,
    label: input.label,
    labelIsAccess: false,
    sealed: input.sealed === true,
  };
  universe.knowledgePacks.push(pack);
  await save(root, store);
  return {
    accepted: true as const,
    pack,
    reason: 'Knowledge pack attached; label ≠ access.',
    labelIsAccess: false as const,
  };
}

export async function bindOrgTool(input: {
  orgId: string;
  name: string;
  actor: BlActor;
  root?: string;
}) {
  if (input.actor.orgId !== input.orgId) {
    return { accepted: false as const, reason: CROSS_ORG_ACCESS_DENIED };
  }
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const universe = store.universes.find((item) => item.orgId === input.orgId);
  if (!universe) return { accepted: false as const, reason: 'ORG_UNIVERSE_NOT_FOUND' };

  const tool: OrgToolBinding = {
    id: `tool_${randomUUID()}`,
    name: input.name,
    leastPrivilege: true,
    productionAuthorized: false,
  };
  universe.tools.push(tool);
  await save(root, store);
  return { accepted: true as const, tool, reason: 'Tool bound under least privilege; productionAuthorized=false.' };
}

export async function declareOrgWorkflow(input: {
  orgId: string;
  name: string;
  actor: BlActor;
  root?: string;
}) {
  if (input.actor.orgId !== input.orgId) {
    return { accepted: false as const, reason: CROSS_ORG_ACCESS_DENIED };
  }
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const universe = store.universes.find((item) => item.orgId === input.orgId);
  if (!universe) return { accepted: false as const, reason: 'ORG_UNIVERSE_NOT_FOUND' };

  const workflow: OrgWorkflow = {
    id: `wf_${randomUUID()}`,
    name: input.name,
    recommendationOnly: true,
    chargeOrDeploy: false,
  };
  universe.workflows.push(workflow);
  await save(root, store);
  return {
    accepted: true as const,
    workflow,
    reason: 'Workflow declared as recommendation-only; recommendation ≠ charge/deploy.',
  };
}

/**
 * Cross-org Universe access is deny-by-default. Isolation is hard.
 */
export async function attemptCrossOrgUniverseAccess(input: {
  fromOrgId: string;
  toOrgId: string;
  fromUniverseId: string;
  toUniverseId: string;
  actor: BlActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const denial: CrossOrgAccessAttempt = {
    id: `xorg_${randomUUID()}`,
    at: new Date().toISOString(),
    fromOrgId: input.fromOrgId,
    toOrgId: input.toOrgId,
    fromUniverseId: input.fromUniverseId,
    toUniverseId: input.toUniverseId,
    actorId: input.actor.id,
    allowed: false,
    reason: CROSS_ORG_ACCESS_DENIED,
  };
  store.crossOrgDenials.push(denial);
  await save(root, store);
  return {
    allowed: false as const,
    reason: CROSS_ORG_ACCESS_DENIED,
    denial,
    locks: {
      ORG_UNIVERSE_ISOLATION: BL_LOCKS.ORG_UNIVERSE_ISOLATION,
      CROSS_ORG_ACCESS_DEFAULT: BL_LOCKS.CROSS_ORG_ACCESS_DEFAULT,
    },
  };
}

export async function getOrgUniverse(orgId: string, root = process.cwd()) {
  const store = await load(root);
  return store.universes.find((item) => item.orgId === orgId) ?? null;
}

export async function listOrgUniverses(root = process.cwd()) {
  return (await load(root)).universes;
}

export async function listCrossOrgDenials(root = process.cwd()) {
  return (await load(root)).crossOrgDenials;
}

export function orgUniverseHonesty() {
  return {
    orgUniverseIsolation: true as const,
    crossOrgAccessDefault: 'DENIED' as const,
    labelIsAccess: false as const,
    learningIsAuthority: false as const,
    recommendationIsChargeOrDeploy: false as const,
    connectEqualsSwallow: false as const,
    connectEqualsLeakSealed: false as const,
    productionAuthorization: false as const,
    locks: BL_LOCKS,
  };
}
