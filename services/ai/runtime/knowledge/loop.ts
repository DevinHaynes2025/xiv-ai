import { companyEntersGlobalBrainAutomatically, evaluateBrainTransfer } from '../fabric';
import { internationalCrossOrgDenied } from '../international/intelligence';
import type { KnowledgeLoopStep } from './types';

export const KNOWLEDGE_INTELLIGENCE_LOOP: readonly KnowledgeLoopStep[] = [
  'OBSERVE',
  'INGEST',
  'NORMALIZE',
  'VERIFY',
  'UNDERSTAND',
  'CONNECT',
  'PREDICT',
  'RECOMMEND',
  'DECIDE',
  'ACT',
  'MEASURE',
  'LEARN',
];

export function learningMayRewriteSecurityOrProductionPolicy(): false {
  return false;
}

export function globalBrainExcludesTenantPrivateData(): boolean {
  return (
    companyEntersGlobalBrainAutomatically() === false &&
    evaluateBrainTransfer({ from: 'company', to: 'global' }).allowed === false
  );
}

export function knowledgeCrossOrgDenied(): boolean {
  return internationalCrossOrgDenied().allowed === false;
}
