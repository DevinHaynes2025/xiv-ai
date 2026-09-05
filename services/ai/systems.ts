import { diagnoseAgentStage } from './diagnostics';
import type { AgentSessionContext } from './types';

export type AgentSystems = {
  readProfile?: (userId: string) => Promise<{ full_name: string | null; email: string | null; country: string | null } | null>;
  readInterests?: (userId: string) => Promise<string[]>;
};

const globalStore = globalThis as typeof globalThis & { __xivAgentSystems?: AgentSystems };

export function bindAgentSystems(next: AgentSystems) {
  globalStore.__xivAgentSystems = next;
}

function systems(): AgentSystems {
  return globalStore.__xivAgentSystems ?? {};
}

export async function systemReadProfile(context: AgentSessionContext) {
  if (context.anonymous) return { blocked: 'policy_employee_identity_blocked' as const, text: '' };
  try {
    const row = (await systems().readProfile?.(context.userId)) ?? {
      full_name: context.displayName ?? null,
      email: null,
      country: null,
    };
    return {
      blocked: null,
      text: `Profile (account): ${row.full_name || 'name pending'}${row.country ? ` · ${row.country}` : ''}. Email is not echoed into agent memory.`,
    };
  } catch (caught) {
    diagnoseAgentStage('systems:profile_failed', (caught as { code?: string }).code);
    return { blocked: null, text: `Profile from session: ${context.displayName || 'name pending'}.` };
  }
}

export async function systemReadInterests(context: AgentSessionContext) {
  try {
    const list = (await systems().readInterests?.(context.userId)) ?? context.interests;
    return { blocked: null, text: list.length ? `Interests: ${list.join(', ')}.` : 'No interests saved yet.' };
  } catch (caught) {
    diagnoseAgentStage('systems:interests_failed', (caught as { code?: string }).code);
    return { blocked: null, text: context.interests.length ? `Interests: ${context.interests.join(', ')}.` : 'No interests saved yet.' };
  }
}

export function systemOrganizationUniverse() {
  return 'Organization universe is a placeholder. Membership is not connected.';
}

export function systemBusinessMetrics() {
  return 'Business metrics are synthetic: health 86, trailing $48.2M, two warehouses off SLA.';
}

export function systemConnectedSystems() {
  return 'Connected systems are placeholders: ERP preview, CRM preview, warehouse degraded. No credentials are read.';
}

export function systemSearchKnowledge() {
  return 'Knowledge search is mock. No live index or web crawl is called.';
}
