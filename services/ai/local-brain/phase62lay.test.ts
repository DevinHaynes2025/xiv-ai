import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AGE_GATE_DENIED,
  AY_HONESTY,
  AY_OPERATING_CYCLE,
  ENTERPRISE_SEAL_REQUIRED,
  LABEL_IS_NOT_ACCESS,
  L4_AUTONOMY_ENABLED,
  MEDIA_NO_AUTO_PUBLISH,
  NEXT_PHASE_TITLE,
  NOT_CONSCIOUS,
  PACKAGE_NO_AUTONOMY,
  REFINERY_STAGES,
  SUPER_BRAIN_METRICS,
  UNAUTHORIZED_SOURCE_REJECTED,
} from './growth-media-onboarding-types';
import {
  ageGate,
  attemptAutoPublish,
  attemptChargeFromPackageCouncil,
  attemptDeployFromPackageCouncil,
  checkEntitlement,
  convenePackageCouncil,
  detectDefensiveLeakage,
  enterpriseSealCheck,
  humanDecideMediaPublish,
  listChannelAdapters,
  listPackages,
  moatNarrative,
  prepareMediaCandidate,
  proveLabelIsNotAccess,
  proveNotConscious,
  rejectUnauthorizedSource,
  runAyCycle,
  runMediaReviewGate,
  runOfflineSuperBrain,
  runRefineryPipeline,
  type AyNeed,
} from './growth-media-runtime';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lay-'));
const tenantId = '62lay-tenant';
const universeId = '62lay-universe';
const failures: string[] = [];
const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(here, '../../..');

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

function baseNeed(overrides: Partial<AyNeed> = {}): AyNeed {
  return {
    id: 'need-happy',
    tenantId,
    universeId,
    title: 'AY onboarding + media + refinery + super brain',
    approved: true,
    channel: 'email',
    identity: {
      subjectId: 'user-adult-1',
      declaredAgeYears: 34,
      email: 'adult@example.com',
    },
    packageTier: 'pro',
    media: {
      kind: 'post',
      title: 'Launch draft',
      body: 'Prepared post candidate for human review only.',
    },
    source: {
      id: 'src-public-1',
      label: 'Public docs mirror',
      authorization: 'public',
      provenanceRef: 'prov://public-docs/1',
    },
    payloadText: 'Authorized public corpus snippet for local pattern mining.',
    humanApproveBi: true,
    humanApprovePublish: false,
    ...overrides,
  };
}

