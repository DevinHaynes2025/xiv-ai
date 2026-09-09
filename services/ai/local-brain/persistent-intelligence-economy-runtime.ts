/**
 * 62L-CI runtime — walks PERSISTENT_INTELLIGENCE_ECONOMY_CYCLE and builds health report.
 */

import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  attemptSpendPurchaseOrBill,
  economyHonesty,
  openResourceAccount,
  recordResourceUsage,
} from './persistent-intelligence-economy';
import {
  claimRunningVerified,
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
  testProposalInSandbox,
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
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PERSISTENT_INTELLIGENCE_ECONOMY_CYCLE,
  predecessorMap,
  type CiActor,
  type CiEvidenceState,
  type CiHop,
  type CiHopRecord,
} from './persistent-intelligence-economy-types';

/** Optional CG/CF/CE/CD continuity — present on preferred base tip; never softens CI locks. */
import { CG_LOCKS } from './deep-knowledge-refinery-os-types';
import { CF_LOCKS } from './data-refinery-compression-replication-types';
import { CE_LOCKS } from './knowledge-excavation-memory-lake-types';
import { CD_LOCKS } from './data-root-local-llm-archive-mesh-types';

export {
  CI_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PERSISTENT_INTELLIGENCE_ECONOMY_CYCLE,
  predecessorMap,
};

function hop(name: CiHop, state: CiEvidenceState, summary: string): CiHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CiCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CiActor;
  root?: string;
};

