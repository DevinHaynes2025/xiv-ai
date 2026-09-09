import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ARTIFACT_QUARANTINED,
  BO_LOCKS,
  MEMORY_REVALIDATION_REQUIRED,
  QUARANTINE_BYPASS_DENIED,
  type ArtifactTrustState,
} from './superbrain-neuroplasticity-types';

/**
 * Global Intelligence Immune System.
 * Detects stale/poisoned knowledge, bad artifacts, anomalous agent behavior,
 * and corrupted memory. Actions: quarantine + revalidation — never silently trust.
 */

export const IMMUNE_STORE = 'global-intelligence-immune.json';

export type ImmuneArtifact = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  artifactKey: string;
  kind: 'knowledge' | 'memory' | 'route_cache' | 'model_artifact' | 'agent_behavior';
  trustState: ArtifactTrustState;
  reason: string;
  quarantinedAt: string | null;
  revalidationRequired: boolean;
  silentlyTrusted: false;
  productionAuthorized: false;
};

type ImmuneStore = {
  artifacts: ImmuneArtifact[];
  bypassDenials: Array<{ id: string; at: string; reason: string; artifactKey: string }>;
};

const MAX_ARTIFACTS = 10_000;
const MAX_DENIALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, IMMUNE_STORE);
}

async function load(root: string): Promise<ImmuneStore> {
  const parsed = await readJsonFile<ImmuneStore>(storePath(root), {
    artifacts: [],
    bypassDenials: [],
  });
  return {
    artifacts: Array.isArray(parsed.artifacts) ? parsed.artifacts : [],
    bypassDenials: Array.isArray(parsed.bypassDenials) ? parsed.bypassDenials : [],
  };
}

async function save(root: string, store: ImmuneStore) {
  await writeJsonFileAtomic(storePath(root), {
    artifacts: store.artifacts.slice(-MAX_ARTIFACTS),
    bypassDenials: store.bypassDenials.slice(-MAX_DENIALS),
  });
}

export type RegisterArtifactInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  artifactKey: string;
  kind: ImmuneArtifact['kind'];
  /** Signals that trigger quarantine. */
  stale?: boolean;
  poisoned?: boolean;
  corrupted?: boolean;
  anomalousBehavior?: boolean;
  root?: string;
};

export async function registerOrInspectArtifact(input: RegisterArtifactInput): Promise<{
  artifact: ImmuneArtifact;
  quarantined: boolean;
  usableAsTrustedRetrieval: boolean;
}> {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const now = new Date().toISOString();

  let trustState: ArtifactTrustState = 'trusted';
  let reason = 'ARTIFACT_TRUSTED_PENDING_CONTINUOUS_EVAL';
  let revalidationRequired = false;

  if (input.poisoned) {
    trustState = 'poisoned';
    reason = ARTIFACT_QUARANTINED;
  } else if (input.corrupted) {
    trustState = 'corrupted';
    reason = MEMORY_REVALIDATION_REQUIRED;
    revalidationRequired = true;
  } else if (input.stale) {
    trustState = 'stale';
    reason = ARTIFACT_QUARANTINED;
  } else if (input.anomalousBehavior) {
    trustState = 'quarantined';
    reason = ARTIFACT_QUARANTINED;
  }

  const shouldQuarantine =
    trustState === 'poisoned' ||
    trustState === 'stale' ||
    trustState === 'corrupted' ||
    trustState === 'quarantined';

  if (shouldQuarantine && trustState !== 'corrupted') {
    trustState = 'quarantined';
  }
  if (trustState === 'corrupted') {
    trustState = 'revalidation_required';
    revalidationRequired = true;
  }

  const artifact: ImmuneArtifact = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    artifactKey: input.artifactKey,
    kind: input.kind,
    trustState,
    reason,
    quarantinedAt: shouldQuarantine ? now : null,
    revalidationRequired,
    silentlyTrusted: false,
    productionAuthorized: false,
  };

  const idx = store.artifacts.findIndex(
    (a) =>
      a.orgId === artifact.orgId &&
      a.universeId === artifact.universeId &&
      a.artifactKey === artifact.artifactKey,
  );
  if (idx >= 0) store.artifacts[idx] = artifact;
  else store.artifacts.push(artifact);
  await save(root, store);

  const usableAsTrustedRetrieval = artifact.trustState === 'trusted';

  return {
    artifact,
    quarantined: shouldQuarantine,
    usableAsTrustedRetrieval,
  };
}

export type RetrievalHitAttempt = {
  orgId: string;
  universeId: string;
  artifactKey: string;
  /** Probe: claim a faster route can use quarantined artifact. */
  preferFasterRouteBypass?: boolean;
  root?: string;
};

export type RetrievalHitResult = {
  allowed: boolean;
  reason: string;
  trustState: ArtifactTrustState | 'missing';
  usedAsTrustedHit: false | true;
};

/**
 * Trusted retrieval never returns quarantined/stale/poisoned/corrupted artifacts.
 * Faster route preference cannot bypass immune quarantine.
 */
export async function attemptTrustedRetrieval(
  input: RetrievalHitAttempt,
): Promise<RetrievalHitResult> {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const artifact = store.artifacts.find(
    (a) =>
      a.orgId === input.orgId &&
      a.universeId === input.universeId &&
      a.artifactKey === input.artifactKey,
  );

  if (!artifact) {
    return {
      allowed: false,
      reason: 'ARTIFACT_MISSING',
      trustState: 'missing',
      usedAsTrustedHit: false,
    };
  }

  if (
    artifact.trustState === 'quarantined' ||
    artifact.trustState === 'poisoned' ||
    artifact.trustState === 'stale' ||
    artifact.trustState === 'revalidation_required' ||
    artifact.trustState === 'corrupted'
  ) {
    if (input.preferFasterRouteBypass) {
      store.bypassDenials.push({
        id: randomUUID(),
        at: new Date().toISOString(),
        reason: QUARANTINE_BYPASS_DENIED,
        artifactKey: input.artifactKey,
      });
      await save(root, store);
      return {
        allowed: false,
        reason: QUARANTINE_BYPASS_DENIED,
        trustState: artifact.trustState,
        usedAsTrustedHit: false,
      };
    }
    return {
      allowed: false,
      reason: artifact.reason,
      trustState: artifact.trustState,
      usedAsTrustedHit: false,
    };
  }

  return {
    allowed: true,
    reason: 'TRUSTED_RETRIEVAL_HIT',
    trustState: artifact.trustState,
    usedAsTrustedHit: true,
  };
}

export async function requireMemoryRevalidation(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  memoryKey: string;
  root?: string;
}) {
  return registerOrInspectArtifact({
    ...input,
    artifactKey: input.memoryKey,
    kind: 'memory',
    corrupted: true,
  });
}

export function immuneSystemHonesty() {
  return {
    locks: BO_LOCKS,
    silentTrustStaleOrPoisoned: BO_LOCKS.SILENT_TRUST_STALE_OR_POISONED,
    fasterRouteBypassesQuarantine: BO_LOCKS.FASTER_ROUTE_BYPASSES_QUARANTINE,
    immuneQuarantineRequired: BO_LOCKS.IMMUNE_QUARANTINE_REQUIRED,
    productionAuthorization: false as const,
  };
}
