import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BO_LOCKS,
  SELF_PERMISSION_EXPANSION_DENIED,
  UNVERIFIED_OUTCOME_REJECTED,
  type OutcomeVerification,
  type PlasticityTarget,
} from './superbrain-neuroplasticity-types';

/**
 * Superbrain Neuroplasticity Engine (software, governed).
 * May improve route weights, retrieval strategies, agent-to-task mappings,
 * workcell composition, cache placement, and local/cloud resource allocation
 * from **verified outcomes** only.
 * Cannot self-expand permissions, bypass human authority, or auto production deploy.
 */

export const PLASTICITY_STORE = 'neuroplasticity-weights.json';

export type PlasticityWeightRecord = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  target: PlasticityTarget;
  key: string;
  weight: number;
  strategyHint: string;
  evidenceRefs: string[];
  verifiedOutcomeId: string;
  updatedAt: string;
  productionAuthorized: false;
  permissionExpanded: false;
};

type PlasticityStore = {
  weights: PlasticityWeightRecord[];
  denials: Array<{ id: string; at: string; reason: string; target?: PlasticityTarget }>;
};

const MAX_WEIGHTS = 5_000;
const MAX_DENIALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, PLASTICITY_STORE);
}

async function load(root: string): Promise<PlasticityStore> {
  const parsed = await readJsonFile<PlasticityStore>(storePath(root), {
    weights: [],
    denials: [],
  });
  return {
    weights: Array.isArray(parsed.weights) ? parsed.weights : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: PlasticityStore) {
  await writeJsonFileAtomic(storePath(root), {
    weights: store.weights.slice(-MAX_WEIGHTS),
    denials: store.denials.slice(-MAX_DENIALS),
  });
}

export type PlasticityUpdateInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  target: PlasticityTarget;
  key: string;
  proposedWeight: number;
  strategyHint?: string;
  evidenceRefs?: string[];
  outcomeVerification: OutcomeVerification;
  verifiedOutcomeId?: string;
  /** Hard-deny probe: attempt to expand own permissions via plasticity. */
  attemptSelfPermissionExpansion?: boolean;
  /** Hard-deny probe: claim bypass of human authority. */
  attemptBypassHumanAuthority?: boolean;
  /** Hard-deny probe: auto production deploy. */
  attemptAutoProductionDeploy?: boolean;
  root?: string;
};

export type PlasticityUpdateResult = {
  accepted: boolean;
  reason: string;
  record: PlasticityWeightRecord | null;
  permissionExpanded: false;
  humanAuthorityBypassed: false;
  productionDeploy: false;
  productionAuthorization: false;
  l4AutonomyEnabled: false;
};

export async function applyPlasticityUpdate(
  input: PlasticityUpdateInput,
): Promise<PlasticityUpdateResult> {
  const root = input.root ?? process.cwd();
  const deny = async (reason: string): Promise<PlasticityUpdateResult> => {
    const store = await load(root);
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason,
      target: input.target,
    });
    await save(root, store);
    return {
      accepted: false,
      reason,
      record: null,
      permissionExpanded: false,
      humanAuthorityBypassed: false,
      productionDeploy: false,
      productionAuthorization: false,
      l4AutonomyEnabled: false,
    };
  };

  if (!input.orgId || !input.tenantId || !input.universeId) {
    return deny('ORG_TENANT_UNIVERSE_REQUIRED');
  }

  if (input.attemptSelfPermissionExpansion) {
    return deny(SELF_PERMISSION_EXPANSION_DENIED);
  }
  if (input.attemptBypassHumanAuthority) {
    return deny('BYPASS_HUMAN_AUTHORITY_DENIED');
  }
  if (input.attemptAutoProductionDeploy) {
    return deny('AUTO_PRODUCTION_DEPLOY_DENIED');
  }

  if (input.outcomeVerification !== 'verified') {
    return deny(
      `${UNVERIFIED_OUTCOME_REJECTED} — plasticity accepts verified outcomes only (got ${input.outcomeVerification}).`,
    );
  }

  if (!input.verifiedOutcomeId) {
    return deny(`${UNVERIFIED_OUTCOME_REJECTED} — verifiedOutcomeId required.`);
  }

  const weight = Math.max(0, Math.min(1, Number(input.proposedWeight) || 0));
  const record: PlasticityWeightRecord = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    target: input.target,
    key: input.key,
    weight,
    strategyHint: input.strategyHint ?? '',
    evidenceRefs: input.evidenceRefs ?? [],
    verifiedOutcomeId: input.verifiedOutcomeId,
    updatedAt: new Date().toISOString(),
    productionAuthorized: false,
    permissionExpanded: false,
  };

  const store = await load(root);
  const idx = store.weights.findIndex(
    (w) =>
      w.orgId === record.orgId &&
      w.universeId === record.universeId &&
      w.target === record.target &&
      w.key === record.key,
  );
  if (idx >= 0) store.weights[idx] = record;
  else store.weights.push(record);
  await save(root, store);

  return {
    accepted: true,
    reason: 'PLASTICITY_APPLIED_FROM_VERIFIED_OUTCOME',
    record,
    permissionExpanded: false,
    humanAuthorityBypassed: false,
    productionDeploy: false,
    productionAuthorization: false,
    l4AutonomyEnabled: false,
  };
}

export async function listPlasticityWeights(root: string, orgId: string, universeId: string) {
  const store = await load(root);
  return store.weights.filter((w) => w.orgId === orgId && w.universeId === universeId);
}

export function neuroplasticityHonesty() {
  return {
    locks: BO_LOCKS,
    banner: 'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED',
    unverifiedOutcomeUpdatesWeights: BO_LOCKS.UNVERIFIED_OUTCOME_UPDATES_WEIGHTS,
    selfPermissionExpansion: BO_LOCKS.SELF_PERMISSION_EXPANSION,
    bypassHumanAuthority: BO_LOCKS.BYPASS_HUMAN_AUTHORITY,
    autoProductionDeploy: BO_LOCKS.AUTO_PRODUCTION_DEPLOY,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
  };
}
