import {
  createHash,
} from 'node:crypto';

import type {
  XviSupervisedResponseReceipt,
} from '../sources/xvi-supervised-response';

export interface XviContentInspectionInput {
  response:
    Readonly<XviSupervisedResponseReceipt>;

  payload: string;
}

export interface XviContentInspectionReceipt {
  version:
    'xvi-content-inspection-v1';

  sourceId: string;
  manifestDigest: string;
  requestDigest: string;

  contentDigest: string;
  payloadBytes: number;

  malwareDetected: boolean;
  executableContentDetected: boolean;
  promptInjectionDetected: boolean;
  personalDataDetected: boolean;
  credentialMaterialDetected: boolean;

  requiresReview: boolean;

  executesContent: false;
  executesFetch: false;
  executesTraining: false;
  networkAuthority: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_CONTENT_INSPECTION_REFUSED',
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
    'response',
    'payload',
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

function containsAny(
  haystack: string,
  needles: readonly string[],
): boolean {
  return needles.some(
    needle =>
      haystack.includes(needle),
  );
}

export function inspectXviContent(
  input: XviContentInspectionInput,
): Readonly<XviContentInspectionReceipt> {
  const d =
    exactInput(input);

  const response =
    d.response.value as
      Readonly<XviSupervisedResponseReceipt>;

  if (
    response.version !==
      'xvi-supervised-response-v1' ||
    response.statusCode !== 200 ||
    response.contentType !==
      'application/json' ||
    response.eligibleForQuarantine !==
      true ||
    response.networkAuthority !== false ||
    response.executesContent !== false ||
    response.executesTraining !== false ||
    response.productionAuthority !== false
  ) {
    refuse();
  }

  const payload =
    d.payload.value;

  if (
    typeof payload !== 'string'
  ) {
    refuse();
  }

  const payloadBytes =
    Buffer.byteLength(
      payload,
      'utf8',
    );

  if (
    payloadBytes !==
      response.payloadBytes
  ) {
    refuse();
  }

  const contentDigest =
    createHash('sha256')
      .update(payload, 'utf8')
      .digest('hex');

  if (
    contentDigest !==
      response.contentDigest
  ) {
    refuse();
  }

  /*
   * Response boundary already requires
   * syntactically valid JSON.
   */
  try {
    JSON.parse(payload);
  } catch {
    refuse();
  }

  const normalized =
    payload.toLowerCase();

  /*
   * Deterministic baseline indicators.
   * These are review signals, not claims
   * of comprehensive malware/PII detection.
   */

  const promptInjectionDetected =
    containsAny(
      normalized,
      [
        'ignore previous instructions',
        'ignore all previous instructions',
        'system prompt',
        'developer message',
        'reveal your instructions',
        'override instructions',
        'jailbreak',
      ],
    );

  const executableContentDetected =
    containsAny(
      normalized,
      [
        '<script',
        'javascript:',
        'powershell.exe',
        'cmd.exe',
        '#!/bin/',
        'eval(',
        'child_process',
      ],
    );

  const credentialMaterialDetected =
    containsAny(
      normalized,
      [
        'authorization: bearer ',
        '"password":',
        '"api_key":',
        '"apikey":',
        '"access_token":',
        '"private_key":',
        '-----begin private key-----',
      ],
    );

  /*
   * Conservative structured-data signals.
   * A stronger DLP/PII layer should follow
   * before broad real-world ingestion.
   */
  const personalDataDetected =
    containsAny(
      normalized,
      [
        '"social_security_number":',
        '"ssn":',
        '"medical_record_number":',
        '"patient_id":',
        '"date_of_birth":',
      ],
    );

  /*
   * Baseline executable/malicious marker.
   * No payload is ever executed here.
   */
  const malwareDetected =
    containsAny(
      normalized,
      [
        'eicar-standard-antivirus-test-file',
        'invoke-mimikatz',
        'meterpreter',
      ],
    );

  const requiresReview =
    malwareDetected ||
    executableContentDetected ||
    promptInjectionDetected ||
    personalDataDetected ||
    credentialMaterialDetected;

  return Object.freeze({
    version:
      'xvi-content-inspection-v1' as const,

    sourceId:
      response.sourceId,

    manifestDigest:
      response.manifestDigest,

    requestDigest:
      response.requestDigest,

    contentDigest,

    payloadBytes,

    malwareDetected,
    executableContentDetected,
    promptInjectionDetected,
    personalDataDetected,
    credentialMaterialDetected,

    requiresReview,

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
