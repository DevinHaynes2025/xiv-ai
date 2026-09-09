/**
 * Agent registry — full agent contracts, no hidden CoT persistence.
 */

import {
  GOB_LOCKS,
  scopesMatch,
  type AgentContract,
  type AgentReturnPayload,
  type DataClass,
  type RevocationState,
  type RuntimeState,
  type TenantScope,
} from './types.ts';

export type RegisterAgentInput = {
  agentId: string;
  agentType: string;
  scope: TenantScope;
  parentAgentId?: string | null;
  missionId: string;
  taskId: string;
  allowedTools: readonly string[];
  allowedDataClasses: readonly DataClass[];
  computeBudget: number;
  storageBudget: number;
  dependencies?: readonly string[];
  returnPath: string;
  expiry: string;
};

export type AgentRegistry = {
  register(input: RegisterAgentInput):
    | { registered: true; agent: AgentContract }
    | { registered: false; denied: true; reason: string };
  get(agentId: string, scope: TenantScope): AgentContract | null;
  setRuntimeState(agentId: string, scope: TenantScope, state: RuntimeState): boolean;
  revoke(agentId: string, scope: TenantScope, state?: RevocationState): boolean;
  inheritChildScope(parentAgentId: string, childAgentId: string, scope: TenantScope):
    | { ok: true; child: AgentContract }
    | { ok: false; denied: true; reason: string };
  attemptCrossTenantGet(agentId: string, foreignScope: TenantScope): null;
  list(scope: TenantScope): readonly AgentContract[];
  /** Returns structured Home Base payload — never persists hidden CoT. */
  buildReturnPayload(input: {
    result: unknown;
    evidence?: readonly string[];
    tests?: readonly string[];
    failures?: readonly string[];
    contradictions?: readonly string[];
    blockers?: readonly string[];
    lessons?: readonly string[];
    candidateSkills?: readonly string[];
    nextAction: string;
    /** Rejected if present — no hidden CoT. */
    hiddenCot?: string;
  }):
    | { ok: true; payload: AgentReturnPayload }
    | { ok: false; denied: true; reason: string };
};

