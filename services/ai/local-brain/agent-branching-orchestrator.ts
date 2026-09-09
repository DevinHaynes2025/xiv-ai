import { randomUUID } from 'node:crypto';

import {
  AUTHORITY_TRANSFER_DENIED,
  CONFLICT_DISPATCH_BLOCKED,
  NON_FOUNDER_GOAL_DENIED,
  RECONCILE_REQUIRED,
  UNAUTHORIZED_DISPATCH_DENIED,
  BK_LOCKS,
  type BkActor,
  type CodingMeshEnvironmentId,
  type EnvironmentProbe,
  type FounderGoal,
} from './superbrain-coexistence-types';
import {
  createUniversalWorkEnvelope,
  selectMeshTargets,
  validateUniversalWorkEnvelope,
  type UniversalWorkEnvelope,
} from './universal-work-envelope';
import {
  sealExecutionContract,
  type CrossPlatformExecutionContract,
  type WorkcellResultArtifact,
} from './cross-platform-execution-contracts';

export type FileClaim = {
  agentId: string;
  path: string;
  workcellId: string;
};

export type ConflictScanResult = {
  conflicts: Array<{ path: string; agentIds: string[] }>;
  blocked: boolean;
  reason: string;
};

export type DispatchPlan = {
  id: string;
  goalId: string;
  envelopeId: string;
  workcells: Array<{
    workcellId: string;
    agentId: string;
    environmentId: CodingMeshEnvironmentId;
    files: string[];
    status: 'PLANNED' | 'DISPATCHED' | 'BLOCKED' | 'DENIED';
  }>;
  dispatched: boolean;
  deniedReason?: string;
};

export type ReconcileResult = {
  reconciled: boolean;
  integrationCandidate: boolean;
  reason: string;
  contractIds: string[];
};

/**
 * Detect overlapping file claims before dispatch. Conflicts block dispatch.
 */
