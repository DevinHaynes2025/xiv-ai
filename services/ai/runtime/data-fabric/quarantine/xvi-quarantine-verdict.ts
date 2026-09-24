export type XviQuarantineDecision =
  | 'CLEAN'
  | 'REVIEW_REQUIRED'
  | 'REJECTED';

export interface XviQuarantineInput {
  sourceId: string;
  manifestDigest: string;
  contentDigest: string;
  provenanceDigest: string;

  malwareDetected: boolean;
  executableContentDetected: boolean;
  promptInjectionDetected: boolean;
  personalDataDetected: boolean;
  credentialMaterialDetected: boolean;

  decision: XviQuarantineDecision;
}

export interface XviQuarantineReceipt {
  version: 'xvi-quarantine-v1';

  sourceId: string;
  manifestDigest: string;
  contentDigest: string;
  provenanceDigest: string;

  decision: XviQuarantineDecision;

  safeForMemoryAdmission: boolean;

  executesContent: false;
  executesFetch: false;
  executesTraining: false;
  networkAuthority: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_QUARANTINE_REFUSED',
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
    'sourceId',
    'manifestDigest',
    'contentDigest',
    'provenanceDigest',
    'malwareDetected',
    'executableContentDetected',
    'promptInjectionDetected',
    'personalDataDetected',
    'credentialMaterialDetected',
    'decision',
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

function digest(
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

function flag(
  value: unknown,
): boolean {
  if (typeof value !== 'boolean') {
    refuse();
  }

  return value;
}

export function createXviQuarantineVerdict(
  input: XviQuarantineInput,
): Readonly<XviQuarantineReceipt> {
  const d =
    exactInput(input);

  const sourceId =
    d.sourceId.value;

  if (
    typeof sourceId !== 'string' ||
    sourceId.length < 1 ||
    sourceId.length > 128 ||
    sourceId !== sourceId.trim()
  ) {
    refuse();
  }

  const manifestDigest =
    digest(d.manifestDigest.value);

  const contentDigest =
    digest(d.contentDigest.value);

  const provenanceDigest =
    digest(d.provenanceDigest.value);

  const malware =
    flag(d.malwareDetected.value);

  const executable =
    flag(
      d.executableContentDetected.value,
    );

  const promptInjection =
    flag(
      d.promptInjectionDetected.value,
    );

  const personalData =
    flag(
      d.personalDataDetected.value,
    );

  const credentials =
    flag(
      d.credentialMaterialDetected.value,
    );

  const decision =
    d.decision.value;

  if (
    decision !== 'CLEAN' &&
    decision !== 'REVIEW_REQUIRED' &&
    decision !== 'REJECTED'
  ) {
    refuse();
  }

  const dangerous =
    malware ||
    executable ||
    promptInjection ||
    personalData ||
    credentials;

  /*
   * A caller cannot simply label dangerous
   * content CLEAN.
   */
  if (
    decision === 'CLEAN' &&
    dangerous
  ) {
    refuse();
  }

  /*
   * Memory admission requires an explicitly
   * CLEAN verdict and zero detected hazards.
   */
  const safeForMemoryAdmission =
    decision === 'CLEAN' &&
    !dangerous;

  return Object.freeze({
    version:
      'xvi-quarantine-v1' as const,

    sourceId,
    manifestDigest,
    contentDigest,
    provenanceDigest,

    decision,

    safeForMemoryAdmission,

    executesContent: false as const,
    executesFetch: false as const,
    executesTraining: false as const,
    networkAuthority: false as const,
    productionAuthority: false as const,
  });
}
