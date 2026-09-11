import { createPilotModeRuntime } from './pilot-mode-runtime';
import { buildOfflineKnowledgePack } from './offline-knowledge-pack';
import { reconcileToHomebase } from './homebase-sync-reconciler';
import { evaluateAgentLibraryLesson } from './agent-library-growth';
import { createOrganizationDigitalTwin } from './organization-digital-twin-lab';

const runtime = createPilotModeRuntime({
  tenantId: 'tenant-a', userId: 'user-a', deviceId: 'device-a', connectivity: 'OFFLINE',
  approvedKnowledgePackIds: ['pack-1'], approvedCapabilityIds: ['local-search'],
  classificationCeiling: 'CONFIDENTIAL', homebaseCheckpointId: 'home-1'
});
if (!runtime.localFirst || runtime.productionMutationAllowed) throw new Error('pilot guardrail failed');

const pack = buildOfflineKnowledgePack({ packId: 'pack-1', tenantId: 'tenant-a', deviceId: 'device-a', items: [
  { id: 'i1', sourceRef: 'case-study:1', classification: 'INTERNAL', approved: true },
  { id: 'i2', sourceRef: 'unreviewed:2', classification: 'INTERNAL', approved: false },
]});
if (pack.items.length !== 1 || !pack.encrypted) throw new Error('knowledge pack failed');

const sync = reconcileToHomebase({ id: 'c1', tenantId: 'tenant-a', evidenceRefs: ['e1'], classification: 'INTERNAL', localApproved: true, conflictsWithHomebase: false });
if (sync.decision !== 'ACCEPT' || !sync.requiresHumanApproval) throw new Error('sync guardrail failed');

const lesson = evaluateAgentLibraryLesson({ lessonId: 'l1', domain: 'supply-chain', sourceRefs: ['s1'], evaluationScore: 0.9, approved: true, tenantId: 'tenant-a' });
if (lesson.status !== 'ELIGIBLE_FOR_MEMORY') throw new Error('lesson gate failed');

const twin = createOrganizationDigitalTwin({ twinId: 't1', tenantId: 'tenant-a', organizationName: 'Demo Org', authorizationRef: 'auth-1', evidenceRefs: ['e1'], bottlenecks: ['handoff delay'] });
if (!twin.simulated || twin.productionMutationAllowed) throw new Error('digital twin guardrail failed');

console.log('12D-63 pilot mode/offline sync/digital twin contracts: OK');
