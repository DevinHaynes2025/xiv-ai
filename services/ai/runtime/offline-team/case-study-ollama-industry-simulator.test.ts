import { buildCaseRolePrompts } from './case-study-ollama-lab';
import { buildInterventionScenarios, rankScenario } from './industry-problem-simulator';
import { synthesizeCaseCouncil } from './case-study-council';

const prompts = buildCaseRolePrompts({
  caseId: 'case-1', tenantId: 'tenant-a', industry: 'SUPPLY_CHAIN',
  problem: 'Late fulfillment and rising inventory buffers', evidenceRefs: ['evidence:1'], confidentiality: 'CONFIDENTIAL',
});
if (prompts.length !== 8) throw new Error('expected eight case roles');

const scenarios = buildInterventionScenarios('case-1', ['Rebalance suppliers','Adjust safety stock'], ['evidence:1']);
if (scenarios.length !== 2 || rankScenario(scenarios[0]) !== 0.5) throw new Error('scenario contracts failed');

const council = synthesizeCaseCouncil([
  { role:'DOMAIN_EXPERT', recommendation:'Rebalance suppliers', risks:['service'], challenges:['finance'], evidenceRefs:['evidence:1'], confidence:0.8 },
  { role:'CONTRARIAN', recommendation:'Hold and gather more evidence', risks:['overreaction'], challenges:['domain'], evidenceRefs:['evidence:2'], confidence:0.6 },
]);
if (!council.requiresHumanApproval || council.dissent.length !== 2) throw new Error('council governance failed');

console.log('12D-52 case study Ollama/industry simulator contracts: OK');