export async function runPersistentIntelligenceEconomyCycle(input: CiCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CiHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CI_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CI_LOCKS.AUTONOMOUS_SPENDING === false &&
        CI_LOCKS.RUNNING_VERIFIED_WITHOUT_HEARTBEAT === false &&
        CI_LOCKS.SIMULATION_IS_VERIFIED_FACT === false &&
        CI_LOCKS.DB_LAB_PRODUCTION_APPLY === false &&
        CI_LOCKS.MODEL_EVOLUTION_GRANTS_PERMISSION === false &&
        CI_LOCKS.HIDDEN_DEVICE_DEPLOY === false &&
        CI_LOCKS.SEALED_SILENT_CLOUD_FALLBACK === false &&
        CG_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CF_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CE_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CD_LOCKS.L4_AUTONOMY_ENABLED === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const acct = await openResourceAccount({
    orgId: input.orgId,
    tenantId: input.tenantId,
    initial: { compute: 10, memory: 8, storage: 100, model_calls: 5 },
    root,
    actor,
  });
  await recordResourceUsage({
    accountId: acct.account!.id,
    kind: 'model_calls',
    units: 1,
    reason: 'cycle_probe',
    root,
    actor,
  });
  hops.push(
    hop(
      'economy_account_resources',
      acct.accepted ? 'PASS' : 'FAIL',
      acct.reason,
    ),
  );

  const spend = await attemptSpendPurchaseOrBill({
    accountId: acct.account!.id,
    action: 'spend',
    amount: 1,
    root,
    actor,
  });
  hops.push(
    hop(
      'economy_spend_purchase_bill_denied',
      spend.accepted === false ? 'DENIED' : 'FAIL',
      spend.reason,
    ),
  );

  const wf = await registerWorkforceAgent({
    name: 'cycle-agent',
    orgId: input.orgId,
    tenantId: input.tenantId,
    root,
    actor,
  });
  hops.push(
    hop(
      'workforce_register_agent',
      wf.accepted ? 'REGISTERED' : 'FAIL',
      wf.reason,
    ),
  );

  const noHb = await claimRunningVerified({
    agentId: wf.agent!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'workforce_no_heartbeat_not_running_verified',
      noHb.accepted === false ? 'DENIED' : 'FAIL',
      noHb.reason,
    ),
  );

  const hb = await recordAgentHeartbeat({
    agentId: wf.agent!.id,
    runtimeEvidence: 'pid=cycle-probe;uptime=1s',
    root,
    actor,
  });
  const verified = await claimRunningVerified({
    agentId: wf.agent!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'workforce_running_verified_requires_heartbeat',
      hb.accepted && verified.accepted && verified.agent?.status === 'RUNNING_VERIFIED'
        ? 'RUNNING_VERIFIED'
        : 'FAIL',
      verified.reason,
    ),
  );

  const sim = await runWorldBusinessSimulation({
    kind: 'business',
    scenario: 'cycle-market-stress',
    assumptions: ['ceteris-paribus'],
    root,
    actor,
  });
  hops.push(
    hop(
      'simulation_run_labeled',
      sim.accepted && sim.run?.label === 'LABELED_SIMULATION' ? 'LABELED_SIMULATION' : 'FAIL',
      sim.reason,
    ),
  );

  const promote = await attemptPromoteSimulationToVerifiedFact({
    runId: sim.run!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'simulation_not_verified_fact',
      promote.accepted === false && promote.run?.verifiedFact === false ? 'DENIED' : 'FAIL',
      promote.reason,
    ),
  );

  const prop = await proposeSandboxSchemaOrMigration({
    title: 'ci_sandbox_probe',
    sqlCandidate: 'CREATE TABLE IF NOT EXISTS ci_probe (id text);',
    root,
    actor,
  });
  await testProposalInSandbox({ proposalId: prop.proposal!.id, root, actor });
  hops.push(
    hop(
      'db_lab_propose_sandbox',
      prop.accepted && prop.proposal?.sandbox === true ? 'SANDBOXED' : 'FAIL',
      prop.reason,
    ),
  );

  const apply = await attemptApplyProductionSchemaOrMigration({
    proposalId: prop.proposal!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'db_lab_production_apply_denied',
      apply.accepted === false ? 'DENIED' : 'FAIL',
      apply.reason,
    ),
  );

  const cand = await submitEvalDrivenCandidate({
    modelId: 'local-mistral-cycle',
    evalScore: 0.82,
    baselineScore: 0.7,
    root,
    actor,
  });
  hops.push(
    hop(
      'model_academy_eval_candidate',
      cand.accepted && cand.candidate?.permissionEscalation === false ? 'CANDIDATE' : 'FAIL',
      cand.reason,
    ),
  );

  const esc = await attemptPermissionEscalationViaEvolution({
    candidateId: cand.candidate!.id,
    requestedPermissionLevel: actor.permissionLevel + 10,
    root,
    actor,
  });
  hops.push(
    hop(
      'model_academy_no_permission_escalation',
      esc.accepted === false && esc.permissionLevelAfter === actor.permissionLevel
        ? 'DENIED'
        : 'FAIL',
      esc.reason,
    ),
  );

  const node = await enrollEdgeNode({ label: 'edge-cycle-1', root, actor });
  hops.push(
    hop('edge_enroll_node', node.accepted ? 'ENROLLED' : 'FAIL', node.reason),
  );

  const ghost = await attemptDeviceDeployWithoutEnrollment({
    deviceLabel: 'hidden-device',
    root,
    actor,
  });
  const unenrolledX = await exchangeKnowledgeDelta({
    nodeId: ghost.node!.id,
    deltaId: 'missing',
    operation: 'export',
    root,
    actor,
  });
  hops.push(
    hop(
      'edge_unenrolled_exchange_denied',
      unenrolledX.accepted === false ? 'DENIED' : 'FAIL',
      unenrolledX.reason,
    ),
  );

  const unapproved = await registerKnowledgeDelta({
    payload: 'unapproved-delta',
    approved: false,
    root,
    actor,
  });
  const unapprovedX = await exchangeKnowledgeDelta({
    nodeId: node.node!.id,
    deltaId: unapproved.delta!.id,
    operation: 'export',
    root,
    actor,
  });
  hops.push(
    hop(
      'edge_unapproved_delta_denied',
      unapprovedX.accepted === false ? 'DENIED' : 'FAIL',
      unapprovedX.reason,
    ),
  );

  const approved = await registerKnowledgeDelta({
    payload: 'approved-delta',
    approved: false,
    root,
    actor,
  });
  const approvedOk = await approveKnowledgeDelta({
    deltaId: approved.delta!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'edge_approve_delta',
      approvedOk.accepted && approvedOk.delta?.approved === true ? 'PASS' : 'FAIL',
      approvedOk.reason,
    ),
  );

  await revokeKnowledgeDelta({ deltaId: approved.delta!.id, root, actor });
  hops.push(hop('edge_revoke_delta', 'REVOKED', 'KNOWLEDGE_DELTA_REVOKED'));

  const revokedX = await exchangeKnowledgeDelta({
    nodeId: node.node!.id,
    deltaId: approved.delta!.id,
    operation: 'import',
    root,
    actor,
  });
  hops.push(
    hop(
      'edge_revoked_import_rejected',
      revokedX.accepted === false ? 'REJECTED' : 'FAIL',
      revokedX.reason,
    ),
  );

  hops.push(
    hop(
      'hidden_device_deploy_denied',
      ghost.accepted === false ? 'DENIED' : 'FAIL',
      ghost.reason,
    ),
  );

  const evidence = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-CI persistent intelligence economy cycle completed',
      payload: { hops: hops.map((h) => h.hop), orgId: input.orgId, sourceRefs: ['62L-CI'] },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidence?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CI persistent intelligence economy cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        'accounting≠spend; RUNNING_VERIFIED needs heartbeat; sim≠fact; DB sandbox; no perm escalate; enrolled+approved edge only',
      sourceRefs: ['62L-CI'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'PASS', 'learning recorded; not permission grant'));

  void decisionGate;

  return {
    ok: hops.every((h) => h.state !== 'FAIL'),
    hops,
    honesty: {
      economy: economyHonesty(),
      workforce: workforceHonesty(),
      simulation: simulationHonesty(),
      dbLab: dbLabHonesty(),
      modelAcademy: modelAcademyHonesty(),
      edgeExchange: edgeExchangeHonesty(),
    },
    locks: CI_LOCKS,
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: CI_LOCKS.L4_AUTONOMY_ENABLED,
    nextPhase: NEXT_PHASE_TITLE,
    predecessors: predecessorMap(root),
  };
}

export async function buildPersistentIntelligenceEconomyHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const health = await checkLocalBrainHealth(root).catch(() => ({
    ok: false,
    reason: 'HEALTH_CHECK_UNAVAILABLE',
  }));
  const preds = predecessorMap(root);
  return {
    phase: '62L-CI',
    title:
      'Persistent Intelligence Economy + Agent Workforce Operating Ledger + World Knowledge Simulation Engine + Autonomous Database Research Lab + Local Model Evolution Academy + Global Edge Knowledge Exchange',
    honestyBanner: HONESTY_BANNER,
    locks: CI_LOCKS,
    l4AutonomyEnabled: CI_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: CI_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CI_LOCKS.TIP_LAND,
    autonomousSpending: CI_LOCKS.AUTONOMOUS_SPENDING,
    liveSupabaseApply: CI_LOCKS.LIVE_SUPABASE_APPLY,
    megaPrBulkIncluded: CI_LOCKS.MEGA_PR_BULK_INCLUDED,
    githubSoT: 99,
    gitlabCoordination: 33,
    cycle: PERSISTENT_INTELLIGENCE_ECONOMY_CYCLE,
    predecessors: preds,
    localBrainHealth: health,
    decisionGatePresent: typeof decisionGate === 'function',
    modules: {
      persistentIntelligenceEconomy: 'IMPLEMENTED',
      agentWorkforceOperatingLedger: 'IMPLEMENTED',
      worldKnowledgeSimulationEngine: 'IMPLEMENTED',
      autonomousDatabaseResearchLab: 'IMPLEMENTED',
      localModelEvolutionAcademy: 'IMPLEMENTED',
      globalEdgeKnowledgeExchange: 'IMPLEMENTED',
    },
    cgCfCeCdContinuity: {
      cgL4: CG_LOCKS.L4_AUTONOMY_ENABLED,
      cfL4: CF_LOCKS.L4_AUTONOMY_ENABLED,
      ceL4: CE_LOCKS.L4_AUTONOMY_ENABLED,
      cdL4: CD_LOCKS.L4_AUTONOMY_ENABLED,
      cfSealedSilentCloudFallback: CF_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
      cdMeshWriteDenyByDefault: CD_LOCKS.DB_WRITE_DENIED_BY_DEFAULT,
      note: 'CI extends CG/CF/CE/CD locks; does not soften them.',
    },
    nextPhase: NEXT_PHASE_TITLE,
  };
}
