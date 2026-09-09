import type { AuthorityLevel } from '../authority';
import type { XivAgentId } from '../agents';
import type { DataScope } from '../context/adapters/scope';
import type { DataClassification } from '../universe/types';

export const HANDOFF_TYPES = [
  'consultation',
  'review',
  'consensus',
  'escalation',
  'delegation',
  'verification',
  'risk_review',
] as const;

export type HandoffType = (typeof HANDOFF_TYPES)[number];

export type CollaborationFailure = {
  code:
    | 'source_unavailable'
    | 'agent_unavailable'
    | 'handoff_denied'
    | 'budget_exceeded'
    | 'loop_detected'
    | 'timeout'
    | 'stale_evidence'
    | 'tenant_unavailable'
    | 'schema_collision'
    | 'scanner_unavailable'
    | 'stream_unavailable'
    | 'unknown_handoff'
    | 'authority_transfer'
    | 'cross_universe'
    | 'guardian_mesh';
  reason: string;
};

export type AgentTask = {
  taskId: string;
  sessionId: string;
  assignedAgent: XivAgentId;
  purpose: string;
  requestedOutput: string;
  status: 'queued' | 'running' | 'completed' | 'denied' | 'partial' | 'failed';
};

export type AgentHandoff = {
  handoffId: string;
  sessionId: string;
  sourceAgent: XivAgentId;
  targetAgent: XivAgentId;
  type: HandoffType;
  organizationId: string | null;
  universeId: string | null;
  purpose: string;
  allowedDataScopes: readonly DataScope[];
  allowedTools: readonly string[];
  authorityLevel: AuthorityLevel;
  deadline: string | null;
  hopCount: number;
  maxHopCount: number;
  createdAt: string;
  provenance: {
    sourceId: string;
    prototype: boolean;
    classification: DataClassification;
  };
  correlationId: string;
  evidenceRefs: readonly string[];
  requestedOutput: string;
  scope: DataScope;
  transferAuthority?: boolean;
};

export type AgentMessage = {
  messageId: string;
  sessionId: string;
  handoffId: string;
  type: HandoffType;
  sourceAgent: XivAgentId;
  targetAgent: XivAgentId;
  scope: DataScope;
  evidenceRefs: readonly string[];
  requestedOutput: string;
  payload: Record<string, unknown>;
};

export type CollaborationParticipant = {
  agentId: XivAgentId;
  role: 'orchestrator' | 'specialist' | 'reviewer' | 'verifier';
};

export type CollaborationBudget = {
  maxHopCount: number;
  maxMessages: number;
  maxDurationMs: number;
  maxCostUnits: number;
  maxToolCalls: number;
  hopsUsed: number;
  messagesUsed: number;
  costUnitsUsed: number;
  toolCallsUsed: number;
  startedAt: string;
};

export type CollaborationSession = {
  sessionId: string;
  orchestratorId: XivAgentId;
  participants: readonly CollaborationParticipant[];
  path: readonly XivAgentId[];
  budget: CollaborationBudget;
  organizationId: string | null;
  universeId: string | null;
  correlationId: string;
  allowBoundedCycle: boolean;
  createdAt: string;
  status: 'open' | 'completed' | 'stopped' | 'denied';
};

export type SpecialistContribution = {
  agentId: XivAgentId;
  status: 'completed' | 'denied' | 'unavailable' | 'partial';
  output: string;
  stance?: 'observed' | 'inferred' | 'hypothesized' | 'recommended' | 'projected';
};

export type CollaborationResult = {
  allowed: boolean;
  reason: string;
  session: CollaborationSession;
  contributions: readonly SpecialistContribution[];
  partial: boolean;
  missingSpecialists: readonly XivAgentId[];
  failure?: CollaborationFailure;
};

export type CollaborationEvaluation = {
  sessionId: string;
  grounding: 'not_measured' | 'pass' | 'fail';
  policyCompliance: 'not_measured' | 'pass' | 'fail';
  provenanceCoverage: 'not_measured';
  unsupportedClaims: 'not_measured';
  toolCorrectness: 'not_measured';
  handoffEfficiency: 'not_measured';
  latencyMs: number | 'not_measured';
  costUnits: number;
  humanOverride: 'not_measured';
  outcomeAccuracy: 'not_measured';
  hopCount: number;
};

export const DEFAULT_COLLABORATION_BUDGET: Omit<
  CollaborationBudget,
  'hopsUsed' | 'messagesUsed' | 'costUnitsUsed' | 'toolCallsUsed' | 'startedAt'
> = {
  maxHopCount: 4,
  maxMessages: 8,
  maxDurationMs: 30_000,
  maxCostUnits: 20,
  maxToolCalls: 12,
};
