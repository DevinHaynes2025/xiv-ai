import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ALGORITHM_NO_INVENTED_OPTIMALITY,
  AV_HONESTY,
  CFO_RECOMMENDATION_IS_NOT_CHARGE,
  HARDWARE_UNAVAILABLE_UNTIL_VERIFIED,
  NEXT_PHASE_TITLE,
  UNIVERSAL_RUNTIME_CYCLE,
  VEHICLE_CONTROL_DENIED,
} from './universal-runtime-types';
import {
  AvSimulatedCrash,
  ALGORITHM_CATALOG,
  attemptChargeCustomer,
  attemptMutateBilling,
  algorithmHonestyLocks,
  breakEven,
  buildAvHealthReport,
  capabilityGate,
  constrainedRoute,
  deduplicateBytes,
  detectAnomalies,
  economicOrderQuantity,
  edmondsKarp,
  generalLpUnavailable,
  generalMilpUnavailable,
  humanApprovePricing,
  independentProbability,
  knapsack01,
  listAvJobs,
  listRuntimeProfiles,
  listSchedule,
  movingAverageForecast,
  proveRecommendationIsNotCharge,
  rankByLinearScore,
  recommendPricing,
  recoverInterruptedAvJobs,
  requestVehicleCapability,
  resumeAvJob,
  runAlgorithmDemo,
  runLengthEncode,
  runUniversalRuntimeCycle,
  sampleMoments,
  selectAlgorithm,
  selectStorageEngine,
  shortestPath,
  solveTwoVariableLp,
  type AvNeed,
} from './universal-runtime';
import { VEHICLE_CONTROL_CAPABILITIES, VEHICLE_DATA_INTERFACES } from './runtime-profiles';
import { searchLearning } from './learning-ledger';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lav-'));
const tenantId = '62lav-tenant';
const universeId = '62lav-universe';
const failures: string[] = [];
const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(here, '../../..');

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

function hopState(job: { hopRecords: Array<{ hop: string; state: string }> }, hop: string) {
  return job.hopRecords.find((item) => item.hop === hop)?.state;
}

function baseNeed(overrides: Partial<AvNeed> = {}): AvNeed {
  return {
    id: 'need-happy',
    tenantId,
    universeId,
    title: 'Portable runtime + algorithm + CFO recommendation',
    approved: true,
    profileId: 'linux',
    algorithmFamily: 'graph',
    storageWorkload: 'embedded_local',
    cfo: {
      sku: 'xiv-offline-core',
      name: 'Offline Core',
      features: ['offline_runtime', 'algorithm_foundry'],
      fixedCost: 1000,
      variableCost: 10,
      unitCost: 12,
      units: 50,
      listPrice: 40,
      discount: 0,
      channel: 'offline',
      humanPrincipal: 'human_cfo',
      humanApprove: true,
      consequence: 'HIGH',
    },
    ...overrides,
  };
}

