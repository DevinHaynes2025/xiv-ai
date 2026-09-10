import { DEFAULT_INDUSTRY_TARGETS, validateIndustryNode } from './industry-ecosystem-graph';
import { buildCaseStudyTeam } from './case-study-team';
import { HistoricalKnowledgeGrowthLedger } from './historical-knowledge-growth';
import { ingestCaseStudyLesson } from './case-study-learning-pipeline';

if (DEFAULT_INDUSTRY_TARGETS.length < 8) throw new Error('industry targets missing');
if (!DEFAULT_INDUSTRY_TARGETS.every(x => x.state === 'WAITING_PARTNER')) throw new Error('unverified partnerships must not be claimed connected');

validateIndustryNode({ nodeId: 'x', name: 'internal', industry: 'OTHER', state: 'INTERNAL', evidenceRefs: [], capabilities: [] });
let blocked = false;
try { validateIndustryNode({ nodeId: 'x2', name: 'fake', industry: 'CLOUD', state: 'CONNECTED', evidenceRefs: [], capabilities: [] }); } catch { blocked = true; }
if (!blocked) throw new Error('connected state without evidence should be blocked');

const team = buildCaseStudyTeam({ caseId: 'case-1', tenantId: 'tenant-a', industry: 'LOGISTICS', problem: 'Reduce fulfillment cost and improve mobile workflow', evidenceRefs: ['evidence:case'], confidentiality: 'CONFIDENTIAL' });
if (!team.roles.includes('CONTRARIAN') || !team.roles.includes('FINANCE_ANALYST') || !team.roles.includes('UX_RESEARCHER')) throw new Error('case team roles incomplete');
if (team.maxParallel > 8) throw new Error('case team concurrency cap exceeded');

const ledger = new HistoricalKnowledgeGrowthLedger();
ledger.append({ receiptId: 'r1', tenantId: 'tenant-a', sourceType: 'CASE_STUDY', sourceRef: 'case-1', observedAt: new Date().toISOString(), bytes: 100, nodeCount: 3, edgeCount: 2, evidenceRefs: ['evidence:case'], confidence: 0.9 });
const snapshot = ledger.snapshot('TRILLION_TARGET');
if (snapshot.receipts !== 1 || snapshot.bytes !== 100 || snapshot.targetScale !== 'TRILLION_TARGET') throw new Error('historical snapshot invalid');

const cell = ingestCaseStudyLesson({ tenantId: 'tenant-a', caseId: 'case-1', summary: 'Supplier variability increases downstream inventory pressure.', evidenceRefs: ['evidence:case'], approved: true, classification: 'CONFIDENTIAL' });
if (!cell.cellId.startsWith('casecell:') || !cell.searchable || cell.modelWeightsMutated) throw new Error('case learning cell invalid');

const secret = ingestCaseStudyLesson({ tenantId: 'tenant-a', caseId: 'case-secret', summary: 'sealed lesson', evidenceRefs: ['vault:case'], approved: true, classification: 'TOP_SECRET' });
if (secret.searchable) throw new Error('top secret case study must not be ordinarily searchable');

console.log('12D-51 company brain/case study/industry graph contracts: OK');
