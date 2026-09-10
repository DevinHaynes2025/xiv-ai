/**
 * Google Cloud sandbox adapters ? CLOUD_SANDBOX classification only.
 * No autonomous deploy, no secrets in git, no production DDL.
 */

import type { BuildTarget } from '../builder/types';
import { DATABASE_CITY_GUARDRAILS } from './database-city';

export type CloudSandboxProvider = 'GOOGLE_CLOUD';

export type CloudSandboxResourceKind =
  | 'CLOUD_SQL_POSTGRES'
  | 'FIRESTORE'
  | 'GCS_OBJECT_STORE'
  | 'VERTEX_VECTOR_STUB'
  | 'SPANNER_STUB';

export type CloudSandboxPlan = {
  planId: string;
  provider: CloudSandboxProvider;
  target: BuildTarget;
  resources: readonly CloudSandboxResourceKind[];
  region: string;
  /** Always generate-only / sandbox ? never autonomous deploy. */
  autonomousDeploy: false;
  secretsEmbedded: false;
  notes: string;
};

export type CloudSandboxExecution = {
  planId: string;
  status: 'GENERATE_ONLY' | 'BLOCKED';
  deployed: false;
  reasons: string[];
};

/**
 * Plan an isolated Google Cloud sandbox topology for Database City experiments.
 * Credentials must be least-privilege and never committed.
 */
export function planGoogleCloudSandbox(input: {
  planId: string;
  region?: string;
  resources?: readonly CloudSandboxResourceKind[];
}): CloudSandboxPlan {
  if (!input.planId) throw new TypeError('planId is required');
  if (DATABASE_CITY_GUARDRAILS.autonomousDeployment) {
    throw new Error('autonomousDeployment must remain false');
  }
  return {
    planId: input.planId,
    provider: 'GOOGLE_CLOUD',
    target: 'CLOUD_SANDBOX',
    resources: Object.freeze(
      input.resources ??
        (['CLOUD_SQL_POSTGRES', 'GCS_OBJECT_STORE', 'VERTEX_VECTOR_STUB'] as CloudSandboxResourceKind[]),
    ),
    region: input.region ?? 'us-central1',
    autonomousDeploy: false,
    secretsEmbedded: false,
    notes:
      'CLOUD_SANDBOX only ? generate IaC/plans; CEO-only sealed ops for credentials; no autonomous deploy',
  };
}

/** Explicitly refuse production target and autonomous deploy. */
export function executeCloudSandboxPlan(plan: CloudSandboxPlan, forceProduction = false): CloudSandboxExecution {
  if (forceProduction || plan.target === 'PRODUCTION') {
    return {
      planId: plan.planId,
      status: 'BLOCKED',
      deployed: false,
      reasons: [
        'PRODUCTION target blocked',
        'autonomous deploy remains false',
        'use separate human-approved deployment workflow',
      ],
    };
  }
  return {
    planId: plan.planId,
    status: 'GENERATE_ONLY',
    deployed: false,
    reasons: [
      'CLOUD_SANDBOX generate-only stub',
      'no live GCP mutate from this research fabric',
      'secrets must stay out of git (CEO-only sealed ops)',
    ],
  };
}
