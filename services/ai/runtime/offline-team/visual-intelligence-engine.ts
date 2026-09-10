export type VisualType = 'LINE' | 'BAR' | 'AREA' | 'SCATTER' | 'HEATMAP' | 'MAP' | 'SANKEY' | 'TIMELINE' | 'NETWORK' | 'GAUGE' | 'WATERFALL' | 'BEFORE_AFTER';
export type StoryStage = 'WHAT_HAPPENED' | 'WHY' | 'IMPACT' | 'OPTIONS' | 'RECOMMENDED_ACTION' | 'OUTCOME';

export interface VisualEvidencePoint {
  label: string;
  value: number;
  unit?: string;
  timestamp?: string;
  evidenceRefs: string[];
}

export interface VisualStoryCard {
  cardId: string;
  tenantId: string;
  industry: string;
  title: string;
  stage: StoryStage;
  visualType: VisualType;
  summary: string;
  points: VisualEvidencePoint[];
  confidence: number;
  evidenceRefs: string[];
}

export function buildVisualStoryCard(input: VisualStoryCard): VisualStoryCard {
  if (!input.tenantId) throw new Error('tenant required');
  if (!input.evidenceRefs.length) throw new Error('story evidence required');
  if (input.confidence < 0 || input.confidence > 1) throw new Error('confidence must be 0..1');
  if (input.points.some(p => !p.evidenceRefs.length)) throw new Error('every visual point requires evidence');
  return { ...input, points: input.points.map(p => ({ ...p, evidenceRefs: [...new Set(p.evidenceRefs)] })), evidenceRefs: [...new Set(input.evidenceRefs)] };
}

export const VISUAL_INTELLIGENCE_GUARDRAILS = {
  storyBeforeDashboard: true,
  evidenceRequiredForEveryMetric: true,
  decorationMayNotImplyCausality: true,
  uncertaintyMustBeVisible: true,
  syntheticDemoDataMustBeLabeled: true,
  crossTenantMixingAllowed: false,
  topSecretClientExposureAllowed: false,
};