export function detectFileConflicts(claims: FileClaim[]): ConflictScanResult {
  const byPath = new Map<string, Set<string>>();
  for (const claim of claims) {
    const normalized = claim.path.replace(/\\/g, '/').replace(/^\.\//, '');
    if (!normalized || normalized.includes('..')) continue;
    const set = byPath.get(normalized) ?? new Set<string>();
    set.add(claim.agentId);
    byPath.set(normalized, set);
  }
  const conflicts: Array<{ path: string; agentIds: string[] }> = [];
  for (const [path, agents] of byPath) {
    if (agents.size > 1) {
      conflicts.push({ path, agentIds: [...agents].sort() });
    }
  }
  if (conflicts.length > 0) {
    return {
      conflicts,
      blocked: true,
      reason: CONFLICT_DISPATCH_BLOCKED,
    };
  }
  return {
    conflicts: [],
    blocked: false,
    reason: 'No file conflicts detected before dispatch.',
  };
}

export function attemptAuthorityTransfer(from: BkActor, to: BkActor): {
  denied: true;
  reason: typeof AUTHORITY_TRANSFER_DENIED;
  authorityTransferred: false;
} {
  void from;
  void to;
  return {
    denied: true,
    reason: AUTHORITY_TRANSFER_DENIED,
    authorityTransferred: false,
  };
}

function partitionFiles(files: string[], agentCount: number): string[][] {
  if (agentCount <= 0) return [];
  if (files.length === 0) return Array.from({ length: agentCount }, () => []);
  const buckets: string[][] = Array.from({ length: agentCount }, () => []);
  files.forEach((file, index) => {
    buckets[index % agentCount]!.push(file);
  });
  return buckets;
}

/**
 * Agent Branching Orchestrator:
 * - Decompose founder-approved goals
 * - Select agents + environments
 * - Conflict-scan before dispatch
 * - Collect workcell artifacts
 * - Reconcile before anything becomes an integration candidate
 * - Deny unauthorized dispatch and authority transfer
 */
export function planGoalDecomposition(goal: FounderGoal): {
  accepted: boolean;
  reason: string;
  envelope?: UniversalWorkEnvelope;
  subtasks: Array<{ id: string; title: string; files: string[] }>;
} {
  if (!goal.founderApproved) {
    return {
      accepted: false,
      reason: NON_FOUNDER_GOAL_DENIED,
      subtasks: [],
    };
  }
  const envelope = createUniversalWorkEnvelope({
    id: `env_${goal.id}`,
    tenantId: goal.tenantId,
    universeId: goal.universeId,
    goalId: goal.id,
    objective: goal.description || goal.title,
    founderApproved: true,
    requestedEnvironments: goal.preferredEnvironments,
    requestedFiles: goal.requestedFiles,
    requestedAgentIds: goal.preferredAgents,
  });
  const validation = validateUniversalWorkEnvelope(envelope);
  if (!validation.accepted) {
    return {
      accepted: false,
      reason: validation.reason,
      envelope,
      subtasks: [],
    };
  }
  const files = goal.requestedFiles ?? [];
  const subtasks =
    files.length === 0
      ? [{ id: `${goal.id}_task_0`, title: goal.title, files: [] as string[] }]
      : files.map((file, i) => ({
          id: `${goal.id}_task_${i}`,
          title: `${goal.title} :: ${file}`,
          files: [file],
        }));
  return { accepted: true, reason: 'Founder-approved goal decomposed.', envelope, subtasks };
}

export function createDispatchPlan(input: {
  goal: FounderGoal;
  agents: BkActor[];
  probes: EnvironmentProbe[];
  /** When true, intentionally create overlapping file claims to exercise conflict block. */
  forceOverlappingClaims?: boolean;
}): {
  plan: DispatchPlan;
  conflictScan: ConflictScanResult;
  envelope?: UniversalWorkEnvelope;
} {
  const decomposed = planGoalDecomposition(input.goal);
  if (!decomposed.accepted || !decomposed.envelope) {
    return {
      plan: {
        id: randomUUID(),
        goalId: input.goal.id,
        envelopeId: '',
        workcells: [],
        dispatched: false,
        deniedReason: decomposed.reason,
      },
      conflictScan: { conflicts: [], blocked: false, reason: decomposed.reason },
      envelope: decomposed.envelope,
    };
  }

  const envelope = decomposed.envelope;
  const agents =
    input.agents.length > 0
      ? input.agents
      : [
          {
            kind: 'specialized_agent' as const,
            id: 'default-coding-agent',
            tenantId: input.goal.tenantId,
            universeId: input.goal.universeId,
            role: 'coder',
          },
        ];

  const targets = selectMeshTargets(envelope.requestedEnvironments, input.probes);
  const available = targets.filter((t) => t.state === 'AVAILABLE');
  if (available.length === 0) {
    return {
      plan: {
        id: randomUUID(),
        goalId: input.goal.id,
        envelopeId: envelope.id,
        workcells: [],
        dispatched: false,
        deniedReason: UNAUTHORIZED_DISPATCH_DENIED + ': no AVAILABLE environments',
      },
      conflictScan: {
        conflicts: [],
        blocked: false,
        reason: 'No AVAILABLE coding-mesh environments after CAV probe.',
      },
      envelope,
    };
  }

  const files = envelope.requestedFiles;
  const fileBuckets = input.forceOverlappingClaims
    ? agents.map(() => [...files])
    : partitionFiles(files, agents.length);

  const claims: FileClaim[] = [];
  const workcells: DispatchPlan['workcells'] = [];
  agents.forEach((agent, index) => {
    const workcellId = `wc_${input.goal.id}_${agent.id}`;
    const assigned = fileBuckets[index] ?? [];
    for (const path of assigned) {
      claims.push({ agentId: agent.id, path, workcellId });
    }
    workcells.push({
      workcellId,
      agentId: agent.id,
      environmentId: available[index % available.length]!.id,
      files: assigned,
      status: 'PLANNED',
    });
  });

  const conflictScan = detectFileConflicts(claims);
  if (conflictScan.blocked) {
    return {
      plan: {
        id: randomUUID(),
        goalId: input.goal.id,
        envelopeId: envelope.id,
        workcells: workcells.map((w) => ({ ...w, status: 'BLOCKED' as const })),
        dispatched: false,
        deniedReason: CONFLICT_DISPATCH_BLOCKED,
      },
      conflictScan,
      envelope,
    };
  }

  return {
    plan: {
      id: randomUUID(),
      goalId: input.goal.id,
      envelopeId: envelope.id,
      workcells: workcells.map((w) => ({ ...w, status: 'DISPATCHED' as const })),
      dispatched: true,
    },
    conflictScan,
    envelope,
  };
}

export function collectWorkcellResult(input: {
  workcellId: string;
  agentId: string;
  environmentId: CodingMeshEnvironmentId;
  filesTouched: string[];
  testsPassed: boolean;
  evidenceRefs: string[];
  codeSummary: string;
}): WorkcellResultArtifact {
  return {
    workcellId: input.workcellId,
    agentId: input.agentId,
    environmentId: input.environmentId,
    filesTouched: [...input.filesTouched],
    testsPassed: input.testsPassed,
    evidenceRefs: [...input.evidenceRefs],
    codeSummary: input.codeSummary,
    collectedAt: new Date().toISOString(),
    reconciled: false,
    integrationCandidate: false,
  };
}

/**
 * Reconcile collected workcell results before promoting an integration candidate.
 * Without reconcile → not an integration candidate.
 */
export function reconcileWorkcellResults(
  results: WorkcellResultArtifact[],
  options?: { skipReconcile?: boolean },
): ReconcileResult & { contracts: CrossPlatformExecutionContract[] } {
  if (options?.skipReconcile === true || results.length === 0) {
    const contracts = results.map((result) =>
      sealExecutionContract({
        status: 'NOT_INTEGRATION_CANDIDATE',
        artifact: { ...result, reconciled: false, integrationCandidate: false },
        reason: RECONCILE_REQUIRED,
      }),
    );
    return {
      reconciled: false,
      integrationCandidate: false,
      reason: RECONCILE_REQUIRED,
      contractIds: contracts.map((c) => c.id),
      contracts,
    };
  }

  // Reconcile: union file sets, require evidence, block if any tests failed.
  const allFiles = new Set<string>();
  const evidence: string[] = [];
  let testsOk = true;
  for (const result of results) {
    for (const f of result.filesTouched) allFiles.add(f);
    evidence.push(...result.evidenceRefs);
    if (!result.testsPassed) testsOk = false;
  }
  // Conflict on overlapping files across workcells after collect → not candidate
  const fileOwners = new Map<string, string[]>();
  for (const result of results) {
    for (const f of result.filesTouched) {
      const owners = fileOwners.get(f) ?? [];
      owners.push(result.agentId);
      fileOwners.set(f, owners);
    }
  }
  const postConflicts = [...fileOwners.entries()].filter(([, owners]) => new Set(owners).size > 1);
  if (postConflicts.length > 0 || !testsOk || evidence.length === 0) {
    const contracts = results.map((result) =>
      sealExecutionContract({
        status: 'NOT_INTEGRATION_CANDIDATE',
        artifact: { ...result, reconciled: true, integrationCandidate: false },
        reason: postConflicts.length
          ? CONFLICT_DISPATCH_BLOCKED
          : !testsOk
            ? 'TESTS_FAILED_NOT_INTEGRATION_CANDIDATE'
            : 'EVIDENCE_REQUIRED_NOT_INTEGRATION_CANDIDATE',
      }),
    );
    return {
      reconciled: true,
      integrationCandidate: false,
      reason: postConflicts.length
        ? CONFLICT_DISPATCH_BLOCKED
        : !testsOk
          ? 'TESTS_FAILED_NOT_INTEGRATION_CANDIDATE'
          : 'EVIDENCE_REQUIRED_NOT_INTEGRATION_CANDIDATE',
      contractIds: contracts.map((c) => c.id),
      contracts,
    };
  }

  const contracts = results.map((result) =>
    sealExecutionContract({
      status: 'INTEGRATION_CANDIDATE',
      artifact: { ...result, reconciled: true, integrationCandidate: true },
      reason: `Reconciled ${allFiles.size} files; evidence=${evidence.length}; testsPassed=true. Recommendation only — not production deploy.`,
    }),
  );
  return {
    reconciled: true,
    integrationCandidate: true,
    reason:
      'Workcells reconciled; gated as integration candidate only (branch/workcell ≠ production deploy).',
    contractIds: contracts.map((c) => c.id),
    contracts,
  };
}

export function orchestratorHonesty() {
  return {
    locks: BK_LOCKS,
    dispatchWithoutConflictScan: BK_LOCKS.DISPATCH_WITHOUT_CONFLICT_SCAN,
    integrationWithoutReconcile: BK_LOCKS.INTEGRATION_WITHOUT_RECONCILE,
    authorityTransfer: BK_LOCKS.AUTHORITY_TRANSFER_BETWEEN_AGENTS,
    learningIsNotPermissionGrant: BK_LOCKS.LEARNING_IS_NOT_PERMISSION_GRANT,
  };
}
