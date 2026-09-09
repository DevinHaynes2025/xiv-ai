import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ADULT_ACCESS_DENIED,
  ATC_HIGHWAY_CONTROL_DENIED,
  AW_HONESTY,
  BUSINESS_OS_CYCLE,
  INDUSTRY_LAYERS,
  MARKETPLACE_CHARGE_DENIED,
  NEXT_PHASE_TITLE,
  UNVERIFIED_RUNTIME_UNAVAILABLE,
  VEHICLE_CONTROL_DENIED,
} from './business-os-types';
import {
  AwSimulatedCrash,
  appRuntimeAvailability,
  attemptMarketplaceCharge,
  attemptMarketplaceBillingMutation,
  buildAwHealthReport,
  catalogDownloadableRuntimes,
  catalogIndustryLayers,
  designBusinessBundle,
  enforceAdultAccess,
  humanApproveMarketplaceContract,
  industryAppLayer,
  listAwJobs,
  logisticsSafetyCore,
  multilingualExperience,
  openCommunitySurface,
  openVirtualControlTower,
  orgDigitalTwinHomepage,
  proveMarketplaceRecommendationIsNotCharge,
  proveNotPhysicalAtc,
  publishDeveloperSdk,
  recoverInterruptedAwJobs,
  recommendPlatformFeeContract,
  requestAuthorizedVehicleData,
  requestPhysicalControl,
  resumeAwJob,
  runBusinessOsCycle,
  selectExperienceTier,
  type AwNeed,
} from './business-os-runtime';
import { searchLearning } from './learning-ledger';
import { VEHICLE_CONTROL_CAPABILITIES, VEHICLE_DATA_INTERFACES } from './runtime-profiles';

const root = await mkdtemp(join(tmpdir(), 'xiv-62law-'));
const tenantId = '62law-tenant';
const universeId = '62law-universe';
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

function baseNeed(overrides: Partial<AwNeed> = {}): AwNeed {
  return {
    id: 'need-happy',
    tenantId,
    universeId,
    orgId: 'acme-bridge',
    title: 'Business OS logistics control-tower plan',
    approved: true,
    profileId: 'linux',
    algorithmFamily: 'graph',
    storageWorkload: 'embedded_local',
    controlTowerMode: 'logistics_ops',
    industry: 'freight',
    tier: 'offline',
    age: { claimedAgeYears: 34, attested: true },
    humanPrincipal: 'ceo',
    humanApprove: true,
    ...overrides,
  };
}

