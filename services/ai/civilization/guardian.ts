import { HIGH_RISK_TOOLS } from '../tools';
import type { AgentRiskLevel } from '../types';
import { refuse } from './errors';
import type { AgentIdentity, CapabilityKind, Universe } from './types';

// Guardian sits above the civilization. Nothing in the agent layer can grant,
// negotiate or vote its way past this list. It is deliberately expressed as
// capability keys rather than free text so a capability grant is a lookup and
// not a judgement call.
export const GUARDIAN_FORBIDDEN_CAPABILITIES = [
  'disable_rls',
  'bypass_tenant_boundary',
  'expose_secrets',
  'read_service_role_key',
  'escalate_own_permissions',
  'grant_own_capability',
  'deploy_to_production',
  'create_external_account',
  'execute_financial_transaction',
  'command_satellite',
  'purchase_orbital_capacity',
  'modify_guardian',
  'train_on_tenant_data',
  'transfer_classified_across_universes',
  'spawn_unbounded_agents',
  'modify_own_guardian_policy',
] as const;

export type GuardianForbiddenCapability = (typeof GUARDIAN_FORBIDDEN_CAPABILITIES)[number];

// An agent may sit at most three levels below the human who started the
// lineage. Bounded depth plus a registration quota is what keeps a recursive
// population from existing at all, rather than merely being discouraged.
export const MAX_AGENT_GENERATION_DEPTH = 3;

const FORBIDDEN = new Set<string>(GUARDIAN_FORBIDDEN_CAPABILITIES);
const HIGH_RISK = new Set<string>(HIGH_RISK_TOOLS);

const SELF_MODIFICATION_PREFIXES = ['guardian.', 'policy.', 'rls.', 'secret.'];

export function isForbiddenCapability(capabilityKey: string) {
  const normalized = capabilityKey.trim().toLowerCase();
  if (FORBIDDEN.has(normalized)) return true;
  if (HIGH_RISK.has(normalized)) return true;
  return SELF_MODIFICATION_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function assertCapabilityPermitted(input: {
  capabilityKind: CapabilityKind;
  capabilityKey: string;
  riskLevel: AgentRiskLevel;
  approved: boolean;
}) {
  if (isForbiddenCapability(input.capabilityKey)) {
    refuse('guardian_forbidden_capability', input.capabilityKey);
  }
  if (input.approved && (input.riskLevel === 'high' || input.riskLevel === 'critical')) {
    refuse('guardian_high_risk_capability', input.capabilityKey);
  }
}

export function assertUniverseOperable(universe: Universe) {
  if (universe.killSwitchEngaged) {
    refuse('guardian_kill_switch_engaged', universe.killSwitchReason ?? universe.id);
  }
  if (universe.lifecycleStage === 'archive' || universe.archivedAt) {
    refuse('guardian_universe_archived', universe.id);
  }
}

export function assertAgentOperable(agent: AgentIdentity) {
  if (agent.killSwitchEngaged) {
    refuse('guardian_agent_kill_switch_engaged', agent.agentKey);
  }
}

export function assertGenerationDepth(depth: number) {
  if (depth > MAX_AGENT_GENERATION_DEPTH) {
    refuse('guardian_generation_depth_exceeded', `depth=${depth}`);
  }
}

// An agent never edits its own identity, capabilities or guardian policy. The
// caller must be a human supervisor acting on a different subject.
export function assertNotSelfModification(input: { actorAgentId?: string | null; subjectAgentId: string }) {
  if (input.actorAgentId && input.actorAgentId === input.subjectAgentId) {
    refuse('guardian_self_modification_blocked', input.subjectAgentId);
  }
}
