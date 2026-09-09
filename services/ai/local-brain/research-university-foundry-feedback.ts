/**
 * 62L-BU Research → Engineering University + Tool Foundry feedback.
 * Verified findings become sandboxed gated candidates only — not production promote.
 * Skill/tool candidates from research do not escalate permissions.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BU_LOCKS,
  HONESTY_BANNER,
  HIDDEN_REASONING_TRACE_REJECTED,
  SKILL_TOOL_NO_PERMISSION,
  UNIVERSITY_FOUNDRY_SANDBOXED,
  containsForbiddenPrivateFields,
  type BuActor,
} from './code-research-benchmark-strategy-types';

export type FeedbackTarget = 'engineering_university' | 'tool_foundry';

export type FeedbackCandidateKind =
  | 'training_material'
  | 'benchmark_tool'
  | 'compiler_adapter'
  | 'pattern_checking_helper'
  | 'skill_candidate'
  | 'tool_candidate';

export type SandboxedFeedbackCandidate = {
  id: string;
  target: FeedbackTarget;
  kind: FeedbackCandidateKind;
  title: string;
  body: string;
  sourceRefs: string[];
  verifiedFinding: boolean;
  status: 'sandboxed_gated_candidate' | 'rejected_unverified' | 'rejected_permission_escalation';
  gatePassed: false;
  productionPromoted: false;
  permissionEscalation: false;
  permissionChange: false;
  underReview: true;
  createdAt: string;
  actorId: string;
  reason: string;
};

type Store = {
  candidates: SandboxedFeedbackCandidate[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'research-university-foundry-feedback.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { candidates: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Probe optional BS university / foundry modules without hard dependency. */
export function probeUniversityFoundryLayers(root = process.cwd()) {
  const lb = join(root, 'services/ai/local-brain');
  return {
    softwareEngineeringUniversity: existsSync(join(lb, 'software-engineering-university.ts'))
      ? ('AVAILABLE' as const)
      : ('WAITING_DATA' as const),
    recursiveToolFoundry: existsSync(join(lb, 'recursive-tool-foundry.ts'))
      ? ('AVAILABLE' as const)
      : ('WAITING_DATA' as const),
    engineeringMemoryCortex: existsSync(join(lb, 'superbrain-engineering-memory-cortex.ts'))
      ? ('AVAILABLE' as const)
      : ('WAITING_DATA' as const),
  };
}

/**
 * Promote a verified research finding into a sandboxed gated candidate
 * for Engineering University or Tool Foundry. Gate not bypassed.
 */
export async function promoteFindingToUniversityOrFoundry(input: {
  target: FeedbackTarget;
  kind: FeedbackCandidateKind;
  title: string;
  body: string;
  sourceRefs?: string[];
  verifiedFinding: boolean;
  /** Attempt to escalate permissions via skill/tool candidate — DENIED. */
  requestPermissionEscalation?: boolean;
  /** Attempt to bypass sandbox gate / promote to production — DENIED. */
  requestProductionPromote?: boolean;
  payload?: Record<string, unknown>;
  actor: BuActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (containsForbiddenPrivateFields(input.payload)) {
    return {
      accepted: false as const,
      reason: HIDDEN_REASONING_TRACE_REJECTED,
      gatePassed: false as const,
      productionPromoted: false as const,
    };
  }

  if (input.requestPermissionEscalation) {
    return {
      accepted: false as const,
      reason: SKILL_TOOL_NO_PERMISSION,
      permissionEscalation: false as const,
      permissionChange: false as const,
      gatePassed: false as const,
      productionPromoted: false as const,
      locks: {
        skillIsPermissionGrant: BU_LOCKS.SKILL_IS_PERMISSION_GRANT,
        toolCandidateEscalatesPermissions: BU_LOCKS.TOOL_CANDIDATE_ESCALATES_PERMISSIONS,
        learningIsAuthority: BU_LOCKS.LEARNING_IS_AUTHORITY,
      },
    };
  }

  if (input.requestProductionPromote) {
    return {
      accepted: false as const,
      reason: UNIVERSITY_FOUNDRY_SANDBOXED,
      gatePassed: false as const,
      productionPromoted: false as const,
      locks: {
        universityFoundryBypassGate: BU_LOCKS.UNIVERSITY_FOUNDRY_BYPASS_GATE,
        findingAutoPromotesToProduction: BU_LOCKS.FINDING_AUTO_PROMOTES_TO_PRODUCTION,
        sandboxedGatedCandidatesOnly: BU_LOCKS.SANDBOXED_GATED_CANDIDATES_ONLY,
      },
    };
  }

  const layers = probeUniversityFoundryLayers(root);
  const store = await load(root);

  if (!input.verifiedFinding) {
    const rejected: SandboxedFeedbackCandidate = {
      id: id('fb'),
      target: input.target,
      kind: input.kind,
      title: input.title,
      body: input.body,
      sourceRefs: input.sourceRefs ?? [],
      verifiedFinding: false,
      status: 'rejected_unverified',
      gatePassed: false,
      productionPromoted: false,
      permissionEscalation: false,
      permissionChange: false,
      underReview: true,
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
      reason: 'UNVERIFIED_FINDING_NOT_PROMOTED',
    };
    store.candidates.push(rejected);
    await save(root, store);
    return {
      accepted: false as const,
      candidate: rejected,
      gatePassed: false as const,
      productionPromoted: false as const,
      layers,
      reason: rejected.reason,
    };
  }

  const candidate: SandboxedFeedbackCandidate = {
    id: id('fb'),
    target: input.target,
    kind: input.kind,
    title: input.title,
    body: input.body,
    sourceRefs: input.sourceRefs ?? [],
    verifiedFinding: true,
    status: 'sandboxed_gated_candidate',
    gatePassed: false,
    productionPromoted: false,
    permissionEscalation: false,
    permissionChange: false,
    underReview: true,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason: UNIVERSITY_FOUNDRY_SANDBOXED,
  };

  store.candidates.push(candidate);
  await save(root, store);

  return {
    accepted: true as const,
    candidate,
    gatePassed: false as const,
    productionPromoted: false as const,
    permissionEscalation: false as const,
    layers,
    reason: UNIVERSITY_FOUNDRY_SANDBOXED,
  };
}

/**
 * Attempt to pass the promotion gate without Founder/human review — DENIED.
 */
export async function attemptBypassPromotionGate(input: {
  candidateId: string;
  actor: BuActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const candidate = store.candidates.find((c) => c.id === input.candidateId);

  return {
    accepted: false as const,
    gatePassed: false as const,
    productionPromoted: false as const,
    candidateFound: !!candidate,
    reason: UNIVERSITY_FOUNDRY_SANDBOXED,
    locks: {
      universityFoundryBypassGate: BU_LOCKS.UNIVERSITY_FOUNDRY_BYPASS_GATE,
    },
  };
}

export async function listFeedbackCandidates(root = process.cwd()) {
  return (await load(root)).candidates;
}

export function universityFoundryFeedbackHonesty() {
  return {
    banner: HONESTY_BANNER,
    sandboxedGatedCandidatesOnly: BU_LOCKS.SANDBOXED_GATED_CANDIDATES_ONLY,
    universityFoundryBypassGate: BU_LOCKS.UNIVERSITY_FOUNDRY_BYPASS_GATE,
    skillIsPermissionGrant: BU_LOCKS.SKILL_IS_PERMISSION_GRANT,
    toolCandidateEscalatesPermissions: BU_LOCKS.TOOL_CANDIDATE_ESCALATES_PERMISSIONS,
    productionAuthorization: BU_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}