try {
  check(
    'US-AV30',
    UNIVERSAL_RUNTIME_CYCLE.join(' → ') === 'device_profile → hardware_verify → capability_gate → algorithm_select → data_fabric_select → cost_model → package_design → bundle_select → pricing_scenario → margin_break_even → sensitivity → human_approval → outcome → learning',
    'Core AV loop hops are recorded in founder-paste order.',
  );
  check(
    'US-AV30',
    AV_HONESTY.l4AutonomyEnabled === false
      && AV_HONESTY.cfoMayChargeCustomers === false
      && AV_HONESTY.cfoMayMutateBilling === false
      && AV_HONESTY.recommendationIsNotCharge === true
      && AV_HONESTY.vehicleControlAuthorized === false
      && AV_HONESTY.inventedAvailableHardware === false
      && AV_HONESTY.inventedOptimality === false
      && AV_HONESTY.tipLand === false
      && AV_HONESTY.founderImpersonation === false
      && AV_HONESTY.guardianRlsWeaken === false,
    'Honesty locks: L4=false, CFO cannot charge, no vehicle control, no invented AVAILABLE/optimality.',
  );

  const profiles = listRuntimeProfiles();
  const ids = profiles.map((item) => item.id);
  check(
    'US-AV1',
    ids.join(',') === 'windows_asus_class_pc,linux,x86_64,arm64,apple_silicon,android,ios,server,approved_edge_embedded',
    `Runtime profile catalog covers Windows/ASUS, Linux, x86-64, ARM64, Apple Silicon, Android, iOS, servers, edge/embedded (${ids.length}).`,
  );

  const linux = profiles.find((item) => item.id === 'linux');
  const x64 = profiles.find((item) => item.id === 'x86_64');
  const windows = profiles.find((item) => item.id === 'windows_asus_class_pc');
  const arm = profiles.find((item) => item.id === 'arm64');
  const apple = profiles.find((item) => item.id === 'apple_silicon');
  const android = profiles.find((item) => item.id === 'android');
  const ios = profiles.find((item) => item.id === 'ios');
  const server = profiles.find((item) => item.id === 'server');
  const edge = profiles.find((item) => item.id === 'approved_edge_embedded');

  check('US-AV4', linux?.state === 'AVAILABLE' && linux.verified === true, `Linux profile on this host is ${linux?.state} with host evidence.`);
  check('US-AV5', x64?.state === 'AVAILABLE' && x64.verified === true, `x86-64 profile on this host is ${x64?.state}.`);
  check('US-AV3', windows?.state === 'UNAVAILABLE' && windows.verified === false && (windows?.evidence.join(' ') ?? '').includes(HARDWARE_UNAVAILABLE_UNTIL_VERIFIED), 'Windows/ASUS-class PC is UNAVAILABLE until verified. Not invented AVAILABLE.');
  check('US-AV6', arm?.state === 'UNAVAILABLE', 'ARM64 is UNAVAILABLE on this x64 host.');
  check('US-AV7', apple?.state === 'UNAVAILABLE', 'Apple Silicon is UNAVAILABLE until verified on darwin/arm64.');
  check('US-AV8', android?.state === 'UNAVAILABLE', 'Android is UNAVAILABLE until verified.');
  check('US-AV9', ios?.state === 'UNAVAILABLE', 'iOS is UNAVAILABLE until verified.');
  check('US-AV10', server?.state === 'AVAILABLE' && server.verified === true, `Server-class linux host is ${server?.state}.`);
  check('US-AV11', edge?.state === 'UNAVAILABLE', 'Approved edge/embedded is UNAVAILABLE until actually verified. Not invented AVAILABLE.');
  check('US-AV2', windows?.reason.includes('UNAVAILABLE until actually verified') === true, 'Hardware verification gate keeps unverified profiles UNAVAILABLE.');

  for (const cap of VEHICLE_DATA_INTERFACES) {
    const result = requestVehicleCapability(cap);
    check('US-AV12', result.allowed === true && result.executed === false && result.physicalControl === false && result.interfaceKind === 'authorized_data', `Vehicle data interface ${cap} is authorized as data-only, not actuation.`);
  }
  for (const cap of VEHICLE_CONTROL_CAPABILITIES) {
    const result = requestVehicleCapability(cap);
    check('US-AV13', result.allowed === false && result.executed === false && result.state === 'DENIED' && result.reason === VEHICLE_CONTROL_DENIED, `Vehicle-control capability ${cap} is DENIED.`);
  }
  const steeringGate = capabilityGate({ profileId: 'linux', vehicleCapability: 'steering' });
  check('US-AV13', steeringGate.state === 'DENIED' && steeringGate.physicalVehicleActuation === false, 'Capability gate denies steering on an otherwise verified linux profile.');
  const brakeGate = capabilityGate({ profileId: 'linux', vehicleCapability: 'braking' });
  check('US-AV13', brakeGate.state === 'DENIED' && brakeGate.vehicle?.reason === VEHICLE_CONTROL_DENIED, 'Braking is DENIED.');

  const families = Object.keys(ALGORITHM_CATALOG);
  check(
    'US-AV14',
    families.join(',') === 'graph,constrained_routing,network_flow,scheduling,inventory,lp,milp,statistics,probability,anomaly_detection,forecasting,ranking,compression,deduplication',
    'Algorithm Foundry catalog covers the founder-paste families.',
  );
  for (const family of families) {
    const selected = selectAlgorithm(family as keyof typeof ALGORITHM_CATALOG);
    const honesty = algorithmHonestyLocks(selected);
    check('US-AV26', honesty.inventedOptimality === false && selected.optimalClaimed === false, `${family} selection does not invent optimality (${selected.algorithm}).`);
  }

  const demo = runAlgorithmDemo();
  check('US-AV15', demo.graph.value.distance === 3 && demo.graph.value.path.join('→') === 's→a→t' && demo.graph.inventedOptimality === false, `Dijkstra s→t distance=${demo.graph.value.distance} (exact for nonnegative class, not invented optimality).`);
  check('US-AV16', demo.constrained.value.distance === 5 && demo.constrained.value.path.join('→') === 's→t', 'Constrained routing avoids forbidden node x and uses the feasible subgraph.');
  check('US-AV17', demo.flow.value.flow === 5 && demo.flow.exactClass === 'integral_max_flow', `Edmonds-Karp max flow=${demo.flow.value.flow} (integral max-flow class).`);
  check('US-AV18', demo.schedule.value.makespan === 4 && demo.schedule.exactForProblemClass === false, `List scheduling makespan=${demo.schedule.value.makespan}; heuristic, not claimed optimal.`);
  check('US-AV19', demo.inventory.value.q !== null && Math.abs((demo.inventory.value.q ?? 0) - Math.sqrt(50_000)) < 1e-9, `EOQ=${demo.inventory.value.q} under Harris-Wilson assumptions.`);
  check('US-AV20', demo.lp.value?.objective === 16 && demo.lp.value?.x === 0 && demo.lp.value?.y === 4, `2-var LP vertex enumeration objective=${demo.lp.value?.objective} at (0,4).`);
  check('US-AV20', demo.generalLp.state === 'UNAVAILABLE' && demo.generalMilp.state === 'UNAVAILABLE', 'General LP/MILP solvers are UNAVAILABLE. No invented optimality.');
  check('US-AV20', demo.knapsack.value.value === 11 && demo.knapsack.value.picked.join(',') === 'a,b', `0-1 knapsack DP value=${demo.knapsack.value.value} picked=${demo.knapsack.value.picked.join(',')}.`);
  check('US-AV21', demo.stats.value.n === 5 && demo.probability.value.probability === 0.25, `Sample moments n=${demo.stats.value.n}; independent P=0.25.`);
  check('US-AV22', demo.anomaly.value.flags.at(-1) === true && demo.anomaly.optimalClaimed === false, 'Z-score anomaly flags the outlier; detection is not claimed optimal.');
  check('US-AV23', demo.forecast.value.forecast === 12 && demo.forecast.epistemicClass === 'FORECAST', 'Moving-average forecast is FORECAST, not a verified fact.');
  check('US-AV24', demo.ranking.value.order.join(',') === 'p2,p1', 'Linear-score ranking orders p2 before p1 without NDCG-optimality claims.');
  check('US-AV25', demo.compression.value.encoded === '3a2b1c' && demo.compression.value.lossless === true, `RLE encoded=${demo.compression.value.encoded}.`);
  const dedup = await deduplicateBytes(['alpha', 'beta', 'alpha']);
  check('US-AV25', dedup.value.unique.join(',') === 'alpha,beta' && dedup.value.dropped === 1, 'SHA-256 exact dedup drops the duplicate.');

  const negative = shortestPath([{ from: 's', to: 't', weight: -1 }], 's', 't');
  check('US-AV15', negative.state === 'DENIED' && negative.inventedOptimality === false, 'Negative-weight shortest path is DENIED rather than invented as Dijkstra-optimal.');

  const sqlite = await selectStorageEngine('embedded_local');
  const txn = await selectStorageEngine('transactional');
  const similarity = await selectStorageEngine('similarity');
  check('US-AV27', sqlite.state === 'PASS' && sqlite.selected?.engine === 'node:sqlite' && sqlite.selected.verified === true, `Embedded/local workload selected verified ${sqlite.selected?.engine}.`);
  check('US-AV27', txn.state === 'PASS' && txn.selected?.kind === 'sqlite' && txn.selected.partnershipClaimed === false, 'Transactional workload falls back to verified SQLite because PostgreSQL is unverified.');
  check('US-AV27', similarity.state === 'PASS' && similarity.selected?.kind === 'vector', 'Similarity workload selected the verified in-memory vector engine.');
  check('US-AV28', (await selectStorageEngine('embedded_local')).selected?.productionWrite === false, 'Selected engines do not authorize production writes.');

  const cfo = baseNeed().cfo;
  const rec = recommendPricing(cfo);
  const proof = proveRecommendationIsNotCharge(rec);
  const charge = attemptChargeCustomer({ sku: rec.sku, amount: rec.recommendedPrice, customerId: 'cust-1' });
  const billing = attemptMutateBilling({ sku: rec.sku, action: 'collect_payment' });
  check('US-AV29', rec.recommended === true && rec.charged === false && rec.billingMutated === false && rec.executionAuthority === false, 'CFO recommendation is recommendation-only.');
  check('US-AV30', proof.chargeAttemptDenied && proof.billingAttemptDenied && proof.reason === CFO_RECOMMENDATION_IS_NOT_CHARGE, 'Recommendation ≠ charge/billing mutation.');
  check('US-AV30', charge.charged === false && charge.executed === false && charge.amountCharged === 0 && charge.reason === CFO_RECOMMENDATION_IS_NOT_CHARGE, 'attemptChargeCustomer cannot charge customers.');
  check('US-AV30', billing.billingMutated === false && billing.executed === false, 'attemptMutateBilling cannot alter billing.');
  const be = breakEven(1000, 40, 10);
  check('US-AV29', be.state === 'PASS' && be.units === 1000 / 30, `Break-even units=${be.units}.`);
  const impossible = breakEven(1000, 5, 10);
  check('US-AV29', impossible.state === 'UNAVAILABLE' && impossible.units === null, 'Non-positive contribution does not invent a break-even.');

  const deniedNeed = await runUniversalRuntimeCycle({ need: baseNeed({ id: 'need-unapproved', approved: false }), root });
  check('US-AV30', deniedNeed.state === 'denied' && hopState(deniedNeed, 'device_profile') === 'DENIED', 'Unapproved need is DENIED before the cycle.');

  const windowsJob = await runUniversalRuntimeCycle({ need: baseNeed({ id: 'need-windows', profileId: 'windows_asus_class_pc' }), root });
  check('US-AV3', windowsJob.state === 'unavailable' && hopState(windowsJob, 'hardware_verify') === 'UNAVAILABLE', 'Windows/ASUS cycle stops at hardware_verify=UNAVAILABLE.');
  check('US-AV2', hopState(windowsJob, 'human_approval') === undefined, 'Unverified Windows hardware does not proceed to CFO approval.');

  const vehicleJob = await runUniversalRuntimeCycle({
    need: baseNeed({ id: 'need-steer', vehicleCapability: 'steering' }),
    root,
  });
  check('US-AV13', vehicleJob.state === 'denied' && hopState(vehicleJob, 'capability_gate') === 'DENIED', 'Steering request is DENIED at the capability gate on a verified linux profile.');
  check('US-AV13', vehicleJob.vehicleControlAuthorized === false, 'Job vehicleControlAuthorized remains false.');

  const agentApprove = humanApprovePricing({ ...cfo, humanPrincipal: 'agent_cfo', humanApprove: true });
  check('US-AV29', agentApprove.accepted === false && agentApprove.reason === 'AGENT_CFO_CANNOT_APPROVE' && agentApprove.charged === false, 'Agent CFO cannot approve pricing.');
  const impersonation = humanApprovePricing({ ...cfo, impersonateFounder: true, humanApprove: true });
  check('US-AV30', impersonation.accepted === false && impersonation.reason === 'FOUNDER_IMPERSONATION_DENIED', 'Founder impersonation is denied.');

  let crashed = false;
  try {
    await runUniversalRuntimeCycle({ need: baseNeed({ id: 'need-crash', crashAfterHop: 'algorithm_select' }), root });
  } catch (error) {
    crashed = error instanceof AvSimulatedCrash;
  }
  check('US-AV30', crashed, 'Simulated crash after algorithm_select is thrown.');
  await recoverInterruptedAvJobs(root);
  const resumed = await resumeAvJob({ need: baseNeed({ id: 'need-crash', crashAfterHop: 'algorithm_select' }), root });
  check('US-AV30', resumed.state === 'completed' && hopState(resumed, 'learning') === 'PASS' && resumed.charged === false, `Crash/resume completed hops=${resumed.completedHops.length} charged=false.`);

  const happy = await runUniversalRuntimeCycle({ need: baseNeed({ id: 'need-happy-2', title: 'Happy path linux/sqlite/CFO' }), root });
  check('US-AV4', hopState(happy, 'device_profile') === 'PASS' && hopState(happy, 'hardware_verify') === 'PASS', 'Linux host profile verifies on this machine.');
  check('US-AV27', hopState(happy, 'data_fabric_select') === 'PASS', 'Data fabric selected a verified engine.');
  check('US-AV29', hopState(happy, 'cost_model') === 'PASS' && hopState(happy, 'package_design') === 'PASS' && hopState(happy, 'bundle_select') === 'PASS', 'CFO cost → package → bundle hops ran.');
  check('US-AV29', hopState(happy, 'pricing_scenario') === 'PASS' && hopState(happy, 'margin_break_even') === 'PASS' && hopState(happy, 'sensitivity') === 'PASS', 'Pricing, margin/break-even, and sensitivity hops ran.');
  check('US-AV30', hopState(happy, 'human_approval') === 'PASS' && hopState(happy, 'outcome') === 'WAITING_DATA' && hopState(happy, 'learning') === 'PASS', 'Human approval PASS; outcome WAITING_DATA; learning PASS.');
  check('US-AV30', happy.charged === false && happy.billingMutated === false, 'Completed job did not charge or mutate billing.');

  const learned = await searchLearning('Runtime/algorithm/CFO', root);
  check('US-AV30', learned.length > 0 && learned.every((item) => item.permissionChange === false && item.productionChange === false), 'Learning Ledger entries do not expand permissions or production.');

  const jobs = await listAvJobs(root);
  check('US-AV30', jobs.every((item) => item.charged === false && item.billingMutated === false && item.vehicleControlAuthorized === false), `All ${jobs.length} jobs remain no-charge / no-billing / no-vehicle-control.`);

  const health = await buildAvHealthReport({ tenantId, universeId, root: repoRoot });
  check('US-AV30', health.honesty.l4AutonomyEnabled === false && health.honesty.inventedPass === false && health.honesty.tipLand === false, 'Health honesty locks remain false.');
  check('US-AV30', health.predecessor.apOpsPlanner === 'PASS' && health.predecessor.acOfflineRuntime === 'PASS', 'AP ops planner and AC offline runtime predecessor reports are present on this child.');
  check(
    'US-AV30',
    health.predecessor.auInformationEconomy === 'WAITING_DATA'
      && health.predecessor.asCognitiveCompiler === 'WAITING_DATA'
      && health.predecessor.aoSupplyChain === 'WAITING_DATA'
      && health.predecessor.abKnowledgeLake === 'WAITING_DATA',
    'AU/AS/AO/AB reports are WAITING_DATA (not invented PASS).',
  );
  check('US-AV3', health.profiles.find((item) => item.id === 'windows_asus_class_pc')?.state === 'UNAVAILABLE', 'Health report keeps Windows/ASUS UNAVAILABLE.');
  check('US-AV13', health.vehicleDeny.state === 'DENIED' && health.vehicleDeny.reason === VEHICLE_CONTROL_DENIED, 'Health report records steering DENIED.');
  check('US-AV28', health.engines.find((item) => item.kind === 'postgresql')?.state === 'UNAVAILABLE', 'PostgreSQL remains UNAVAILABLE until verified.');
  check('US-AV27', health.engines.find((item) => item.kind === 'sqlite')?.state === 'AVAILABLE', 'SQLite is AVAILABLE after node:sqlite probe.');
  check('US-AV30', health.localModel.availability === 'UNAVAILABLE' || health.localModel.availability === 'PASS', `Health localModel=${health.localModel.availability}; unconfigured stays UNAVAILABLE.`);
  check('US-AV30', health.providers.every((slot) => slot.state === 'UNAVAILABLE' || slot.configured), 'Unconfigured providers are UNAVAILABLE until verified.');
  check('US-AV30', health.next === NEXT_PHASE_TITLE, 'NEXT title is 62L-AW only.');
  check('US-AV30', health.charged === 0 && health.billingMutated === 0 && health.vehicleControlAuthorized === 0, 'Health store on repo root: charged=0 billingMutated=0 vehicleControlAuthorized=0.');
  check('US-AV2', health.honesty.windowsNodeVerification === 'NOT_TESTED', 'Windows-node verification is NOT_TESTED.');
  check('US-AV26', ALGORITHM_NO_INVENTED_OPTIMALITY.includes('OPTIMALITY'), 'Algorithm honesty constant is recorded.');
} catch (error) {
  failures.push(`UNCAUGHT: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('62L-AV safety tests FAIL');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('62L-AV safety tests PASS');
