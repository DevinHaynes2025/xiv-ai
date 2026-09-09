import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BO_LOCKS,
  QUARANTINE_BYPASS_DENIED,
  type AdaptiveLocality,
} from './superbrain-neuroplasticity-types';
import { attemptTrustedRetrieval } from './global-intelligence-immune-system';

/**
 * Adaptive Offline/Cloud Brain Layers.
 * Adapts placement/routing under trust and metabolism constraints.
 * Privacy/security above speed/price. Quarantined artifacts cannot be used
 * even if a cloud/faster route is available.
 */

export const ADAPTIVE_LAYER_STORE = 'adaptive-offline-cloud-brain-layers.json';

export type AdaptivePlacement = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  workloadKey: string;
  locality: AdaptiveLocality;
  trustSatisfied: boolean;
  metabolismOk: boolean;
  reason: string;
  at: string;
  productionAuthorized: false;
};

type LayerStore = {
  placements: AdaptivePlacement[];
  denials: Array<{ id: string; at: string; reason: string; workloadKey: string }>;
};

const MAX_PLACEMENTS = 5_000;
const MAX_DENIALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, ADAPTIVE_LAYER_STORE);
}

async function load(root: string): Promise<LayerStore> {
  const parsed = await readJsonFile<LayerStore>(storePath(root), {
    placements: [],
    denials: [],
  });
  return {
    placements: Array.isArray(parsed.placements) ? parsed.placements : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: LayerStore) {
  await writeJsonFileAtomic(storePath(root), {
    placements: store.placements.slice(-MAX_PLACEMENTS),
    denials: store.denials.slice(-MAX_DENIALS),
  });
}

export type AdaptivePlacementInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  workloadKey: string;
  /** Preferred locality (speed/price bias) — overruled by trust/immune. */
  preferredLocality?: AdaptiveLocality;
  localCapacityOk?: boolean;
  edgeCapacityOk?: boolean;
  cloudConfigured?: boolean;
  cloudVerified?: boolean;
  /** Artifact that must be trusted for this workload. */
  requiredArtifactKey?: string;
  /** Probe: try to use faster cloud despite quarantine. */
  attemptFasterBypassQuarantine?: boolean;
  /** Metabolism constraint from BN/BL (capacity / cost budget). */
  metabolismBudgetOk?: boolean;
  root?: string;
};

export type AdaptivePlacementResult = {
  accepted: boolean;
  reason: string;
  placement: AdaptivePlacement | null;
  productionAuthorization: false;
  providersUnavailableUntilVerified: true;
};

export async function adaptBrainLayerPlacement(
  input: AdaptivePlacementInput,
): Promise<AdaptivePlacementResult> {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  const deny = async (reason: string): Promise<AdaptivePlacementResult> => {
    store.denials.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      reason,
      workloadKey: input.workloadKey,
    });
    await save(root, store);
    return {
      accepted: false,
      reason,
      placement: null,
      productionAuthorization: false,
      providersUnavailableUntilVerified: true,
    };
  };

  if (!input.orgId || !input.tenantId || !input.universeId) {
    return deny('ORG_TENANT_UNIVERSE_REQUIRED');
  }

  if (input.metabolismBudgetOk === false) {
    return deny('METABOLISM_CAPACITY_CONSTRAINT — placement deferred.');
  }

  if (input.requiredArtifactKey) {
    const hit = await attemptTrustedRetrieval({
      orgId: input.orgId,
      universeId: input.universeId,
      artifactKey: input.requiredArtifactKey,
      preferFasterRouteBypass: input.attemptFasterBypassQuarantine === true,
      root,
    });
    if (!hit.allowed) {
      return deny(
        input.attemptFasterBypassQuarantine
          ? QUARANTINE_BYPASS_DENIED
          : `TRUST_GATE — ${hit.reason}`,
      );
    }
  }

  let locality: AdaptiveLocality = 'local';
  let reason = 'DEFAULT_LOCAL_PRIVACY_FIRST';

  if (input.localCapacityOk !== false) {
    locality = 'local';
    reason = 'LOCAL_PREFERRED_PRIVACY_AND_TRUST';
  } else if (input.edgeCapacityOk) {
    locality = 'edge';
    reason = 'EDGE_FALLBACK_UNDER_METABOLISM';
  } else if (input.cloudConfigured && input.cloudVerified) {
    locality = 'cloud';
    reason = 'CLOUD_VERIFIED_ONLY';
  } else if (input.preferredLocality === 'cloud' || input.cloudConfigured) {
    // Unverified/unconfigured cloud stays UNAVAILABLE.
    return deny('CLOUD_PROVIDER_UNAVAILABLE_UNTIL_VERIFIED');
  } else {
    locality = 'hybrid';
    reason = 'HYBRID_DEGRADED_CONTRACT';
  }

  // Privacy/security above speed/price: never elevate preferred cloud over local
  // when local is healthy, even if preferredLocality is cloud.
  if (
    input.preferredLocality === 'cloud' &&
    input.localCapacityOk !== false &&
    BO_LOCKS.PRIVACY_OVER_SPEED_OR_PRICE
  ) {
    locality = 'local';
    reason = 'PRIVACY_OVER_SPEED_OR_PRICE — local retained despite faster cloud preference.';
  }

  const placement: AdaptivePlacement = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    workloadKey: input.workloadKey,
    locality,
    trustSatisfied: true,
    metabolismOk: input.metabolismBudgetOk !== false,
    reason,
    at: new Date().toISOString(),
    productionAuthorized: false,
  };

  store.placements.push(placement);
  await save(root, store);

  return {
    accepted: true,
    reason: placement.reason,
    placement,
    productionAuthorization: false,
    providersUnavailableUntilVerified: true,
  };
}

export function adaptiveLayersHonesty() {
  return {
    locks: BO_LOCKS,
    privacyOverSpeedOrPrice: BO_LOCKS.PRIVACY_OVER_SPEED_OR_PRICE,
    fasterRouteBypassesQuarantine: BO_LOCKS.FASTER_ROUTE_BYPASSES_QUARANTINE,
    providersUnavailableUntilVerified: BO_LOCKS.PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED,
    productionAuthorization: false as const,
    l4AutonomyEnabled: false as const,
  };
}
