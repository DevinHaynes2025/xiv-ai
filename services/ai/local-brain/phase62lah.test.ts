import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resetAgentPopulation } from './agent-population';
import { appendEvidenceEvent } from './evidence-ledger';
import { CAUSAL_WORLD_CYCLE, CAUSAL_WORLD_LOCKS, DIGITAL_TWIN_KINDS } from './causal-world-types';
import { generateCompetingCausalHypotheses, hypothesisCannotBecomeFactBySimulation, queryWorldModel } from './causal-world-model';
import { allTwinKinds, listIndustryTwins, twinHonesty, upsertIndustryTwin } from './industry-digital-twins';
import { forecastClass, runCounterfactual, runMonteCarlo, runSensitivity, simulationIsNotFact } from './causal-simulation';
import { optimizationHonesty, runOptimizationWorkcell } from './optimization-workcells';
import {
  createApprovedSimulationPack,
  federateSimulationPacks,
  provisionTwinFederationNodes,
  runApprovedPackLocally,
} from './offline-simulation-packs';
import { calibrateOutcome, classesRemainSeparate } from './outcome-calibration';
import { buildCausalWorldHealth, runCausalWorldCycle } from './causal-world-runtime';
import { sealCeoRecord, SEALED_REDACTION, readCeoSealedRecord } from './ceo-sealed-vault';
import { getRuntime } from './hybrid-runtime';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lah-'));
const tenantId = '62lah-tenant';
const universeId = '62lah-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

resetAgentPopulation();

