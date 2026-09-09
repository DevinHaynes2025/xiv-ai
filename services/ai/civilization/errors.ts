export type GovernanceCode =
  | 'tenancy_universe_unknown'
  | 'tenancy_not_a_member'
  | 'tenancy_not_a_supervisor'
  | 'tenancy_universe_mismatch'
  | 'tenancy_cross_universe_blocked'
  | 'tenancy_agent_unknown'
  | 'guardian_forbidden_capability'
  | 'guardian_high_risk_capability'
  | 'guardian_kill_switch_engaged'
  | 'guardian_agent_kill_switch_engaged'
  | 'guardian_generation_depth_exceeded'
  | 'guardian_self_modification_blocked'
  | 'guardian_universe_archived'
  | 'quota_budget_missing'
  | 'quota_registration_exceeded'
  | 'quota_activation_exceeded'
  | 'quota_task_queue_exceeded'
  | 'quota_cost_exceeded'
  | 'evaluation_gate_missing'
  | 'evaluation_gate_failed'
  | 'agent_not_active'
  | 'agent_capability_missing'
  | 'xacp_phase_out_of_order'
  | 'xacp_participant_unknown'
  | 'xacp_relationship_unauthorized'
  | 'xacp_incomplete_provenance'
  | 'meeting_unknown'
  | 'meeting_not_open'
  | 'meeting_participant_unknown'
  | 'meeting_requires_human_decider'
  | 'meeting_decision_not_reached'
  | 'knowledge_original_text_missing'
  | 'knowledge_historical_claim_as_present'
  | 'knowledge_source_unknown'
  | 'knowledge_lineage_out_of_order'
  | 'task_unknown'
  | 'task_rollback_plan_missing'
  | 'task_not_approved'
  | 'task_not_active'
  | 'task_force_unknown'
  | 'runtime_capability_unavailable'
  | 'runtime_external_unconfigured'
  | 'universe_stage_transition_invalid'
  // 2I-AI-62B — meetings, collective reasoning and the human bridge
  | 'meeting_lifecycle_regression'
  | 'meeting_stage_not_reached'
  | 'meeting_budget_missing'
  | 'meeting_budget_exhausted'
  | 'meeting_closed'
  | 'meeting_async_window_invalid'
  | 'meeting_async_window_closed'
  | 'xarp_agent_impersonation_blocked'
  | 'xarp_no_speaking_grant'
  | 'xarp_role_coverage_incomplete'
  | 'xarp_role_not_held'
  | 'evidence_contract_incomplete'
  | 'evidence_unknown'
  | 'proposal_unknown'
  | 'proposal_requires_evidence'
  | 'vote_requires_cited_evidence'
  | 'vote_cites_foreign_evidence'
  | 'objection_unknown'
  | 'objection_requires_human_resolution'
  | 'decision_requires_human_participant'
  | 'decision_attribution_blocked'
  | 'decision_requires_selected_proposal'
  | 'decision_unknown'
  | 'action_requires_approval'
  | 'action_requires_rollback_plan'
  | 'action_unknown'
  | 'action_revoked'
  | 'human_opinion_cannot_become_fact'
  | 'human_knowledge_requires_target'
  | 'human_knowledge_elevation_requires_supervisor'
  | 'guardian_observation_refused'
  | 'agent_control_state_blocked'
  | 'agent_control_requires_target'
  | 'task_force_control_state_blocked'
  | 'reputation_unknown'
  | 'reputation_impact_not_eligible'
  | 'directory_profession_unknown'
  | 'directory_high_stakes_requires_approval'
  | 'outcome_requires_measurement';

export class GovernanceError extends Error {
  readonly code: GovernanceCode;
  readonly detail: string;

  constructor(code: GovernanceCode, detail = '') {
    super(detail ? `${code}: ${detail}` : code);
    this.name = 'GovernanceError';
    this.code = code;
    this.detail = detail;
  }
}

export function refuse(code: GovernanceCode, detail = ''): never {
  throw new GovernanceError(code, detail);
}

export function isGovernanceError(value: unknown): value is GovernanceError {
  return value instanceof GovernanceError;
}
