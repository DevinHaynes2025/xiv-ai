export {
  AUTHORITY_LABEL,
  AUTHORITY_RANK,
  AuthorityLevel,
  DEFAULT_AUTHORITY,
  authorityRank,
  boundedAutonomyEnabled,
  hasMinimumAuthority,
} from './authority';
export type { AuthorityLevel as AuthorityLevelId } from './authority';

export {
  XIV_AGENT_REGISTRY,
  getXivAgent,
  isXivAgentId,
  listXivAgents,
} from './agents';
export type {
  ApprovalClass,
  XivAgentCapability,
  XivAgentDefinition,
  XivAgentDomain,
  XivAgentId,
  XivAgentStatus,
} from './agents';

export {
  READ_ONLY_CONTEXT_TOOLS,
  XIV_TOOL_REGISTRY,
  getRuntimeTool,
  isRuntimeToolId,
  listRuntimeTools,
} from './tools';
export type { RuntimeToolDefinition, RuntimeToolId, ToolRiskLevel } from './tools';

export { evaluatePolicy } from './policy';
export type { PolicyEvaluation, PolicyInput, PolicyRegistries, PolicyVerdict, RuntimeEnvironment } from './policy';

export { createId, nowIso, statusForVerdict } from './actions';
export type {
  ApprovalDecision,
  ApprovalRecord,
  GovernedAction,
  GovernedActionStatus,
  GovernedApprovalStatus,
  GovernedAuditEvent,
  GovernedResult,
} from './actions';

export { createMemoryAuditStore, getPrototypeAuditStore } from './audit';
export type { AuditStore } from './audit';

export { invokeApprovedTool } from './gateway';
export type { ToolHandler, ToolInvokeInput, ToolInvokeResult } from './gateway';

export type { BusinessContextProvider } from './context/provider';
export { createPrototypeContextProvider, getPrototypeBusinessContext } from './context/prototype';
export { buildDiagnosticStory, storyHasPrototypeLabels } from './context/story';
export type {
  BusinessContext,
  BusinessHealthSlice,
  CausalChainStep,
  ContextSourceLabel,
  DiagnosticStory,
  OperationalSignals,
  SystemContextSlice,
} from './context/types';

export { createApprovalService } from './approval';
export type { ApprovalDecisionInput, ApprovalService } from './approval';

export {
  GUARDIAN_CHECK_REGISTRY,
  getGuardianCheck,
  listGuardianChecks,
} from './guardian/checks';
export type {
  AllowlistedCommand,
  GuardianCheckCategory,
  GuardianCheckDefinition,
  GuardianCheckId,
  GuardianCheckSeverity,
} from './guardian/checks';

export { rollupOverall, summarizeReport } from './guardian/health';
export type {
  GuardianCheckResult,
  GuardianCheckStatus,
  GuardianHealthReport,
  GuardianOverallStatus,
} from './guardian/health';

export { runGuardianSnapshot } from './guardian/runner';
export type { GuardianCheckHandler, GuardianRunnerOptions } from './guardian/runner';

export {
  analyzeBusinessHealth,
  createAgentRuntime,
  getDefaultAgentRuntime,
  proposeOperationalChange,
  runGovernedRequest,
} from './runtime';
export type { AgentRuntime, AgentRuntimeOptions, GovernedRequest } from './runtime';
