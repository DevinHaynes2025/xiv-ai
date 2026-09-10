export type ExecutiveRole = 'FOUNDER_TWIN'|'COO'|'CTO'|'CFO'|'CISO'|'CHIEF_PRODUCT'|'CHIEF_DATA'|'CHIEF_AI'|'CHIEF_PEOPLE'|'CHIEF_REVENUE'|'GENERAL_COUNSEL_RISK'|'SUPPLY_CHAIN_OPERATIONS';

export interface ExecutiveSeat { role: ExecutiveRole; mission: string; authority:'ADVISE'|'DRAFT'|'APPROVAL_GATED'; canRunOffline:boolean; requiresEvidence:boolean; }

export const XIV_EXECUTIVE_CABINET: readonly ExecutiveSeat[] = Object.freeze([
 {role:'FOUNDER_TWIN',mission:'Preserve founder-approved vision, principles, and decision context.',authority:'ADVISE',canRunOffline:true,requiresEvidence:true},
 {role:'COO',mission:'Coordinate operating priorities and bounded execution.',authority:'DRAFT',canRunOffline:true,requiresEvidence:true},
 {role:'CTO',mission:'Review architecture, portability, technical debt, and runtime feasibility.',authority:'DRAFT',canRunOffline:true,requiresEvidence:true},
 {role:'CFO',mission:'Model economics, pricing, cost, runway, and scenario risk.',authority:'DRAFT',canRunOffline:true,requiresEvidence:true},
 {role:'CISO',mission:'Protect secrets, identity, tenant isolation, and evidence integrity.',authority:'DRAFT',canRunOffline:true,requiresEvidence:true},
 {role:'CHIEF_PRODUCT',mission:'Prioritize user value, scope, and product proof.',authority:'DRAFT',canRunOffline:true,requiresEvidence:true},
 {role:'CHIEF_DATA',mission:'Govern private data, provenance, mining, retention, and knowledge quality.',authority:'DRAFT',canRunOffline:true,requiresEvidence:true},
 {role:'CHIEF_AI',mission:'Evaluate models, agents, prompts, memory, and learning loops.',authority:'DRAFT',canRunOffline:true,requiresEvidence:true},
 {role:'CHIEF_PEOPLE',mission:'Manage AI-role readiness, training, workload, and fairness.',authority:'ADVISE',canRunOffline:true,requiresEvidence:true},
 {role:'CHIEF_REVENUE',mission:'Develop pricing, contracts, licensing, and sales hypotheses.',authority:'DRAFT',canRunOffline:true,requiresEvidence:true},
 {role:'GENERAL_COUNSEL_RISK',mission:'Flag legal, contractual, governance, and irreversible-action risks.',authority:'ADVISE',canRunOffline:true,requiresEvidence:true},
 {role:'SUPPLY_CHAIN_OPERATIONS',mission:'Optimize logistics, operations, and measurable workflow outcomes.',authority:'DRAFT',canRunOffline:true,requiresEvidence:true}
]);

export const EXECUTIVE_GUARDRAILS = Object.freeze({ autonomousMoneyMovement:false, autonomousContractSignature:false, autonomousProductionRoot:false, humanApprovalForConsequentialActions:true });
