/**
 * 12D-07 Founder Twin roster — digital-twin replicas + compressed shards only.
 * Hard CAP + energy budget (assertable). Never bio cloning; never always-on infinite clones.
 * "Wormholes" here = sparse SIMULATION pathways only (not physical portals).
 */
import { BIOLOGICAL_DNA_CLONING_CAPABILITY, PHYSICAL_PORTAL_CAPABILITY } from './fabric';
import { assertEthicsSafeCopy, UNIVERSES_ARE_SIMULATION_LAYERS_ONLY } from './universe-ethics';

/** Hard ceiling on concurrently registered digital-twin replicas. */
export const FOUNDER_TWIN_REPLICA_HARD_CAP = 64 as const;

/** Max compressed memory shards per replica (duty-cycled cold storage ok beyond active set). */
export const FOUNDER_TWIN_ACTIVE_SHARD_CAP = 128 as const;

/** Joules-equivalent budget units per duty cycle window (abstract local units). */
export const FOUNDER_TWIN_ENERGY_BUDGET_PER_CYCLE = 1000 as const;

/** Duty cycle: fraction of wall time a replica may be "hot"/always-on. */
export const FOUNDER_TWIN_MAX_DUTY_CYCLE = 0.25 as const;

/** Sparse SIMULATION pathway ("wormhole") edge budget — research topology only. */
export const FOUNDER_TWIN_SPARSE_PATHWAY_CAP = 32 as const;

export const FOUNDER_TWIN_GUARDRAILS = {
  biologicalDnaCloningCapability: BIOLOGICAL_DNA_CLONING_CAPABILITY,
  physicalPortalCapability: PHYSICAL_PORTAL_CAPABILITY,
  universesAreSimulationLayersOnly: UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  replicaHardCap: FOUNDER_TWIN_REPLICA_HARD_CAP,
  activeShardCap: FOUNDER_TWIN_ACTIVE_SHARD_CAP,
  energyBudgetPerCycle: FOUNDER_TWIN_ENERGY_BUDGET_PER_CYCLE,
  maxDutyCycle: FOUNDER_TWIN_MAX_DUTY_CYCLE,
  sparsePathwayCap: FOUNDER_TWIN_SPARSE_PATHWAY_CAP,
  alwaysOnInfiniteClonesAllowed: false as const,
  bioCloningAllowed: false as const,
  wormholesAreSparseSimulationPathwaysOnly: true as const,
} as const;

export type TwinReplicaKind = 'DIGITAL_TWIN' | 'COMPRESSED_SHARD_SET';

export type FounderTwinReplica = {
  replicaId: string;
  kind: TwinReplicaKind;
  dutyCycle: number;
  energyUsedThisCycle: number;
  activeShardCount: number;
  hot: boolean;
};

export type FounderTwinRoster = {
  tenantId: string;
  cycleId: string;
  replicas: FounderTwinReplica[];
  sparsePathwayCount: number;
  energyBudgetRemaining: number;
  guardrails: typeof FOUNDER_TWIN_GUARDRAILS;
};

export function assertFounderTwinGuardrails(): void {
  if (FOUNDER_TWIN_GUARDRAILS.biologicalDnaCloningCapability) {
    throw new Error('biological DNA cloning capability must remain false');
  }
  if (FOUNDER_TWIN_GUARDRAILS.bioCloningAllowed) {
    throw new Error('bioCloningAllowed must remain false');
  }
  if (FOUNDER_TWIN_GUARDRAILS.alwaysOnInfiniteClonesAllowed) {
    throw new Error('always-on infinite clones must remain false');
  }
  if (FOUNDER_TWIN_GUARDRAILS.physicalPortalCapability) {
    throw new Error('physical portals must remain false');
  }
  if (!FOUNDER_TWIN_GUARDRAILS.universesAreSimulationLayersOnly) {
    throw new Error('universes must remain SIMULATION layers only');
  }
  if (!FOUNDER_TWIN_GUARDRAILS.wormholesAreSparseSimulationPathwaysOnly) {
    throw new Error('wormholes must remain sparse SIMULATION pathways only');
  }
  if (FOUNDER_TWIN_REPLICA_HARD_CAP < 1) {
    throw new Error('replica hard cap must be positive');
  }
  if (FOUNDER_TWIN_MAX_DUTY_CYCLE <= 0 || FOUNDER_TWIN_MAX_DUTY_CYCLE > 1) {
    throw new Error('max duty cycle must be in (0, 1]');
  }
}

