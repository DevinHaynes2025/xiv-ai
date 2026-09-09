import { randomUUID } from 'node:crypto';

import { validateWorkEnvelope, type WorkEnvelope } from './collaboration-protocol';
import { evaluateOfflineTask } from './offline-policy';
import type { ConsequenceClass } from './decision-gate';

export const NEURAL_TRANSIT_PIPELINE = [
  'Devin',
  'Founder Digital Twin',
  'Global Brain',
  'Neural Highways',
  'Departments',
  'Agent Societies',
  'Tool Mesh',
  'Local/Cloud Models',
  'Evidence Highways',
  'Decisions',
  'Builds',
  'Tests',
  'Outcomes',
  'Learning',
  'Debrief',
  'Brain improvement',
] as const;

export type NeuralTransitHop =
  | 'twin'
  | 'department'
  | 'agent'
  | 'tool'
  | 'model'
  | 'council'
  | 'evidence'
  | 'learning';

export type NeuralTransitEnvelope = {
  id: string;
  tenantId: string;
  universeId: string;
  from: { kind: NeuralTransitHop; id: string };
  to: { kind: NeuralTransitHop; id: string };
  topic: string;
  body: string;
  evidenceRefs: string[];
  classification: WorkEnvelope['classification'];
  consequence: ConsequenceClass;
  partition: 'local' | 'cloud';
  ttlMs: number;
  createdAt: string;
  expiresAt: string;
  productionAuthorized: false;
  permissionExpansionAuthorized: false;
};

export function createNeuralTransitEnvelope(input: {
  tenantId: string;
  universeId: string;
  from: NeuralTransitEnvelope['from'];
  to: NeuralTransitEnvelope['to'];
  topic: string;
  body: string;
  evidenceRefs?: string[];
  classification?: WorkEnvelope['classification'];
  consequence?: ConsequenceClass;
  partition?: 'local' | 'cloud';
  ttlMs?: number;
  now?: number;
}): { accepted: true; envelope: NeuralTransitEnvelope } | { accepted: false; reason: string; state: 'DENIED' | 'UNAVAILABLE' | 'HUMAN_APPROVAL_REQUIRED' } {
  if (!input.tenantId || !input.universeId || !input.topic.trim() || !input.body.trim()) {
    return { accepted: false, reason: 'NEURAL_TRANSIT_ENVELOPE_INVALID', state: 'DENIED' };
  }
  if (input.body.length > 16_000) {
    return { accepted: false, reason: 'NEURAL_TRANSIT_BODY_TOO_LARGE', state: 'DENIED' };
  }

  const work: WorkEnvelope = {
    id: `ntr_probe_${input.topic}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.topic,
    requestedRoles: ['workflow_planner'],
    sourceProvider: 'local_model',
    targetProviders: ['local_model'],
    evidenceRefs: input.evidenceRefs ?? [],
    classification: input.classification ?? 'internal',
    consequence: input.consequence ?? 'LOW',
    productionAuthorized: false,
    permissionExpansionAuthorized: false,
  };
  const gate = validateWorkEnvelope(work);
  if (!gate.accepted) {
    return { accepted: false, reason: gate.reason, state: gate.state };
  }

  const partition = input.partition ?? 'local';
  if (partition === 'cloud') {
    const offline = evaluateOfflineTask({
      needsInternet: false,
      needsCloudProvider: true,
      needsExternalFreshness: false,
      needsProductionWrite: false,
      needsPermissionChange: false,
      classification: input.classification ?? 'internal',
    });
    return { accepted: false, reason: offline.reason, state: 'UNAVAILABLE' };
  }

  const now = input.now ?? Date.now();
  const ttlMs = Math.max(1_000, Math.min(input.ttlMs ?? 30 * 60_000, 24 * 60 * 60_000));
  return {
    accepted: true,
    envelope: {
      id: `ntr_${randomUUID()}`,
      tenantId: input.tenantId,
      universeId: input.universeId,
      from: { ...input.from },
      to: { ...input.to },
      topic: input.topic.trim(),
      body: input.body.trim().slice(0, 16_000),
      evidenceRefs: [...(input.evidenceRefs ?? [])],
      classification: input.classification ?? 'internal',
      consequence: input.consequence ?? 'LOW',
      partition: 'local',
      ttlMs,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttlMs).toISOString(),
      productionAuthorized: false,
      permissionExpansionAuthorized: false,
    },
  };
}
