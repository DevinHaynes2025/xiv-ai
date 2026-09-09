import type { MeshAgentRole } from './agent-mesh';

export type CollaborationProvider = 'chatgpt' | 'cursor' | 'gemini' | 'claude' | 'local_model' | 'supabase' | 'github' | 'gitlab';
export type CollaborationState = 'AVAILABLE' | 'UNAVAILABLE' | 'WAITING_DATA' | 'HUMAN_APPROVAL_REQUIRED';

export type WorkEnvelope = {
  id: string;
  tenantId: string;
  universeId: string;
  storyId?: string;
  objective: string;
  requestedRoles: MeshAgentRole[];
  sourceProvider: CollaborationProvider;
  targetProviders: CollaborationProvider[];
  evidenceRefs: string[];
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  consequence: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  productionAuthorized: false;
  permissionExpansionAuthorized: false;
};

export type ProviderObservation = {
  provider: CollaborationProvider;
  state: CollaborationState;
  evidenceRefs: string[];
  notes: string;
};

export function validateWorkEnvelope(envelope: WorkEnvelope) {
  if (!envelope.id || !envelope.tenantId || !envelope.universeId || !envelope.objective.trim()) throw new Error('INVALID_WORK_ENVELOPE');
  if (envelope.targetProviders.length === 0) throw new Error('TARGET_PROVIDER_REQUIRED');
  if (envelope.consequence === 'HIGH' || envelope.consequence === 'CRITICAL') {
    return { accepted: false as const, state: 'HUMAN_APPROVAL_REQUIRED' as const, reason: 'High-consequence collaboration requires human authorization.' };
  }
  return { accepted: true as const, state: 'AVAILABLE' as const, reason: 'Envelope is eligible for bounded collaboration routing.' };
}

export function selectAvailableTargets(envelope: WorkEnvelope, observations: ProviderObservation[]) {
  const byProvider = new Map(observations.map((item) => [item.provider, item]));
  return envelope.targetProviders.map((provider) => {
    const observed = byProvider.get(provider);
    if (!observed || observed.state !== 'AVAILABLE' || observed.evidenceRefs.length === 0) {
      return { provider, state: 'UNAVAILABLE' as const, evidenceRefs: observed?.evidenceRefs ?? [] };
    }
    return { provider, state: 'AVAILABLE' as const, evidenceRefs: observed.evidenceRefs };
  });
}

// This protocol coordinates work artifacts; it does not grant one model authority over another,
// does not expose secrets, and does not authorize production deployment or database mutation.
