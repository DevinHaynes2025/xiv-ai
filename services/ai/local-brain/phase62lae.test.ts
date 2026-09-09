import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { agenticPut, agenticQuery, denyProductionDatabaseWrite, federateAgenticQuery } from './agentic-database';
import {
  grantSealedAccess,
  isOrdinaryMemoryFile,
  listSealedAudit,
  readCeoSealedRecord,
  redactSealedForRouting,
  sealCeoRecord,
  SEALED_REDACTION,
} from './ceo-sealed-vault';
import {
  cloudFailureFallback,
  cloudPeerSlots,
  observeCloudPeer,
  resetCloudPeerAdapters,
  routeToCloudPeer,
} from './cloud-peer-adapters';
import { crossOsCompatibility, federateCrossOsAgents, registerDeviceNode, setDeviceNodeOnline } from './device-node-runtime';
import { enterEmergencyIsolation, readIsolationMode, resumeFromEmergencyIsolation } from './emergency-isolation';
import { rememberFounderMemory } from './founder-memory-vault';
import {
  HYBRID_EDGE_CLOUD_ARCHITECTURE,
  HYBRID_EDGE_CLOUD_LOCKS,
  hostOsClass,
} from './hybrid-edge-cloud-types';
import {
  authorizeThenReadSealed,
  buildHybridEdgeCloudHealthReport,
  classifyAndGate,
  runHybridEdgeCloudCycle,
} from './hybrid-edge-cloud-runtime';
import { ingestLakeSource } from './knowledge-lake';
import { syncKnowledgePack } from './knowledge-pack-sync';
import { retrieveOfflineKnowledge } from './knowledge-retrieval';
import { cloneLogicalUniverse, federateLogicalUniverses, isFederated } from './logical-universe-graph';
import { sendSecureAgentMessage, verifySecureEnvelope } from './secure-agent-conversation';
import { enqueueStoreAndForward, flushStoreAndForward, listStoreAndForward } from './store-and-forward';
import { isAllowedLocalCommand } from './local-command-runner';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lae-'));
const tenantId = '62lae-tenant';
const universeId = '62lae-universe';
const ceo = { kind: 'ceo_principal' as const, id: 'ceo-principal-sim' };
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  resetCloudPeerAdapters();

  check(
    'US-AE1',
    HYBRID_EDGE_CLOUD_ARCHITECTURE.join(' → ') ===
      'ceo_intent → ceo_sealed_vault_or_executive_memory → approved_story → local_device_node → offline_llm_agent_workcell → knowledge_memory_retrieval → secure_agent_conversation → local_result → classification_policy_gate → optional_peer_aws_azure_cisco_route → evidence → checkpoint → learning_ledger → universe_graph_update → debrief → next_story',
    'Hybrid Edge-Cloud architecture cycle is recorded in order.',
  );
  check(
    'US-AE30-locks',
    HYBRID_EDGE_CLOUD_LOCKS.L4_AUTONOMY_ENABLED === false &&
      HYBRID_EDGE_CLOUD_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      HYBRID_EDGE_CLOUD_LOCKS.FOUNDER_IMPERSONATION === false &&
      HYBRID_EDGE_CLOUD_LOCKS.TIP_LAND === false,
    'L4, production, founder impersonation, and tip-land locks are false.',
  );

  const sealed = await sealCeoRecord({
    tenantId,
    universeId,
    label: 'founder-priority-note',
    payload: 'SEALED_FOUNDER_PRIORITY_TOKEN',
    actor: ceo,
    root,
  });
  check('US-AE2', sealed.accepted === true && sealed.record?.sealedPayload === SEALED_REDACTION, 'CEO principal can seal; returned record is redacted.');

  const ordinaryWrite = await sealCeoRecord({
    tenantId,
    universeId,
    label: 'should-fail',
    payload: 'nope',
    actor: { kind: 'ordinary_agent', id: 'researcher-1', role: 'researcher' },
    root,
  });
  check('US-AE2', ordinaryWrite.accepted === false, 'Ordinary agents are denied sealed writes by default.');

  await rememberFounderMemory({
    twinId: 'twin-sim',
    founderId: 'founder-sim',
    tenantId,
    universeId,
    kind: 'preference',
    subject: 'offline first',
    summary: 'Prefer local work.',
    root,
  });
  check(
    'US-AE3',
    isOrdinaryMemoryFile('founder-memory-vault.json') &&
      isOrdinaryMemoryFile('memory-cortex.json') &&
      !isOrdinaryMemoryFile('ceo-sealed-vault.json'),
    'CEO Sealed Vault is a separate file from ordinary agent memory stores.',
  );

  const routed = await redactSealedForRouting({
    recordId: sealed.record!.id,
    tenantId,
    universeId,
    destination: 'cloud',
    actor: { kind: 'cloud_adapter', id: 'aws-adapter' },
    root,
  });
  check(
    'US-AE4',
    routed.redacted.sealedPayload === SEALED_REDACTION && routed.leaked === true,
    'Sealed fields are redacted before cloud/agent routing.',
  );

  const deniedRead = await readCeoSealedRecord({
    recordId: sealed.record!.id,
    tenantId,
    universeId,
    actor: { kind: 'ordinary_agent', id: 'researcher-1', role: 'researcher' },
    root,
  });
  const toolDenied = await readCeoSealedRecord({
    recordId: sealed.record!.id,
    tenantId,
    universeId,
    actor: { kind: 'tool', id: 'search_knowledge' },
    root,
  });
  const peerDenied = await readCeoSealedRecord({
    recordId: sealed.record!.id,
    tenantId,
    universeId,
    actor: { kind: 'peer', id: 'mesh-peer' },
    root,
  });
  const providerDenied = await readCeoSealedRecord({
    recordId: sealed.record!.id,
    tenantId,
    universeId,
    actor: { kind: 'provider', id: 'aws' },
    root,
  });
  const audit = await listSealedAudit({ deniedOnly: true, root });
  check('US-AE5', audit.length >= 4, 'Denied sealed access is audited.');
  check(
    'US-AE6',
    deniedRead.allowed === false && toolDenied.allowed === false && peerDenied.allowed === false && providerDenied.allowed === false,
    'Ordinary agents, tools, peers, and providers cannot read sealed content.',
  );

  const ceoRead = await readCeoSealedRecord({
    recordId: sealed.record!.id,
    tenantId,
    universeId,
    actor: ceo,
    root,
  });
  const granted = await authorizeThenReadSealed({
    recordId: sealed.record!.id,
    tenantId,
    universeId,
    ceo,
    granteeId: 'researcher-granted',
    root,
  });
  check('US-AE7', ceoRead.allowed === true && ceoRead.payload === 'SEALED_FOUNDER_PRIORITY_TOKEN', 'CEO principal can read sealed content.');
  check('US-AE7', granted.grant.granted === true && granted.read.allowed === true && granted.read.payload === 'SEALED_FOUNDER_PRIORITY_TOKEN', 'Explicit grant allows a named ordinary agent to read sealed content.');

  const expiredGrant = await grantSealedAccess({
    recordId: sealed.record!.id,
    tenantId,
    universeId,
    issuer: ceo,
    grantee: { id: 'expired-agent', kind: 'ordinary_agent' },
    ttlMs: 1_000,
    root,
  });
  const expiredRead = await readCeoSealedRecord({
    recordId: sealed.record!.id,
    tenantId,
    universeId,
    actor: { kind: 'ordinary_agent', id: 'expired-agent', role: 'researcher' },
    now: Date.now() + 120_000,
    root,
  });
  check('US-AE7', expiredGrant.granted === true && expiredRead.allowed === false, 'Expired grants do not unlock sealed content.');

  const laptop = await registerDeviceNode({ tenantId, universeId, deviceClass: 'laptop', root });
  const android = await registerDeviceNode({ tenantId, universeId, deviceClass: 'android_class', root });
  const ios = await registerDeviceNode({ tenantId, universeId, deviceClass: 'ios_class', root });
  check('US-AE8', laptop.deviceClass === 'laptop' && laptop.locality === 'device' && laptop.physicalControl === false, 'Laptop device node is a local logical runtime.');
  check('US-AE9', android.osClass === 'android' && android.physicalControl === false, 'Android-class node is a logical adapter, not physical phone control.');
  check('US-AE10', ios.osClass === 'ios' && ios.physicalControl === false, 'iOS-class node is a logical adapter, not physical phone control.');

  const win = crossOsCompatibility('linux', 'windows');
  const lin = crossOsCompatibility('windows', 'linux');
  const mac = crossOsCompatibility('linux', 'macos');
  check('US-AE11', win.compatible && win.pathSeparatorTo === '\\' && win.physicalControl === false, 'Windows-class path/env adapter is logical only.');
  check('US-AE12', lin.compatible && hostOsClass() === 'linux' && lin.pathSeparatorTo === '/', 'Linux host OS-class adapter matches this runtime.');
  check('US-AE13', mac.compatible && mac.envHome === 'HOME' && mac.physicalControl === false, 'macOS-class adapter is logical only.');

  const federatedOs = await federateCrossOsAgents({
    tenantId,
    universeId,
    fromNodeId: laptop.id,
    toNodeId: android.id,
    root,
  });
  check('US-AE14', federatedOs.federated === true && federatedOs.physicalControl === false, 'Cross-OS agent federation stays inside one tenant/Universe.');

  const cycle = await runHybridEdgeCloudCycle({
    tenantId,
    universeId,
    storyId: 'US-AE-cycle',
    intent: 'Prepare a local hybrid-edge briefing',
    sealedPayload: 'SEALED_CYCLE_SECRET',
    isolate: false,
    federateClone: true,
    actor: ceo,
    root,
  });
  check('US-AE15', cycle.workcell.consensusForced === false && cycle.workcell.productionAuthorization === false, 'Offline agent workcell is bounded and does not force consensus.');
  check('US-AE16', cycle.knowledge.inventedFacts === false, 'Knowledge/memory retrieval does not invent facts.');
  check('US-AE1', cycle.hops.length === 16 && cycle.productionAuthorization === false, 'Architecture cycle executed locally.');
  check('US-AE6', cycle.ordinaryAgentSawSealedRow === false, 'Ordinary agentic-DB queries hide sealed cycle rows.');
  check('US-AE4', cycle.sealedRedaction === SEALED_REDACTION, 'Cycle redacts sealed payload before routing.');

  const envelope = await sendSecureAgentMessage({
    tenantId,
    universeId,
    conversationId: 'conv-ae',
    fromAgent: 'architect',
    toAgent: 'tester',
    body: 'local handshake',
    root,
  });
  check('US-AE17', verifySecureEnvelope(envelope) && envelope.sealedRedacted === true, 'Agent-to-agent envelopes carry a MAC and sealed redaction flag.');

  const sealedEnvelope = await sendSecureAgentMessage({
    tenantId,
    universeId,
    conversationId: 'conv-ae-sealed',
    fromAgent: 'architect',
    toAgent: 'tester',
    body: 'SEALED_FOUNDER_PRIORITY_TOKEN',
    containsSealed: true,
    root,
  });
  check('US-AE17', sealedEnvelope.body === SEALED_REDACTION, 'Sealed content is redacted inside secure conversations.');

  await setDeviceNodeOnline({ nodeId: android.id, tenantId, universeId, online: false, root });
  const held = await enqueueStoreAndForward({
    tenantId,
    universeId,
    fromNodeId: laptop.id,
    toNodeId: android.id,
    envelope,
    root,
  });
  check('US-AE18', held.state === 'held_offline', 'Store-and-forward holds messages while the destination node is offline.');
  await setDeviceNodeOnline({ nodeId: android.id, tenantId, universeId, online: true, root });
  const flushed = await flushStoreAndForward({ tenantId, universeId, toNodeId: android.id, root });
  const remaining = await listStoreAndForward({ tenantId, universeId, root });
  check('US-AE18', flushed.flushed >= 1 && remaining.some((item) => item.id === held.id && item.state === 'delivered'), 'Offline messages deliver after the node returns.');

  const row = await agenticPut({
    tenantId,
    universeId,
    table: 'briefings',
    document: { title: 'local' },
    root,
  });
  const queried = await agenticQuery({
    tenantId,
    universeId,
    table: 'briefings',
    actor: { kind: 'ordinary_agent', id: 'coder-1', role: 'coder' },
    root,
  });
  const prod = await denyProductionDatabaseWrite();
  check('US-AE19', queried.rows.some((item) => item.id === row.id) && prod.allowed === false, 'Agentic database is local and denies production writes.');

  const clone = await cloneLogicalUniverse({ tenantId, fromUniverseId: universeId, label: 'clone-b', root });
  check('US-AE22', clone.physicalAlternateUniverse === false && clone.clonedFrom === universeId, 'Logical Universe clone is not a physical alternate universe.');
  const unfed = await federateAgenticQuery({
    tenantId,
    universeIds: [universeId, clone.id],
    actor: { kind: 'ordinary_agent', id: 'coder-1', role: 'coder' },
    federated: false,
    root,
  });
  check('US-AE20', unfed.state === 'DENIED', 'Database federation is denied without an explicit logical Universe link.');
  await federateLogicalUniverses({ tenantId, fromUniverseId: universeId, toUniverseId: clone.id, root });
  const fed = await federateAgenticQuery({
    tenantId,
    universeIds: [universeId, clone.id],
    actor: { kind: 'ordinary_agent', id: 'coder-1', role: 'coder' },
    federated: true,
    root,
  });
  check('US-AE20', fed.state === 'AVAILABLE' && fed.productionWrite === false, 'Federated agentic queries stay local/logical.');
  check('US-AE23', await isFederated({ tenantId, fromUniverseId: universeId, toUniverseId: clone.id, root }), 'Logical Universes can federate after an explicit link.');

  const lake = await ingestLakeSource({
    tenantId,
    universeId,
    industry: 'operations',
    era: '2026',
    partition: 'business',
    sourceUri: 'synthetic:62lae/pack',
    sourceLanguage: 'en',
    originalText: 'Local knowledge pack for hybrid edge-cloud tests.',
    provenanceRefs: ['synthetic:62lae/pack'],
    root,
  });
  const blockedSync = await syncKnowledgePack({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: clone.id,
    lakeObjectId: lake.object.id,
    federated: false,
    root,
  });
  const sealedSync = await syncKnowledgePack({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: clone.id,
    lakeObjectId: lake.object.id,
    federated: true,
    sealed: true,
    root,
  });
  const synced = await syncKnowledgePack({
    tenantId,
    fromUniverseId: universeId,
    toUniverseId: clone.id,
    lakeObjectId: lake.object.id,
    federated: true,
    root,
  });
  check('US-AE21', blockedSync.state === 'denied' && sealedSync.state === 'denied' && synced.state === 'synced', 'Knowledge-pack sync requires federation and refuses sealed packs.');

  const awsDetectOnly = observeCloudPeer({
    peer: 'aws',
    detected: true,
    configured: false,
    authorized: false,
    verified: false,
    evidenceRefs: [],
    notes: 'Account presence is not authorization.',
  });
  const aws = routeToCloudPeer({ peer: 'aws', classification: 'internal', sealedRedacted: true, isolation: false });
  const azure = routeToCloudPeer({ peer: 'azure', classification: 'internal', sealedRedacted: true, isolation: false });
  const cisco = routeToCloudPeer({ peer: 'cisco', classification: 'internal', sealedRedacted: true, isolation: false });
  check('US-AE24', awsDetectOnly.state === 'UNAVAILABLE' && aws.state === 'UNAVAILABLE', 'AWS stays UNAVAILABLE until configured, authorized, and verified.');
  check('US-AE25', azure.state === 'UNAVAILABLE', 'Azure stays UNAVAILABLE until configured, authorized, and verified.');
  check('US-AE26', cisco.state === 'UNAVAILABLE', 'Cisco stays UNAVAILABLE until configured, authorized, and verified.');
  resetCloudPeerAdapters();
  check('US-AE24', cloudPeerSlots().every((slot) => slot.state === 'UNAVAILABLE'), 'Reset cloud peers remain UNAVAILABLE.');

  const lowGate = await classifyAndGate({ action: 'draft local note', classification: 'internal', consequence: 'LOW' });
  const sealedGate = await classifyAndGate({
    action: 'publish sealed',
    classification: 'sealed_founder_priority',
    consequence: 'LOW',
  });
  const highGate = await classifyAndGate({ action: 'production push', classification: 'internal', consequence: 'CRITICAL', production: true });
  check('US-AE27', lowGate.executableByAgent === true && sealedGate.routeCloud === false && highGate.humanApprovalRequired === true, 'Classification/policy gate reuses Decision Gate and blocks sealed cloud routes.');

  const fallback = cloudFailureFallback('aws');
  check('US-AE28', fallback.continueLocal === true && fallback.peerState === 'UNAVAILABLE', 'Cloud failure resilience continues local/offline work.');

  const isolated = await enterEmergencyIsolation({ reason: 'test-isolation', root });
  const isolatedRoute = routeToCloudPeer({ peer: 'aws', classification: 'internal', sealedRedacted: true, isolation: true });
  const autoResume = await resumeFromEmergencyIsolation({ explicit: false, root });
  const explicitResume = await resumeFromEmergencyIsolation({ explicit: true, root });
  const after = await readIsolationMode(root);
  check('US-AE29', isolated.mode.active === true && isolatedRoute.state === 'UNAVAILABLE', 'Emergency isolation blocks cloud/peer routing.');
  check('US-AE29', autoResume.resumed === false && explicitResume.resumed === true && after.active === false, 'Isolation does not auto-resume.');

  const waitingKnowledge = await retrieveOfflineKnowledge('fresh news', {
    tenantId,
    universeId,
    needsExternalFreshness: true,
    root,
  });
  check('US-AE16', waitingKnowledge.state === 'WAITING_DATA' && waitingKnowledge.inventedFacts === false, 'External freshness is WAITING_DATA.');

  check('US-AE30', isAllowedLocalCommand('npm_typecheck') && !isAllowedLocalCommand('rm_rf'), 'Command-runner allowlist is reused and not expanded to arbitrary shell.');

  const health = await buildHybridEdgeCloudHealthReport(root);
  check(
    'US-AE30',
    health.productionAuthorization === false &&
      health.aws === 'UNAVAILABLE' &&
      health.azure === 'UNAVAILABLE' &&
      health.cisco === 'UNAVAILABLE' &&
      health.githubIssue42 === 'UNAVAILABLE' &&
      health.windowsNodeVerification === 'NOT_TESTED' &&
      health.next.startsWith('62L-AF'),
    'Health report stays honest: unconfigured peers UNAVAILABLE, issue unread, Windows node NOT_TESTED.',
  );
  check('US-AE15', cycle.offline.allowed === true || cycle.offline.state === 'UNAVAILABLE', 'Offline policy states are recorded on the cycle.');

  if (failures.length) {
    console.error(`62L-AE safety tests FAIL\n${failures.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('62L-AE safety tests PASS');
  }
} catch (error) {
  console.error('62L-AE safety tests FAIL');
  console.error(error);
  process.exitCode = 1;
} finally {
  await rm(root, { recursive: true, force: true });
}
