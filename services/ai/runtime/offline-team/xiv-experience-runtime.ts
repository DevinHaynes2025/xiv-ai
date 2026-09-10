import { composeClientVisual, ClientFormFactor, ClientVisualPayload } from './client-visual-component-gateway';

export interface ExperienceSignal {
  signalId: string;
  tenantId: string;
  metric: string;
  value: number;
  unit?: string;
  evidenceRefs: string[];
  observedAt: string;
}

export interface ExperienceRuntimeInput {
  tenantId: string;
  formFactor: ClientFormFactor;
  title: string;
  narrative: string;
  signals: ExperienceSignal[];
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
  requiresHumanApproval?: boolean;
}

export interface ExperienceRuntimeOutput {
  tenantId: string;
  healthScore: number;
  visual: ClientVisualPayload;
  generatedAt: string;
  sourceEvidenceRefs: string[];
}

export function runXivExperience(input: ExperienceRuntimeInput): ExperienceRuntimeOutput {
  if (!input.tenantId) throw new Error('tenantId required');
  if (!input.signals.length) throw new Error('signals required');
  if (input.signals.some(s => s.tenantId !== input.tenantId)) throw new Error('cross-tenant signal blocked');
  if (input.signals.some(s => !s.evidenceRefs.length)) throw new Error('signal evidence required');

  const avg = input.signals.reduce((sum, s) => sum + Math.max(0, Math.min(100, s.value)), 0) / input.signals.length;
  const healthScore = Math.round(avg);
  const sourceEvidenceRefs = [...new Set(input.signals.flatMap(s => s.evidenceRefs))];

  const visual = composeClientVisual({
    tenantId: input.tenantId,
    title: input.title,
    narrative: input.narrative,
    component: 'STORY_CARD',
    formFactor: input.formFactor,
    points: input.signals.map(s => ({ label: s.metric, value: s.value, evidenceRefs: s.evidenceRefs })),
    confidence: sourceEvidenceRefs.length ? 0.8 : undefined,
    requiresHumanApproval: Boolean(input.requiresHumanApproval),
    classification: input.classification,
  });

  return { tenantId: input.tenantId, healthScore, visual, generatedAt: new Date().toISOString(), sourceEvidenceRefs };
}

export const EXPERIENCE_RUNTIME_GUARDRAILS = {
  tenantIsolation: true,
  evidenceRequired: true,
  topSecretClientRenderingAllowed: false,
  productionMutationAllowed: false,
  storyFirst: true,
};
