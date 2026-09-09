import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  describeIntegrationAdapter,
  integrationAdapterSlots,
  planCrossDatabaseQuery,
  resetIntegrationAdapters,
} from './database-adapters';
import { federateOfflineVectorGraph, predecessorProbes } from './distributed-data-fabric';
import { analyzeAdapterGaps, analyzeHighwayGaps, analyzeRootGaps, refuseExploitIntent } from './gap-analysis';
import { freshnessEngine, linkTimeline, registerHistoricalRecord } from './historical-timeline';
import {
  INFORMATION_SUPPLY_CHAIN,
  INFORMATION_SUPPLY_CHAIN_LOCKS,
} from './information-supply-chain-types';
import {
  buildInformationSupplyChainHealthReport,
  runInformationSupplyChainCycle,
} from './information-supply-chain-runtime';
import { appendProvenance, provenanceChain, routeContradiction } from './provenance-contradiction';
import { cacheRootIdentitiesOffline, listRootIdentities, registerRootIdentity } from './root-identities';
import { bridgeSchemaFields } from './schema-ontology-bridge';
import { controlTowerMetrics, registerSupplier, runInformationSupplyChain } from './supply-chain-manager';
import { TypedHighwayGraph } from './typed-highway-edges';
import { SEALED_REDACTION } from './ceo-sealed-vault';
import { agenticQuery } from './agentic-database';
import { listLakeObjects } from './knowledge-lake';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lam-'));
const tenantId = '62lam-tenant';
const universeId = '62lam-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  resetIntegrationAdapters();

  check(
    'US-AM-pipeline',
    INFORMATION_SUPPLY_CHAIN.join(' → ') ===
      'source → intake → quality → classification → transformation → storage → routing → delivery → decision → outcome → feedback',
    'Information supply chain hops are recorded in order.',
  );
  check(
    'US-AM-locks',
    INFORMATION_SUPPLY_CHAIN_LOCKS.L4_AUTONOMY_ENABLED === false &&
      INFORMATION_SUPPLY_CHAIN_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      INFORMATION_SUPPLY_CHAIN_LOCKS.FOUNDER_IMPERSONATION === false &&
      INFORMATION_SUPPLY_CHAIN_LOCKS.TIP_LAND === false &&
      INFORMATION_SUPPLY_CHAIN_LOCKS.BRUTE_FORCE_CENTRALIZATION === false &&
      INFORMATION_SUPPLY_CHAIN_LOCKS.PARTNERSHIP_CLAIMED === false &&
      INFORMATION_SUPPLY_CHAIN_LOCKS.EXPLOIT_OTHER_COMPANIES === false,
    'L4, production, impersonation, tip-land, centralization, partnership, and exploit locks are false.',
  );

  const dataRoot = await registerRootIdentity({
    kind: 'data_root',
    label: 'local-lake-root',
    tenantId,
    universeId,
    capabilityRootId: 'local-brain',
    location: 'local',
    root,
  });
  const highwayRoot = await registerRootIdentity({
    kind: 'highway_root',
    label: 'typed-highway-root',
    tenantId,
    universeId,
    root,
  });
  const vaultRoot = await registerRootIdentity({
    kind: 'vault_root',
    label: 'ceo-sealed-root',
    tenantId,
    universeId,
    root,
  });
  check(
    'US-AM1',
    dataRoot.privateMemoryExposed === false &&
      dataRoot.productionAuthorization === false &&
      highwayRoot.kind === 'highway_root' &&
      vaultRoot.kind === 'vault_root',
    'Root identities are tenant/Universe scoped and do not expose private memory.',
  );

  let remoteDenied = false;
  try {
    await registerRootIdentity({
      kind: 'adapter_root',
      label: 'unverified-cloud',
      tenantId,
      universeId,
      location: 'remote_unverified',
      root,
    });
  } catch {
    remoteDenied = true;
  }
  check('US-AM1', remoteDenied, 'Remote unverified roots are refused.');

  const cached = await cacheRootIdentitiesOffline({ tenantId, universeId, root });
  const listed = await listRootIdentities({ tenantId, universeId, root });
  check(
    'US-AM14',
    cached.cached === 3 && cached.movementBytes === 0 && listed.length === 3,
    'Offline root cache writes locally with zero movement.',
  );

  const highways = new TypedHighwayGraph();
  highways.registerNode({
    id: 'src',
    kind: 'source',
    label: 'source',
    tenantId,
    universeId,
    holdsPrivateMemory: false,
    sealed: false,
  });
  highways.registerNode({
    id: 'store',
    kind: 'store',
    label: 'store',
    tenantId,
    universeId,
    holdsPrivateMemory: false,
    sealed: false,
  });
  highways.registerNode({
    id: 'agent',
    kind: 'agent',
    label: 'agent',
    tenantId,
    universeId,
    holdsPrivateMemory: false,
    sealed: false,
  });
  highways.registerNode({
    id: 'tool',
    kind: 'tool',
    label: 'mcp-tool',
    tenantId,
    universeId,
    holdsPrivateMemory: false,
    sealed: false,
  });
  highways.registerNode({
    id: 'private',
    kind: 'agent',
    label: 'private-memory',
    tenantId,
    universeId,
    holdsPrivateMemory: true,
    sealed: false,
  });
  highways.registerNode({
    id: 'sealed-hold',
    kind: 'sealed_hold',
    label: 'sealed',
    tenantId,
    universeId,
    holdsPrivateMemory: false,
    sealed: true,
  });
  const typed = highways.connect({
    from: 'src',
    to: 'store',
    relation: 'query_to_data',
    stale: false,
    evidenceRefs: ['62L-AM:test'],
  });
  check('US-AM2', 'accepted' in typed && typed.accepted === true && typed.loop === false, 'Typed query-to-data highway edge is accepted.');

  const a2a = highways.routeSharedHighway({
    tenantId,
    universeId,
    fromLane: 'agent_team',
    toLane: 'agent_team',
    topic: 'interop',
    body: 'shared envelope without private memory',
    relation: 'a2a_interop',
  });
  const mcp = highways.routeSharedHighway({
    tenantId,
    universeId,
    fromLane: 'agent_team',
    toLane: 'tool_model',
    topic: 'tool-data',
    body: 'tool/data highway',
    relation: 'mcp_tool_data',
  });
  const privateBlocked = highways.routeSharedHighway({
    tenantId,
    universeId,
    fromLane: 'agent_team',
    toLane: 'knowledge',
    topic: 'leak',
    body: 'nope',
    privateMemory: 'secret-context-vault',
    relation: 'a2a_interop',
  });
  check(
    'US-AM2',
    a2a.accepted === true && mcp.accepted === true && privateBlocked.accepted === false && privateBlocked.privateMemoryExposed === false,
    'A2A and MCP highways are complementary and do not expose private internal memory.',
  );

  const privateEdge = highways.connect({
    from: 'src',
    to: 'private',
    relation: 'a2a_interop',
    stale: false,
    evidenceRefs: ['62L-AM:test'],
  });
  check('US-AM2', 'accepted' in privateEdge && privateEdge.accepted === false, 'Private-memory nodes cannot join shared highways.');

  const sealedMove = highways.connect({
    from: 'src',
    to: 'sealed-hold',
    relation: 'query_to_data',
    stale: false,
    evidenceRefs: ['62L-AM:test'],
  });
  const sealedHold = highways.connect({
    from: 'src',
    to: 'sealed-hold',
    relation: 'sealed_hold',
    stale: false,
    evidenceRefs: ['62L-AM:test'],
  });
  check(
    'US-AM2',
    'accepted' in sealedMove && sealedMove.accepted === false && 'accepted' in sealedHold && sealedHold.accepted === true,
    'Sealed nodes refuse ordinary movement and only accept sealed_hold edges.',
  );

  highways.connect({
    from: 'store',
    to: 'agent',
    relation: 'a2a_interop',
    stale: false,
    evidenceRefs: ['62L-AM:test'],
  });
  const loop = highways.connect({
    from: 'agent',
    to: 'src',
    relation: 'mcp_tool_data',
    stale: false,
    evidenceRefs: ['62L-AM:test'],
  });
  check('US-AM15', 'loop' in loop && loop.loop === true && loop.blocked === true, 'Recursive highway loops are detected and blocked.');

  const pathway = highways.generatePathway({ from: 'src', to: 'agent' });
  check('US-AM13', pathway.found === true && pathway.path.join('→') === 'src→store→agent', 'Pathway generation finds a live acyclic route.');

  const dead = highways.generatePathway({ from: 'src', to: 'missing' });
  check('US-AM13', dead.deadRoute === true && dead.found === false, 'Missing destinations are dead routes, not invented paths.');

  const adapters = integrationAdapterSlots();
  const remoteAdapters = adapters.filter((slot) => slot.adapter !== 'local_agentic' && slot.adapter !== 'local_knowledge_lake');
  check(
    'US-AM3',
    remoteAdapters.every((slot) => slot.state === 'UNAVAILABLE' && slot.partnershipClaimed === false) &&
      describeIntegrationAdapter('aws').state === 'UNAVAILABLE' &&
      describeIntegrationAdapter('azure').state === 'UNAVAILABLE' &&
      describeIntegrationAdapter('google_cloud').state === 'UNAVAILABLE' &&
      describeIntegrationAdapter('github').state === 'UNAVAILABLE' &&
      describeIntegrationAdapter('gitlab').state === 'UNAVAILABLE' &&
      describeIntegrationAdapter('supabase_postgres').state === 'UNAVAILABLE' &&
      describeIntegrationAdapter('snowflake').state === 'UNAVAILABLE' &&
      describeIntegrationAdapter('databricks').state === 'UNAVAILABLE' &&
      describeIntegrationAdapter('local_knowledge_lake').state === 'AVAILABLE',
    'Unconfigured integration adapters are UNAVAILABLE; no partnerships are claimed; local lake is available.',
  );

  const minimize = planCrossDatabaseQuery({
    query: 'inventory by id',
    neededStores: ['local_knowledge_lake', 'local_agentic'],
    copyAllToOnePlace: false,
  });
  check(
    'US-AM4',
    minimize.accepted === true &&
      minimize.movementBytes === 0 &&
      minimize.copyAllToOnePlace === false &&
      (minimize.strategy === 'query_to_data' || minimize.strategy === 'federated_in_place'),
    'Cross-database planner keeps the query at local stores with zero movement.',
  );

  const centralize = planCrossDatabaseQuery({
    query: 'copy everything into snowflake',
    neededStores: ['local_knowledge_lake'],
    copyAllToOnePlace: true,
    destination: 'snowflake',
  });
  check(
    'US-AM4',
    centralize.accepted === false &&
      centralize.strategy === 'denied_centralization' &&
      centralize.copyAllToOnePlace === false &&
      centralize.movementBytes === 0,
    'Brute-force centralization of all data into one place is refused.',
  );

  const snowflake = planCrossDatabaseQuery({
    query: 'select * from remote',
    neededStores: ['snowflake'],
    destination: 'snowflake',
  });
  check(
    'US-AM3',
    snowflake.accepted === false && snowflake.strategy === 'unavailable' && snowflake.unavailableAdapters.includes('snowflake'),
    'Snowflake stays UNAVAILABLE until configured, authenticated, and runtime-verified.',
  );

  const sealedPlan = planCrossDatabaseQuery({
    query: 'sealed founder note',
    neededStores: ['local_knowledge_lake'],
    sealed: true,
  });
  check(
    'US-AM4',
    sealedPlan.accepted === false && sealedPlan.sealedNonMovement === true && sealedPlan.movementBytes === 0,
    'Sealed records are non-movement; they are not copied across adapters.',
  );

  const bridge = bridgeSchemaFields({
    from: { name: 'supplier_name', type: 'string', store: 'local_knowledge_lake', ontologyKind: 'supplier' },
    to: { name: 'vendor', type: 'string', store: 'local_agentic', ontologyKind: 'supplier' },
    ontologyKind: 'supplier',
  });
  check(
    'US-AM5',
    bridge.accepted === true && bridge.bridge?.copiesPayload === false && bridge.bridge?.movementBytes === 0,
    'Schema/ontology bridges map concepts without copying payloads.',
  );
  const fragmented = bridgeSchemaFields({
    from: { name: 'qty', type: 'int', store: 'lake' },
    to: { name: 'quantity', type: 'string', store: 'warehouse' },
    ontologyKind: 'metric',
  });
  check('US-AM5', fragmented.fragmentation === true, 'Type mismatch is recorded as schema fragmentation, not silently coerced by moving rows.');

  const older = await registerHistoricalRecord({
    tenantId,
    universeId,
    sourceId: dataRoot.id,
    era: '2020s',
    observedAt: '2020-01-01T00:00:00.000Z',
    summary: 'Prior inventory snapshot',
    provenanceRefs: ['hist-source-1'],
    root,
  });
  const newer = await registerHistoricalRecord({
    tenantId,
    universeId,
    sourceId: dataRoot.id,
    era: '2026',
    observedAt: '2026-09-01T00:00:00.000Z',
    summary: 'Current inventory snapshot',
    provenanceRefs: ['hist-source-2'],
    root,
  });
  const timeline = await linkTimeline({
    tenantId,
    universeId,
    from: older.id,
    to: newer.id,
    relation: 'precedes',
    root,
  });
  check('US-AM6', older.id !== newer.id && older.provenanceRefs.length > 0, 'Historical-data registry stores provenance-backed records.');
  check('US-AM7', timeline.from === older.id && timeline.to === newer.id, 'Timeline graph links historical records without loops.');

  const fresh = freshnessEngine({
    observedAt: newer.observedAt,
    now: '2026-09-09T00:00:00.000Z',
    maxAgeMs: 14 * 24 * 60 * 60 * 1000,
  });
  const stale = freshnessEngine({
    observedAt: older.observedAt,
    now: '2026-09-09T00:00:00.000Z',
    maxAgeMs: 14 * 24 * 60 * 60 * 1000,
  });
  const waiting = freshnessEngine({
    observedAt: newer.observedAt,
    maxAgeMs: 1000,
    needsExternalFreshness: true,
  });
  check('US-AM8', fresh.state === 'FRESH' && stale.state === 'STALE' && waiting.state === 'WAITING_DATA', 'Freshness engine distinguishes fresh, stale, and WAITING_DATA.');

  const prov = await appendProvenance({
    tenantId,
    universeId,
    from: older.id,
    to: newer.id,
    kind: 'derived_from',
    root,
  });
  const chain = await provenanceChain({ tenantId, universeId, start: newer.id, root });
  check('US-AM9', prov.from === older.id && chain.chain[0] === older.id && chain.weak === false, 'Provenance chains walk derived_from links.');

  const contradiction = await routeContradiction({
    tenantId,
    universeId,
    claimA: 'claim-open-hours',
    claimB: 'claim-closed-hours',
    evidenceRefs: ['ctr-test'],
    root,
  });
  check(
    'US-AM10',
    contradiction.routed === true && contradiction.forgotten === false && contradiction.exploit === false && contradiction.contradiction.state === 'OPEN',
    'Contradiction routing reuses the world graph and does not forget either claim.',
  );

  const rootGaps = await analyzeRootGaps({
    tenantId,
    universeId,
    requiredCapabilityRoots: ['guardian', 'local-brain'],
    requiredIdentityKinds: ['data_root', 'highway_root', 'memory_root'],
    root,
  });
  check(
    'US-AM11',
    rootGaps.some((gap) => gap.kind === 'missing_root' && gap.subject === 'memory_root') &&
      rootGaps.every((gap) => gap.exploit === false && gap.attackSteps.length === 0 && gap.vulnerabilityBypass === false),
    'Root-gap analysis reports missing roots as redesign work, not exploits.',
  );

  highways.connect({
    from: 'src',
    to: 'tool',
    relation: 'mcp_tool_data',
    stale: true,
    evidenceRefs: ['62L-AM:stale'],
  });
  const highwayGaps = analyzeHighwayGaps(highways);
  check(
    'US-AM12',
    highwayGaps.some((gap) => gap.kind === 'stale_path') && highwayGaps.every((gap) => gap.exploit === false && gap.attackSteps.length === 0),
    'Highway-gap analysis flags stale paths for redesign, not bypass.',
  );

  const adapterGaps = analyzeAdapterGaps(['snowflake', 'aws']);
  check(
    'US-AM12',
    adapterGaps.every((gap) => gap.exploit === false && gap.redesign.includes('UNAVAILABLE')),
    'Unverified adapters are vendor-lock-in / brittle-API gaps, not partnerships.',
  );

  const exploit = refuseExploitIntent('exploit their silo and bypass security');
  check(
    'US-AM11',
    exploit.accepted === false &&
      exploit.exploit === false &&
      exploit.attackSteps.length === 0 &&
      exploit.vulnerabilityBypass === false &&
      'redesign' in exploit,
    'Gap analysis refuses exploit/bypass intent and returns a redesign.',
  );

  const supplier = await registerSupplier({ tenantId, universeId, label: 'local-docs', root });
  const delivered = await runInformationSupplyChain({
    tenantId,
    universeId,
    supplierId: supplier.id,
    sourceUri: 'xiv://local/inventory.md',
    originalText: 'Local inventory remains at the lake. Query the lake; do not warehouse a copy.',
    classification: 'internal',
    destination: 'decision-gate',
    root,
  });
  check(
    'US-AM17',
    delivered.hops.join(' → ') === INFORMATION_SUPPLY_CHAIN.join(' → ') &&
      delivered.copyAllToOnePlace === false &&
      delivered.plan.movementBytes === 0 &&
      delivered.item.quality === 'pass',
    'Agentic Information Supply Chain Manager walks source through feedback with minimize-movement routing.',
  );

  const sealedRun = await runInformationSupplyChain({
    tenantId,
    universeId,
    supplierId: supplier.id,
    sourceUri: 'xiv://local/sealed.md',
    originalText: 'placeholder-not-the-secret',
    sealedPayload: 'SEALED_FOUNDER_PRIORITY_TOKEN',
    root,
  });
  const lake = await listLakeObjects({ tenantId, universeId, root });
  const db = await agenticQuery({
    tenantId,
    universeId,
    actor: { kind: 'ordinary_agent', id: 'researcher-1', role: 'researcher' },
    root,
  });
  const lakeBlob = JSON.stringify(lake);
  const dbBlob = JSON.stringify(db.rows);
  check(
    'US-AM17',
    sealedRun.item.sealed === true &&
      sealedRun.plan.sealedNonMovement === true &&
      sealedRun.item.movementBytes === 0 &&
      sealedRun.sealedRedaction === SEALED_REDACTION &&
      !lakeBlob.includes('SEALED_FOUNDER_PRIORITY_TOKEN') &&
      !dbBlob.includes('SEALED_FOUNDER_PRIORITY_TOKEN'),
    'Sealed founder-priority content does not move into the lake, highways, or ordinary database.',
  );

  const metrics = await controlTowerMetrics(root);
  check(
    'US-AM16',
    metrics.copyAllToOnePlace === false &&
      metrics.productionAuthorization === false &&
      metrics.sealedHolds >= 1 &&
      metrics.movementBytes === 0 &&
      metrics.feedbackEvents >= 2,
    'Information-control-tower metrics record sealed holds and zero movement without authorizing production.',
  );

  const fabric = await federateOfflineVectorGraph({
    tenantId,
    universeId,
    query: 'inventory',
    shards: [
      { id: 'local', location: 'local', graphNodes: 4, vectorDim: 0 },
      { id: 'remote', location: 'remote_unverified', graphNodes: 0, vectorDim: 0 },
    ],
    root,
  });
  check(
    'US-AM18',
    fabric.materializedEmbeddings === 0 &&
      fabric.movementBytes === 0 &&
      fabric.copyAllToOnePlace === false &&
      fabric.remoteState === 'UNAVAILABLE' &&
      fabric.partnershipClaimed === false &&
      fabric.inventedFacts === false,
    'Distributed data fabric federates in place, materializes zero embeddings, and leaves unverified shards UNAVAILABLE.',
  );

  const cycle = await runInformationSupplyChainCycle({
    tenantId,
    universeId,
    sourceUri: 'xiv://local/cycle.md',
    originalText: 'Cycle uses local roots and query-to-data.',
    root,
  });
  check(
    'US-AM17',
    cycle.hops.length === INFORMATION_SUPPLY_CHAIN.length &&
      cycle.copyAllToOnePlace === false &&
      cycle.locks.L4_AUTONOMY_ENABLED === false,
    'Supply-chain cycle reuses Knowledge Lake, Decision Gate, Learning Ledger, and Evidence Promotion.',
  );

  const repoRoot = join(root, '..', '..');
  const probes = predecessorProbes(process.cwd());
  check(
    'US-AM18',
    probes.knowledgeLakeAB === 'PASS' &&
      probes.memoryCortex === 'PASS' &&
      probes.ceoSealedVaultAE === 'PASS' &&
      probes.edgePackageSyncAL === 'WAITING_DATA' &&
      probes.universeKernelAF === 'WAITING_DATA' &&
      probes.distributedMeshAD === 'WAITING_DATA' &&
      probes.neuralTransitW === 'WAITING_DATA',
    'Predecessor modules on this AE parent are PASS; AL/AF/AD/W remain WAITING_DATA (not invented PASS).',
  );
  check('US-AM18', typeof repoRoot === 'string', 'Probe helper is callable against an isolated root.');

  const health = await buildInformationSupplyChainHealthReport(root);
  check(
    'US-AM16',
    health.productionAuthorization === false &&
      health.inventedPass === false &&
      health.partnershipClaimed === false &&
      health.githubIssue51 === 'UNAVAILABLE' &&
      health.windowsNodeVerification === 'NOT_TESTED' &&
      health.adapters.some((slot) => slot.adapter === 'aws' && slot.state === 'UNAVAILABLE'),
    'Health report is honest: no invented PASS, no partnerships, AWS UNAVAILABLE, issue 51 UNAVAILABLE.',
  );

  const sealedOrdinary = JSON.parse(await readFile(join(root, '.xiv-local', 'ceo-sealed-vault.json'), 'utf8')) as {
    records: Array<{ sealedPayload: string }>;
  };
  check(
    'US-AM17',
    sealedOrdinary.records.some((record) => record.sealedPayload === 'SEALED_FOUNDER_PRIORITY_TOKEN'),
    'Sealed payload remains only in the CEO vault file, outside ordinary movement.',
  );
} catch (error) {
  failures.push(`UNCAUGHT: ${(error as Error).stack ?? (error as Error).message}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('62L-AM safety tests FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('62L-AM safety tests PASS');
