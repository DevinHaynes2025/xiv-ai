import {
  createHash,
} from 'node:crypto';

import type {
  XviContentInspectionReceipt,
} from './xvi-content-inspector';

export interface XviInspectionEvidenceReceipt {
  version:
    'xvi-inspection-evidence-v1';

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

  inspectionDigest: string;

  executesContent: false;
  executesFetch: false;
  executesTraining: false;
  networkAuthority: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_INSPECTION_EVIDENCE_REFUSED',
  );
};

export function createXviInspectionEvidence(
  inspection:
    Readonly<XviContentInspectionReceipt>,
): Readonly<XviInspectionEvidenceReceipt> {
  if (
    inspection.version !==
      'xvi-content-inspection-v1' ||
    inspection.executesContent !== false ||
    inspection.executesFetch !== false ||
    inspection.executesTraining !== false ||
    inspection.networkAuthority !== false ||
    inspection.productionAuthority !== false
  ) {
    refuse();
  }

  for (
    const digest of [
      inspection.manifestDigest,
      inspection.requestDigest,
      inspection.contentDigest,
    ]
  ) {
    if (
      !/^[a-f0-9]{64}$/.test(digest)
    ) {
      refuse();
    }
  }

  if (
    !Number.isSafeInteger(
      inspection.payloadBytes,
    ) ||
    inspection.payloadBytes < 1
  ) {
    refuse();
  }

  const hazardous =
    inspection.malwareDetected ||
    inspection.executableContentDetected ||
    inspection.promptInjectionDetected ||
    inspection.personalDataDetected ||
    inspection.credentialMaterialDetected;

  if (
    inspection.requiresReview !==
      hazardous
  ) {
    refuse();
  }

  const canonical =
    JSON.stringify([
      'xvi-inspection-evidence-v1',

      inspection.sourceId,
      inspection.manifestDigest,
      inspection.requestDigest,
      inspection.contentDigest,

      inspection.payloadBytes,

      inspection.malwareDetected,
      inspection.executableContentDetected,
      inspection.promptInjectionDetected,
      inspection.personalDataDetected,
      inspection.credentialMaterialDetected,

      inspection.requiresReview,
    ]);

  const inspectionDigest =
    createHash('sha256')
      .update(canonical)
      .digest('hex');

  return Object.freeze({
    version:
      'xvi-inspection-evidence-v1' as const,

    sourceId:
      inspection.sourceId,

    manifestDigest:
      inspection.manifestDigest,

    requestDigest:
      inspection.requestDigest,

    contentDigest:
      inspection.contentDigest,

    payloadBytes:
      inspection.payloadBytes,

    malwareDetected:
      inspection.malwareDetected,

    executableContentDetected:
      inspection.executableContentDetected,

    promptInjectionDetected:
      inspection.promptInjectionDetected,

    personalDataDetected:
      inspection.personalDataDetected,

    credentialMaterialDetected:
      inspection.credentialMaterialDetected,

    requiresReview:
      inspection.requiresReview,

    inspectionDigest,

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
