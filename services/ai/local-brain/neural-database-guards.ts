import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { decisionGate } from './decision-gate';
import {
  BA_LOCKS,
  HUMAN_GATE_REQUIRED,
  LABEL_ALONE_INSUFFICIENT,
  PRODUCTION_DDL_DENIED,
  PRODUCTION_DML_DENIED,
  SEALED_PLACEMENT_DENIED,
  TENANT_ISOLATION_VIOLATION,
  type BaActor,
  type BaEvidenceState,
  type DataTier,
  type RecommendationEvidence,
  type RecommendationKind,
} from './neural-database-types';

export type RlsAbacMapping = {
  tenantId: string;
  universeId: string;
  table: string;
  rlsPredicates: string[];
  abacAttributes: string[];
  productionApplied: false;
  guardianWeakened: false;
  notes: string;
};

export function mapRlsAbacPolicy(input: {
  tenantId: string;
  universeId: string;
  table: string;
  roles?: string[];
}): RlsAbacMapping {
  return {
    tenantId: input.tenantId,
    universeId: input.universeId,
    table: input.table,
    rlsPredicates: [
      `tenant_id = '${input.tenantId}'`,
      `universe_id = '${input.universeId}'`,
    ],
    abacAttributes: ['tenantId', 'universeId', 'role', 'compartment', ...(input.roles ?? [])],
    productionApplied: false,
    guardianWeakened: false,
    notes: 'RLS/ABAC mapping is a candidate overlay. Guardian/RLS must not be weakened.',
  };
}

export type SealedPlacementDecision = {
  allowed: boolean;
  tier: DataTier;
  reason: string;
  sealedWeakened: false;
};

export function guardSealedDataPlacement(input: {
  sealed: boolean;
  tier: DataTier;
}): SealedPlacementDecision {
  if (!input.sealed) {
    return {
      allowed: true,
      tier: input.tier,
      reason: 'Non-sealed data may use authorized tiers under policy.',
      sealedWeakened: false,
    };
  }
  if (input.tier === 'edge_node' || input.tier === 'cloud_storage') {
    return {
      allowed: false,
      tier: input.tier,
      reason: SEALED_PLACEMENT_DENIED,
      sealedWeakened: false,
    };
  }
  return {
    allowed: true,
    tier: input.tier,
    reason: 'Sealed data limited to local_device / enterprise_system with vault controls.',
    sealedWeakened: false,
  };
}

export type LeakageScanResult = {
  scanned: true;
  leaked: boolean;
  hits: string[];
  offensive: false;
  notes: string;
};

/** Defensive leakage detection only — never offensive tooling. */
export async function detectDefensiveLeakage(input: {
  root: string;
  token: string;
  allowFiles?: string[];
}): Promise<LeakageScanResult> {
  if (BA_LOCKS.OFFENSIVE_LEAKAGE_TOOLS) {
    throw new Error('INVARIANT_BROKEN_OFFENSIVE_LEAKAGE_MUST_BE_FALSE');
  }
  const hits: string[] = [];
  const allow = new Set(input.allowFiles ?? ['ceo-sealed-vault.json']);
  const base = join(input.root, '.xiv-local');
  let entries: string[] = [];
  try {
    entries = await readdir(base);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        scanned: true,
        leaked: false,
        hits: [],
        offensive: false,
        notes: 'No .xiv-local directory; defensive scan clean.',
      };
    }
    throw error;
  }
  for (const name of entries) {
    if (allow.has(name)) continue;
    const path = join(base, name);
    try {
      const text = await readFile(path, 'utf8');
      if (input.token && text.includes(input.token)) hits.push(name);
    } catch {
      // skip unreadable
    }
  }
  return {
    scanned: true,
    leaked: hits.length > 0,
    hits,
    offensive: false,
    notes: 'Defensive leakage detection only. Never offensive.',
  };
}

export type TenantIsolationCheck = {
  ok: boolean;
  reason: string;
  weakened: false;
};

export function checkTenantIsolation(input: {
  actor: BaActor;
  resourceTenantId: string;
  resourceUniverseId: string;
}): TenantIsolationCheck {
  if (input.actor.impersonatingFounder) {
    return { ok: false, reason: 'FOUNDER_IMPERSONATION_DENIED', weakened: false };
  }
  if (input.actor.labelOnly || input.actor.kind === 'label_only_principal') {
    return { ok: false, reason: LABEL_ALONE_INSUFFICIENT, weakened: false };
  }
  if (
    input.actor.tenantId !== input.resourceTenantId ||
    input.actor.universeId !== input.resourceUniverseId
  ) {
    return { ok: false, reason: TENANT_ISOLATION_VIOLATION, weakened: false };
  }
  return { ok: true, reason: 'Tenant/Universe isolation holds.', weakened: false };
}

export type ProductionAlterAttempt = {
  allowed: false;
  executed: false;
  ddlApplied: false;
  dmlApplied: false;
  reason: string;
  state: 'DENIED';
};