export function createFounderTwinRoster(input: {
  tenantId: string;
  cycleId: string;
}): FounderTwinRoster {
  assertFounderTwinGuardrails();
  const ethicsNotice =
    'Founder Twin roster uses digital-twin replicas and compressed shards only. Wormholes are sparse SIMULATION pathways. No bio cloning; no always-on infinite clones.';
  assertEthicsSafeCopy(ethicsNotice, 'founder-twin-roster');
  return {
    tenantId: input.tenantId,
    cycleId: input.cycleId,
    replicas: [],
    sparsePathwayCount: 0,
    energyBudgetRemaining: FOUNDER_TWIN_ENERGY_BUDGET_PER_CYCLE,
    guardrails: FOUNDER_TWIN_GUARDRAILS,
  };
}

function assertReplicaEligible(roster: FounderTwinRoster, replica: Omit<FounderTwinReplica, 'hot'>): void {
  assertFounderTwinGuardrails();
  if (roster.replicas.length >= FOUNDER_TWIN_REPLICA_HARD_CAP) {
    throw new Error(
      'FOUNDER_TWIN_REPLICA_HARD_CAP exceeded (' + String(FOUNDER_TWIN_REPLICA_HARD_CAP) + ')',
    );
  }
  if (roster.replicas.some((r) => r.replicaId === replica.replicaId)) {
    throw new Error('duplicate replicaId: ' + replica.replicaId);
  }
  if (replica.kind !== 'DIGITAL_TWIN' && replica.kind !== 'COMPRESSED_SHARD_SET') {
    throw new Error('replica kind must be DIGITAL_TWIN or COMPRESSED_SHARD_SET');
  }
  if (replica.dutyCycle <= 0 || replica.dutyCycle > FOUNDER_TWIN_MAX_DUTY_CYCLE) {
    throw new Error(
      'dutyCycle must be in (0, ' + String(FOUNDER_TWIN_MAX_DUTY_CYCLE) + '] (capped, not always-on)',
    );
  }
  if (replica.activeShardCount < 0 || replica.activeShardCount > FOUNDER_TWIN_ACTIVE_SHARD_CAP) {
    throw new Error('activeShardCount exceeds FOUNDER_TWIN_ACTIVE_SHARD_CAP');
  }
  if (replica.energyUsedThisCycle < 0) {
    throw new Error('energyUsedThisCycle must be >= 0');
  }
  if (replica.energyUsedThisCycle > roster.energyBudgetRemaining) {
    throw new Error('energy budget exceeded for this duty cycle');
  }
}

/**
 * Register a capped digital-twin / compressed-shard replica. Never bio cloning.
 */
export function registerTwinReplica(
  roster: FounderTwinRoster,
  input: {
    replicaId: string;
    kind: TwinReplicaKind;
    dutyCycle: number;
    energyUsedThisCycle: number;
    activeShardCount: number;
  },
): FounderTwinRoster {
  assertReplicaEligible(roster, input);
  const replica: FounderTwinReplica = {
    ...input,
    // hot only within duty-cycle budget — never always-on infinite
    hot: input.dutyCycle <= FOUNDER_TWIN_MAX_DUTY_CYCLE && input.dutyCycle > 0,
  };
  return {
    ...roster,
    replicas: [...roster.replicas, replica],
    energyBudgetRemaining: roster.energyBudgetRemaining - input.energyUsedThisCycle,
  };
}

/**
 * Add a sparse SIMULATION pathway edge ("wormhole" metaphor). Physical portals banned.
 */
export function addSparseSimulationPathway(roster: FounderTwinRoster): FounderTwinRoster {
  assertFounderTwinGuardrails();
  if (roster.sparsePathwayCount >= FOUNDER_TWIN_SPARSE_PATHWAY_CAP) {
    throw new Error(
      'FOUNDER_TWIN_SPARSE_PATHWAY_CAP exceeded (' + String(FOUNDER_TWIN_SPARSE_PATHWAY_CAP) + ')',
    );
  }
  return {
    ...roster,
    sparsePathwayCount: roster.sparsePathwayCount + 1,
  };
}

export function summarizeFounderTwinRoster(roster: FounderTwinRoster): {
  replicaCount: number;
  hardCap: number;
  energyBudgetRemaining: number;
  energyBudgetTotal: number;
  sparsePathwayCount: number;
  maxDutyCycle: number;
  alwaysOnInfiniteClonesAllowed: false;
  bioCloningAllowed: false;
  wormholesAreSparseSimulationPathwaysOnly: true;
} {
  return {
    replicaCount: roster.replicas.length,
    hardCap: FOUNDER_TWIN_REPLICA_HARD_CAP,
    energyBudgetRemaining: roster.energyBudgetRemaining,
    energyBudgetTotal: FOUNDER_TWIN_ENERGY_BUDGET_PER_CYCLE,
    sparsePathwayCount: roster.sparsePathwayCount,
    maxDutyCycle: FOUNDER_TWIN_MAX_DUTY_CYCLE,
    alwaysOnInfiniteClonesAllowed: false,
    bioCloningAllowed: false,
    wormholesAreSparseSimulationPathwaysOnly: true,
  };
}
