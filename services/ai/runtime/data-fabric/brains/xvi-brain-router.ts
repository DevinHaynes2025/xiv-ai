import type {
  XviBrainTarget,
  XviSourceManifest,
} from '../xvi-source-manifest';

import {
  XVI_BRAIN_REGISTRY,
} from './xvi-brain-registry';

export interface XviBrainRouteReceipt {
  version: 'xvi-brain-route-v1';

  sourceId: string;

  brainTargets: readonly XviBrainTarget[];

  routeApproved: true;

  executesFetch: false;
  executesTraining: false;
  networkAuthority: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_BRAIN_ROUTE_REFUSED',
  );
};

export function routeSourceToBrains(
  manifest: Readonly<XviSourceManifest>,
): Readonly<XviBrainRouteReceipt> {
  if (
    manifest.version !==
      'xvi-source-manifest-v1' ||
    manifest.executesFetch !== false ||
    manifest.networkAuthority !== false ||
    manifest.productionAuthority !== false
  ) {
    refuse();
  }

  if (
    manifest.sensitivity === 'PROHIBITED'
  ) {
    refuse();
  }

  if (
    manifest.containsPersonalData
  ) {
    refuse();
  }

  if (
    !manifest.retrievalAllowed
  ) {
    refuse();
  }

  if (
    manifest.providerAuthenticationRequired &&
    !manifest.authorizationVerified
  ) {
    refuse();
  }

  if (
    !Array.isArray(
      manifest.brainTargets,
    ) ||
    manifest.brainTargets.length < 1
  ) {
    refuse();
  }

  const unique =
    [...new Set(
      manifest.brainTargets,
    )];

  if (
    unique.length !==
      manifest.brainTargets.length
  ) {
    refuse();
  }

  for (const target of unique) {
    const brain =
      XVI_BRAIN_REGISTRY[target];

    if (!brain) {
      refuse();
    }

    if (
      manifest.sensitivity ===
        'RESTRICTED' &&
      !brain.acceptsRestrictedData
    ) {
      refuse();
    }

    if (
      manifest.containsPersonalData &&
      !brain.acceptsPersonalData
    ) {
      refuse();
    }
  }

  return Object.freeze({
    version:
      'xvi-brain-route-v1' as const,

    sourceId:
      manifest.sourceId,

    brainTargets:
      Object.freeze([...unique]),

    routeApproved:
      true as const,

    executesFetch:
      false as const,

    executesTraining:
      false as const,

    networkAuthority:
      false as const,

    productionAuthority:
      false as const,
  });
}
