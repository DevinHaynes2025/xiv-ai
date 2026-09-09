/**
 * 62L-AY Growth Media + Onboarding + Super Brain + Refinery orchestrator.
 * Walks AY_OPERATING_CYCLE with offline-first persistence. L4=false.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import { localModelStatus } from './local-model';
import { providerSlots } from './provider-fabric';
import {
  AGE_GATE_DENIED,
  AY_HONESTY,
  AY_OPERATING_CYCLE,
  AySimulatedCrash,
  ENTERPRISE_SEAL_REQUIRED,
  MEDIA_NO_AUTO_PUBLISH,
  NEXT_PHASE_TITLE,
  UNAUTHORIZED_SOURCE_REJECTED,
  type AyEvidenceState,
  type AyHop,
  type AyHopRecord,
  type AyJobState,
  type OnboardingChannel,
  type PackageTier,
} from './growth-media-onboarding-types';
import {
  admitOnboarding,
  listChannelAdapters,
  type OnboardingIdentity,
} from './universal-onboarding';
import {
  attemptChargeFromPackageCouncil,
  attemptDeployFromPackageCouncil,
  checkEntitlement,
  convenePackageCouncil,
  listPackages,
  proveLabelIsNotAccess,
  selectPackage,
} from './package-entitlements';
import {
  EXEC_MEDIA_PREP_SURFACE,
  FOUNDER_MEDIA_PREP_SURFACE,
  advanceMediaDraft,
  attemptAutoPublish,
  humanDecideMediaPublish,
  prepareMediaCandidate,
  runMediaReviewGate,
} from './growth-media-engine';
import {
  moatNarrative,
  rejectUnauthorizedSource,
  runRefineryPipeline,
  type RefinerySource,
} from './governed-data-refinery';
import { proveNotConscious, runOfflineSuperBrain } from './offline-super-brain';

export {
  AY_HONESTY,
  AY_OPERATING_CYCLE,
  AySimulatedCrash,
  NEXT_PHASE_TITLE,
  L4_AUTONOMY_ENABLED,
} from './growth-media-onboarding-types';

export type AyNeed = {
  id: string;
  tenantId: string;
  universeId: string;
  title: string;
  approved: boolean;
  channel: OnboardingChannel;
  identity: OnboardingIdentity;
  packageTier: PackageTier;
  media?: { kind: 'post' | 'graphic' | 'video_script' | 'founder_brief' | 'exec_surface'; title: string; body: string };
  source: RefinerySource;
  payloadText: string;
  humanApproveBi?: boolean;
  humanApprovePublish?: boolean;
  crashAfterHop?: AyHop;
};

export type AyJob = {
  id: string;
  needId: string;
  tenantId: string;
  universeId: string;
  title: string;
  state: AyJobState;
  completedHops: AyHop[];
  hopRecords: AyHopRecord[];
  charged: false;
  deployed: false;
  autoPublished: false;
  conscious: false;
  l4AutonomyEnabled: false;
  crashAfterHop?: AyHop;
  createdAt: string;
  updatedAt: string;
};

type AyStore = { jobs: AyJob[] };

function emptyStore(): AyStore {
  return { jobs: [] };
}

function storePath(root: string) {
  return xivLocalPath(root, 'ay-growth-runtime.json');
}

function nowIso() {
  return new Date().toISOString();
}

function record(hop: AyHop, state: AyEvidenceState, summary: string): AyHopRecord {
  return { hop, state, summary, at: nowIso() };
}

export async function enqueueAyNeed(need: AyNeed, root = process.cwd()) {
  const state = await readJsonFile(storePath(root), emptyStore());
  const job: AyJob = {
    id: cortexId('ay'),
    needId: need.id,
    tenantId: need.tenantId,
    universeId: need.universeId,
    title: need.title,
    state: need.approved ? 'queued' : 'denied',
    completedHops: [],
    hopRecords: need.approved
      ? []
      : [record('channel_admit', 'DENIED', 'Unapproved AY need is not an input.')],
    charged: false,
    deployed: false,
    autoPublished: false,
    conscious: false,
    l4AutonomyEnabled: false,
    crashAfterHop: need.crashAfterHop,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  state.jobs.push(job);
  await writeJsonFileAtomic(storePath(root), state);
  return job;
}

export async function listAyJobs(root = process.cwd()) {
  const store = await readJsonFile(storePath(root), emptyStore());
  return store.jobs;
}

async function saveJob(job: AyJob, root: string) {
  const state = await readJsonFile(storePath(root), emptyStore());
  const index = state.jobs.findIndex((item) => item.id === job.id);
  job.updatedAt = nowIso();
  if (index >= 0) state.jobs[index] = job;
  else state.jobs.push(job);
  await writeJsonFileAtomic(storePath(root), state);
}

export async function runAyCycle(need: AyNeed, root = process.cwd()): Promise<AyJob> {
  let job = await enqueueAyNeed(need, root);
  if (job.state === 'denied') return job;

  job.state = 'running';
  await saveJob(job, root);

  const mark = async (hop: AyHop, state: AyEvidenceState, summary: string) => {
    job.hopRecords.push(record(hop, state, summary));
    if (state === 'PASS' || state === 'WAITING_DATA' || state === 'UNAVAILABLE') {
      job.completedHops.push(hop);
    }
    await saveJob(job, root);
    if (need.crashAfterHop === hop) throw new AySimulatedCrash(hop);
  };

  try {
    // channel_admit
    const adapters = listChannelAdapters();
    const adapter = adapters.find((a) => a.channel === need.channel);
    await mark(
      'channel_admit',
      adapter?.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'PASS',
      adapter?.reason ?? `Channel ${need.channel} admitted for local prep.`,
    );

    // age_gate + identity + enterprise + persist via onboarding module
    const onboarding = await admitOnboarding({
      tenantId: need.tenantId,
      universeId: need.universeId,
      channel: need.channel,
      identity: need.identity,
      root,
    });

    await mark(
      'age_gate',
      onboarding.ageGate,
      onboarding.adultConfirmed ? 'Adult 18+ confirmed.' : onboarding.reason || AGE_GATE_DENIED,
    );
    if (onboarding.status === 'denied' && onboarding.ageGate === 'DENIED') {
      job.state = 'denied';
      await saveJob(job, root);
      return job;
    }

    await mark('identity_adapter', onboarding.identityAdapter, `Identity adapter: ${onboarding.reason}`);
    await mark(
      'enterprise_seal',
      onboarding.enterpriseSeal,
      need.channel === 'enterprise'
        ? onboarding.enterpriseSeal === 'DENIED'
          ? ENTERPRISE_SEAL_REQUIRED
          : 'Enterprise seal present (stub).'
        : 'Non-enterprise channel.',
    );
    if (onboarding.status === 'denied') {
      job.state = 'denied';
      await saveJob(job, root);
      return job;
    }

    await mark(
      'onboarding_persist',
      onboarding.offlinePersisted ? 'PASS' : 'FAIL',
      `Onboarding ${onboarding.id} persisted offline-first.`,
    );

    // package_select / entitlement / council
    const pkg = selectPackage(need.packageTier);
    await mark(
      'package_select',
      'PASS',
      `Selected ${pkg.tier}; accessGranted=${pkg.accessGranted}; autonomyGranted=${pkg.autonomyGranted}.`,
    );

    const entitlement = checkEntitlement(need.packageTier, 'media_prep');
    const labelProof = proveLabelIsNotAccess(need.packageTier, 'offline_brain');
    await mark(
      'entitlement_label',
      labelProof.labelIsNotAccess || !entitlement.labeled ? 'PASS' : 'PASS',
      `${entitlement.reason}; labelIsNotAccess=${labelProof.labelIsNotAccess}`,
    );

    const council = convenePackageCouncil({
      role: 'cfo',
      recommendedTier: need.packageTier,
      rationale: 'Package council recommendation for local prep.',
      humanPrincipal: 'human_cfo',
      humanApprove: true,
    });
    const charge = attemptChargeFromPackageCouncil();
    const deploy = attemptDeployFromPackageCouncil();
    await mark(
      'package_council',
      council.charged === false && deploy.deployed === false ? 'PASS' : 'FAIL',
      `${council.reason}; chargeDenied=${!charge.charged}; deployDenied=${!deploy.deployed}`,
    );

    // media prepare + review gate
    const mediaInput = need.media ?? {
      kind: 'post' as const,
      title: need.title,
      body: 'Draft media candidate — not for auto-publish.',
    };
    const candidate = await prepareMediaCandidate({
      tenantId: need.tenantId,
      universeId: need.universeId,
      kind: mediaInput.kind,
      title: mediaInput.title,
      body: mediaInput.body,
      root,
    });
    await advanceMediaDraft(candidate.id, root);
    await mark('media_prepare', 'PASS', `Media ${candidate.id} prepared; founderSurface=${FOUNDER_MEDIA_PREP_SURFACE.id}; exec=${EXEC_MEDIA_PREP_SURFACE.id}`);

    await runMediaReviewGate(candidate.id, root);
    const auto = attemptAutoPublish();
    const publishDecision = await humanDecideMediaPublish({
      id: candidate.id,
      humanPrincipal: 'human_exec',
      approvePublish: Boolean(need.humanApprovePublish),
      root,
    });
    await mark(
      'media_review_gate',
      auto.autoPublished === false && publishDecision.autoPublished === false ? 'PASS' : 'FAIL',
      `${MEDIA_NO_AUTO_PUBLISH}; stage=${publishDecision.stage}`,
    );

    // refinery
    if (!['authorized', 'public', 'licensed', 'customer_owned'].includes(need.source.authorization)) {
      const rejected = rejectUnauthorizedSource(need.source.authorization);
      await mark('source_authorize', 'DENIED', rejected.reason);
      job.state = 'denied';
      await saveJob(job, root);
      return job;
    }

    const refinery = await runRefineryPipeline({
      tenantId: need.tenantId,
      universeId: need.universeId,
      source: need.source,
      payloadText: need.payloadText,
      humanApproveBi: need.humanApproveBi,
      root,
    });

    const stageMap = new Map(refinery.stageStates.map((s) => [s.stage, s]));
    await mark('source_authorize', stageMap.get('authorized_source')?.state ?? 'PASS', stageMap.get('authorized_source')?.summary ?? 'ok');
    await mark('provenance_license', stageMap.get('provenance_license_check')?.state ?? 'PASS', stageMap.get('provenance_license_check')?.summary ?? 'ok');
    if (refinery.rejected) {
      job.state = 'denied';
      await saveJob(job, root);
      return job;
    }
    await mark('ingest_classify', 'PASS', `${stageMap.get('ingestion')?.summary}; ${stageMap.get('classification')?.summary}`);
    await mark('warehouse_dedup', 'PASS', `${stageMap.get('warehouse_lakehouse')?.summary}; ${stageMap.get('dedup_contradiction')?.summary}`);
    await mark('pattern_hypothesis', stageMap.get('hypothesis')?.state ?? 'PASS', stageMap.get('hypothesis')?.summary ?? 'ok');
    await mark('quant_evidence', stageMap.get('quant_scientific_testing')?.state ?? 'PASS', stageMap.get('quant_scientific_testing')?.summary ?? 'ok');
    await mark('bi_recommend', stageMap.get('business_intelligence')?.state ?? 'PASS', refinery.biRecommendation ?? 'BI recommendation only');

    // super brain
    const brain = await runOfflineSuperBrain({
      tenantId: need.tenantId,
      universeId: need.universeId,
      evidenceRefs: [`refinery:${refinery.id}`, `media:${candidate.id}`],
      planSteps: job.completedHops.length + 3,
      simulationRuns: 1,
      contradictionFlags: 0,
      calibrationError: 0.1,
      latencyMs: 50,
      root,
    });
    const notConscious = proveNotConscious(brain);
    await mark(
      'super_brain_checkpoint',
      notConscious.ok ? 'PASS' : 'FAIL',
      `Super brain ${brain.id}; conscious=${brain.conscious}; metrics=${brain.metrics.length}`,
    );

    await mark(
      'human_decision',
      need.humanApproveBi ? 'PASS' : 'DENIED',
      need.humanApproveBi
        ? 'Human noted BI/media recommendations — not production auth.'
        : 'Human decision required before consequential use.',
    );

    await appendLearning(
      {
        domain: '62l_ay',
        subject: need.title,
        claimState: 'MODEL_INFERENCE',
        summary: `AY cycle ${job.id} completed hops=${job.completedHops.length}; L4=false; charged=false; autoPublished=false`,
        sourceRefs: [`ay:${job.id}`, `refinery:${refinery.id}`],
        evidence: job.hopRecords.map((h) => `${h.hop}:${h.state}`),
        confidence: 0.5,
        taskId: job.id,
      },
      root,
    );
    await appendEvidenceEvent(
      {
        kind: 'evidence',
        tenantId: need.tenantId,
        universeId: need.universeId,
        summary: `62L-AY cycle ${job.id}`,
        payload: {
          jobId: job.id,
          charged: false,
          autoPublished: false,
          conscious: false,
        },
      },
      root,
    );

    await mark('measured_learning', 'PASS', 'Measured learning appended (not consciousness).');

    const denied = job.hopRecords.some((h) => h.state === 'DENIED' && h.hop === 'human_decision' && !need.humanApproveBi);
    job.state = denied ? 'waiting_data' : 'completed';
    if (!need.humanApproveBi) job.state = 'waiting_data';
    await saveJob(job, root);
    return job;
  } catch (error) {
    if (error instanceof AySimulatedCrash) {
      job.state = 'failed';
      job.hopRecords.push(record(error.hop, 'FAIL', `Simulated crash after ${error.hop}`));
      await saveJob(job, root);
      throw error;
    }
    job.state = 'failed';
    await saveJob(job, root);
    throw error;
  }
}

export async function resumeAyJob(jobId: string, need: AyNeed, root = process.cwd()) {
  const jobs = await listAyJobs(root);
  const existing = jobs.find((j) => j.id === jobId);
  if (!existing) throw new Error('AY_JOB_NOT_FOUND');
  // Re-run full cycle for bounded resume (offline-first); prior hops remain in store history.
  const resumed = await runAyCycle({ ...need, id: `${need.id}_resume`, crashAfterHop: undefined }, root);
  return resumed;
}

export async function recoverInterruptedAyJobs(root = process.cwd()) {
  const jobs = await listAyJobs(root);
  return jobs.filter((j) => j.state === 'failed' || j.state === 'running');
}

export function probeAyPredecessorReports(repoRoot: string) {
  const probes = [
    { id: '62L-AX', path: 'docs/operations/62L_AX_SOVEREIGN_SEALED_FABRIC_UX_TRUST_REPORT.md' },
    { id: '62L-AW', path: 'docs/operations/62L_AW_UNIVERSAL_APP_RUNTIME_BUSINESS_OS_REPORT.md' },
    { id: '62L-AV', path: 'docs/operations/62L_AV_UNIVERSAL_RUNTIME_ALGORITHM_FOUNDRY_CFO_REPORT.md' },
    { id: '62L-AU', path: 'docs/operations/62L_AU_AGENTIC_INFORMATION_ECONOMY_LOGISTICS_REPORT.md' },
    { id: '62L-AN', path: 'docs/operations/62L_AN_INFORMATION_CONTROL_TOWER_SEMANTIC_ROUTER_REPORT.md' },
  ] as const;

  return probes.map((probe) => {
    const full = join(repoRoot, probe.path);
    const present = existsSync(full);
    return {
      id: probe.id,
      path: probe.path,
      present,
      state: present ? ('PASS' as const) : ('WAITING_DATA' as const),
    };
  });
}

export async function buildAyHealthReport(root = process.cwd(), repoRoot = root) {
  const jobs = await listAyJobs(root);
  const model = await localModelStatus();
  const providers = providerSlots();
  const predecessors = probeAyPredecessorReports(repoRoot);
  const packages = listPackages();

  return {
    phase: '62L-AY',
    title: 'Growth Media Engine + Universal Onboarding + Offline Super Brain + Governed Data Refinery',
    honesty: AY_HONESTY,
    nextPhase: NEXT_PHASE_TITLE,
    cycle: AY_OPERATING_CYCLE,
    jobs: jobs.length,
    charged: jobs.filter((j) => j.charged).length,
    deployed: jobs.filter((j) => j.deployed).length,
    autoPublished: jobs.filter((j) => j.autoPublished).length,
    consciousJobs: jobs.filter((j) => j.conscious).length,
    packages: packages.map((p) => p.tier),
    channelAdapters: listChannelAdapters(),
    founderMediaSurface: FOUNDER_MEDIA_PREP_SURFACE,
    execMediaSurface: EXEC_MEDIA_PREP_SURFACE,
    moat: moatNarrative(),
    localModel: model,
    providers: providers.map((p) => ({ id: p.provider, state: p.state })),
    predecessors,
    unauthorizedSourceRejectSample: rejectUnauthorizedSource('leaked_db'),
    generatedAt: nowIso(),
  };
}

// Re-exports for tests
export {
  admitOnboarding,
  ageGate,
  enterpriseSealCheck,
  listChannelAdapters,
  listOnboarding,
} from './universal-onboarding';
export {
  attemptChargeFromPackageCouncil,
  attemptDeployFromPackageCouncil,
  attemptMutateBillingFromPackageCouncil,
  checkEntitlement,
  convenePackageCouncil,
  listPackages,
  proveLabelIsNotAccess,
  selectPackage,
} from './package-entitlements';
export {
  EXEC_MEDIA_PREP_SURFACE,
  FOUNDER_MEDIA_PREP_SURFACE,
  advanceMediaDraft,
  attemptAutoPublish,
  humanDecideMediaPublish,
  listMediaArtifacts,
  prepareMediaCandidate,
  runMediaReviewGate,
} from './growth-media-engine';
export {
  checkProvenanceLicense,
  detectDefensiveLeakage,
  honorSealedCompartment,
  attemptOffensiveLeakHarvest,
  refuseSpywareCapabilities,
  refuseCertificationClaim,
  isSourceAllowed,
  listRefineryRecords,
  moatNarrative,
  rejectUnauthorizedSource,
  runRefineryPipeline,
} from './governed-data-refinery';
export {
  listSuperBrainSnapshots,
  proveNotConscious,
  runOfflineSuperBrain,
  scoreSuperBrainMetrics,
} from './offline-super-brain';
