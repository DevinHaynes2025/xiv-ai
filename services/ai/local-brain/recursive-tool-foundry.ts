/**
 * 62L-BQ Recursive Tool Foundry — build tools inside tools, plugins, APIs, small AI projects.
 * Bounds on recursion depth; review gates; no unbounded self-replication.
 * Builder agents ≠ production deploy authority.
 */

import { randomUUID } from 'node:crypto';

import {
  BQ_BOUNDS,
  BQ_LOCKS,
  TOOL_RECURSION_BOUND,
} from './polyglot-coding-civilization-types';

export type FoundryArtifactKind = 'tool' | 'plugin' | 'api' | 'ai_project';

export type FoundryArtifact = {
  id: string;
  kind: FoundryArtifactKind;
  name: string;
  parentId: string | null;
  depth: number;
  status: 'SANDBOX' | 'AWAITING_REVIEW' | 'APPROVED_NOT_DEPLOYED' | 'DENIED';
  productionAuthorized: false;
  autoDeployed: false;
  builderIsDeployAuthority: false;
  createdAt: string;
  reason: string;
};

export type FoundryBuildResult =
  | { accepted: true; artifact: FoundryArtifact }
  | { accepted: false; artifact: FoundryArtifact | null; reason: string; reviewRequired: boolean };

const artifacts = new Map<string, FoundryArtifact>();

export function resetToolFoundry() {
  artifacts.clear();
}

function nowIso() {
  return new Date().toISOString();
}

function parentDepth(parentId: string | null): number {
  if (!parentId) return 0;
  const parent = artifacts.get(parentId);
  return parent ? parent.depth : 0;
}

/**
 * Build a tool/plugin/api/project. Nested builds increment depth.
 * Hitting MAX_TOOL_RECURSION_DEPTH requires review and is denied for further nesting.
 */
export function buildFoundryArtifact(input: {
  kind: FoundryArtifactKind;
  name: string;
  parentId?: string | null;
  reviewApproved?: boolean;
}): FoundryBuildResult {
  const parentId = input.parentId ?? null;
  if (parentId && !artifacts.has(parentId)) {
    return {
      accepted: false,
      artifact: null,
      reason: 'PARENT_ARTIFACT_NOT_FOUND',
      reviewRequired: false,
    };
  }

  const depth = parentId ? parentDepth(parentId) + 1 : 1;

  if (BQ_LOCKS.UNBOUNDED_TOOL_RECURSION) {
    return {
      accepted: false,
      artifact: null,
      reason: 'LOCK_VIOLATION_UNBOUNDED_RECURSION',
      reviewRequired: true,
    };
  }

  if (depth > BQ_BOUNDS.MAX_TOOL_RECURSION_DEPTH) {
    const denied: FoundryArtifact = {
      id: randomUUID(),
      kind: input.kind,
      name: input.name.trim(),
      parentId,
      depth,
      status: 'DENIED',
      productionAuthorized: false,
      autoDeployed: false,
      builderIsDeployAuthority: false,
      createdAt: nowIso(),
      reason: TOOL_RECURSION_BOUND,
    };
    artifacts.set(denied.id, denied);
    return {
      accepted: false,
      artifact: denied,
      reason: TOOL_RECURSION_BOUND,
      reviewRequired: true,
    };
  }

  // At max depth, further useful work requires explicit review before accept.
  if (depth === BQ_BOUNDS.MAX_TOOL_RECURSION_DEPTH && input.reviewApproved !== true) {
    const awaiting: FoundryArtifact = {
      id: randomUUID(),
      kind: input.kind,
      name: input.name.trim(),
      parentId,
      depth,
      status: 'AWAITING_REVIEW',
      productionAuthorized: false,
      autoDeployed: false,
      builderIsDeployAuthority: false,
      createdAt: nowIso(),
      reason: TOOL_RECURSION_BOUND,
    };
    artifacts.set(awaiting.id, awaiting);
    return {
      accepted: false,
      artifact: awaiting,
      reason: TOOL_RECURSION_BOUND,
      reviewRequired: true,
    };
  }

  const artifact: FoundryArtifact = {
    id: randomUUID(),
    kind: input.kind,
    name: input.name.trim(),
    parentId,
    depth,
    status: input.reviewApproved === true ? 'APPROVED_NOT_DEPLOYED' : 'SANDBOX',
    productionAuthorized: false,
    autoDeployed: false,
    builderIsDeployAuthority: false,
    createdAt: nowIso(),
    reason:
      input.reviewApproved === true
        ? 'REVIEW_APPROVED_SANDBOX_NOT_DEPLOYED'
        : 'SANDBOX_ARTIFACT_CREATED',
  };
  artifacts.set(artifact.id, artifact);
  return { accepted: true, artifact };
}

export function listFoundryArtifacts() {
  return [...artifacts.values()].map((a) => ({ ...a }));
}

export function getFoundryArtifact(id: string) {
  const a = artifacts.get(id);
  return a ? { ...a } : null;
}

export function toolFoundryHonesty() {
  return {
    locks: BQ_LOCKS,
    maxRecursionDepth: BQ_BOUNDS.MAX_TOOL_RECURSION_DEPTH,
    unboundedRecursion: BQ_LOCKS.UNBOUNDED_TOOL_RECURSION,
    builderIsDeployAuthority: BQ_LOCKS.BUILDER_IS_DEPLOY_AUTHORITY,
    productionAuthorization: false as const,
  };
}
