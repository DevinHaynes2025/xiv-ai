import { companyEntersGlobalBrainAutomatically, evaluateBrainTransfer } from '../fabric';

export type AgentMemoryScope = 'WORKING' | 'TASK' | 'EVIDENCE' | 'LESSON';
export type AgentMemoryRetention = { days: number | null; infinite: false };
export type AgentMemoryProvenance = { source: string; retrievedAt: string };
export type AgentWorkingMemory = { agentId: string; scope: 'WORKING'; globalTruth: false };
export type AgentTaskMemory = { agentId: string; taskId: string; globalTruth: false };
export type AgentEvidenceMemory = { agentId: string; evidence: AgentMemoryProvenance; globalTruth: false };
export type AgentLesson = { lessonId: string; text: string; globalTruth: false };

export function agentMemoryBecomesGlobalBrainFact(): boolean {
  return companyEntersGlobalBrainAutomatically() || evaluateBrainTransfer({ from: 'company', to: 'global' }).allowed === true;
}
