/**
 * Classification ladder PUBLIC → … → SECRET.
 * No government classified acquisition. SECRET here is company internal ladder only.
 */
import type { ClassificationLadder } from './types';
import { CLASSIFICATION_LADDER } from './types';

export type ClassificationPolicy = {
  ladder: readonly ClassificationLadder[];
  acquiresGovernmentClassified: false;
  autoDowngradeForbidden: true;
};

export function openClassificationPolicy(): ClassificationPolicy {
  return {
    ladder: CLASSIFICATION_LADDER,
    acquiresGovernmentClassified: false,
    autoDowngradeForbidden: true,
  };
}

export function classificationRank(level: ClassificationLadder): number {
  return CLASSIFICATION_LADDER.indexOf(level);
}

export function mayAccessClassification(input: {
  subjectClearance: ClassificationLadder;
  objectClassification: ClassificationLadder;
  governmentClassifiedSource?: boolean;
}) {
  if (input.governmentClassifiedSource === true) {
    return { allowed: false as const, reason: 'no_government_classified_acquisition' };
  }
  if (classificationRank(input.subjectClearance) < classificationRank(input.objectClassification)) {
    return { allowed: false as const, reason: 'insufficient_clearance' };
  }
  return { allowed: true as const };
}

export function acquiresGovernmentClassifiedIntel(): false {
  return false;
}

export function autoDowngradeClassificationAllowed(): false {
  return false;
}
