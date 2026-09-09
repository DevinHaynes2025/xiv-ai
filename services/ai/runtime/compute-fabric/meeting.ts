/**
 * 62L-EX17 — Agent meeting structured brief (no hidden CoT).
 * Multi-agent compute roles via existing Agent Mesh only — no second framework.
 */

import {
  EX17_LOCKS,
  ex17Deny,
  type AgentMeetingBrief,
  type Ex17Denial,
} from './types.ts';

export type MeetingBriefInput = {
  briefId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  structuredSummary: string;
  evidenceRefs?: readonly string[];
  /** Hostile — must never persist. */
  chainOfThought?: string;
  hiddenCot?: string;
};

export function createAgentMeetingBrief(
  input: MeetingBriefInput,
): AgentMeetingBrief | Ex17Denial {
  if (EX17_LOCKS.HIDDEN_COT_PERSISTENCE) {
    return ex17Deny('HIDDEN_COT_LOCK');
  }
  // Strip any CoT; never persist.
  void input.chainOfThought;
  void input.hiddenCot;

  return {
    briefId: input.briefId,
    missionId: input.missionId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    structuredSummary: input.structuredSummary,
    evidenceRefs: input.evidenceRefs ?? [],
    hiddenCotPersisted: false,
    chainOfThought: null,
  };
}

/** Compute roles request capabilities through Agent Mesh — not a parallel mesh. */
export const COMPUTE_AGENT_ROLES = [
  'COMPUTE_PLANNER',
  'DEVICE_ROUTER',
  'RESOURCE_GOVERNOR',
  'PREPROCESS_OPERATOR',
  'EXECUTE_OPERATOR',
  'POSTPROCESS_OPERATOR',
  'BENCHMARK_ANALYST',
  'EVIDENCE_SCRIBE',
] as const;

export type ComputeAgentRole = (typeof COMPUTE_AGENT_ROLES)[number];

export function agentMeshComputeRoleBinding(role: ComputeAgentRole): {
  role: ComputeAgentRole;
  viaAgentMeshOnly: true;
  secondFramework: false;
  seizeHardware: false;
} {
  return {
    role,
    viaAgentMeshOnly: true,
    secondFramework: false,
    seizeHardware: false,
  };
}