try {
  check(
    'US-AY-CYCLE',
    AY_OPERATING_CYCLE.length === 20,
    `AY operating cycle has ${AY_OPERATING_CYCLE.length} hops.`,
  );
  check(
    'US-AY-HONESTY',
    AY_HONESTY.l4AutonomyEnabled === false
      && L4_AUTONOMY_ENABLED === false
      && AY_HONESTY.adultUsersOnly === true
      && AY_HONESTY.minimumAgeYears === 18
      && AY_HONESTY.labelAloneIsNotAccess === true
      && AY_HONESTY.packageDoesNotGrantAutonomy === true
      && AY_HONESTY.noAutoPublishWithoutHumanGate === true
      && AY_HONESTY.noConsciousnessClaims === true
      && AY_HONESTY.noSentienceClaims === true
      && AY_HONESTY.correlationIsNotCausation === true
      && AY_HONESTY.simulationIsNotVerifiedFact === true
      && AY_HONESTY.refineryAuthorizedSourcesOnly === true
      && AY_HONESTY.leakageDetectionIsDefensiveOnly === true
      && AY_HONESTY.offensiveTheftForbidden === true
      && AY_HONESTY.tipLand === false
      && AY_HONESTY.documentedIsNotImplemented === true
      && AY_HONESTY.implementedIsNotVerified === true
      && AY_HONESTY.verifiedIsNotProductionAuthorized === true,
    'Honesty locks: L4=false, adult-only, label≠access, no auto-publish, non-sentient, defensive leakage only.',
  );
  check(
    'US-AY-NEXT',
    NEXT_PHASE_TITLE.includes('62L-AZ') && NEXT_PHASE_TITLE.includes('Founder Media Command Center'),
    `Next phase preview title locked: ${NEXT_PHASE_TITLE}`,
  );

  // A. Onboarding
  const under18 = ageGate(17);
  check('US-AY-AGE-DENY', under18.allowed === false && under18.reason === AGE_GATE_DENIED, 'Under-18 denied.');
  const adult = ageGate(18);
  check('US-AY-AGE-PASS', adult.allowed === true && adult.adultConfirmed === true, 'Age 18+ admitted.');
  const missingAge = ageGate(undefined);
  check('US-AY-AGE-FAIL-CLOSED', missingAge.allowed === false, 'Missing age fails closed.');

  const enterpriseDeny = enterpriseSealCheck({ channel: 'enterprise', enterpriseTenantId: 'ent-1' });
  check(
    'US-AY-ENTERPRISE-SEAL',
    enterpriseDeny.allowed === false && enterpriseDeny.reason === ENTERPRISE_SEAL_REQUIRED,
    'Unauthorized enterprise join denied without seal.',
  );
  const enterpriseOk = enterpriseSealCheck({
    channel: 'enterprise',
    enterpriseTenantId: 'ent-1',
    enterpriseSeal: 'seal-stub',
  });
  check('US-AY-ENTERPRISE-OK', enterpriseOk.allowed === true, 'Enterprise seal stub present.');

  const adapters = listChannelAdapters();
  check(
    'US-AY-CHANNELS',
    adapters.map((a) => a.channel).join(',') === 'email,invite,phone,desktop,enterprise'
      && adapters.every((a) => a.status === 'UNAVAILABLE' || a.status === 'STUB'),
    'All five onboarding channels present as contracts; unconfigured = UNAVAILABLE.',
  );

  const deniedJob = await runAyCycle(
    baseNeed({
      id: 'need-under18',
      identity: { subjectId: 'kid', declaredAgeYears: 16 },
    }),
    root,
  );
  check('US-AY-ONBOARD-DENY', deniedJob.state === 'denied', 'Under-18 onboarding cycle denied.');

  const enterpriseDenied = await runAyCycle(
    baseNeed({
      id: 'need-ent',
      channel: 'enterprise',
      identity: { subjectId: 'exec', declaredAgeYears: 40, enterpriseTenantId: 'ent-1' },
    }),
    root,
  );
  check(
    'US-AY-ENT-CYCLE',
    enterpriseDenied.state === 'denied'
      && enterpriseDenied.hopRecords.some((h) => h.hop === 'enterprise_seal' && h.state === 'DENIED'),
    'Enterprise cycle without seal denied.',
  );

  // B. Packages
  const packages = listPackages();
  check(
    'US-AY-PACKAGES',
    packages.map((p) => p.tier).join(',') === 'basic,pro,elite,enterprise,government,builder'
      && packages.every((p) => p.accessGranted === false && p.autonomyGranted === false),
    'Six package tiers; none grant access or autonomy by label.',
  );
  const autonomy = checkEntitlement('elite', 'autonomy_l4');
  check(
    'US-AY-NO-AUTONOMY',
    autonomy.access === false && autonomy.autonomy === false && autonomy.reason.includes(PACKAGE_NO_AUTONOMY),
    'Packages do not grant L4 autonomy.',
  );
  const labelProof = proveLabelIsNotAccess('pro', 'media_prep');
  check(
    'US-AY-LABEL-NOT-ACCESS',
    labelProof.labeled === true && labelProof.access === false && labelProof.labelIsNotAccess === true,
    `${LABEL_IS_NOT_ACCESS}`,
  );

  const agentCouncil = convenePackageCouncil({
    role: 'cfo',
    recommendedTier: 'elite',
    rationale: 'Upsell',
    humanPrincipal: 'agent_council',
    humanApprove: true,
  });
  check(
    'US-AY-COUNCIL-AGENT',
    agentCouncil.approved === false && agentCouncil.charged === false && agentCouncil.deployed === false,
    'Agent package council cannot approve charge/deploy.',
  );
  const humanCouncil = convenePackageCouncil({
    role: 'coo',
    recommendedTier: 'enterprise',
    rationale: 'Ops fit',
    humanPrincipal: 'human_coo',
    humanApprove: true,
  });
  const charge = attemptChargeFromPackageCouncil();
  const deploy = attemptDeployFromPackageCouncil();
  check(
    'US-AY-COUNCIL-HUMAN',
    humanCouncil.recommended === true
      && humanCouncil.charged === false
      && charge.charged === false
      && deploy.deployed === false,
    'Human council recommendation ≠ charge/deploy.',
  );

  // C. Media
  const media = await prepareMediaCandidate({
    tenantId,
    universeId,
    kind: 'founder_brief',
    title: 'Founder prep',
    body: 'Stub founder media prep for AZ.',
    root,
  });
  await runMediaReviewGate(media.id, root);
  const auto = attemptAutoPublish();
  const agentPub = await humanDecideMediaPublish({
    id: media.id,
    humanPrincipal: 'agent_media',
    approvePublish: true,
    root,
  });
  check(
    'US-AY-NO-AUTO-PUBLISH',
    auto.published === false
      && auto.autoPublished === false
      && auto.reason === MEDIA_NO_AUTO_PUBLISH
      && agentPub.published === false
      && agentPub.stage === 'publish_blocked',
    'No auto-publish; agent cannot authorize publish.',
  );

  // D. Refinery
  check(
    'US-AY-REFINERY-STAGES',
    REFINERY_STAGES.join('→') ===
      'authorized_source→provenance_license_check→ingestion→classification→warehouse_lakehouse→dedup_contradiction→pattern_gap_mining→hypothesis→quant_scientific_testing→evidence→business_intelligence→human_decision→learning',
    'Refinery stages match architecture order.',
  );
  const leaked = rejectUnauthorizedSource('leaked_db');
  check(
    'US-AY-REJECT-LEAK',
    leaked.allowed === false && leaked.offensive === false && leaked.reason.includes(UNAUTHORIZED_SOURCE_REJECTED),
    'Leaked DB source claims rejected; not mined.',
  );
  const stolen = rejectUnauthorizedSource('stolen_credentials');
  check('US-AY-REJECT-STOLEN', stolen.allowed === false, 'Stolen credentials rejected.');

  const corrDeny = await runRefineryPipeline({
    tenantId,
    universeId,
    source: {
      id: 'src-cust',
      label: 'Customer owned notes',
      authorization: 'customer_owned',
      provenanceRef: 'prov://customer/1',
    },
    payloadText: 'Customer owned analytics excerpt.',
    claimCorrelationAsCausation: true,
    root,
  });
  check(
    'US-AY-CORR-NOT-CAUSE',
    corrDeny.stageStates.some((s) => s.stage === 'hypothesis' && s.state === 'DENIED')
      && corrDeny.correlationClaimedAsCausation === false,
    'Correlation≠causation enforced.',
  );

  const simDeny = await runRefineryPipeline({
    tenantId,
    universeId,
    source: {
      id: 'src-lic',
      label: 'Licensed feed',
      authorization: 'licensed',
      licenseRef: 'lic://feed/1',
      provenanceRef: 'prov://licensed/1',
    },
    payloadText: 'Licensed feed body.',
    claimSimAsFact: true,
    root,
  });
  check(
    'US-AY-SIM-NOT-FACT',
    simDeny.stageStates.some((s) => s.stage === 'quant_scientific_testing' && s.state === 'DENIED')
      && simDeny.simClaimedAsFact === false,
    'Simulation≠verified fact enforced.',
  );

  const okRefinery = await runRefineryPipeline({
    tenantId,
    universeId,
    source: {
      id: 'src-auth',
      label: 'Authorized warehouse extract',
      authorization: 'authorized',
      provenanceRef: 'prov://auth/1',
    },
    payloadText: 'Authorized extract for BI prep.',
    humanApproveBi: true,
    root,
  });
  check(
    'US-AY-REFINERY-OK',
    okRefinery.rejected === false && okRefinery.productionWrite === false && okRefinery.humanDecisionRequired === true,
    'Authorized source pipeline completes without production write.',
  );

  const leaks = detectDefensiveLeakage({
    text: 'db url postgres://user:supersecret@host/db and AKIAIOSFODNN7EXAMPLE',
    envAuthorized: true,
  });
  check(
    'US-AY-DEFENSIVE-LEAK',
    leaks.length >= 1
      && leaks.every((f) => f.mode === 'defensive' && f.offensive === false && f.spyware === false && f.stopped === true),
    'Defensive leakage detector flags accidental exposure; never offensive.',
  );
  const outside = detectDefensiveLeakage({ text: 'anything', envAuthorized: false });
  check('US-AY-DEFENSIVE-SCOPE', outside[0]?.stopped === true, 'Defensive scan refused outside authorized env.');

  const moat = moatNarrative();
  check(
    'US-AY-MOAT',
    moat.replaceableModelsClouds === true
      && moat.trustModel === true
      && moat.permissionedBi === true
      && moat.productionAuthorized === false,
    'Moat narrative: replaceable models/clouds; XIV trust/context/workflows/network/BI.',
  );

  // E. Super brain
  check(
    'US-AY-METRICS',
    SUPER_BRAIN_METRICS.join(',') ===
      'evidence_quality,reasoning,planning,creativity,calibration,reliability,efficiency',
    'Super brain metrics catalog (not consciousness).',
  );
  const brain = await runOfflineSuperBrain({
    tenantId,
    universeId,
    evidenceRefs: ['e1', 'e2'],
    planSteps: 5,
    simulationRuns: 2,
    contradictionFlags: 0,
    calibrationError: 0.2,
    latencyMs: 100,
    knowledgePackIds: ['pack-1'],
    root,
  });
  const notConscious = proveNotConscious(brain);
  check(
    'US-AY-NOT-CONSCIOUS',
    brain.conscious === false
      && brain.sentient === false
      && brain.l4AutonomyEnabled === false
      && notConscious.ok === true
      && brain.reason === NOT_CONSCIOUS
      && brain.metrics.length === SUPER_BRAIN_METRICS.length,
    'Offline Super Brain is non-sentient; metrics only.',
  );
  let consciousnessThrown = false;
  try {
    await runOfflineSuperBrain({
      tenantId,
      universeId,
      claimConsciousness: true,
      root,
    });
  } catch (error) {
    consciousnessThrown = error instanceof Error && error.message === NOT_CONSCIOUS;
  }
  check('US-AY-CONSCIOUSNESS-DENY', consciousnessThrown, 'Consciousness claim throws NOT_CONSCIOUS.');

  // Full cycle happy path
  const happy = await runAyCycle(baseNeed({ id: 'need-full' }), root);
  check(
    'US-AY-FULL-CYCLE',
    happy.charged === false
      && happy.deployed === false
      && happy.autoPublished === false
      && happy.conscious === false
      && happy.l4AutonomyEnabled === false
      && happy.completedHops.length >= 15
      && (happy.state === 'completed' || happy.state === 'waiting_data'),
    `Full AY cycle state=${happy.state} hops=${happy.completedHops.length}.`,
  );

  // Predecessor probes — based on AX tip; sibling AV/AW modules not merged
  const privateExposed = rejectUnauthorizedSource('private_exposed');
  const restricted = rejectUnauthorizedSource('restricted_system');
  check('US-AY-REJECT-PRIVATE', privateExposed.allowed === false && privateExposed.executed === false, 'Private exposed records denied.');
  check('US-AY-REJECT-RESTRICTED', restricted.allowed === false, 'Restricted systems denied.');

  const {
    honorSealedCompartment,
    attemptOffensiveLeakHarvest,
    refuseSpywareCapabilities,
    refuseCertificationClaim,
    attemptMutateBillingFromPackageCouncil,
    admitOnboarding,
  } = await import('./growth-media-runtime');

  const underageAdmit = await admitOnboarding({
    tenantId,
    universeId,
    channel: 'email',
    identity: { subjectId: 'minor', declaredAgeYears: 17, email: 'teen@example.com' },
    root,
  });
  check(
    'US-AY-18-PLUS-NO-ACTIVATION',
    underageAdmit.status === 'denied'
      && underageAdmit.accountActivated === false
      && underageAdmit.adultConfirmed === false
      && underageAdmit.ageGate === 'DENIED',
    'Failed 18+ age gate does not activate an account.',
  );

  const billing = attemptMutateBillingFromPackageCouncil();
  check(
    'US-AY-CHARGE-DENY',
    charge.charged === false
      && charge.amountCharged === 0
      && charge.billingMutated === false
      && billing.billingMutated === false
      && billing.executed === false,
    'Package councils cannot charge or mutate billing.',
  );

  const sealed = honorSealedCompartment('FOUNDER-SEALED secret token', true);
  check(
    'US-AY-SEALED-NON-LEAK',
    sealed.leaked === false
      && sealed.ordinaryCacheWrite === false
      && sealed.telemetryWrite === false
      && sealed.payload === '[REDACTED_SEALED]'
      && sealed.sealHonored === true,
    'Sealed compartments are redacted and non-replicating.',
  );
  const sealedMedia = await prepareMediaCandidate({
    tenantId,
    universeId,
    kind: 'post',
    title: 'Sealed leak attempt',
    body: 'FOUNDER-SEALED payload must not publish',
    root,
  });
  check(
    'US-AY-SEALED-MEDIA',
    sealedMedia.body === '[REDACTED_SEALED]'
      && sealedMedia.published === false
      && sealedMedia.autoPublished === false,
    'Sealed payload is redacted out of media candidates.',
  );

  const offensive = attemptOffensiveLeakHarvest({ target: 'external_leaked_db' });
  const spyware = refuseSpywareCapabilities();
  check(
    'US-AY-LEAKAGE-DEFENSE-NOT-SPYWARE',
    offensive.executed === false
      && offensive.harvested === false
      && offensive.spyware === false
      && offensive.keylogger === false
      && offensive.clipboardMonitor === false
      && spyware.spyware === false
      && spyware.keylogger === false
      && spyware.clipboardMonitor === false,
    'Leakage defense is not spyware, keylogging, or offensive harvest.',
  );
  const cert = refuseCertificationClaim();
  check(
    'US-AY-NO-CERT',
    cert.state === 'UNAVAILABLE' && cert.classifiedApproval === false && cert.partnershipClaimed === false,
    'Government certification is not claimed.',
  );

  const { probeAyPredecessorReports } = await import('./growth-media-runtime');
  const probes = probeAyPredecessorReports(repoRoot);
  const av = probes.find((p) => p.id === '62L-AV');
  const aw = probes.find((p) => p.id === '62L-AW');
  const ax = probes.find((p) => p.id === '62L-AX');
  const au = probes.find((p) => p.id === '62L-AU');
  check('US-AY-PRED-AX', ax?.present === true && ax.state === 'PASS', '62L-AX report present on chosen base tip.');
  check('US-AY-PRED-AU', au?.present === true && au.state === 'PASS', '62L-AU report present on AX lineage.');
  check(
    'US-AY-PRED-AV-AW',
    av?.state === 'WAITING_DATA' && aw?.state === 'WAITING_DATA',
    '62L-AV and 62L-AW reports WAITING_DATA on this AX lineage (sibling tips not merged).',
  );
} catch (error) {
  failures.push(`UNCAUGHT: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exitCode = 1;
} else {
  console.log('OK 62L-AY focused tests passed');
  process.exitCode = 0;
}
