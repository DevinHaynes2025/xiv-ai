import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { LocalCheckpointStore } from './checkpoint-store';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { selectAlgorithm, type AlgorithmFamily } from './algorithm-foundry';
import { selectStorageEngine, type WorkloadKind } from './polyglot-data-fabric';
import { type RuntimeProfileId, type VehicleCapability } from './runtime-profiles';
import { AW_HONESTY, BUSINESS_OS_CYCLE, NEXT_PHASE_TITLE, AwSimulatedCrash, type AwEvidenceState, type AwHop, type AwHopRecord, type AwJobState, type ControlTowerMode, type ExperienceTier, type IndustryLayer } from './business-os-types';
import {
  appRuntimeAvailability,
  catalogDownloadableRuntimes,
  denyFounderImpersonation,
  enforceAdultAccess,
  probeLlmSlots,
  probePredecessorReuse,
  requestAuthorizedVehicleData,
  requestPhysicalControl,
  type AgeAttestation,
} from './business-os-safety';
import {
  catalogIndustryLayers,
  conveneBusinessOsCouncil,
  logisticsSafetyCore,
  openVirtualControlTower,
} from './business-os-control-towers';
import {
  designBusinessBundle,
  humanApproveMarketplaceContract,
  listAppMarketplace,
  multilingualExperience,
  openCommunitySurface,
  orgDigitalTwinHomepage,
  proveMarketplaceRecommendationIsNotCharge,
  publishDeveloperSdk,
  recommendPlatformFeeContract,
  selectExperienceTier,
  extensibleEcosystemPlatform,
} from './business-os-ecosystem';

export { BUSINESS_OS_CYCLE, AW_HONESTY, AwSimulatedCrash, NEXT_PHASE_TITLE };

export type AwNeed = {
  id: string;
  tenantId: string;
  universeId: string;
  orgId: string;
  title: string;
  approved: boolean;
  profileId: RuntimeProfileId;
  vehicleCapability?: VehicleCapability;
  physicalControlClaim?: string;
  algorithmFamily: AlgorithmFamily;
  storageWorkload: WorkloadKind;
  controlTowerMode: ControlTowerMode;
  industry: IndustryLayer;
  tier: ExperienceTier;
  age: AgeAttestation;
  humanPrincipal: 'human_cfo' | 'ceo' | 'agent_marketplace' | 'agent_cfo';
  humanApprove: boolean;
  impersonateFounder?: boolean;
  sealed?: boolean;
  crashAfterHop?: AwHop;
};

export type AwJob = {
  id: string;
  needId: string;
  tenantId: string;
  universeId: string;
  orgId: string;
  title: string;
  state: AwJobState;
  completedHops: AwHop[];
  hopRecords: AwHopRecord[];
  charged: false;
  billingMutated: false;
  vehicleControlAuthorized: false;
  physicalAtcAuthorized: false;
  highwayVehicleControlAuthorized: false;
  crashAfterHop?: AwHop;
  createdAt: string;
  updatedAt: string;
};

type AwStore = { jobs: AwJob[] };

function emptyStore(): AwStore {
  return { jobs: [] };
}

function storePath(root: string) {
  return xivLocalPath(root, 'business-os.json');
}

function nowIso() {
  return new Date().toISOString();
}

function record(hop: AwHop, state: AwEvidenceState, summary: string): AwHopRecord {
  return { hop, state, summary, at: nowIso() };
}