export function createAgentRegistry(): AgentRegistry {
  const byId = new Map<string, AgentContract>();

  return {
    register(input) {
      if (GOB_LOCKS.L4_AUTONOMY_ENABLED) {
        return {
          registered: false,
          denied: true,
          reason: 'L4_AUTONOMY_MUST_BE_FALSE',
        };
      }
      if (GOB_LOCKS.HIDDEN_COT_PERSISTENCE) {
        return {
          registered: false,
          denied: true,
          reason: 'HIDDEN_COT_LOCK_VIOLATION',
        };
      }
      if (byId.has(input.agentId)) {
        return {
          registered: false,
          denied: true,
          reason: 'AGENT_ID_ALREADY_REGISTERED',
        };
      }
      if (input.parentAgentId) {
        const parent = byId.get(input.parentAgentId);
        if (!parent) {
          return {
            registered: false,
            denied: true,
            reason: 'PARENT_AGENT_NOT_FOUND',
          };
        }
        if (
          parent.tenantId !== input.scope.tenantId ||
          parent.homeUniverseId !== input.scope.universeId
        ) {
          return {
            registered: false,
            denied: true,
            reason: 'PARENT_CHILD_SCOPE_MISMATCH',
          };
        }
      }
      const agent: AgentContract = {
        agentId: input.agentId,
        agentType: input.agentType,
        homeUniverseId: input.scope.universeId,
        tenantId: input.scope.tenantId,
        parentAgentId: input.parentAgentId ?? null,
        missionId: input.missionId,
        taskId: input.taskId,
        allowedTools: [...input.allowedTools],
        allowedDataClasses: [...input.allowedDataClasses],
        computeBudget: input.computeBudget,
        storageBudget: input.storageBudget,
        dependencies: [...(input.dependencies ?? [])],
        heartbeat: null,
        runtimeState: 'IDLE',
        returnPath: input.returnPath,
        expiry: input.expiry,
        revocationState: 'ACTIVE',
      };
      byId.set(agent.agentId, agent);
      return { registered: true, agent };
    },

    get(agentId, scope) {
      const agent = byId.get(agentId);
      if (!agent) return null;
      if (
        agent.tenantId !== scope.tenantId ||
        agent.homeUniverseId !== scope.universeId
      ) {
        return null;
      }
      return agent;
    },

    setRuntimeState(agentId, scope, state) {
      const agent = this.get(agentId, scope);
      if (!agent) return false;
      agent.runtimeState = state;
      return true;
    },

    revoke(agentId, scope, state = 'REVOKED') {
      const agent = this.get(agentId, scope);
      if (!agent) return false;
      agent.revocationState = state;
      agent.runtimeState = 'REVOKED';
      return true;
    },

    inheritChildScope(parentAgentId, childAgentId, scope) {
      const parent = this.get(parentAgentId, scope);
      const child = this.get(childAgentId, scope);
      if (!parent || !child) {
        return {
          ok: false,
          denied: true,
          reason: 'PARENT_OR_CHILD_NOT_FOUND',
        };
      }
      if (child.parentAgentId !== parent.agentId) {
        return {
          ok: false,
          denied: true,
          reason: 'CHILD_PARENT_LINK_MISSING',
        };
      }
      // Child tools/data classes must be subset of parent.
      for (const tool of child.allowedTools) {
        if (!parent.allowedTools.includes(tool)) {
          return {
            ok: false,
            denied: true,
            reason: 'CHILD_TOOL_NOT_IN_PARENT_SCOPE',
          };
        }
      }
      for (const dc of child.allowedDataClasses) {
        if (!parent.allowedDataClasses.includes(dc)) {
          return {
            ok: false,
            denied: true,
            reason: 'CHILD_DATA_CLASS_NOT_IN_PARENT_SCOPE',
          };
        }
      }
      if (child.computeBudget > parent.computeBudget) {
        return {
          ok: false,
          denied: true,
          reason: 'CHILD_COMPUTE_BUDGET_EXCEEDS_PARENT',
        };
      }
      return { ok: true, child };
    },

    attemptCrossTenantGet(_agentId, _foreignScope) {
      void _agentId;
      void _foreignScope;
      return null;
    },

    list(scope) {
      return [...byId.values()].filter(
        (a) =>
          a.tenantId === scope.tenantId &&
          a.homeUniverseId === scope.universeId,
      );
    },

    buildReturnPayload(input) {
      if (input.hiddenCot !== undefined) {
        return {
          ok: false,
          denied: true,
          reason: 'HIDDEN_COT_PERSISTENCE_FORBIDDEN',
        };
      }
      if (GOB_LOCKS.HIDDEN_COT_PERSISTENCE) {
        return {
          ok: false,
          denied: true,
          reason: 'HIDDEN_COT_LOCK_VIOLATION',
        };
      }
      return {
        ok: true,
        payload: {
          result: input.result,
          evidence: input.evidence ?? [],
          tests: input.tests ?? [],
          failures: input.failures ?? [],
          contradictions: input.contradictions ?? [],
          blockers: input.blockers ?? [],
          lessons: input.lessons ?? [],
          candidateSkills: input.candidateSkills ?? [],
          nextAction: input.nextAction,
        },
      };
    },
  };
}

export function agentScope(agent: AgentContract, orgId: string): TenantScope {
  return {
    orgId,
    tenantId: agent.tenantId,
    universeId: agent.homeUniverseId,
  };
}

export function sameTenantUniverse(
  a: AgentContract,
  b: AgentContract,
): boolean {
  return scopesMatch(
    { orgId: 'x', tenantId: a.tenantId, universeId: a.homeUniverseId },
    { orgId: 'x', tenantId: b.tenantId, universeId: b.homeUniverseId },
  );
}
