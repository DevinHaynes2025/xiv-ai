import type { XivAgentId } from '../agents';
import type { DataClassification } from '../universe/types';

const RANK: Record<DataClassification, number> = {
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
};

export function classificationRank(value: DataClassification) {
  return RANK[value];
}

export function canAgentAccessClassification(agentId: XivAgentId, classification: DataClassification) {
  if (agentId === 'guardian' || agentId === 'innovation' || agentId === 'moderation') {
    return classification === 'public';
  }
  if (classification === 'restricted' && agentId !== 'executive' && agentId !== 'security') return false;
  return true;
}

export function consumerMayAccessClassification(classification: DataClassification) {
  return classification === 'public';
}
