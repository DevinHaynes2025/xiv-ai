import { VisualStoryCard } from './visual-intelligence-engine';

export interface PresentationSection {
  sectionId: string;
  title: string;
  purpose: string;
  visualCardIds: string[];
}

export interface ClientPresentation {
  presentationId: string;
  tenantId: string;
  title: string;
  audience: 'EXECUTIVE' | 'OPERATIONS' | 'INVESTOR' | 'CLIENT';
  sections: PresentationSection[];
  evidenceRefs: string[];
  generatedFromSyntheticData: boolean;
}

export function composeClientPresentation(input: {
  presentationId: string;
  tenantId: string;
  title: string;
  audience: ClientPresentation['audience'];
  cards: VisualStoryCard[];
  evidenceRefs: string[];
  generatedFromSyntheticData?: boolean;
}): ClientPresentation {
  if (!input.tenantId) throw new Error('tenant required');
  if (!input.evidenceRefs.length) throw new Error('presentation evidence required');
  if (input.cards.some(c => c.tenantId !== input.tenantId)) throw new Error('cross-tenant presentation data blocked');

  const grouped = new Map<string, string[]>();
  for (const card of input.cards) {
    const arr = grouped.get(card.stage) ?? [];
    arr.push(card.cardId);
    grouped.set(card.stage, arr);
  }

  const order = ['WHAT_HAPPENED','WHY','IMPACT','OPTIONS','RECOMMENDED_ACTION','OUTCOME'];
  const sections: PresentationSection[] = order
    .filter(stage => grouped.has(stage))
    .map((stage, i) => ({ sectionId:`section-${i+1}`, title:stage.replaceAll('_',' '), purpose:'Turn evidence into a client-ready decision narrative.', visualCardIds:grouped.get(stage)! }));

  return {
    presentationId: input.presentationId,
    tenantId: input.tenantId,
    title: input.title,
    audience: input.audience,
    sections,
    evidenceRefs: [...new Set(input.evidenceRefs)],
    generatedFromSyntheticData: !!input.generatedFromSyntheticData,
  };
}

export const PRESENTATION_GUARDRAILS = {
  evidenceBeforePolish: true,
  syntheticDataLabelRequired: true,
  noCrossTenantDecks: true,
  confidentialSlidesNeedExplicitAuthorization: true,
};
