export type Pipeline = { pipelineId: string; bypassesGuardian: false };
export type NestedPipeline = { parentId: string; childId: string; inheritsParentPolicy: true };
export type PipelineNode = { nodeId: string };
export type PipelineEdge = { from: string; to: string };
export type PipelineTrigger = { triggerId: string };
export type PipelineAgent = { agentId: string; permanentAuthority: false };
export type PipelinePolicy = { guardianRequired: true };
export type PipelineApproval = { required: boolean };
export type PipelineEvidence = { evidenceId: string };
export type PipelineMetric = { metricId: string };
export type PipelineOutcome = { outcomeId: string };
export type PipelineAudit = { eventId: string };

export function createPipeline(input: { domain: string; guardianBound: boolean }) {
  if (!input.guardianBound) return { allowed: false as const, reason: 'pipeline_cannot_bypass_guardian' };
  return {
    allowed: true as const,
    pipeline: { pipelineId: `pipe:${input.domain}`, bypassesGuardian: false as const },
  };
}

export function nestPipeline(input: { parentPolicyLocked: boolean; childAttemptsEscape: boolean }) {
  if (input.childAttemptsEscape || !input.parentPolicyLocked) {
    return { allowed: false as const, reason: 'nested_pipeline_cannot_escape_parent_policy' };
  }
  return { allowed: true as const, inheritsParentPolicy: true as const };
}
