import { buildVisualStoryCard, VISUAL_INTELLIGENCE_GUARDRAILS } from './visual-intelligence-engine';
import { getIndustryTemplate } from './industry-visual-templates';
import { composeClientPresentation } from './client-presentation-composer';

const card = buildVisualStoryCard({
  cardId:'card-1', tenantId:'tenant-a', industry:'SUPPLY_CHAIN', title:'Lead-time variability', stage:'WHAT_HAPPENED', visualType:'LINE', summary:'Lead times increased.',
  points:[{ label:'Week 1', value:4, unit:'days', evidenceRefs:['metric:1'] }, { label:'Week 2', value:7, unit:'days', evidenceRefs:['metric:2'] }],
  confidence:0.86, evidenceRefs:['story:1']
});
if (card.points.length !== 2) throw new Error('visual points missing');
if (getIndustryTemplate('SUPPLY_CHAIN').recommendedVisuals.length < 3) throw new Error('industry visuals missing');
const deck = composeClientPresentation({ presentationId:'deck-1', tenantId:'tenant-a', title:'Client Decision Brief', audience:'CLIENT', cards:[card], evidenceRefs:['deck:evidence'], generatedFromSyntheticData:true });
if (!deck.generatedFromSyntheticData) throw new Error('synthetic label missing');
if (VISUAL_INTELLIGENCE_GUARDRAILS.crossTenantMixingAllowed) throw new Error('cross-tenant mixing enabled');
console.log('12D-47 visual intelligence/data storytelling contracts: OK');
