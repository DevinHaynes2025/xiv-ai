import { createHash } from 'node:crypto';

export interface LocalLearningExample {
  tenantId: string;
  sourceRef: string;
  content: string;
  approved: boolean;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
}

export interface LocalLearningReceipt {
  exampleId: string;
  tenantId: string;
  sourceRef: string;
  classification: LocalLearningExample['classification'];
  contentHash: string;
  mode: 'RAG_MEMORY_EVAL' | 'FINE_TUNE_CANDIDATE';
  modelWeightsMutated: false;
}

export const LOCAL_LEARNING_GUARDRAILS = {
  approvalRequired: true,
  provenanceRequired: true,
  productionSelfModificationAllowed: false,
  modelWeightMutationByDefault: false,
  topSecretCloudTrainingAllowed: false,
  rollbackRequiredForFutureFineTuning: true,
};

export function stageLocalLearning(example: LocalLearningExample): LocalLearningReceipt {
  if (!example.approved) throw new Error('learning example requires explicit approval');
  if (!example.sourceRef) throw new Error('learning example requires provenance');
  const contentHash = createHash('sha256').update(example.content).digest('hex');
  return {
    exampleId: `learn-${contentHash.slice(0, 16)}`,
    tenantId: example.tenantId,
    sourceRef: example.sourceRef,
    classification: example.classification,
    contentHash,
    mode: 'RAG_MEMORY_EVAL',
    modelWeightsMutated: false,
  };
}
