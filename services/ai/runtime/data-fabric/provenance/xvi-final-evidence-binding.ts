import type {
  XviInspectionEvidenceReceipt,
} from '../quarantine/xvi-inspection-evidence';

import type {
  XviEvidenceChainReceipt,
} from './xvi-evidence-chain';

import type {
  XviProvenanceReceipt,
} from './xvi-provenance-ledger';

export interface XviFinalEvidenceBindingInput {
  inspection:
    Readonly<XviInspectionEvidenceReceipt>;

  evidence:
    Readonly<XviEvidenceChainReceipt>;

  provenance:
    Readonly<XviProvenanceReceipt>;
}

export interface XviFinalEvidenceBindingReceipt {
  version:
    'xvi-final-evidence-binding-v1';

  sourceId: string;

  manifestDigest: string;
  requestDigest: string;
  contentDigest: string;

  inspectionDigest: string;
  evidenceDigest: string;
  provenanceDigest: string;

  observedAtMs: number;
  schemaVersion: string;

  finalEvidenceVerified: true;
  eligibleForMemoryAdmission: true;

  executesContent: false;
  executesFetch: false;
  executesTraining: false;

  networkAuthority: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_FINAL_EVIDENCE_BINDING_REFUSED',
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
    'evidence',
    'provenance',
  ] as const;

  const descriptors =
    Object.getOwnPropertyDescriptors(value);

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

export function bindXviFinalEvidence(
  input: XviFinalEvidenceBindingInput,
): Readonly<XviFinalEvidenceBindingReceipt> {
  const d =
    exactInput(input);

  const inspection =
    d.inspection.value as
      Readonly<XviInspectionEvidenceReceipt>;

  const evidence =
    d.evidence.value as
      Readonly<XviEvidenceChainReceipt>;

  const provenance =
    d.provenance.value as
      Readonly<XviProvenanceReceipt>;

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
    evidence.version !==
      'xvi-evidence-chain-v1' ||
    evidence.quarantineDecision !== 'CLEAN' ||
    evidence.eligibleForProvenance !== true ||
    evidence.executesContent !== false ||
    evidence.executesFetch !== false ||
    evidence.executesTraining !== false ||
    evidence.networkAuthority !== false ||
    evidence.productionAuthority !== false
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
    inspection.sourceId !== evidence.sourceId ||
    inspection.sourceId !== provenance.sourceId ||

    inspection.manifestDigest !==
      evidence.manifestDigest ||
    inspection.manifestDigest !==
      provenance.manifestDigest ||

    inspection.contentDigest !==
      evidence.contentDigest ||
    inspection.contentDigest !==
      provenance.contentDigest ||

    inspection.inspectionDigest !==
      evidence.inspectionDigest ||

    evidence.observedAtMs !==
      provenance.observedAtMs ||

    evidence.schemaVersion !==
      provenance.schemaVersion
  ) {
    refuse();
  }

  if (
    evidence.brainTargets.length !==
      provenance.brainTargets.length
  ) {
    refuse();
  }

  for (
    let index = 0;
    index < evidence.brainTargets.length;
    index += 1
  ) {
    if (
      evidence.brainTargets[index] !==
        provenance.brainTargets[index]
    ) {
      refuse();
    }
  }

  return Object.freeze({
    version:
      'xvi-final-evidence-binding-v1' as const,

    sourceId:
      evidence.sourceId,

    manifestDigest:
      digest64(evidence.manifestDigest),

    requestDigest:
      digest64(evidence.requestDigest),

    contentDigest:
      digest64(evidence.contentDigest),

    inspectionDigest:
      digest64(evidence.inspectionDigest),

    evidenceDigest:
      digest64(evidence.evidenceDigest),

    provenanceDigest:
      digest64(provenance.provenanceDigest),

    observedAtMs:
      evidence.observedAtMs,

    schemaVersion:
      evidence.schemaVersion,

    finalEvidenceVerified:
      true as const,

    eligibleForMemoryAdmission:
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