try {
  check(
    'US-AW26',
    BUSINESS_OS_CYCLE.join(' → ') === 'xiv_os_kernel → local_cloud_llms → agent_society → algorithm_foundry → database_fabric → information_highways → logistics_core → virtual_control_towers → industry_apps → developer_sdk → marketplace → businesses_employees_consumers → learning',
    'Architecture cycle hops are recorded in founder-paste order.',
  );
  check(
    'US-AW23',
    AW_HONESTY.l4AutonomyEnabled === false
      && AW_HONESTY.physicalAtcAuthorized === false
      && AW_HONESTY.highwayVehicleControlAuthorized === false
      && AW_HONESTY.vehicleControlAuthorized === false
      && AW_HONESTY.marketplaceMayChargeCustomers === false
      && AW_HONESTY.adultAccessPolicy18Plus === true
      && AW_HONESTY.unverifiedRuntimeUnavailable === true
      && AW_HONESTY.xivIsBridgeNotReplacement === true
      && AW_HONESTY.inventedPartnerships === false
      && AW_HONESTY.tipLand === false
      && AW_HONESTY.founderImpersonation === false
      && AW_HONESTY.ceoSealedCompartmentalized === true
      && AW_HONESTY.guardianRlsWeaken === false,
    'Honesty locks: L4=false, no ATC/highway/vehicle control, no marketplace charge, 18+, unverified UNAVAILABLE, bridge-only.',
  );

  const runtimes = catalogDownloadableRuntimes();
  const linux = appRuntimeAvailability('linux');
  const server = appRuntimeAvailability('server');
  const windows = appRuntimeAvailability('windows_asus_class_pc');
  const android = appRuntimeAvailability('android');
  const ios = appRuntimeAvailability('ios');
  const edge = appRuntimeAvailability('approved_edge_embedded');
  check('US-AW1', linux.state === 'AVAILABLE' && linux.downloadable === true && linux.verified === true, `Linux app runtime on this host is downloadable (${linux.state}).`);
  check('US-AW1', server.state === 'AVAILABLE' && server.verified === true, `Server app runtime on this linux host is ${server.state}.`);
  check('US-AW14', windows.state === 'UNAVAILABLE' && windows.downloadable === false && windows.reason === UNVERIFIED_RUNTIME_UNAVAILABLE, 'Windows desktop runtime is UNAVAILABLE until verified.');
  check('US-AW14', android.state === 'UNAVAILABLE' && ios.state === 'UNAVAILABLE' && edge.state === 'UNAVAILABLE', 'Android/iOS/edge runtimes are UNAVAILABLE until verified. Not invented AVAILABLE.');
  check('US-AW14', runtimes.some((item) => item.id === 'linux' && item.downloadable) && runtimes.filter((item) => !item.verified).every((item) => item.state === 'UNAVAILABLE'), 'Unverified catalog targets stay UNAVAILABLE.');

  const atc = requestPhysicalControl('air_traffic_control');
  const physicalAtc = requestPhysicalControl('physical_atc');
  const highway = requestPhysicalControl('highway_vehicle_control');
  const highwayTraffic = requestPhysicalControl('highway_traffic_control');
  check('US-AW16', atc.state === 'DENIED' && atc.allowed === false && atc.executed === false && atc.isAirTrafficControl === false && atc.reason === ATC_HIGHWAY_CONTROL_DENIED, 'Air-traffic-control claim is DENIED.');
  check('US-AW16', physicalAtc.state === 'DENIED' && physicalAtc.physicalControl === false, 'physical_atc claim is DENIED.');
  check('US-AW16', highway.state === 'DENIED' && highway.isHighwayVehicleControl === false && highway.reason === ATC_HIGHWAY_CONTROL_DENIED, 'Highway vehicle-control claim is DENIED.');
  check('US-AW16', highwayTraffic.state === 'DENIED' && highwayTraffic.executed === false, 'Highway traffic-control claim is DENIED.');

  const tower = openVirtualControlTower({ mode: 'logistics_ops' });
  const atcTower = openVirtualControlTower({ mode: 'logistics_ops', physicalControlClaim: 'air_traffic_control' });
  const highwayTower = openVirtualControlTower({ mode: 'enterprise_ops', physicalControlClaim: 'highway_vehicle_control' });
  const proofTower = proveNotPhysicalAtc(atcTower);
  check('US-AW4', tower.state === 'PASS' && tower.kind === 'business_operations_interface' && tower.isAirTrafficControl === false && tower.l4AutonomyEnabled === false, 'Virtual Control Tower is a business operations interface.');
  check('US-AW16', atcTower.state === 'DENIED' && proofTower.isAirTrafficControl === false && proofTower.virtualControlTowerMeansBusinessOps === true, 'Control-tower ATC claim is DENIED.');
  check('US-AW16', highwayTower.state === 'DENIED' && highwayTower.isHighwayVehicleControl === false, 'Control-tower highway-control claim is DENIED.');

  for (const cap of VEHICLE_DATA_INTERFACES) {
    const result = requestAuthorizedVehicleData(cap);
    check('US-AW15', result.allowed === true && result.executed === false && result.physicalControl === false && result.interfaceKind === 'authorized_data', `Vehicle data interface ${cap} is authorized as data-only.`);
  }
  for (const cap of VEHICLE_CONTROL_CAPABILITIES) {
    const result = requestAuthorizedVehicleData(cap);
    check('US-AW15', result.allowed === false && result.executed === false && result.state === 'DENIED' && result.reason === VEHICLE_CONTROL_DENIED, `Vehicle-control capability ${cap} is DENIED.`);
  }

  const adult = enforceAdultAccess({ claimedAgeYears: 21, attested: true });
  const teen = enforceAdultAccess({ claimedAgeYears: 17, attested: true });
  const missing = enforceAdultAccess({ claimedAgeYears: null, attested: false });
  check('US-AW12', adult.allowed === true && adult.state === 'PASS' && adult.identityPartnership === false, 'Self-attested 21 is allowed. No identity-verification partnership.');
  check('US-AW12', teen.allowed === false && teen.state === 'DENIED' && teen.reason.includes(ADULT_ACCESS_DENIED), 'Age 17 is DENIED by the 18+ policy.');
  check('US-AW12', missing.allowed === false && missing.state === 'DENIED', 'Missing age attestation fail-closes.');

  const communityOk = openCommunitySurface({ audience: 'consumer', age: { claimedAgeYears: 18, attested: true } });
  const communityTeen = openCommunitySurface({ audience: 'employee', age: { claimedAgeYears: 16, attested: true } });
  check('US-AW11', communityOk.opened === true && communityOk.state === 'PASS', '18+ consumer community surface may open.');
  check('US-AW12', communityTeen.opened === false && communityTeen.state === 'DENIED', 'Underage community access is DENIED.');

  const contract = recommendPlatformFeeContract({
    contractId: 'fee-1',
    appId: 'app-1',
    platformFeeBps: 1500,
    revenueShareBps: 8500,
    tier: 'hybrid',
  });
  const chargeProof = proveMarketplaceRecommendationIsNotCharge(contract);
  const charge = attemptMarketplaceCharge({ appId: 'app-1', amount: 50, customerId: 'c1' });
  const billing = attemptMarketplaceBillingMutation({ appId: 'app-1', action: 'collect_payment' });
  check('US-AW8', contract.recommended === true && contract.charged === false && contract.executionAuthority === false && contract.liveBillingConnected === false, 'Platform-fee/revenue-share contract is a recommendation only.');
  check('US-AW17', chargeProof.chargeAttemptDenied && chargeProof.billingAttemptDenied && chargeProof.reason === MARKETPLACE_CHARGE_DENIED, 'Marketplace recommendation is not a charge.');
  check('US-AW17', charge.charged === false && charge.executed === false && charge.amountCharged === 0 && charge.reason === MARKETPLACE_CHARGE_DENIED, 'attemptMarketplaceCharge cannot charge customers.');
  check('US-AW17', billing.billingMutated === false && billing.executed === false, 'Marketplace billing mutation is DENIED.');
  const agentApprove = humanApproveMarketplaceContract({ contract, humanPrincipal: 'agent_marketplace', humanApprove: true });
  check('US-AW18', agentApprove.accepted === false && agentApprove.charged === false, 'Marketplace agent cannot approve or charge.');
  const impersonation = humanApproveMarketplaceContract({ contract, humanPrincipal: 'ceo', humanApprove: true, impersonateFounder: true });
  check('US-AW25', impersonation.accepted === false && String(impersonation.reason).includes('FOUNDER_IMPERSONATION'), 'Founder impersonation is DENIED.');

  const sdk = publishDeveloperSdk({ sdkId: 'sdk-1', name: 'XIV SDK', version: '0.0.1', publisher: 'partner-dev' });
  const sdkDenied = publishDeveloperSdk({
    sdkId: 'sdk-bad',
    name: 'Bad SDK',
    version: '0.0.1',
    publisher: 'partner-dev',
    requestedPermissions: ['production_deploy'],
  });
  check('US-AW6', sdk.accepted === true && sdk.sdk?.productionAuthorization === false && sdk.sdk.marketplacePublished === false && sdk.sdk.permissionExpansion === false, 'Developer SDK is a sandbox contract, not a production grant.');
  check('US-AW6', sdkDenied.accepted === false, 'SDK requesting production_deploy is denied (reuses AJ plugin manifest gate).');

  const core = logisticsSafetyCore('move freight safely');
  const layers = catalogIndustryLayers('plan warehouse labor');
  const freight = industryAppLayer('freight', 'plan');
  check('US-AW3', core.physicalAtc === false && core.highwayVehicleControl === false && core.vehicleActuation === false && core.productionAuthorization === false, 'Logistics/safety core does not control aircraft, highways, or vehicles.');
  check('US-AW5', INDUSTRY_LAYERS.length === 8 && layers.length === 8 && layers.every((item) => item.sitsOn === 'logistics_safety' && item.replacesErpBankPosWms === false), 'Eight industry layers sit on the logistics/safety core and do not replace ERP/bank/POS/WMS.');
  check('US-AW19', freight.connectors.every((item) => item.state === 'UNAVAILABLE' && item.partnershipClaimed === false && item.replacesVendor === false), 'Unconfigured ERP/bank/POS/WMS/cloud/transport stay UNAVAILABLE. No invented partnerships.');
  check('US-AW20', freight.replacesErpBankPosWms === false, 'XIV is a bridge, not a day-one replacement.');

  const homepage = orgDigitalTwinHomepage({ orgId: 'acme-bridge', sealedPayload: 'secret' });
  const bundle = designBusinessBundle({ bundleId: 'b1', layers: ['freight', 'logistics_safety'] });
  const locale = multilingualExperience('sw');
  const live = selectExperienceTier('live');
  check('US-AW10', homepage.liveTwinConnected === false && homepage.productionEffect === false && homepage.sealed.payload === '[REDACTED_SEALED]', 'Org digital-twin homepage is local and CEO-sealed; not a live twin partnership.');
  check('US-AW22', bundle.executable === false && bundle.charged === false, 'Business bundle is not executable and does not charge.');
  check('US-AW21', locale.cataloged === true && locale.translationPartnership === false && locale.adultGated === true, 'Multilingual catalog has no invented translation partnership.');
  check('US-AW9', live.liveBillingConnected === false && live.hybridDoesNotCharge === true, 'Live/hybrid tiers do not connect billing.');
  check('US-AW24', homepage.sealed.ceoSealedCompartmentalized === true && homepage.sealed.replicating === false, 'CEO-sealed payload stays compartmentalized.');

  const unapproved = await runBusinessOsCycle({ need: baseNeed({ id: 'need-unapproved', approved: false }), root });
  check('US-AW2', unapproved.state === 'denied' && hopState(unapproved, 'xiv_os_kernel') === 'DENIED', 'Unapproved Business OS need is DENIED.');

  const iosJob = await runBusinessOsCycle({ need: baseNeed({ id: 'need-ios', profileId: 'ios' }), root });
  check('US-AW14', iosJob.state === 'unavailable' && hopState(iosJob, 'xiv_os_kernel') === 'UNAVAILABLE', 'Unverified iOS runtime is UNAVAILABLE in the cycle.');

  const atcJob = await runBusinessOsCycle({
    need: baseNeed({ id: 'need-atc', physicalControlClaim: 'air_traffic_control' }),
    root,
  });
  check('US-AW16', atcJob.state === 'denied' && hopState(atcJob, 'virtual_control_towers') === 'DENIED', 'Cycle denies a physical ATC claim at the Virtual Control Tower hop.');
  check('US-AW16', atcJob.physicalAtcAuthorized === false && atcJob.highwayVehicleControlAuthorized === false, 'Job ATC/highway flags remain false.');

  const highwayJob = await runBusinessOsCycle({
    need: baseNeed({ id: 'need-highway', physicalControlClaim: 'highway_vehicle_control' }),
    root,
  });
  check('US-AW16', highwayJob.state === 'denied' && hopState(highwayJob, 'virtual_control_towers') === 'DENIED', 'Cycle denies a highway-control claim.');

  const steerJob = await runBusinessOsCycle({
    need: baseNeed({ id: 'need-steer', vehicleCapability: 'steering' }),
    root,
  });
  check('US-AW15', steerJob.state === 'denied' && hopState(steerJob, 'logistics_core') === 'DENIED' && steerJob.vehicleControlAuthorized === false, 'Steering is DENIED at logistics/safety core.');

  const teenJob = await runBusinessOsCycle({
    need: baseNeed({ id: 'need-teen', age: { claimedAgeYears: 17, attested: true } }),
    root,
  });
  check('US-AW12', teenJob.state === 'denied' && hopState(teenJob, 'marketplace') === 'DENIED', 'Underage marketplace/community access is DENIED in the cycle.');

  const agentJob = await runBusinessOsCycle({
    need: baseNeed({ id: 'need-agent', humanPrincipal: 'agent_marketplace', humanApprove: true }),
    root,
  });
  check('US-AW18', agentJob.state === 'denied' && hopState(agentJob, 'marketplace') === 'DENIED', 'Marketplace agent cannot approve billing.');

  let crashed = false;
  try {
    await runBusinessOsCycle({ need: baseNeed({ id: 'need-crash', crashAfterHop: 'logistics_core' }), root });
  } catch (error) {
    crashed = error instanceof AwSimulatedCrash && error.hop === 'logistics_core';
  }
  const recovered = await recoverInterruptedAwJobs(root);
  const resumed = await resumeAwJob({ need: baseNeed({ id: 'need-crash', crashAfterHop: 'logistics_core' }), root });
  check('US-AW29', crashed && recovered.length >= 1, 'Simulated crash after logistics_core is recorded.');
  check('US-AW29', resumed.state === 'completed' && hopState(resumed, 'learning') === 'PASS' && resumed.charged === false, 'Resume completes remaining hops without charging.');

  const happy = await runBusinessOsCycle({ need: baseNeed({ id: 'need-happy-2', sealed: true }), root });
  check('US-AW2', hopState(happy, 'xiv_os_kernel') === 'PASS', 'Business Infrastructure OS kernel hop ran on a verified linux runtime.');
  check('US-AW27', hopState(happy, 'algorithm_foundry') === 'PASS', 'Algorithm Foundry hop reused AV.');
  check('US-AW27', hopState(happy, 'database_fabric') === 'PASS', 'Database fabric hop reused AV.');
  check('US-AW3', hopState(happy, 'logistics_core') === 'PASS', 'Logistics/safety core hop ran.');
  check('US-AW4', hopState(happy, 'virtual_control_towers') === 'PASS', 'Virtual Control Tower hop ran as business ops.');
  check('US-AW5', hopState(happy, 'industry_apps') === 'PASS', 'Industry app layer hop ran.');
  check('US-AW6', hopState(happy, 'developer_sdk') === 'PASS', 'Developer SDK hop ran.');
  check('US-AW7', hopState(happy, 'marketplace') === 'PASS', 'App Marketplace hop ran as recommendation-only.');
  check('US-AW11', hopState(happy, 'businesses_employees_consumers') === 'PASS', 'Business/employee/consumer surfaces hop ran.');
  check('US-AW28', hopState(happy, 'learning') === 'PASS' && happy.state === 'completed', 'Learning hop wrote back into XIV.');
  check('US-AW13', happy.charged === false && happy.billingMutated === false && happy.vehicleControlAuthorized === false, 'Completed ecosystem job did not charge or actuate.');
  check('US-AW27', hopState(happy, 'information_highways') === 'WAITING_DATA', 'AU Information Highways remain WAITING_DATA (not invented PASS).');

  const learned = await searchLearning('Business OS cycle completed', root);
  check('US-AW28', learned.length > 0 && learned.every((item) => item.permissionChange === false && item.productionChange === false), 'Learning Ledger entries do not expand permissions or production.');

  const jobs = await listAwJobs(root);
  check('US-AW17', jobs.every((item) => item.charged === false && item.billingMutated === false), `All ${jobs.length} jobs remain no-charge / no-billing.`);

  const health = await buildAwHealthReport({ tenantId, universeId, root: repoRoot });
  check('US-AW23', health.honesty.l4AutonomyEnabled === false && health.honesty.inventedPass === false && health.honesty.tipLand === false, 'Health honesty locks remain false.');
  check('US-AW27', health.predecessor.ops_planner_ap === 'PASS' && health.predecessor.software_factory_aj === 'PASS', 'AP ops planner and AJ factory predecessor reports are present.');
  const avProbe = health.predecessorDetails.find((item) => item.name === 'universal_runtime_av');
  check('US-AW27', avProbe?.modulePresent === true, 'AV Universal Runtime module is present on this parent and is reused, not copied.');
  check(
    'US-AW27',
    avProbe?.state === (avProbe?.reportPresent ? 'PASS' : 'WAITING_DATA'),
    `AV operations report probe=${avProbe?.state} (reportPresent=${avProbe?.reportPresent}). Not invented PASS.`,
  );
  check(
    'US-AW27',
    health.predecessor.package_marketplace_ak === 'WAITING_DATA'
      && health.predecessor.supply_chain_ao === 'WAITING_DATA'
      && health.predecessor.information_economy_au === 'WAITING_DATA'
      && health.predecessor.universe_kernel_af === 'WAITING_DATA'
      && health.predecessor.agent_society_ag === 'WAITING_DATA',
    'AK / AO / AU / AF / AG remain WAITING_DATA (not invented PASS).',
  );
  check('US-AW16', health.atcDeny.state === 'DENIED' && health.atcDeny.isAirTrafficControl === false, 'Health report records ATC DENIED.');
  check('US-AW16', health.highwayDeny.state === 'DENIED' && health.highwayDeny.isHighwayVehicleControl === false, 'Health report records highway-control DENIED.');
  check('US-AW15', health.vehicleDeny.state === 'DENIED' && health.vehicleDeny.reason === VEHICLE_CONTROL_DENIED, 'Health report records steering DENIED.');
  check('US-AW12', health.adultGateUnderage.allowed === false && health.adultGateUnderage.state === 'DENIED', 'Health report records underage DENIED.');
  check('US-AW17', health.marketplaceCharge.charged === false && health.marketplaceCharge.reason === MARKETPLACE_CHARGE_DENIED, 'Health report records marketplace charge DENIED.');
  check('US-AW14', health.runtimes.find((item) => item.id === 'ios')?.state === 'UNAVAILABLE', 'Health report keeps iOS UNAVAILABLE.');
  check('US-AW19', health.localModel.availability === 'UNAVAILABLE' || health.localModel.availability === 'PASS', `Health localModel=${health.localModel.availability}; unconfigured stays UNAVAILABLE.`);
  check('US-AW19', health.providers.every((slot) => slot.state === 'UNAVAILABLE' || slot.configured), 'Unconfigured providers are UNAVAILABLE until verified.');
  check('US-AW30', health.next === NEXT_PHASE_TITLE, 'NEXT title is 62L-AX only.');
  check('US-AW17', health.charged === 0 && health.billingMutated === 0 && health.vehicleControlAuthorized === 0 && health.physicalAtcAuthorized === 0, 'Health store: charged=0 billing=0 vehicle=0 atc=0.');
  check('US-AW29', health.honesty.windowsNodeVerification === 'NOT_TESTED', 'Windows-node verification is NOT_TESTED.');
  check('US-AW13', health.ecosystem.published === false && health.ecosystem.charged === false && health.ecosystem.productionAuthorization === false, 'Extensible ecosystem platform is unpublished and does not charge.');
} catch (error) {
  failures.push(`UNCAUGHT: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('62L-AW safety tests FAIL');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log('62L-AW safety tests PASS');
