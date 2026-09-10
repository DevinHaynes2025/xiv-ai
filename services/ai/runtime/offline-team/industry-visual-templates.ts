import { VisualType } from './visual-intelligence-engine';

export interface IndustryVisualTemplate {
  industry: string;
  primaryQuestions: string[];
  recommendedVisuals: VisualType[];
  narrativeOrder: string[];
}

export const INDUSTRY_VISUAL_TEMPLATES: IndustryVisualTemplate[] = [
  { industry:'SUPPLY_CHAIN', primaryQuestions:['Where is flow breaking?','What is delayed?','What is the cost?'], recommendedVisuals:['MAP','SANKEY','TIMELINE','HEATMAP'], narrativeOrder:['signal','bottleneck','cause','impact','intervention','outcome'] },
  { industry:'FINANCE', primaryQuestions:['What changed in cash/revenue/margin?','Why?','What happens next?'], recommendedVisuals:['LINE','WATERFALL','BAR','GAUGE'], narrativeOrder:['trend','variance','driver','risk','scenario','decision'] },
  { industry:'RETAIL', primaryQuestions:['What are customers doing?','What inventory is affected?','What action matters?'], recommendedVisuals:['LINE','BAR','MAP','BEFORE_AFTER'], narrativeOrder:['demand','customer signal','inventory','root cause','action','result'] },
  { industry:'MANUFACTURING', primaryQuestions:['Where is throughput constrained?','What quality issue is emerging?'], recommendedVisuals:['HEATMAP','TIMELINE','NETWORK','BAR'], narrativeOrder:['machine/process signal','constraint','quality impact','cost','fix','verification'] },
  { industry:'HEALTHCARE_ADMIN', primaryQuestions:['Where is access or operations friction?','What is the service impact?'], recommendedVisuals:['TIMELINE','HEATMAP','BAR','MAP'], narrativeOrder:['operational signal','flow','capacity','impact','option','outcome'] },
  { industry:'SOFTWARE_SAAS', primaryQuestions:['What changed in usage/reliability/revenue?','Which system caused it?'], recommendedVisuals:['LINE','AREA','NETWORK','WATERFALL'], narrativeOrder:['usage','incident/change','dependency','customer impact','response','recovery'] },
];

export function getIndustryTemplate(industry: string): IndustryVisualTemplate {
  return INDUSTRY_VISUAL_TEMPLATES.find(x => x.industry === industry) ?? {
    industry,
    primaryQuestions:['What happened?','Why?','What should I do?','What changed after action?'],
    recommendedVisuals:['LINE','BAR','TIMELINE','BEFORE_AFTER'],
    narrativeOrder:['signal','cause','impact','options','action','outcome'],
  };
}
