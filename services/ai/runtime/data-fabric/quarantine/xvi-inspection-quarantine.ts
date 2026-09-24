import type {
  XviContentInspectionReceipt,
} from './xvi-content-inspector';

import {
  createXviQuarantineVerdict,
  type XviQuarantineReceipt,
} from './xvi-quarantine-verdict';

const refuse = (): never => {
  throw new Error(
    'XVI_INSPECTION_QUARANTINE_REFUSED',
  );
};

export function quarantineXviInspection(
  inspection:
    Readonly<XviContentInspectionReceipt>,
): Readonly<XviQuarantineReceipt> {
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

  if (
    !/^[a-f0-9]{64}$/.test(
      inspection.manifestDigest,
    ) ||
    !/^[a-f0-9]{64}$/.test(
      inspection.contentDigest,
    )
  ) {
    refuse();
  }

  const hazardous =
    inspection.malwareDetected ||
    inspection.executableContentDetected ||
    inspection.promptInjectionDetected ||
    inspection.personalDataDetected ||
    inspection.credentialMaterialDetected;

  /*
   * Internal consistency is mandatory.
   */
  if (
    inspection.requiresReview !==
      hazardous
  ) {
    refuse();
  }

  /*
   * The quarantine receipt requires a
   * provenance digest. At this boundary
   * we deterministically bind the scan
   * to its request identity until the
   * final provenance receipt is created.
   */
  const provenanceDigest =
    inspection.requestDigest;

  return createXviQuarantineVerdict({
    sourceId:
      inspection.sourceId,

    manifestDigest:
      inspection.manifestDigest,

    contentDigest:
      inspection.contentDigest,

    provenanceDigest,

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

    decision:
      hazardous
        ? 'REVIEW_REQUIRED'
        : 'CLEAN',
  });
}
