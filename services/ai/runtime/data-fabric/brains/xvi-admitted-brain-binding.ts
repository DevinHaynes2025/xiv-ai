import type {
  XviBrainTarget,
} from '../xvi-source-manifest';

import type {
  XviAdmittedSource,
} from '../xvi-source-validator';

import {
  routeSourceToBrains,
} from './xvi-brain-router';

export interface XviAdmittedBrainBinding {
  version: 'xvi-admitted-brain-binding-v1';

  sourceId: string;
  manifestDigest: string;

  brainTargets:
    readonly XviBrainTarget[];

  admissionVerified: true;
  routingVerified: true;

  executesFetch: false;
  executesTraining: false;
  networkAuthority: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_ADMITTED_BRAIN_BINDING_REFUSED',
  );
};

export function bindAdmittedSourceToBrains(
  admitted: Readonly<XviAdmittedSource>,
): Readonly<XviAdmittedBrainBinding> {
  if (
    admitted.version !==
      'xvi-admitted-source-v1' ||
    admitted.admittedForRetrieval !== true ||
    admitted.executesFetch !== false ||
    admitted.executesTraining !== false ||
    admitted.networkAuthority !== false ||
    admitted.productionAuthority !== false ||
    !/^[a-f0-9]{64}$/.test(
      admitted.manifestDigest,
    )
  ) {
    refuse();
  }

  const route =
    routeSourceToBrains(
      admitted.manifest,
    );

  if (
    route.routeApproved !== true ||
    route.executesFetch !== false ||
    route.executesTraining !== false ||
    route.networkAuthority !== false ||
    route.productionAuthority !== false ||
    route.sourceId !==
      admitted.manifest.sourceId
  ) {
    refuse();
  }

  if (
    route.brainTargets.length !==
      admitted.manifest.brainTargets.length
  ) {
    refuse();
  }

  for (
    let index = 0;
    index < route.brainTargets.length;
    index += 1
  ) {
    if (
      route.brainTargets[index] !==
        admitted.manifest.brainTargets[index]
    ) {
      refuse();
    }
  }

  return Object.freeze({
    version:
      'xvi-admitted-brain-binding-v1' as const,

    sourceId:
      admitted.manifest.sourceId,

    manifestDigest:
      admitted.manifestDigest,

    brainTargets:
      Object.freeze([
        ...route.brainTargets,
      ]),

    admissionVerified:
      true as const,

    routingVerified:
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
