export type ViewportKind = 'MOBILE' | 'TABLET' | 'LAPTOP' | 'DESKTOP';
export type VisualKind = 'LINE' | 'BAR' | 'AREA' | 'HEATMAP' | 'MAP' | 'SANKEY' | 'NETWORK' | 'GAUGE' | 'WATERFALL' | 'TIMELINE' | 'BEFORE_AFTER';
export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface VisualEvidencePoint {
  label: string;
  value: number;
  unit?: string;
  evidenceRefs: string[];
}

export interface StoryVisualCard {
  id: string;
  tenantId: string;
  title: string;
  story: string;
  visual: VisualKind;
  data: VisualEvidencePoint[];
  confidence: number;
  classification: DataClassification;
  nextAction?: string;
}

export interface DashboardLayout {
  viewport: ViewportKind;
  columns: number;
  cards: StoryVisualCard[];
  drillDownEnabled: boolean;
  rawDataDefaultVisible: boolean;
}

export function composeDashboard(viewport: ViewportKind, cards: StoryVisualCard[]): DashboardLayout {
  if (cards.some(c => c.confidence < 0 || c.confidence > 1)) throw new Error('confidence must be 0..1');
  if (cards.some(c => c.data.some(p => !p.evidenceRefs.length))) throw new Error('every visual point requires evidence');
  const columns = viewport === 'MOBILE' ? 1 : viewport === 'TABLET' ? 2 : viewport === 'LAPTOP' ? 3 : 4;
  return {
    viewport,
    columns,
    cards,
    drillDownEnabled: true,
    rawDataDefaultVisible: false,
  };
}

export function canRenderCardForClient(card: StoryVisualCard): boolean {
  return card.classification !== 'TOP_SECRET';
}

export const LIVE_VISUAL_GUARDRAILS = {
  storyFirst: true,
  evidenceRequired: true,
  rawDataThird: true,
  topSecretClientRenderingAllowed: false,
  crossTenantRenderingAllowed: false,
};
