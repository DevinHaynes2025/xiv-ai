import { StoryVisualCard } from './live-visual-dashboard';

export interface DrilldownLayer {
  level: 'STORY' | 'EVIDENCE' | 'RAW';
  title: string;
  payload: unknown;
}

export function buildStoryDrilldown(card: StoryVisualCard): DrilldownLayer[] {
  return [
    { level: 'STORY', title: card.title, payload: { story: card.story, confidence: card.confidence, nextAction: card.nextAction } },
    { level: 'EVIDENCE', title: 'Evidence', payload: card.data.map(point => ({ label: point.label, value: point.value, unit: point.unit, evidenceRefs: point.evidenceRefs })) },
    { level: 'RAW', title: 'Raw data', payload: card.data },
  ];
}

export const DRILLDOWN_GUARDRAILS = {
  order: ['STORY','EVIDENCE','RAW'] as const,
  rawDataHiddenByDefault: true,
  evidenceBeforeRawData: true,
};