try {
  check(
    'US-AH-cycle',
    CAUSAL_WORLD_CYCLE.join(' → ') ===
      'approved_story → world_model_query → evidence_retrieval → competing_causal_hypotheses → digital_twin_simulation → agent_challenge_council → evidence_check → outcome_estimate → human_gate → observed_result → calibration → learning_ledger → memory → next_story',
    'Causal world operating cycle hops are recorded in order.',
  );
  check(
    'US-AH-locks',
    CAUSAL_WORLD_LOCKS.l4AutonomyEnabled === false &&
      CAUSAL_WORLD_LOCKS.founderImpersonation === false &&
      CAUSAL_WORLD_LOCKS.correlationEqualsCausation === false &&
      CAUSAL_WORLD_LOCKS.simulationIsReality === false &&
      CAUSAL_WORLD_LOCKS.ceoSealedReplicating === false &&
      CAUSAL_WORLD_LOCKS.claimsQuantumAdvantage === false &&
      CAUSAL_WORLD_LOCKS.tipLand === false,
    'Honesty locks remain false.',
  );

  const denied = await runCausalWorldCycle({
    id: 'story-unapproved',
    tenantId,
    universeId,
    title: 'Unapproved causal story',
    subject: 'lead time',
    approved: false,
    root,
  });
  check('US-AH-approved', denied.state === 'denied' && denied.hops[0]?.state === 'DENIED', 'Unapproved stories are denied before simulation.');

  const factEvent = await appendEvidenceEvent({
    kind: 'evidence',
    tenantId,
    universeId,
    summary: 'Observed warehouse fill rate from local receiving log.',
    payload: { fillRate: 0.91, source: 'local-receiving-log' },
  }, root);
  check('US-AH-fact', factEvent.productionAuthorization === false && factEvent.summary.includes('Observed'), 'Verified-fact pathway records an observed local evidence event.');

  const query = await queryWorldModel({
    tenantId,
    universeId,
    question: 'Does expedited freight reduce lead time?',
    root,
  });
  check('US-AH8', query.isVerifiedFact === false && query.inventedFacts === false && query.epistemicClass === 'UNKNOWN', 'World-model query does not invent verified facts.');

  const hypotheses = await generateCompetingCausalHypotheses({
    tenantId,
    universeId,
    queryId: query.id,
    subject: 'expedited freight',
    root,
  });
  check(
    'US-AH8',
    hypotheses.length >= 2 &&
      hypotheses.every((item) => hypothesisCannotBecomeFactBySimulation(item) && item.correlationNote.includes('not causation')),
    `Generated ${hypotheses.length} competing hypotheses; none are causation claims.`,
  );

  const kinds = allTwinKinds();
  check('US-AH-kinds', kinds.join(',') === DIGITAL_TWIN_KINDS.join(','), 'All seven digital twin kinds are registered.');
  for (const kind of kinds) {
    const twin = await upsertIndustryTwin({
      tenantId,
      universeId,
      kind,
      label: `${kind} sandbox twin`,
      root,
    });
    const honesty = twinHonesty(twin);
    const story =
      kind === 'business'
        ? 'US-AH1'
        : kind === 'supply_chain'
          ? 'US-AH2'
          : kind === 'manufacturing'
            ? 'US-AH3'
            : kind === 'cloud_compute'
              ? 'US-AH4'
              : kind === 'infrastructure'
                ? 'US-AH5'
                : kind === 'market_economic'
                  ? 'US-AH6'
                  : 'US-AH7';
    check(
      story,
      twin.kind === kind && honesty.isReality === false && honesty.physicalControl === false && twin.epistemicClass === 'SIMULATION',
      `${kind} twin is a simulation without physical control.`,
    );
  }
  const twins = await listIndustryTwins({ tenantId, universeId, root });
  check('US-AH-twins', twins.length === 7, 'Seven industry twins exist in the sandbox catalog.');

  const supply = twins.find((twin) => twin.kind === 'supply_chain');
  assert.ok(supply);

  const counterfactual = await runCounterfactual({
    tenantId,
    universeId,
    twinId: supply.id,
    hypothesisIds: hypotheses.map((item) => item.id),
    intervention: { leadTimeDays: 10 },
    requestQuantum: true,
    root,
  });
  check(
    'US-AH9',
    simulationIsNotFact(counterfactual) &&
      counterfactual.results.leadTimeDays === 10 &&
      counterfactual.classicalBaseline.leadTimeDays === 14 &&
      counterfactual.quantumState === 'UNAVAILABLE' &&
      counterfactual.claimsQuantumAdvantage === false,
    'Counterfactual is SIMULATION with a classical baseline; unconfigured QPU is UNAVAILABLE.',
  );

  const monte = await runMonteCarlo({
    tenantId,
    universeId,
    twinId: supply.id,
    hypothesisIds: hypotheses.map((item) => item.id),
    seed: 62108,
    draws: 32,
    root,
  });
  check(
    'US-AH10',
    monte.kind === 'monte_carlo' &&
      monte.epistemicClass === 'SIMULATION' &&
      typeof monte.results.mean === 'number' &&
      (monte.samples?.length ?? 0) === 32 &&
      monte.isVerifiedFact === false,
    'Monte Carlo returns a classical distribution labeled SIMULATION.',
  );

  const sensitivity = await runSensitivity({
    tenantId,
    universeId,
    twinId: supply.id,
    hypothesisIds: hypotheses.map((item) => item.id),
    root,
  });
  check(
    'US-AH11',
    (sensitivity.sensitivity?.length ?? 0) === supply.variables.length && sensitivity.epistemicClass === 'SIMULATION',
    'Sensitivity analysis perturbs each twin parameter without claiming causation.',
  );

  const opt = await runOptimizationWorkcell({
    tenantId,
    universeId,
    twinId: supply.id,
    objective: 'Reduce simulated lead time without warehouse actuation',
    root,
  });
  const blockedOpt = await runOptimizationWorkcell({
    tenantId,
    universeId,
    twinId: supply.id,
    objective: 'Actuate production inventory',
    consequence: 'HIGH',
    production: true,
    root,
  });
  check(
    'US-AH12',
    opt.status === 'COMPLETED' &&
      opt.tradingAuthorized === false &&
      optimizationHonesty(opt).claimsQuantumAdvantage === false &&
      blockedOpt.status === 'HUMAN_APPROVAL_REQUIRED',
    'Optimization workcells stay simulation-only; production/HIGH requires a human.',
  );

  const unapprovedPack = await createApprovedSimulationPack({
    tenantId,
    universeId,
    scenario: 'unapproved freight shock',
    approved: false,
    simulationIds: [monte.id],
    root,
  });
  check('US-AH13', 'accepted' in unapprovedPack && unapprovedPack.accepted === false, 'Unapproved simulation packs are refused.');

  const sealed = await sealCeoRecord({
    tenantId,
    universeId,
    label: 'CEO sealed freight strategy',
    payload: 'CEO_SEALED_SECRET_do_not_replicate',
    actor: { kind: 'ceo_principal', id: 'ceo-test' },
    root,
  });
  check('US-AH17', sealed.accepted === true && sealed.record?.sealedPayload === SEALED_REDACTION, 'CEO seal write returns a redacted record to callers.');

  const peerRead = await readCeoSealedRecord({
    recordId: sealed.record?.id ?? 'missing',
    tenantId,
    universeId,
    actor: { kind: 'peer', id: 'mesh-peer' },
    root,
  });
  check('US-AH17', peerRead.allowed === false && peerRead.payload === null, 'Peers cannot read CEO-sealed payload.');

  const pack = await createApprovedSimulationPack({
    tenantId,
    universeId,
    scenario: 'approved freight shock (offline)',
    approved: true,
    simulationIds: [counterfactual.id, monte.id, sensitivity.id],
    extraPayload: { sealedPayload: 'CEO_SEALED_SECRET_do_not_replicate', founderPriority: 'hidden' },
    sealedRecordId: sealed.record?.id,
    requestCloud: true,
    root,
  });
  assert.ok(!('accepted' in pack));
  check(
    'US-AH13',
    pack.approved === true &&
      pack.cloudRequired === false &&
      pack.cloudState === 'UNAVAILABLE' &&
      pack.payload.sealedPayload === SEALED_REDACTION &&
      pack.replicatingSealed === false &&
      pack.sealedFieldsRemoved >= 1,
    'Approved packs run without cloud and redact sealed fields.',
  );
  const localRun = await runApprovedPackLocally({ packId: pack.id, tenantId, universeId, root });
  check(
    'US-AH13',
    localRun.ranLocally === true && localRun.unconfiguredRemainUnavailable === true,
    `Local pack run; aws=${localRun.providers.aws} azure=${localRun.providers.azure} gcp=${localRun.providers.gcp}.`,
  );

  const nodes = await provisionTwinFederationNodes({ tenantId, universeId, root });
  const federation = await federateSimulationPacks({
    tenantId,
    universeId,
    packIds: [pack.id],
    fromNodeId: nodes.left.id,
    toNodeId: nodes.right.id,
    root,
  });
  const fedJson = JSON.stringify(federation);
  check(
    'US-AH17',
    federation.state === 'PASS' &&
      federation.replicatingSealed === false &&
      federation.leakedSealedPayload === false &&
      federation.restrictedMoved === false &&
      !fedJson.includes('CEO_SEALED_SECRET_do_not_replicate') &&
      federation.sealedFieldsRemoved >= 1,
    'Distributed sim federation combines summaries without moving CEO-sealed secrets.',
  );

  const waitingCal = await calibrateOutcome({
    tenantId,
    universeId,
    simulationId: monte.id,
    root,
  });
  const calibrated = await calibrateOutcome({
    tenantId,
    universeId,
    simulationId: monte.id,
    observed: 13.5,
    observedVerified: true,
    evidenceRefs: [factEvent.id],
    root,
  });
  check(
    'US-AH14',
    waitingCal.status === 'WAITING_DATA' &&
      calibrated.status === 'CALIBRATED' &&
      calibrated.estimateClass === 'SIMULATION' &&
      calibrated.observedClass === 'VERIFIED_FACT' &&
      calibrated.simulationPromotedToFact === false &&
      classesRemainSeparate(calibrated.estimateClass, calibrated.observedClass),
    'Calibration keeps simulation estimates separate from verified observations.',
  );
  check(
    'US-AH16',
    forecastClass() === 'FORECAST' &&
      counterfactual.epistemicClass === 'SIMULATION' &&
      factEvent.summary.startsWith('Observed') &&
      calibrated.observedClass === 'VERIFIED_FACT',
    'Fact vs simulation/forecast classes remain distinct.',
  );

  const cycle = await runCausalWorldCycle({
    id: 'story-freight',
    tenantId,
    universeId,
    title: 'Freight lead-time causal review',
    subject: 'expedited freight',
    approved: true,
    twinKind: 'supply_chain',
    federate: true,
    observed: 13.2,
    observedVerified: true,
    root,
  });
  check(
    'US-AH15',
    cycle.hops.map((item) => item.hop).join(',') === CAUSAL_WORLD_CYCLE.join(',') &&
      cycle.hypothesisIds.length >= 2 &&
      cycle.epistemicSeparation === true &&
      cycle.founderImpersonation === false &&
      cycle.l4AutonomyEnabled === false,
    'Full causal world cycle executed with epistemic separation.',
  );

  const high = await runCausalWorldCycle({
    id: 'story-high',
    tenantId,
    universeId,
    title: 'High-consequence market move',
    subject: 'price index',
    approved: true,
    twinKind: 'market_economic',
    consequence: 'HIGH',
    root,
  });
  const humanHop = high.hops.find((item) => item.hop === 'human_gate');
  check('US-AH-gate', humanHop?.state === 'DENIED', 'HIGH consequence remains a human gate.');

  const cloud = await runCausalWorldCycle({
    id: 'story-cloud',
    tenantId,
    universeId,
    title: 'Needs unconfigured cloud freshness',
    subject: 'global spot prices',
    approved: true,
    needsCloudProvider: true,
    root,
  });
  check(
    'US-AH-providers',
    (cloud.state === 'unavailable' || cloud.hops.some((item) => item.state === 'UNAVAILABLE' || item.state === 'WAITING_DATA')) &&
      getRuntime('aws').state === 'UNAVAILABLE' &&
      getRuntime('gcp').configured === false,
    'Unconfigured cloud providers stay UNAVAILABLE/WAITING_DATA.',
  );

  const health = await buildCausalWorldHealth(root);
  check(
    'US-AH-health',
    health.inventedPass === false &&
      health.productionAuthorization === false &&
      health.locks.l4AutonomyEnabled === false &&
      health.predecessors['62L-AD'] === 'PRESENT' &&
      health.predecessors['62L-AC'] === 'PRESENT' &&
      health.predecessors['62L-AE'] === 'PRESENT' &&
      health.predecessors['62L-AG'] === 'WAITING_DATA' &&
      health.predecessors['62L-AF'] === 'WAITING_DATA' &&
      health.windowsNodeVerification === 'NOT_TESTED' &&
      health.githubIssue46 === 'UNAVAILABLE',
    `Health map predecessors=${JSON.stringify(health.predecessors)}.`,
  );
} catch (error) {
  failures.push(`UNCAUGHT: ${(error as Error).stack ?? String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('62L-AH safety tests FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('62L-AH safety tests PASS');
