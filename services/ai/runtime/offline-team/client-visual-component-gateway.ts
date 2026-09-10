export type ClientFormFactor = 'PHONE' | 'TABLET' | 'LAPTOP' | 'DESKTOP' | 'XR';
export type VisualComponentKind = 'STORY_CARD' | 'LINE' | 'BAR' | 'MAP' | 'SANKEY' | 'TIMELINE' | 'HEATMAP' | 'NETWORK' | 'GAUGE' | 'WATERFALL' | 'BEFORE_AFTER';

export interface VisualEvidencePoint {
  label: string;
  value: number | string;
  evidenceRefs: string[];
}

export interface ClientVisualPayload {
  payloadId: string;
  tenantId: string;
  title: string;
  narrative: string;
  component: VisualComponentKind;
  formFactor: ClientFormFactor;
  points: VisualEvidencePoint[];
  confidence?: number;
  requiresHumanApproval: boolean;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
}

export function composeClientVisual(input: Omit<ClientVisualPayload, 'payloadId'>): ClientVisualPayload {
  if (!input.tenantId) throw new Error('tenantId required');
  if (!input.points.length || input.points.some(p => !p.evidenceRefs.length)) throw new Error('visual evidence required');
  const payloadId = `visual:${input.tenantId}:${input.component}:${input.formFactor}:${input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)}`;
  return { ...input, payloadId };
}

export const VISUAL_COMPONENT_GUARDRAILS = {
  storyFirst: true,
  evidenceRequired: true,
  topSecretClientRenderingAllowed: false,
  crossTenantRenderingAllowed: false,
  consequentialActionsRequireHumanApproval: true,
};
