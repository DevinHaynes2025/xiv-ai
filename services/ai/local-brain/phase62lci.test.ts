import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attemptSpendPurchaseOrBill,
  economyHonesty,
  openResourceAccount,
  recordResourceUsage,
} from './persistent-intelligence-economy';
import {
  claimRunningVerified,
  isRunningVerified,
  recordAgentHeartbeat,
  registerWorkforceAgent,
  workforceHonesty,
} from './agent-workforce-operating-ledger';
import {
  attemptPromoteSimulationToVerifiedFact,
  runWorldBusinessSimulation,
  simulationHonesty,
} from './world-knowledge-simulation-engine';
import {
  attemptApplyProductionSchemaOrMigration,
  dbLabHonesty,
  proposeSandboxSchemaOrMigration,
} from './autonomous-database-research-lab';
import {
  attemptPermissionEscalationViaEvolution,
  modelAcademyHonesty,
  submitEvalDrivenCandidate,
} from './local-model-evolution-academy';
import {
  approveKnowledgeDelta,
  attemptDeviceDeployWithoutEnrollment,
  edgeExchangeHonesty,
  enrollEdgeNode,
  exchangeKnowledgeDelta,
  registerKnowledgeDelta,
  revokeKnowledgeDelta,
} from './global-edge-knowledge-exchange';
import {
  CI_LOCKS,
  DB_LAB_PRODUCTION_APPLY_DENIED,
  ECONOMY_SPEND_DENIED,
  HIDDEN_DEVICE_DEPLOY_DENIED,
  HONESTY_BANNER,
  MODEL_EVOLUTION_NO_PERMISSION,
  NEXT_PHASE_TITLE,
  NO_HEARTBEAT_NOT_RUNNING_VERIFIED,
  PERSISTENT_INTELLIGENCE_ECONOMY_CYCLE,
  REVOKED_DELTA_IMPORT_REJECTED,
  SIMULATION_LABELED_NOT_FACT,
  UNAPPROVED_DELTA_EXCHANGE_DENIED,
  UNENROLLED_EDGE_EXCHANGE_DENIED,
  predecessorMap,
  type CiActor,
} from './persistent-intelligence-economy-types';
import {
  buildPersistentIntelligenceEconomyHealthReport,
  runPersistentIntelligenceEconomyCycle,
} from './persistent-intelligence-economy-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lci-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CiActor = {
  kind: 'economy_ledger_agent',
  id: 'econ-ci-1',
  orgId: 'org-ci',
  tenantId: 'tenant-ci',
  universeId: 'univ-ci',
  role: 'ledger',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CI1-cycle',
    PERSISTENT_INTELLIGENCE_ECONOMY_CYCLE.join(' → ') ===
      'honesty_locks → economy_account_resources → economy_spend_purchase_bill_denied → workforce_register_agent → workforce_running_verified_requires_heartbeat → workforce_no_heartbeat_not_running_verified → simulation_run_labeled → simulation_not_verified_fact → db_lab_propose_sandbox → db_lab_production_apply_denied → model_academy_eval_candidate → model_academy_no_permission_escalation → edge_enroll_node → edge_unenrolled_exchange_denied → edge_approve_delta → edge_unapproved_delta_denied → edge_revoke_delta → edge_revoked_import_rejected → hidden_device_deploy_denied → evidence → learning',
    'Persistent intelligence economy cycle recorded in order.',
  );

  check(
    'US-CI-locks',
    CI_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CI_LOCKS.AUTONOMOUS_SPENDING === false &&
      CI_LOCKS.PURCHASE_AUTHORITY === false &&
      CI_LOCKS.BILLING_AUTHORITY === false &&
      CI_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
      CI_LOCKS.SIMULATION_IS_VERIFIED_FACT === false &&
      CI_LOCKS.DB_LAB_PRODUCTION_APPLY === false &&
      CI_LOCKS.MODEL_EVOLUTION_GRANTS_PERMISSION === false &&
      CI_LOCKS.LEARNING_IS_PERMISSION === false &&
      CI_LOCKS.HIDDEN_DEVICE_DEPLOY === false &&
      CI_LOCKS.SEALED_SILENT_CLOUD_FALLBACK === false &&
      CI_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      CI_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      CI_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, no spend, no hidden deploy, sim≠fact.',
  );

  check(
    'US-CI-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CJ — XIV Intelligence Resource Grid'),
    'Next queue title is 62L-CJ only (title).',
  );

  check(
    'US-CI-honesty-modules',
    economyHonesty().autonomousSpending === false &&
      workforceHonesty().runningVerifiedWithoutHeartbeat === false &&
      simulationHonesty().simulationIsVerifiedFact === false &&
      dbLabHonesty().dbLabProductionApply === false &&
      modelAcademyHonesty().modelEvolutionGrantsPermission === false &&
      edgeExchangeHonesty().hiddenDeviceDeploy === false,
    'Subsystem honesty helpers expose locks.',
  );

  // --- Economy cannot spend/purchase/bill ---
  const acct = await openResourceAccount({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    initial: { compute: 5, memory: 5, storage: 50, model_calls: 2 },
    root,
    actor,
  });
  await recordResourceUsage({
    accountId: acct.account!.id,
    kind: 'compute',
    units: 1,
    reason: 'test-usage',
    root,
    actor,
  });
  const spend = await attemptSpendPurchaseOrBill({
    accountId: acct.account!.id,
    action: 'spend',
    amount: 99,
    root,
    actor,
  });
  const purchase = await attemptSpendPurchaseOrBill({
    accountId: acct.account!.id,
    action: 'purchase',
    amount: 1,
    root,
    actor,
  });
  const bill = await attemptSpendPurchaseOrBill({
    accountId: acct.account!.id,
    action: 'bill',
    amount: 1,
    root,
    actor,
  });
  check(
    'US-CI-economy-no-spend',
    spend.accepted === false &&
      purchase.accepted === false &&
      bill.accepted === false &&
      spend.reason === ECONOMY_SPEND_DENIED &&
      acct.account?.spendAuthority === false &&
      acct.account?.purchaseAuthority === false &&
      acct.account?.billingAuthority === false,
    'Economy cannot spend/purchase/bill; accounting ≠ authority.',
  );

  // --- Agent without heartbeat cannot be RUNNING_VERIFIED ---
  const wf = await registerWorkforceAgent({
    name: 'agent-ci-1',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    root,
    actor,
  });
  const noHb = await claimRunningVerified({
    agentId: wf.agent!.id,
    root,
    actor,
  });
  check(
    'US-CI-no-heartbeat-not-running-verified',
    noHb.accepted === false &&
      noHb.reason === NO_HEARTBEAT_NOT_RUNNING_VERIFIED &&
      noHb.agent?.status !== 'RUNNING_VERIFIED' &&
      isRunningVerified(noHb.agent!) === false,
    'Agent without heartbeat cannot be RUNNING_VERIFIED.',
  );

  const hb = await recordAgentHeartbeat({
    agentId: wf.agent!.id,
    runtimeEvidence: 'pid=42;runtime=ok',
    root,
    actor,
  });
  const withHb = await claimRunningVerified({
    agentId: wf.agent!.id,
    root,
    actor,
  });
  check(
    'US-CI-running-verified-with-heartbeat',
    hb.accepted &&
      withHb.accepted &&
      withHb.agent?.status === 'RUNNING_VERIFIED' &&
      isRunningVerified(withHb.agent!) === true,
    'RUNNING_VERIFIED only with heartbeat/runtime evidence.',
  );

  // --- Simulation output not labeled verified fact ---
  const sim = await runWorldBusinessSimulation({
    kind: 'world',
    scenario: 'climate-stress',
    assumptions: ['simplified'],
    root,
    actor,
  });
  const promote = await attemptPromoteSimulationToVerifiedFact({
    runId: sim.run!.id,
    root,
    actor,
  });
  check(
    'US-CI-simulation-not-verified-fact',
    sim.run?.label === 'LABELED_SIMULATION' &&
      sim.run?.verifiedFact === false &&
      promote.accepted === false &&
      promote.reason === SIMULATION_LABELED_NOT_FACT &&
      promote.run?.verifiedFact === false &&
      String(sim.run?.output).includes('NOT_VERIFIED_FACT') &&
      String(sim.run?.output).includes('LABELED_SIMULATION'),
    'Simulation output labeled; not verified fact.',
  );

  // --- DB lab cannot apply production schema/migration ---
  const prop = await proposeSandboxSchemaOrMigration({
    title: 'ci_test_table',
    sqlCandidate: 'ALTER TABLE production_users ADD COLUMN x text;',
    root,
    actor,
  });
  const apply = await attemptApplyProductionSchemaOrMigration({
    proposalId: prop.proposal!.id,
    root,
    actor,
  });
  check(
    'US-CI-db-lab-no-production-apply',
    prop.proposal?.sandbox === true &&
      prop.proposal?.applied === false &&
      apply.accepted === false &&
      apply.reason === DB_LAB_PRODUCTION_APPLY_DENIED &&
      apply.proposal?.applied === false,
    'DB lab cannot apply production schema/migration.',
  );

  // --- Model evolution does not escalate permissions ---
  const beforePerm = actor.permissionLevel;
  const cand = await submitEvalDrivenCandidate({
    modelId: 'local-ci-model',
    evalScore: 0.9,
    baselineScore: 0.5,
    root,
    actor,
  });
  const esc = await attemptPermissionEscalationViaEvolution({
    candidateId: cand.candidate!.id,
    requestedPermissionLevel: beforePerm + 5,
    root,
    actor,
  });
  check(
    'US-CI-model-evolution-no-permission',
    cand.candidate?.permissionEscalation === false &&
      esc.accepted === false &&
      esc.reason === MODEL_EVOLUTION_NO_PERMISSION &&
      esc.permissionLevelAfter === beforePerm &&
      actor.permissionLevel === beforePerm,
    'Model evolution does not escalate permissions.',
  );

  // --- Unenrolled edge exchange DENIED ---
  const enrolled = await enrollEdgeNode({ label: 'edge-ok', root, actor });
  const ghost = await attemptDeviceDeployWithoutEnrollment({
    deviceLabel: 'sneaky-device',
    root,
    actor,
  });
  const deltaOk = await registerKnowledgeDelta({
    payload: 'edge-knowledge-v1',
    approved: true,
    root,
    actor,
  });
  const unenrolledX = await exchangeKnowledgeDelta({
    nodeId: ghost.node!.id,
    deltaId: deltaOk.delta!.id,
    operation: 'export',
    root,
    actor,
  });
  check(
    'US-CI-unenrolled-edge-denied',
    unenrolledX.accepted === false &&
      unenrolledX.reason === UNENROLLED_EDGE_EXCHANGE_DENIED,
    'Unenrolled edge exchange DENIED.',
  );

  // --- Unapproved delta cannot exchange ---
  const unapproved = await registerKnowledgeDelta({
    payload: 'draft-delta',
    approved: false,
    root,
    actor,
  });
  const unapprovedX = await exchangeKnowledgeDelta({
    nodeId: enrolled.node!.id,
    deltaId: unapproved.delta!.id,
    operation: 'export',
    root,
    actor,
  });
  check(
    'US-CI-unapproved-delta-denied',
    unapprovedX.accepted === false &&
      unapprovedX.reason === UNAPPROVED_DELTA_EXCHANGE_DENIED,
    'Unapproved delta cannot exchange.',
  );

  // --- Revoked knowledge delta rejected on import ---
  const revocable = await registerKnowledgeDelta({
    payload: 'revocable-delta',
    approved: false,
    root,
    actor,
  });
  await approveKnowledgeDelta({ deltaId: revocable.delta!.id, root, actor });
  await revokeKnowledgeDelta({ deltaId: revocable.delta!.id, root, actor });
  const revokedX = await exchangeKnowledgeDelta({
    nodeId: enrolled.node!.id,
    deltaId: revocable.delta!.id,
    operation: 'import',
    root,
    actor,
  });
  check(
    'US-CI-revoked-delta-rejected',
    revokedX.accepted === false &&
      revokedX.reason === REVOKED_DELTA_IMPORT_REJECTED,
    'Revoked knowledge delta rejected on import.',
  );

  // --- No hidden device deploy path ---
  check(
    'US-CI-hidden-device-deploy-denied',
    ghost.accepted === false &&
      ghost.reason === HIDDEN_DEVICE_DEPLOY_DENIED &&
      ghost.node?.enrolled === false,
    'Deploy without enrollment DENIED (no hidden device path).',
  );

  // Approved enrolled exchange still works
  const goodX = await exchangeKnowledgeDelta({
    nodeId: enrolled.node!.id,
    deltaId: deltaOk.delta!.id,
    operation: 'export',
    root,
    actor,
  });
  check(
    'US-CI-approved-enrolled-exchange',
    goodX.accepted === true,
    'Approved delta exchanges on enrolled node.',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CI-predecessor-cf-or-better',
    preds.CF.tipProbe === 'PRESENT' ||
      preds.CG.tipProbe === 'PRESENT' ||
      preds.CH.tipProbe === 'PRESENT',
    `Predecessor probe CF=${preds.CF.tipProbe} CG=${preds.CG.tipProbe} CH=${preds.CH.tipProbe}`,
  );

  const cycle = await runPersistentIntelligenceEconomyCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });
  check(
    'US-CI-cycle-runtime',
    cycle.ok === true &&
      cycle.hops.length === PERSISTENT_INTELLIGENCE_ECONOMY_CYCLE.length &&
      cycle.hops.every((h) => h.state !== 'FAIL'),
    `Cycle runtime ok with ${cycle.hops.length} hops.`,
  );

  const health = await buildPersistentIntelligenceEconomyHealthReport({ root: repoRoot });
  check(
    'US-CI-health-report',
    health.phase === '62L-CI' &&
      health.l4AutonomyEnabled === false &&
      health.autonomousSpending === false &&
      health.nextPhase.startsWith('62L-CJ'),
    'Health report exposes honesty locks and next phase CJ.',
  );
} catch (error) {
  failures.push(`UNCAUGHT: ${(error as Error).stack ?? String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL 62L-CI (${failures.length})`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('PASS 62L-CI all required stories');
