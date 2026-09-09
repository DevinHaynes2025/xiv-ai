/**
 * Agent debrief capture.
 */

import type { AgentDebrief } from './types';

export function createDebrief(input: {
  debriefId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  workerId: string;
  outcome: AgentDebrief['outcome'];
  summary: string;
  findings?: readonly string[];
  blockers?: readonly string[];
  lessons?: readonly string[];
  humanDecisionsRequired?: readonly string[];
  evidenceRefs?: readonly string[];
  createdAt: string;
}): AgentDebrief {
  return {
    debriefId: input.debriefId,
    missionId: input.missionId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    workerId: input.workerId,
    outcome: input.outcome,
    summary: input.summary,
    findings: input.findings ?? [],
    blockers: input.blockers ?? [],
    lessons: input.lessons ?? [],
    humanDecisionsRequired: input.humanDecisionsRequired ?? [],
    evidenceRefs: input.evidenceRefs ?? [],
    promotesToGlobalBrain: false,
    createdAt: input.createdAt,
  };
}

export function debriefPromotesToGlobalBrain(_debrief: AgentDebrief): false {
  return false;
}