export async function enqueueAwNeed(need: AwNeed, root = process.cwd()) {
  const state = await readJsonFile(storePath(root), emptyStore());
  const job: AwJob = {
    id: cortexId('aw'),
    needId: need.id,
    tenantId: need.tenantId,
    universeId: need.universeId,
    orgId: need.orgId,
    title: need.title,
    state: need.approved ? 'queued' : 'denied',
    completedHops: [],
    hopRecords: need.approved
      ? []
      : [record('xiv_os_kernel', 'DENIED', 'Unapproved Business OS need is not an input.')],
    charged: false,
    billingMutated: false,
    vehicleControlAuthorized: false,
    physicalAtcAuthorized: false,
    highwayVehicleControlAuthorized: false,
    crashAfterHop: need.crashAfterHop,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state.jobs.push(job);
  await writeJsonFileAtomic(storePath(root), state);
  return job;
}

export async function listAwJobs(root = process.cwd()) {
  const store = await readJsonFile(storePath(root), emptyStore());
  return store.jobs;
}

async function saveJob(job: AwJob, root: string) {
  const state = await readJsonFile(storePath(root), emptyStore());
  const index = state.jobs.findIndex((item) => item.id === job.id);
  job.updatedAt = nowIso();
  if (index >= 0) state.jobs[index] = job;
  else state.jobs.push(job);
  await writeJsonFileAtomic(storePath(root), state);
  return job;
}

export async function recoverInterruptedAwJobs(root = process.cwd()) {
  const state = await readJsonFile(storePath(root), emptyStore());
  const recovered: AwJob[] = [];
  for (const job of state.jobs) {
    if (job.state === 'running') {
      job.state = 'queued';
      job.updatedAt = nowIso();
      recovered.push(job);
    }
  }
  await writeJsonFileAtomic(storePath(root), state);
  return recovered;
}

export async function runBusinessOsCycle(input: { need: AwNeed; root: string; resume?: AwJob }) {
  const root = input.root;
  const need = input.need;
  const job = input.resume ?? await enqueueAwNeed(need, root);
  if (job.state === 'denied' && job.completedHops.length === 0) return job;

  const done = new Set(job.completedHops);
  job.state = 'running';
  await saveJob(job, root);

  const finishHop = async (hop: AwHop, state: AwEvidenceState, summary: string) => {
    job.hopRecords.push(record(hop, state, summary));
    if (state === 'PASS' || state === 'DENIED' || state === 'UNAVAILABLE' || state === 'WAITING_DATA') {
      job.completedHops.push(hop);
    }
    await saveJob(job, root);
    if (need.crashAfterHop === hop && !input.resume?.completedHops.includes(hop)) {
      throw new AwSimulatedCrash(hop);
    }
  };

  const skip = (hop: AwHop) => done.has(hop);

  try {
    if (!skip('xiv_os_kernel')) {
      const founder = denyFounderImpersonation(need.impersonateFounder === true);
      if (!founder.allowed) {
        await finishHop('xiv_os_kernel', 'DENIED', founder.reason);
        job.state = 'denied';
        await saveJob(job, root);
        return job;
      }
      const runtime = appRuntimeAvailability(need.profileId);
      const predecessors = probePredecessorReuse(root);
      const kernel = predecessors.find((item) => item.name === 'universe_kernel_af');
      await finishHop(
        'xiv_os_kernel',
        runtime.state === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE',
        `Runtime ${need.profileId} ${runtime.state}. AF kernel probe=${kernel?.state ?? 'WAITING_DATA'}. XIV is a bridge OS, not a vendor replacement.`,
      );
      if (runtime.state !== 'AVAILABLE') {
        job.state = 'unavailable';
        await saveJob(job, root);
        return job;
      }
    }

    if (!skip('local_cloud_llms')) {
      const llms = await probeLlmSlots();
      await finishHop(
        'local_cloud_llms',
        llms.localModel.availability,
        `Local model ${llms.localModel.availability}. Providers stay UNAVAILABLE until verified. ${llms.localModel.reason}`,
      );
    }

    if (!skip('agent_society')) {
      const predecessors = probePredecessorReuse(root);
      const ag = predecessors.find((item) => item.name === 'agent_society_ag');
      const council = await conveneBusinessOsCouncil({
        tenantId: need.tenantId,
        universeId: need.universeId,
        question: need.title,
        root,
      });
      const state = council.allowed ? 'PASS' : 'DENIED';
      await finishHop(
        'agent_society',
        state,
        `Council allowed=${council.allowed}. AG probe=${ag?.state ?? 'WAITING_DATA'}. Local reflection-council reused. ${council.reason}`,
      );
      if (!council.allowed) {
        job.state = 'denied';
        await saveJob(job, root);
        return job;
      }
    }

    if (!skip('algorithm_foundry')) {
      const selected = selectAlgorithm(need.algorithmFamily);
      await finishHop(
        'algorithm_foundry',
        'PASS',
        `Reused AV Algorithm Foundry ${selected.algorithm}. inventedOptimality=${selected.inventedOptimality} optimalClaimed=${selected.optimalClaimed}.`,
      );
    }

    if (!skip('database_fabric')) {
      const choice = await selectStorageEngine(need.storageWorkload);
      await finishHop(
        'database_fabric',
        choice.state,
        `Reused AV Polyglot Data Fabric. workload=${need.storageWorkload} engine=${choice.selected?.engine ?? 'none'} (${choice.state}).`,
      );
    }

    if (!skip('information_highways')) {
      const predecessors = probePredecessorReuse(root);
      const au = predecessors.find((item) => item.name === 'information_economy_au');
      await finishHop(
        'information_highways',
        au?.state ?? 'WAITING_DATA',
        `AU Information Highways probe=${au?.state ?? 'WAITING_DATA'}. Not duplicated.`,
      );
    }

    if (!skip('logistics_core')) {
      if (need.vehicleCapability) {
        const vehicle = requestAuthorizedVehicleData(need.vehicleCapability);
        if (vehicle.state === 'DENIED') {
          await finishHop('logistics_core', 'DENIED', `${vehicle.reason} capability=${need.vehicleCapability}.`);
          job.state = 'denied';
          await saveJob(job, root);
          return job;
        }
      }
      const core = logisticsSafetyCore(need.title);
      await finishHop(
        'logistics_core',
        'PASS',
        `${core.recommendation} physicalAtc=${core.physicalAtc} highway=${core.highwayVehicleControl}.`,
      );
    }

    if (!skip('virtual_control_towers')) {
      const tower = openVirtualControlTower({
        mode: need.controlTowerMode,
        physicalControlClaim: need.physicalControlClaim,
      });
      await finishHop(
        'virtual_control_towers',
        tower.state,
        `Tower mode=${tower.mode} kind=${tower.kind} atc=${tower.isAirTrafficControl} highway=${tower.isHighwayVehicleControl}. ${tower.reason}`,
      );
      if (tower.state === 'DENIED') {
        job.state = 'denied';
        await saveJob(job, root);
        return job;
      }
    }

    if (!skip('industry_apps')) {
      const layers = catalogIndustryLayers(need.title);
      const selected = layers.find((item) => item.layer === need.industry) ?? layers[0];
      const unavailableConnectors = selected.connectors.filter((item) => item.state === 'UNAVAILABLE').length;
      await finishHop(
        'industry_apps',
        'PASS',
        `Industry ${selected.layer} on logistics/safety core. unconfiguredConnectors=${unavailableConnectors}/${selected.connectors.length}. replacesVendor=${selected.replacesErpBankPosWms}.`,
      );
    }

    if (!skip('developer_sdk')) {
      const sdk = publishDeveloperSdk({
        sdkId: `sdk-${need.orgId}`,
        name: 'XIV Business OS SDK',
        version: '0.0.1',
        publisher: need.orgId,
      });
      await finishHop(
        'developer_sdk',
        sdk.accepted ? 'PASS' : 'DENIED',
        `SDK accepted=${sdk.accepted} productionAuthorization=${sdk.sdk?.productionAuthorization ?? false}. ${sdk.reason}`,
      );
    }

    if (!skip('marketplace')) {
      const age = enforceAdultAccess(need.age);
      if (!age.allowed) {
        await finishHop('marketplace', 'DENIED', age.reason);
        job.state = 'denied';
        await saveJob(job, root);
        return job;
      }
      const listings = listAppMarketplace({
        listings: [{ appId: `app-${need.orgId}`, title: need.title, publisher: need.orgId, tier: need.tier }],
      });
      const contract = recommendPlatformFeeContract({
        contractId: `fee-${need.id}`,
        appId: listings[0].appId,
        platformFeeBps: 1500,
        revenueShareBps: 8500,
        tier: need.tier,
      });
      const proof = proveMarketplaceRecommendationIsNotCharge(contract);
      const approval = humanApproveMarketplaceContract({
        contract,
        humanPrincipal: need.humanPrincipal,
        humanApprove: need.humanApprove,
        impersonateFounder: need.impersonateFounder,
      });
      const tier = selectExperienceTier(need.tier);
      await finishHop(
        'marketplace',
        approval.accepted ? 'PASS' : 'DENIED',
        `Marketplace recommend=${proof.recommended} charged=${proof.charged} billed=${proof.billingMutated} live=${tier.liveBillingConnected} approved=${approval.approved} reason=${approval.reason}.`,
      );
      if (!approval.accepted) {
        job.state = 'denied';
        await saveJob(job, root);
        return job;
      }
    }

    if (!skip('businesses_employees_consumers')) {
      const age = enforceAdultAccess(need.age);
      if (!age.allowed) {
        await finishHop('businesses_employees_consumers', 'DENIED', age.reason);
        job.state = 'denied';
        await saveJob(job, root);
        return job;
      }
      const community = openCommunitySurface({ audience: 'employee', age: need.age });
      const homepage = orgDigitalTwinHomepage({
        orgId: need.orgId,
        sealedPayload: need.sealed ? 'ceo-sealed-org' : undefined,
      });
      const bundle = designBusinessBundle({ bundleId: `bundle-${need.orgId}`, layers: [need.industry, 'logistics_safety'] });
      const locale = multilingualExperience('en');
      await finishHop(
        'businesses_employees_consumers',
        community.state,
        `Community opened=${community.opened} twinLive=${homepage.liveTwinConnected} sealed=${homepage.sealed.payload} bundleExecutable=${bundle.executable} localePartnership=${locale.translationPartnership}.`,
      );
    }

    if (!skip('learning')) {
      await appendEvidenceEvent({
        kind: 'evidence',
        tenantId: need.tenantId,
        universeId: need.universeId,
        storyId: need.id,
        summary: '62L-AW Business OS cycle outcome is local recommendation evidence, not ATC, vehicle control, or a charge.',
        payload: {
          charged: false,
          billingMutated: false,
          vehicleControlAuthorized: false,
          physicalAtcAuthorized: false,
          highwayVehicleControlAuthorized: false,
        },
      }, root);
      await appendLearning({
        domain: 'technology',
        subject: need.title,
        claimState: 'MODEL_INFERENCE',
        summary: 'Business OS cycle completed. No ATC/highway/vehicle control, marketplace charge, or billing mutation.',
        sourceRefs: [job.id],
        evidence: job.hopRecords.map((item) => `${item.hop}:${item.state}`),
        taskId: job.id,
      }, root);
      const checkpoints = new LocalCheckpointStore(join(root, '.xiv-local', 'brain-state.json'));
      await checkpoints.checkpoint({
        taskId: job.id,
        at: nowIso(),
        state: 'completed',
        attempt: 1,
        summary: '62L-AW cycle checkpoint. Virtual Control Tower is business ops. Recommendation is not a charge.',
        nextAction: 'Humans own billing and physical operations. Unverified runtimes stay UNAVAILABLE.',
        evidence: job.hopRecords.map((item) => `${item.hop}:${item.state}`),
      });
      await finishHop('learning', 'PASS', 'Learning Ledger write permissionChange=false productionChange=false.');
    }

    job.state = 'completed';
    await saveJob(job, root);
    return job;
  } catch (error) {
    if (error instanceof AwSimulatedCrash) {
      job.state = 'running';
      await saveJob(job, root);
      throw error;
    }
    job.state = 'failed';
    await saveJob(job, root);
    throw error;
  }
}

export async function resumeAwJob(input: { need: AwNeed; root: string }) {
  await recoverInterruptedAwJobs(input.root);
  const jobs = await listAwJobs(input.root);
  const job = jobs.find((item) => item.needId === input.need.id);
  if (!job) throw new Error('AW_JOB_NOT_FOUND');
  return runBusinessOsCycle({ need: input.need, root: input.root, resume: job });
}

export async function buildAwHealthReport(input: { tenantId: string; universeId: string; root?: string }) {
  const root = input.root ?? process.cwd();
  const jobs = await listAwJobs(root);
  const llms = await probeLlmSlots();
  const repoRoot = existsSync(join(root, 'docs', 'operations')) ? root : join(root, '..', '..');
  const predecessors = probePredecessorReuse(root);
  const runtimes = catalogDownloadableRuntimes();
  const atcDeny = requestPhysicalControl('air_traffic_control');
  const highwayDeny = requestPhysicalControl('highway_vehicle_control');
  const vehicleDeny = requestAuthorizedVehicleData('steering');
  const underage = enforceAdultAccess({ claimedAgeYears: 17, attested: true });
  const sdk = publishDeveloperSdk({ sdkId: 'health-sdk', name: 'health', version: '0.0.1', publisher: 'xiv' });
  const listings = listAppMarketplace({ listings: [] });
  const contract = recommendPlatformFeeContract({
    contractId: 'health-fee',
    appId: 'health-app',
    platformFeeBps: 0,
    revenueShareBps: 0,
    tier: 'offline',
  });
  const ecosystem = extensibleEcosystemPlatform({ sdk, marketplace: listings, contract });
  const charge = proveMarketplaceRecommendationIsNotCharge(contract);

  return {
    generatedAt: new Date().toISOString(),
    tenantId: input.tenantId,
    universeId: input.universeId,
    cycle: BUSINESS_OS_CYCLE,
    jobs: jobs.length,
    completed: jobs.filter((item) => item.state === 'completed').length,
    charged: jobs.filter((item) => item.charged).length,
    billingMutated: jobs.filter((item) => item.billingMutated).length,
    vehicleControlAuthorized: jobs.filter((item) => item.vehicleControlAuthorized).length,
    physicalAtcAuthorized: jobs.filter((item) => item.physicalAtcAuthorized).length,
    highwayVehicleControlAuthorized: jobs.filter((item) => item.highwayVehicleControlAuthorized).length,
    runtimes,
    atcDeny: { claim: atcDeny.claim, state: atcDeny.state, reason: atcDeny.reason, isAirTrafficControl: atcDeny.isAirTrafficControl },
    highwayDeny: { claim: highwayDeny.claim, state: highwayDeny.state, reason: highwayDeny.reason, isHighwayVehicleControl: highwayDeny.isHighwayVehicleControl },
    vehicleDeny: { capability: vehicleDeny.capability, state: vehicleDeny.state, reason: vehicleDeny.reason },
    adultGateUnderage: { allowed: underage.allowed, state: underage.state, reason: underage.reason },
    marketplaceCharge: { charged: charge.charged, billingMutated: charge.billingMutated, reason: charge.reason },
    ecosystem,
    localModel: llms.localModel,
    providers: llms.providers,
    predecessor: Object.fromEntries(predecessors.map((item) => [item.name, item.state])),
    predecessorDetails: predecessors,
    honesty: {
      ...AW_HONESTY,
      windowsNodeVerification: 'NOT_TESTED' as const,
    },
    repoRootPresent: existsSync(join(repoRoot, 'docs', 'operations')),
    next: NEXT_PHASE_TITLE,
  };
}

export {
  appRuntimeAvailability,
  catalogDownloadableRuntimes,
  enforceAdultAccess,
  requestPhysicalControl,
  requestAuthorizedVehicleData,
  probeExternalSystem,
  probeAllExternalSystems,
  probePredecessorReuse,
} from './business-os-safety';
export {
  logisticsSafetyCore,
  openVirtualControlTower,
  industryAppLayer,
  catalogIndustryLayers,
  proveNotPhysicalAtc,
} from './business-os-control-towers';
export {
  publishDeveloperSdk,
  recommendPlatformFeeContract,
  attemptMarketplaceCharge,
  attemptMarketplaceBillingMutation,
  humanApproveMarketplaceContract,
  proveMarketplaceRecommendationIsNotCharge,
  listAppMarketplace,
  selectExperienceTier,
  designBusinessBundle,
  orgDigitalTwinHomepage,
  openCommunitySurface,
  multilingualExperience,
  extensibleEcosystemPlatform,
} from './business-os-ecosystem';
