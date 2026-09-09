/**
 * Learning Pipeline — controlled, human-gated. No uncontrolled self-retraining.
 * Approved interaction → outcome → feedback → anonymize/redact if permitted →
 * classify → provenance → evaluation candidate → benchmark → human review → promotion.
 */

import { LEARNING_PIPELINE, type LearningPipelineStage } from './types';
import type { DatasetRecord } from './datasets';
import type { ModelFineTuneCandidate, ModelRecord } from './registry';

export type LearningPipeline = {
  stages: readonly LearningPipelineStage[];
  uncontrolledSelfRetrain: false;
  humanApprovalRequired: true;
  productionLive: false;
};

export type LearningStepInput = {
  stage: LearningPipelineStage;
  dataset?: DatasetRecord;
  model?: ModelRecord;
  candidate?: ModelFineTuneCandidate;
  humanApproved?: boolean;
  guardianApproved?: boolean;
  selfRetrain?: boolean;
};

export function openLearningPipeline(): LearningPipeline {
  return {
    stages: LEARNING_PIPELINE,
    uncontrolledSelfRetrain: false,
    humanApprovalRequired: true,
    productionLive: false,
  };
}

export function listLearningPipelineStages(): readonly LearningPipelineStage[] {
  return LEARNING_PIPELINE;
}

export function advanceLearningStage(input: LearningStepInput) {
  if (input.selfRetrain === true) {
    return { allowed: false as const, reason: 'no_uncontrolled_self_retraining' };
  }
  if (input.stage === 'RIGHTS_CONSENT' && input.dataset) {
    if (
      input.dataset.source.kind === 'OPT_IN_PERSONAL' &&
      input.dataset.consent.state !== 'EXPLICIT_OPT_IN'
    ) {
      return { allowed: false as const, reason: 'consent_required' };
    }
  }
  if (input.stage === 'PROVENANCE' && input.dataset && !input.dataset.provenance.complete) {
    return { allowed: false as const, reason: 'training_data_lineage_required' };
  }
  if (input.stage === 'HUMAN_APPROVAL' && input.humanApproved !== true) {
    return { allowed: false as const, reason: 'human_approval_required' };
  }
  if (input.stage === 'CONTROLLED_DEPLOYMENT') {
    if (input.guardianApproved !== true) {
      return { allowed: false as const, reason: 'guardian_required' };
    }
    if (input.humanApproved !== true) {
      return { allowed: false as const, reason: 'human_approval_required' };
    }
    if (input.model?.maySelfPromote) {
      return { allowed: false as const, reason: 'model_cannot_self_promote' };
    }
  }
  if (input.stage === 'FINE_TUNE_CANDIDATE' && input.candidate && !input.candidate.humanApproved) {
    return { allowed: false as const, reason: 'fine_tune_requires_human_approval' };
  }
  return { allowed: true as const, stage: input.stage, selfRetrain: false as const };
}

export function learningPipelineDocument(): readonly LearningPipelineStage[] {
  return LEARNING_PIPELINE;
}
