import { scheduleNeuralGrowth } from './neural-growth-scheduler';
import { trustedHistoricalRecords } from './historical-technology-archive';
import { evaluateLesson } from './agent-academy-learning-loop';

const plan = scheduleNeuralGrowth([
  { candidateId: 'g1', tenantId: 'tenant-a', source: 'CASE_STUDY', fromNode: 'inventory', toNode: 'fill-rate', relation: 'CAUSE_CANDIDATE', evidenceRefs: ['e1'], confidence: 0.84, approved: true },
  { candidateId: 'g2', tenantId: 'tenant-a', source: 'HISTORICAL_TECH', fromNode: 'a', toNode: 'b', relation: 'PRECEDES', evidenceRefs: [], confidence: 0.95, approved: true },
]);
if (plan.accepted.length !== 1) throw new Error('growth evidence gate failed');

const trusted = trustedHistoricalRecords([{ recordId: 'r1', name: 'Packet switching', era: '1960s', category: 'NETWORK', summary: 'Historical networking concept.', sourceRefs: ['source:1'], peopleOrOrgs: [], predecessorIds: [], successorIds: [], confidence: 0.9, reviewed: true }]);
if (trusted.length !== 1) throw new Error('historical trust gate failed');

const evaluation = evaluateLesson({ lessonId: 'l1', role: 'SUPPLY_CHAIN', objective: 'Study bottleneck evidence.', sourceRefs: ['source:case'] , synthetic: false }, 0.91, ['eval:1']);
if (!evaluation.passed) throw new Error('academy evaluation should pass');
if (evaluation.approvedForSharedMemory) throw new Error('academy must not self-approve shared memory');

console.log('12D-57 neural growth/history/agent academy contracts: OK');