export function denyAutomaticProductionSchemaChange(input?: {
  action?: string;
}): ProductionAlterAttempt {
  return {
    allowed: false,
    executed: false,
    ddlApplied: false,
    dmlApplied: false,
    reason: `${PRODUCTION_DDL_DENIED}${input?.action ? `:${input.action}` : ''}`,
    state: 'DENIED',
  };
}

export function denyAutomaticProductionDml(input?: { action?: string }): ProductionAlterAttempt {
  return {
    allowed: false,
    executed: false,
    ddlApplied: false,
    dmlApplied: false,
    reason: `${PRODUCTION_DML_DENIED}${input?.action ? `:${input.action}` : ''}`,
    state: 'DENIED',
  };
}

export type HumanGateResult = {
  executableByAgent: false;
  humanApprovalRequired: true;
  productionAlterApplied: false;
  reason: string;
  recommendationMayProceedToReview: boolean;
};

export function humanDecisionGateBeforeProductionAlter(input: {
  recommendationKind: RecommendationKind;
  actor: BaActor;
  humanApproved?: boolean;
}): HumanGateResult {
  const gate = decisionGate({
    id: `ba-gate-${input.recommendationKind}`,
    action: `apply_${input.recommendationKind}_to_production`,
    consequence: 'CRITICAL',
    production: true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  if (input.actor.kind === 'ordinary_agent' || input.actor.kind === 'service') {
    return {
      executableByAgent: false,
      humanApprovalRequired: true,
      productionAlterApplied: false,
      reason: `${HUMAN_GATE_REQUIRED}: agents cannot apply production DB alters`,
      recommendationMayProceedToReview: true,
    };
  }

  if (!input.humanApproved) {
    return {
      executableByAgent: false,
      humanApprovalRequired: true,
      productionAlterApplied: false,
      reason: HUMAN_GATE_REQUIRED,
      recommendationMayProceedToReview: true,
    };
  }

  // Even with human approval signal, this module still does not apply production DDL.
  // Approval unlocks a *candidate authorization record*, not automatic alter.
  return {
    executableByAgent: false,
    humanApprovalRequired: true,
    productionAlterApplied: false,
    reason: `${HUMAN_GATE_REQUIRED}: human approval recorded as review signal only; production alter still requires separate production authority outside L4=false runtime. decisionGate=${gate.reason}`,
    recommendationMayProceedToReview: true,
  };
}

export type EvidenceStateRecord = {
  kind: RecommendationKind;
  documented: boolean;
  implemented: boolean;
  verified: boolean;
  productionAuthorized: boolean;
  recommendation: RecommendationEvidence;
  equalityLocks: {
    documentedEqImplemented: false;
    implementedEqVerified: false;
    verifiedEqProductionAuthorized: false;
  };
  state: BaEvidenceState;
};

export function classifyRecommendationEvidence(input: {
  kind: RecommendationKind;
  documented?: boolean;
  implemented?: boolean;
  verified?: boolean;
  productionAuthorized?: boolean;
  recommendation?: RecommendationEvidence;
}): EvidenceStateRecord {
  const documented = input.documented ?? true;
  const implemented = input.implemented ?? true;
  const verified = input.verified ?? false;
  const productionAuthorized = input.productionAuthorized ?? false;
  let state: BaEvidenceState = 'DOCUMENTED';
  if (implemented && !verified) state = 'IMPLEMENTED';
  if (verified && !productionAuthorized) state = 'VERIFIED';
  if (productionAuthorized) state = 'PRODUCTION_AUTHORIZED';
  // Honesty: this runtime never elevates to PRODUCTION_AUTHORIZED automatically.
  if (productionAuthorized) {
    state = 'DENIED';
  } else if (verified) {
    state = 'VERIFIED';
  } else if (implemented) {
    state = 'IMPLEMENTED';
  } else if (documented) {
    state = 'DOCUMENTED';
  }
  return {
    kind: input.kind,
    documented,
    implemented,
    verified: false,
    productionAuthorized: false,
    recommendation: input.recommendation ?? 'RECOMMENDED',
    equalityLocks: {
      documentedEqImplemented: false,
      implementedEqVerified: false,
      verifiedEqProductionAuthorized: false,
    },
    state: productionAuthorized ? 'DENIED' : state === 'VERIFIED' ? 'IMPLEMENTED' : state,
  };
}

export type SyncPolicy = {
  tiers: DataTier[];
  sealedExcludedFromEdgeCloud: true;
  sealedWeakened: false;
  automaticProductionAlter: false;
  notes: string;
};

export function syncPolicyAcrossTiers(input: { includeSealed: boolean }): SyncPolicy {
  return {
    tiers: input.includeSealed
      ? ['local_device', 'enterprise_system']
      : ['local_device', 'enterprise_system', 'edge_node', 'cloud_storage'],
    sealedExcludedFromEdgeCloud: true,
    sealedWeakened: false,
    automaticProductionAlter: false,
    notes: input.includeSealed
      ? 'Sealed sync limited to local/enterprise; edge/cloud excluded. Boundaries not weakened.'
      : 'Non-sealed sync may use all authorized tiers under policy.',
  };
}
