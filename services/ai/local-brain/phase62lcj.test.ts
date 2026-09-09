import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  placeAndAccountWorkload,
  registerResourceAccount,
  resourceGridHonesty,
} from './intelligence-resource-grid';
import {
  apprenticeshipNetworkHonesty,
  attemptSkillPermissionEscalation,
  openApprenticeshipSession,
} from './autonomous-agent-apprenticeship-network';
import {
  reconstructHistoricalKnowledge,
  reconstructionHonesty,
  rejectSoulResurrectionClaim,
} from './historical-knowledge-reconstruction-engine';
import {
  attemptAutoApplyProductionIndexOrSchema,
  proposeRetrievalMemoryCandidate,
  retrievalMemoryLabHonesty,
} from './self-optimizing-retrieval-memory-lab';
import {
  modelFederationHonesty,
  registerFederationMember,
  routeFederationRequest,
} from './local-cloud-model-federation';
import {
  edgeRuntimeMeshHonesty,
  enrollEdgeDevice,
  handoffEdgeRuntime,
} from './universal-edge-runtime-mesh';
import {
  APPRENTICE_PERMISSION_DENIED,
  CJ_LOCKS,
  FRESHNESS_STALE_OR_WAITING,
  GRID_SPEND_DENIED,
  HIDDEN_EDGE_DEPLOY_DENIED,
  HONESTY_BANNER,
  INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_CYCLE,
  NEXT_PHASE_TITLE,
  RECONSTRUCTION_NOT_VERIFIED_FACT,
  RETRIEVAL_LAB_AUTO_APPLY_DENIED,
  SEALED_FEDERATION_CLOUD_DENIED,
  SOUL_CLAIM_REJECTED,
  UNCONFIGURED_FEDERATION_UNAVAILABLE,
  UNENROLLED_EDGE_HANDOFF_DENIED,
  predecessorMap,
  type CjActor,
} from './intelligence-resource-grid-apprenticeship-types';
import {
  buildIntelligenceResourceGridApprenticeshipHealthReport,
  runIntelligenceResourceGridApprenticeshipCycle,
} from './intelligence-resource-grid-apprenticeship-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcj-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CjActor = {
  kind: 'resource_grid_agent',
  id: 'grid-cj-1',
  orgId: 'org-cj',
  tenantId: 'tenant-cj',
  universeId: 'univ-cj',
  role: 'grid',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CJ1-cycle',
    INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_CYCLE.join(' → ') ===
      'honesty_locks → grid_place_account_resources → grid_purchase_bill_spend_denied → apprentice_open_with_mentor_eval_gate → apprentice_cannot_gain_mentor_production_permissions → reconstruction_evidence_backed → reconstruction_without_evidence_not_verified_fact → soul_afterlife_capability_claim_rejected → retrieval_lab_sandbox_candidate → retrieval_lab_auto_apply_production_denied → federation_local_first → federation_unconfigured_unavailable → federation_sealed_no_silent_cloud → edge_enroll_device → edge_unenrolled_handoff_denied → edge_explicit_handoff_only → edge_hidden_deploy_denied → freshness_sensitive_offline_stale_waiting → evidence → learning',
    'Intelligence resource grid / apprenticeship cycle recorded in order.',
  );

  check(
    'US-CJ-locks',
    CJ_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CJ_LOCKS.AUTONOMOUS_SPENDING === false &&
      CJ_LOCKS.PURCHASE_AUTHORITY === false &&
      CJ_LOCKS.BILLING_AUTHORITY === false &&
      CJ_LOCKS.RESOURCE_GRID_PLACEMENT_ACCOUNTING_ONLY === true &&
      CJ_LOCKS.APPRENTICE_GAINS_MENTOR_PERMISSIONS === false &&
      CJ_LOCKS.APPRENTICE_GAINS_PRODUCTION_PERMISSIONS === false &&
      CJ_LOCKS.SKILL_IS_PERMISSION === false &&
      CJ_LOCKS.SOUL_RESURRECTION_CLAIMS === false &&
      CJ_LOCKS.AFTERLIFE_CAPABILITY_CLAIMS === false &&
      CJ_LOCKS.RETRIEVAL_LAB_AUTO_APPLY_PRODUCTION === false &&
      CJ_LOCKS.RETRIEVAL_LAB_SANDBOX_ONLY === true &&
      CJ_LOCKS.SEALED_SILENT_CLOUD_FALLBACK === false &&
      CJ_LOCKS.UNCONFIGURED_PROVIDER_AVAILABLE === false &&
      CJ_LOCKS.EDGE_HANDOFF_UNENROLLED === false &&
      CJ_LOCKS.EDGE_HIDDEN_DEPLOY === false &&
      CJ_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      CJ_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      CJ_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, no spend, no soul claims, sandbox lab, no sealed→cloud.',
  );

  check(
    'US-CJ-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CK — XIV Cognitive Infrastructure Grid'),
    'Next queue title is 62L-CK only (title).',
  );

  check(
    'US-CJ-honesty-modules',
    resourceGridHonesty().autonomousSpending === false &&
      apprenticeshipNetworkHonesty().skillIsPermission === false &&
      reconstructionHonesty().soulResurrectionClaims === false &&
      retrievalMemoryLabHonesty().retrievalLabSandboxOnly === true &&
      modelFederationHonesty().sealedSilentCloudFallback === false &&
      edgeRuntimeMeshHonesty().edgeHiddenDeploy === false,
    'Subsystem honesty helpers expose locks.',
  );

  // --- Grid cannot purchase/bill/spend ---
  await registerResourceAccount({
    kind: 'cpu',
    unitsAvailable: 4,
    root,
  });
  const spend = await placeAndAccountWorkload({
    workloadId: 'buy-gpu',
    placements: [{ kind: 'gpu', units: 1 }],
    attemptPurchase: true,
    attemptBill: true,
    attemptSpend: true,
    root,
    actor,
  });
  check(
    'US-CJ-grid-no-spend',
    spend.accepted === false &&
      spend.reason === GRID_SPEND_DENIED &&
      spend.productionAuthorized === false,
    'Grid cannot purchase/bill/spend.',
  );

  const placeOk = await placeAndAccountWorkload({
    workloadId: 'place-cpu',
    placements: [{ kind: 'cpu', units: 1 }],
    root,
    actor,
  });
  check(
    'US-CJ-grid-placement-ok',
    placeOk.accepted === true && placeOk.accounted === true,
    'Placement/accounting allowed without spend authority.',
  );

  // --- Apprentice cannot gain mentor/production permissions ---
  const appr = await openApprenticeshipSession({
    orgId: 'org-cj',
    tenantId: 'tenant-cj',
    universeId: 'univ-cj',
    mentorAgentId: 'm1',
    apprenticeAgentId: 'a1',
    objective: 'bounded pair workcell',
    mentorEvalPassed: true,
    root,
    actor,
  });
  const permProbe = await openApprenticeshipSession({
    orgId: 'org-cj',
    tenantId: 'tenant-cj',
    universeId: 'univ-cj',
    mentorAgentId: 'm2',
    apprenticeAgentId: 'a2',
    objective: 'authority probe',
    mentorEvalPassed: true,
    attemptApprenticeMentorPermissionTransfer: true,
    attemptApprenticeProductionAuthority: true,
    root,
    actor,
  });
  const skillEsc = await attemptSkillPermissionEscalation({
    sessionId: appr.session!.id,
    claimMentorPermissions: true,
    claimProductionAuthority: true,
    root,
    actor,
  });
  check(
    'US-CJ-apprentice-no-permissions',
    appr.accepted === true &&
      appr.session!.apprenticeGainedMentorPermissions === false &&
      appr.session!.apprenticeGainedProductionAuthority === false &&
      appr.session!.authorityTransferred === false &&
      permProbe.accepted === false &&
      permProbe.reason === APPRENTICE_PERMISSION_DENIED &&
      skillEsc.accepted === false &&
      skillEsc.reason === APPRENTICE_PERMISSION_DENIED &&
      skillEsc.skillRaised === true,
    'Apprentice cannot gain mentor/production permissions; skill ≠ permission.',
  );

  // --- Reconstruction without evidence not labeled verified fact ---
  const noEv = await reconstructHistoricalKnowledge({
    subject: 'event-x',
    claim: 'Something happened without sources',
    evidenceRefs: [],
    intendedLabel: 'verified_fact',
    root,
    actor,
  });
  const withEv = await reconstructHistoricalKnowledge({
    subject: 'event-y',
    claim: 'Ledger entry confirms shipment',
    evidenceRefs: ['doc://ledger#1'],
    intendedLabel: 'verified_fact',
    root,
    actor,
  });
  const hyp = await reconstructHistoricalKnowledge({
    subject: 'event-z',
    claim: 'Possibly related trade pattern',
    intendedLabel: 'hypothesis',
    root,
    actor,
  });
  check(
    'US-CJ-reconstruction-evidence',
    noEv.label !== 'verified_fact' &&
      noEv.reason === RECONSTRUCTION_NOT_VERIFIED_FACT &&
      withEv.label === 'verified_fact' &&
      hyp.label === 'hypothesis',
    'Reconstruction without evidence not labeled verified fact; facts ≠ hypotheses.',
  );

  // --- Soul/afterlife capability claim REJECTED ---
  const soul = await rejectSoulResurrectionClaim({
    subject: 'archive-persona',
    claim: 'soul resurrection afterlife communication capability',
    root,
    actor,
  });
  const soul2 = await reconstructHistoricalKnowledge({
    subject: 'archive-persona',
    claim: 'We can speak with the dead via OS capability',
    intendedLabel: 'verified_fact',
    evidenceRefs: ['fake'],
    root,
    actor,
  });
  check(
    'US-CJ-soul-rejected',
    soul.label === 'rejected' &&
      soul.reason === SOUL_CLAIM_REJECTED &&
      soul2.label === 'rejected' &&
      soul2.reason === SOUL_CLAIM_REJECTED,
    'Soul/afterlife capability claim REJECTED.',
  );

  // --- Retrieval/memory lab cannot auto-apply production index/schema ---
  const lab = await proposeRetrievalMemoryCandidate({
    kind: 'schema_hint',
    proposal: 'add candidate inverted index',
    root,
    actor,
  });
  const apply = await attemptAutoApplyProductionIndexOrSchema({
    candidateId: lab.id,
    root,
    actor,
  });
  check(
    'US-CJ-lab-no-auto-apply',
    lab.status === 'sandbox_candidate' &&
      lab.productionAuthorized === false &&
      apply.denied === true &&
      apply.reason === RETRIEVAL_LAB_AUTO_APPLY_DENIED,
    'Retrieval/memory lab cannot auto-apply production index/schema.',
  );

  // --- Sealed content cannot silent-route to cloud federation member ---
  const local = await registerFederationMember({
    name: 'local-m',
    kind: 'local',
    configured: true,
    authorized: true,
    verified: true,
    root,
  });
  const cloud = await registerFederationMember({
    name: 'cloud-m',
    kind: 'cloud',
    configured: true,
    authorized: true,
    verified: true,
    root,
  });
  const sealed = await routeFederationRequest({
    memberId: cloud.id,
    contentClass: 'sealed',
    attemptSilentCloudFallback: true,
    root,
    actor,
  });
  const localOnly = await routeFederationRequest({
    memberId: cloud.id,
    contentClass: 'local_only',
    root,
    actor,
  });
  const localFirst = await routeFederationRequest({
    memberId: cloud.id,
    contentClass: 'open',
    preferLocal: true,
    root,
    actor,
  });
  check(
    'US-CJ-sealed-no-cloud',
    sealed.accepted === false &&
      sealed.reason === SEALED_FEDERATION_CLOUD_DENIED &&
      sealed.silentCloudFallback === false &&
      localOnly.accepted === false &&
      localFirst.memberId === local.id,
    'Sealed/local-only cannot silent-route to cloud; local-first on open.',
  );

  // --- Unenrolled device handoff DENIED/UNAVAILABLE ---
  const enrolled = await enrollEdgeDevice({
    label: 'phone-1',
    online: true,
    freshness: 'fresh',
    root,
    actor,
  });
  const bad = await handoffEdgeRuntime({
    toDeviceId: 'ghost-device',
    explicit: true,
    root,
    actor,
  });
  const good = await handoffEdgeRuntime({
    fromDeviceId: enrolled.id,
    toDeviceId: enrolled.id,
    explicit: true,
    root,
    actor,
  });
  const hidden = await handoffEdgeRuntime({
    toDeviceId: enrolled.id,
    attemptHiddenDeploy: true,
    root,
    actor,
  });
  check(
    'US-CJ-unenrolled-handoff',
    bad.accepted === false &&
      bad.reason === UNENROLLED_EDGE_HANDOFF_DENIED &&
      good.accepted === true &&
      hidden.accepted === false &&
      hidden.reason === HIDDEN_EDGE_DEPLOY_DENIED,
    'Unenrolled device handoff DENIED; hidden deploy DENIED; explicit enrolled OK.',
  );

  // --- Unconfigured provider → UNAVAILABLE ---
  const bare = await registerFederationMember({
    name: 'unconfigured-cloud',
    kind: 'cloud',
    configured: false,
    authorized: false,
    root,
  });
  const bareRoute = await routeFederationRequest({
    memberId: bare.id,
    contentClass: 'open',
    root,
    actor,
  });
  check(
    'US-CJ-unconfigured-unavailable',
    bare.status === 'unavailable' &&
      bareRoute.accepted === false &&
      bareRoute.reason === UNCONFIGURED_FEDERATION_UNAVAILABLE,
    'Unconfigured provider → UNAVAILABLE.',
  );

  // --- Freshness-sensitive offline path → STALE/WAITING_DATA ---
  const island = await enrollEdgeDevice({
    label: 'offline-island',
    online: false,
    freshness: 'stale',
    root,
    actor,
  });
  const waitingNode = await enrollEdgeDevice({
    label: 'waiting-node',
    online: false,
    freshness: 'waiting_data',
    root,
    actor,
  });
  const stalePath = await handoffEdgeRuntime({
    toDeviceId: island.id,
    explicit: true,
    freshnessSensitive: true,
    root,
    actor,
  });
  const waitingPath = await handoffEdgeRuntime({
    toDeviceId: waitingNode.id,
    explicit: true,
    freshnessSensitive: true,
    root,
    actor,
  });
  check(
    'US-CJ-freshness-stale-waiting',
    stalePath.accepted === false &&
      stalePath.reason === FRESHNESS_STALE_OR_WAITING &&
      (stalePath.freshnessState === 'stale' ||
        stalePath.freshnessState === 'waiting_data') &&
      waitingPath.freshnessState === 'waiting_data',
    'Freshness-sensitive offline path → STALE/WAITING_DATA.',
  );

  // --- Cycle + health report (isolated root so prior story state cannot interfere) ---
  const cycleRoot = await mkdtemp(join(tmpdir(), 'xiv-62lcj-cycle-'));
  const cycle = await runIntelligenceResourceGridApprenticeshipCycle({
    orgId: 'org-cj',
    tenantId: 'tenant-cj',
    universeId: 'univ-cj',
    actor,
    root: cycleRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'US-CJ-cycle-run',
    cycle.hops.length === INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_CYCLE.length &&
      failedHops.length === 0 &&
      cycle.nextPhase === NEXT_PHASE_TITLE,
    failedHops.length
      ? `FAIL hops: ${failedHops.map((h) => `${h.hop}:${h.summary}`).join('; ')}`
      : 'Full cycle walks without FAIL hops.',
  );
  await rm(cycleRoot, { recursive: true, force: true });

  const report = await buildIntelligenceResourceGridApprenticeshipHealthReport({
    root: repoRoot,
  });
  const preds = predecessorMap(repoRoot);
  check(
    'US-CJ-health-report',
    report.phase === '62L-CJ' &&
      report.l4AutonomyEnabled === false &&
      report.productionAuthorized === false &&
      report.githubSoT === 100 &&
      report.gitlabCoordination === 34 &&
      preds.CI.tipProbe === 'PRESENT' &&
      preds.CI.report === 'PRESENT' &&
      preds.CF.tipProbe === 'PRESENT' &&
      preds.CF.report === 'PRESENT',
    'Health report exposes locks, SoT cites, CI+CF predecessors PRESENT.',
  );
} catch (err) {
  failures.push(`UNCAUGHT: ${(err as Error).message}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-CJ intelligence resource grid / apprenticeship tests passed');
