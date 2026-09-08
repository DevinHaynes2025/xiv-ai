/**
 * Phase 2I-AC Agent DevOps + Creative Control + Multi-agent review contracts.
 * Creative capability ≠ production authority.
 * Semi-autonomous: prepare RC/canary; consequential prod behind independent policy/human gate.
 */

export type AgentDevOpsStage =
  | 'IDEA'
  | 'SPEC'
  | 'SANDBOX_BRANCH'
  | 'BUILD'
  | 'STATIC_ANALYSIS'
  | 'UNIT_TEST'
  | 'INTEGRATION_TEST'
  | 'SECURITY_TEST'
  | 'AGENT_REVIEW'
  | 'UAT'
  | 'RELEASE_CANDIDATE'
  | 'HUMAN_POLICY_GATE'
  | 'CANARY'
  | 'PRODUCTION'
  | 'MONITOR'
  | 'ROLLBACK';

export type CodeReviewRole =
  | 'Builder'
  | 'Testing'
  | 'Security'
  | 'Architecture'
  | 'Performance'
  | 'Database'
  | 'Contradiction'
  | 'Release'
  | 'HumanPolicyGate';

export type CreativeCapability =
  | 'BRAINSTORM'
  | 'DESIGN'
  | 'WRITE_SPECS'
  | 'WRITE_CODE'
  | 'WRITE_TESTS'
  | 'PROTOTYPES'
  | 'PROPOSALS'
  | 'RESEARCH'
  | 'WORKFLOWS'
  | 'SCHEMAS'
  | 'PLUGINS'
  | 'ARTICLES'
  | 'BLOG_DRAFTS'
  | 'VIDEO_SCRIPTS'
  | 'DOCS'
  | 'PROBLEMS'
  | 'EXPERIMENTS'
  | 'CHALLENGE_DESIGNS'
  | 'MIGRATION_PLANS';

export type AgentDevOpsForbidden =
  | 'SILENT_CONSEQUENTIAL_PROD_DEPLOY'
  | 'DISABLE_SECURITY_GATES'
  | 'SELF_APPROVE_PRIVILEGED_CHANGES'
  | 'EXPAND_CREDENTIALS'
  | 'FORCE_PUSH_PROTECTED_BRANCHES'
  | 'MODIFY_AUDIT_HISTORY';

export type AgentDevOpsAllowedPrep =
  | 'PREPARE_COMMITS'
  | 'PREPARE_PRS'
  | 'PREPARE_MIGRATIONS'
  | 'PREPARE_RELEASES'
  | 'PREPARE_MANIFESTS'
  | 'RUN_AUTHORIZED_CI'
  | 'ANALYZE_FAILURES'
  | 'RECOMMEND_ROLLBACK'
  | 'GENERATE_FIXES';

export const AGENT_DEVOPS_STAGES = [
  'IDEA',
  'SPEC',
  'SANDBOX_BRANCH',
  'BUILD',
  'STATIC_ANALYSIS',
  'UNIT_TEST',
  'INTEGRATION_TEST',
  'SECURITY_TEST',
  'AGENT_REVIEW',
  'UAT',
  'RELEASE_CANDIDATE',
  'HUMAN_POLICY_GATE',
  'CANARY',
  'PRODUCTION',
  'MONITOR',
  'ROLLBACK',
] as const satisfies readonly AgentDevOpsStage[];

export const CODE_REVIEW_CHAIN = [
  'Builder',
  'Testing',
  'Security',
  'Architecture',
  'Performance',
  'Database',
  'Contradiction',
  'Release',
  'HumanPolicyGate',
] as const satisfies readonly CodeReviewRole[];

export const CREATIVE_CAPABILITIES = [
  'BRAINSTORM',
  'DESIGN',
  'WRITE_SPECS',
  'WRITE_CODE',
  'WRITE_TESTS',
  'PROTOTYPES',
  'PROPOSALS',
  'RESEARCH',
  'WORKFLOWS',
  'SCHEMAS',
  'PLUGINS',
  'ARTICLES',
  'BLOG_DRAFTS',
  'VIDEO_SCRIPTS',
  'DOCS',
  'PROBLEMS',
  'EXPERIMENTS',
  'CHALLENGE_DESIGNS',
  'MIGRATION_PLANS',
] as const satisfies readonly CreativeCapability[];

export const AGENT_DEVOPS_FORBIDDEN = [
  'SILENT_CONSEQUENTIAL_PROD_DEPLOY',
  'DISABLE_SECURITY_GATES',
  'SELF_APPROVE_PRIVILEGED_CHANGES',
  'EXPAND_CREDENTIALS',
  'FORCE_PUSH_PROTECTED_BRANCHES',
  'MODIFY_AUDIT_HISTORY',
] as const satisfies readonly AgentDevOpsForbidden[];

export const AGENT_DEVOPS_ALLOWED_PREP = [
  'PREPARE_COMMITS',
  'PREPARE_PRS',
  'PREPARE_MIGRATIONS',
  'PREPARE_RELEASES',
  'PREPARE_MANIFESTS',
  'RUN_AUTHORIZED_CI',
  'ANALYZE_FAILURES',
  'RECOMMEND_ROLLBACK',
  'GENERATE_FIXES',
] as const satisfies readonly AgentDevOpsAllowedPrep[];
