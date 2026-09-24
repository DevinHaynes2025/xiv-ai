import type {
  XviBrainTarget,
} from '../xvi-source-manifest';

import type {
  XviAdmittedSource,
} from '../xvi-source-validator';

import type {
  XviAdmittedBrainBinding,
} from '../brains/xvi-admitted-brain-binding';

import type {
  XviProvenanceReceipt,
} from '../provenance/xvi-provenance-ledger';

import type {
  XviQuarantineReceipt,
} from '../quarantine/xvi-quarantine-verdict';

export interface XviMemoryAdmissionInput {
  source:
    Readonly<XviAdmittedSource>;

  binding:
    Readonly<XviAdmittedBrainBinding>;

  provenance:
    Readonly<XviProvenanceReceipt>;

  quarantine:
    Readonly<XviQuarantineReceipt>;
}

export interface XviMemoryAdmissionReceipt {
  version:
    'xvi-memory-admission-v1';

  sourceId: string;

  manifestDigest: string;
  contentDigest: string;
  provenanceDigest: string;

  brainTargets:
    readonly XviBrainTarget[];

  admittedToMemory: true;

  retrievalEligible: true;
  trainingEligible: false;

  executesContent: false;
  executesFetch: false;
  executesTraining: false;

  networkAuthority: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_MEMORY_ADMISSION_REFUSED',
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
    'source',
    'binding',
    'provenance',
    'quarantine',
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
          key as
            (typeof expected)[number],
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

export function admitXviMemory(
  input: XviMemoryAdmissionInput,
): Readonly<XviMemoryAdmissionReceipt> {
  const d =
    exactInput(input);

  const source =
    d.source.value as
      Readonly<XviAdmittedSource>;

  const binding =
    d.binding.value as
      Readonly<XviAdmittedBrainBinding>;

  const provenance =
    d.provenance.value as
      Readonly<XviProvenanceReceipt>;

  const quarantine =
    d.quarantine.value as
      Readonly<XviQuarantineReceipt>;

  if (
    source.version !==
      'xvi-admitted-source-v1' ||
    source.admittedForRetrieval !== true ||
    source.executesFetch !== false ||
    source.executesTraining !== false ||
    source.networkAuthority !== false ||
    source.productionAuthority !== false
  ) {
    refuse();
  }

  if (
    binding.version !==
      'xvi-admitted-brain-binding-v1' ||
    binding.admissionVerified !== true ||
    binding.routingVerified !== true ||
    binding.executesFetch !== false ||
    binding.executesTraining !== false ||
    binding.networkAuthority !== false ||
    binding.productionAuthority !== false
  ) {
    refuse();
  }

  if (
    provenance.version !==
      'xvi-provenance-receipt-v1' ||
    provenance.executesFetch !== false ||
    provenance.executesTraining !== false ||
    provenance.networkAuthority !== false ||
    provenance.productionAuthority !== false
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

  /*
   * Cross-receipt identity binding.
   */

  if (
    source.manifest.sourceId !==
      binding.sourceId ||
    source.manifest.sourceId !==
      provenance.sourceId ||
    source.manifest.sourceId !==
      quarantine.sourceId
  ) {
    refuse();
  }

  if (
    source.manifestDigest !==
      binding.manifestDigest ||
    source.manifestDigest !==
      provenance.manifestDigest ||
    source.manifestDigest !==
      quarantine.manifestDigest
  ) {
    refuse();
  }

  if (
    provenance.contentDigest !==
      quarantine.contentDigest ||
    provenance.provenanceDigest !==
      quarantine.provenanceDigest
  ) {
    refuse();
  }

  if (
    binding.brainTargets.length !==
      provenance.brainTargets.length
  ) {
    refuse();
  }

  for (
    let index = 0;
    index < binding.brainTargets.length;
    index += 1
  ) {
    if (
      binding.brainTargets[index] !==
        provenance.brainTargets[index]
    ) {
      refuse();
    }
  }

  return Object.freeze({
    version:
      'xvi-memory-admission-v1' as const,

    sourceId:
      source.manifest.sourceId,

    manifestDigest:
      source.manifestDigest,

    contentDigest:
      provenance.contentDigest,

    provenanceDigest:
      provenance.provenanceDigest,

    brainTargets:
      Object.freeze([
        ...binding.brainTargets,
      ]),

    admittedToMemory:
      true as const,

    retrievalEligible:
      true as const,

    /*
     * Memory admission NEVER implies
     * model-training permission.
     */
    trainingEligible:
      false as const,

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
