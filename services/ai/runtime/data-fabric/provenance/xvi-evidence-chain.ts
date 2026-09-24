import {
  createHash,
} from 'node:crypto';

import type {
  XviBrainTarget,
} from '../xvi-source-manifest';

import type {
  XviInspectionEvidenceReceipt,
} from '../quarantine/xvi-inspection-evidence';

import type {
  XviQuarantineReceipt,
} from '../quarantine/xvi-quarantine-verdict';

export interface XviEvidenceChainInput {
  inspection:
    Readonly<XviInspectionEvidenceReceipt>;

  quarantine:
    Readonly<XviQuarantineReceipt>;

  observedAtMs: number;
  schemaVersion: string;

  brainTargets:
    readonly XviBrainTarget[];
}

export interface XviEvidenceChainReceipt {
  version:
    'xvi-evidence-chain-v1';

  sourceId: string;

  manifestDigest: string;
  requestDigest: string;
  contentDigest: string;
  inspectionDigest: string;

  quarantineDecision:
    'CLEAN';

  observedAtMs: number;
  schemaVersion: string;

  brainTargets:
    readonly XviBrainTarget[];

  evidenceDigest: string;

  eligibleForProvenance: true;

  executesContent: false;
  executesFetch: false;
  executesTraining: false;

  networkAuthority: false;
  productionAuthority: false;
}

const VALID_BRAINS =
  new Set<XviBrainTarget>([
    'MACRO',
    'FINANCIAL',
    'COMPANY',
    'HEALTH',
    'MENTAL_HEALTH',
    'GOVERNMENT',
    'CODE',
    'SCIENCE',
    'SUPPLY_CHAIN',
    'GEOSPATIAL',
    'TECHNOLOGY',
    'GOVERNANCE',
  ]);

const refuse = (): never => {
  throw new Error(
    'XVI_EVIDENCE_CHAIN_REFUSED',
  );
};

function exactInput(
  value: unknown,
): PropertyDescriptorMap {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !==
      Object.prototype
  ) {
    refuse();
  }

  const expected = [
    'inspection',
    'quarantine',
    'observedAtMs',
    'schemaVersion',
    'brainTargets',
  ] as const;

  const descriptors =
    Object.getOwnPropertyDescriptors(
      value,
    );

  const keys =
    Reflect.ownKeys(value);

  if (
    keys.length !== expected.length ||
    keys.some(
      key =>
        typeof key !== 'string' ||
        !expected.includes(
          key as (typeof expected)[number],
        ),
    )
  ) {
    refuse();
  }

  for (const key of expected) {
    const descriptor =
      descriptors[key];

    if (
      !descriptor ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      refuse();
    }
  }

  return descriptors;
}

function digest64(
  value: unknown,
): string {
  if (
    typeof value !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value)
  ) {
    refuse();
  }

  return value;
}

export function createXviEvidenceChain(
  input: XviEvidenceChainInput,
): Readonly<XviEvidenceChainReceipt> {
  const d =
    exactInput(input);

  const inspection =
    d.inspection.value as
      Readonly<XviInspectionEvidenceReceipt>;

  const quarantine =
    d.quarantine.value as
      Readonly<XviQuarantineReceipt>;

  if (
    inspection.version !==
      'xvi-inspection-evidence-v1' ||
    inspection.requiresReview !== false ||
    inspection.executesContent !== false ||
    inspection.executesFetch !== false ||
    inspection.executesTraining !== false ||
    inspection.networkAuthority !== false ||
    inspection.productionAuthority !== false
  ) {
    refuse();
  }

  if (
    quarantine.version !==
      'xvi-quarantine-v1' ||
    quarantine.decision !== 'CLEAN' ||
    quarantine.safeForMemoryAdmission !==
      true ||
    quarantine.executesContent !== false ||
    quarantine.executesFetch !== false ||
    quarantine.executesTraining !== false ||
    quarantine.networkAuthority !== false ||
    quarantine.productionAuthority !== false
  ) {
    refuse();
  }

  if (
    inspection.sourceId !==
      quarantine.sourceId ||
    inspection.manifestDigest !==
      quarantine.manifestDigest ||
    inspection.contentDigest !==
      quarantine.contentDigest
  ) {
    refuse();
  }

  const manifestDigest =
    digest64(
      inspection.manifestDigest,
    );

  const requestDigest =
    digest64(
      inspection.requestDigest,
    );

  const contentDigest =
    digest64(
      inspection.contentDigest,
    );

  const inspectionDigest =
    digest64(
      inspection.inspectionDigest,
    );

  const observedAtMs =
    d.observedAtMs.value;

  if (
    typeof observedAtMs !== 'number' ||
    !Number.isSafeInteger(
      observedAtMs,
    ) ||
    observedAtMs < 0
  ) {
    refuse();
  }

  const schemaVersion =
    d.schemaVersion.value;

  if (
    typeof schemaVersion !== 'string' ||
    schemaVersion.length < 1 ||
    schemaVersion.length > 128 ||
    schemaVersion !==
      schemaVersion.trim()
  ) {
    refuse();
  }

  const targets =
    d.brainTargets.value;

  if (
    !Array.isArray(targets) ||
    targets.length < 1 ||
    targets.length > 12 ||
    new Set(targets).size !==
      targets.length ||
    targets.some(
      target =>
        typeof target !== 'string' ||
        !VALID_BRAINS.has(
          target as XviBrainTarget,
        ),
    )
  ) {
    refuse();
  }

  const frozenTargets =
    Object.freeze([
      ...targets,
    ]) as readonly XviBrainTarget[];

  const canonical =
    JSON.stringify([
      'xvi-evidence-chain-v1',

      inspection.sourceId,

      manifestDigest,
      requestDigest,
      contentDigest,
      inspectionDigest,

      'CLEAN',

      observedAtMs,
      schemaVersion,

      frozenTargets,
    ]);

  const evidenceDigest =
    createHash('sha256')
      .update(canonical)
      .digest('hex');

  return Object.freeze({
    version:
      'xvi-evidence-chain-v1' as const,

    sourceId:
      inspection.sourceId,

    manifestDigest,
    requestDigest,
    contentDigest,
    inspectionDigest,

    quarantineDecision:
      'CLEAN' as const,

    observedAtMs,
    schemaVersion,

    brainTargets:
      frozenTargets,

    evidenceDigest,

    eligibleForProvenance:
      true as const,

    executesContent:
      false as const,

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
