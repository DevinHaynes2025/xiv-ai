import { strict as assert } from 'node:assert';
import { universePersistencePolicy } from './universe-persistent-store';
import { VirtualOfficeMarketplaceGraph, virtualMarketplacePolicy } from './virtual-office-marketplace-graph';
import { validateProjectRoom } from './entrepreneur-project-room';
import { canHandoffSession, sessionContinuityPolicy } from './cross-device-session-continuity';

assert.equal(universePersistencePolicy.localFirst, true);
assert.equal(universePersistencePolicy.topSecretExternalSyncAllowed, false);
assert.equal(virtualMarketplacePolicy.rawPrivateMemoryListingAllowed, false);
assert.equal(virtualMarketplacePolicy.unauthorizedIdentityTradingAllowed, false);
assert.equal(sessionContinuityPolicy.contextMinimizationRequired, true);
assert.equal(sessionContinuityPolicy.productionAuthorityInheritedAcrossDevices, false);

const graph = new VirtualOfficeMarketplaceGraph();
graph.addNode({ id: 'u1', tenantId: 't1', universeId: 'v1', type: 'USER', label: 'User', classification: 'CONFIDENTIAL', evidenceRefs: ['e1'] });
graph.addNode({ id: 'r1', tenantId: 't1', universeId: 'v1', type: 'PROJECT_ROOM', label: 'Room', classification: 'CONFIDENTIAL', evidenceRefs: ['e2'] });
graph.addEdge({ fromId: 'u1', toId: 'r1', type: 'JOINS', tenantId: 't1', universeId: 'v1', approved: true, evidenceRefs: ['e3'] });
assert.equal(graph.snapshot('t1', 'v1').edges.length, 1);

const room = validateProjectRoom({
  roomId: 'r1', tenantId: 't1', universeId: 'v1', ventureId: 'venture1', title: 'Build Room',
  members: [{ actorId: 'u1', role: 'OWNER', isAgent: false, approved: true }, { actorId: 'a1', role: 'ENGINEERING', isAgent: true, approved: true }],
  taskIds: [], evidenceRefs: ['e4'], classification: 'CONFIDENTIAL', consequentialActionRequiresHumanApproval: true,
});
assert.equal(room.members.length, 2);

assert.equal(canHandoffSession({ sessionId: 's1', tenantId: 't1', userId: 'u1', universeId: 'v1', fromDevice: 'PHONE', toDevice: 'LAPTOP', approvedContextKeys: ['activeProject'], classification: 'CONFIDENTIAL', consentRef: 'c1', createdAt: new Date().toISOString() }).allowed, true);
assert.equal(canHandoffSession({ sessionId: 's2', tenantId: 't1', userId: 'u1', universeId: 'v1', fromDevice: 'PHONE', toDevice: 'SMART_TV', approvedContextKeys: ['activeProject'], classification: 'TOP_SECRET', consentRef: 'c2', createdAt: new Date().toISOString() }).allowed, false);

console.log('12D-80 universe persistence/office marketplace/project room/session continuity contracts: OK');
