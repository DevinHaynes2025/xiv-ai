export type ClientScale='STARTUP'|'SMALL_BUSINESS'|'MID_MARKET'|'ENTERPRISE';
export interface ConsultingPlaybook { playbookId:string; scale:ClientScale; domains:readonly string[]; requiredEvidence:readonly string[]; humanApprovalRequired:true; }
export interface AgentCourse { courseId:string; title:string; skills:readonly string[]; graduationChecks:readonly string[]; }
export const CONSULTANT_ACADEMY_GUARDRAILS={humanApprovalRequired:true,financialAdviceNotGuaranteed:true,productionDeployAllowed:false,tenantIsolationRequired:true} as const;
export const DEFAULT_PLAYBOOKS:readonly ConsultingPlaybook[]=Object.freeze([
 {playbookId:'xiv-startup-foundation',scale:'STARTUP',domains:['security','operations','finance-logistics','data'],requiredEvidence:['current-state','constraints','risk-register'],humanApprovalRequired:true},
 {playbookId:'xiv-enterprise-scale',scale:'ENTERPRISE',domains:['security','supply-chain','analytics','governance'],requiredEvidence:['architecture','controls','ownership'],humanApprovalRequired:true}
]);
export const DEFAULT_AGENT_COURSES:readonly AgentCourse[]=Object.freeze([
 {courseId:'xiv-evidence-101',title:'Evidence before claims',skills:['provenance','testing','review'],graduationChecks:['no fabricated pass','source attached']},
 {courseId:'xiv-lean-ops',title:'Lean agent operations',skills:['flow','waste-reduction','bottleneck-analysis'],graduationChecks:['bounded plan','measurable outcome']}
]);
