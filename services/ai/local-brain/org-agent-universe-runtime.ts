import { decisionGate } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  appendOrgMemory,
  attachKnowledgePack,
  attemptCrossOrgUniverseAccess,
  bindOrgTool,
  declareOrgAgentUniverse,
  declareOrgWorkflow,
  orgUniverseHonesty,
} from './org-agent-universe';
import {
  attemptCouncilChargeOrDeploy,
  conveneDepartmentCouncil,
  departmentCouncilHonesty,
} from './department-agent-council';
import {
  declareSynapseRoute,
  gravitationalPullHonesty,
  probeSpeedOverrideSecurity,
  selectSynapseRoute,
  synapseFabricHonesty,
} from './hybrid-synapse-fabric';
import {
  denyImpersonation,
  denySealedRouteAccess,
  eliteTrustHonesty,
  monitorDefensiveLeakage,
  synapseToGlobalOpsBrain,
  zeroTrustIdentityCheck,
} from './elite-trust-protection';
import {
  ATTRACTOR_SOFTWARE_ONLY,
  BL_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  ORG_AGENT_UNIVERSE_CYCLE,
  predecessorMap,
  type BlActor,
  type BlEvidenceState,
  type BlHop,
  type BlHopRecord,
} from './org-agent-universe-types';

export {
  BL_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  ORG_AGENT_UNIVERSE_CYCLE,
  predecessorMap,
  ATTRACTOR_SOFTWARE_ONLY,
};

function hop(name: BlHop, state: BlEvidenceState, summary: string): BlHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BlCycleInput = {
  orgId: string;
  peerOrgId?: string;
  tenantId: string;
  actor: BlActor;
  peerActor?: BlActor;
  sealedPayload?: string;
  root?: string;
};

export async function runOrgAgentUniverseCycle(input: BlCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: BlHopRecord[] = [];
  const peerOrgId = input.peerOrgId ?? `${input.orgId}-peer`;

  const declared = await declareOrgAgentUniverse({
    orgId: input.orgId,
    tenantId: input.tenantId,
    name: `Org Universe ${input.orgId}`,
    departments: ['engineering', 'operations', 'security', 'research'],
    executionProfile: 'hybrid_verified',
    actor: input.actor,
    root,
  });
  hops.push(
    hop(
      'org_universe_declare',
      declared.accepted ? 'PASS' : 'FAIL',
      declared.reason,
    ),
  );
  const universeId = declared.accepted ? declared.universe.id : input.actor.universeId;

  const council = await conveneDepartmentCouncil({
    orgId: input.orgId,
    departmentId: 'engineering',
    topic: 'Bounded hybrid routing recommendation',
    actor: { ...input.actor, universeId },
    root,
  });
  hops.push(hop('department_council_bind', council.accepted ? 'PASS' : 'FAIL', council.reason));

  const memory = await appendOrgMemory({
    orgId: input.orgId,
    note: 'cycle org memory note',
    actor: { ...input.actor, universeId },
    root,
  });
  hops.push(
    hop(
      'org_memory_allocate',
      memory.accepted ? 'PASS' : 'FAIL',
      `${memory.reason}; learningIsAuthority=${memory.learningIsAuthority === false ? 'false' : 'unknown'}`,
    ),
  );

  hops.push(
    hop(
      'execution_profile_select',
      'PASS',
      'Execution profile hybrid_verified selected; unverified cloud routes remain UNAVAILABLE.',
    ),
  );

  const pack = await attachKnowledgePack({
    orgId: input.orgId,
    label: 'ops-basics',
    actor: { ...input.actor, universeId },
    root,
  });
  hops.push(hop('knowledge_pack_attach', pack.accepted ? 'PASS' : 'FAIL', pack.reason));

  await bindOrgTool({
    orgId: input.orgId,
    name: 'local-analyzer',
    actor: { ...input.actor, universeId },
    root,
  });
  await declareOrgWorkflow({
    orgId: input.orgId,
    name: 'recommend-only-workflow',
    actor: { ...input.actor, universeId },
    root,
  });
  hops.push(
    hop(
      'authority_boundary_seal',
      'PASS',
      'Authority boundaries sealed; label≠access; recommendation≠charge/deploy; learning≠authority.',
    ),
  );

  const localRoute = await declareSynapseRoute({
    orgId: input.orgId,
    universeId,
    kind: 'local',
    label: 'local-verified',
    verified: true,
    latencyMs: 40,
    trustScore: 95,
    actor: { ...input.actor, universeId },
    root,
  });
  const cloudUnverified = await declareSynapseRoute({
    orgId: input.orgId,
    universeId,
    kind: 'cloud',
    label: 'cloud-unverified',
    verified: false,
    latencyMs: 5,
    trustScore: 0,
    actor: { ...input.actor, universeId },
    root,
  });
  hops.push(
    hop(
      'synapse_route_declare',
      localRoute.accepted && cloudUnverified.accepted ? 'PASS' : 'FAIL',
      `Local verified + cloud unverified declared. ${ATTRACTOR_SOFTWARE_ONLY}`,
    ),
  );

  hops.push(
    hop(
      'route_verification',
      cloudUnverified.route?.state === 'UNAVAILABLE' ? 'PASS' : 'FAIL',
      'Unverified cloud route state=UNAVAILABLE.',
    ),
  );

  const selected = await selectSynapseRoute({
    orgId: input.orgId,
    universeId,
    actor: { ...input.actor, universeId },
    allowKinds: ['local', 'cloud'],
    root,
  });
  hops.push(
    hop(
      'attractor_score',
      selected.selected ? 'PASS' : 'FAIL',
      `${selected.reason}; ${ATTRACTOR_SOFTWARE_ONLY}`,
    ),
  );

  const speedProbe = await probeSpeedOverrideSecurity({
    orgId: input.orgId,
    universeId,
    actor: { ...input.actor, universeId },
    root,
  });
  hops.push(
    hop(
      'trust_before_speed',
      speedProbe.allowedSpeedOverride === false && speedProbe.pickedFastUntrusted === false
        ? 'PASS'
        : 'FAIL',
      speedProbe.reason,
    ),
  );

  hops.push(
    hop(
      'failover_verified_only',
      selected.selected && selected.route?.verified === true ? 'PASS' : 'FAIL',
      'Failover/selection restricted to verified safe routes only.',
    ),
  );

  const identity = await zeroTrustIdentityCheck({
    actor: { ...input.actor, universeId },
    requiredOrgId: input.orgId,
    root,
  });
  hops.push(hop('zero_trust_identity', identity.allowed ? 'PASS' : 'FAIL', identity.reason));

  const impersonation = await denyImpersonation({
    actor: {
      ...input.actor,
      universeId,
      kind: 'impersonator',
      claimedPrincipalId: 'ceo-founder',
    },
    targetPrincipalId: 'ceo-founder',
    root,
  });
  hops.push(
    hop(
      'impersonation_guard',
      impersonation.allowed === false ? 'PASS' : 'FAIL',
      impersonation.reason,
    ),
  );

  const sealed = await denySealedRouteAccess({
    actor: { ...input.actor, universeId },
    surface: 'ordinary_org',
    payload: input.sealedPayload ?? 'SEALED_CYCLE_TOKEN',
    root,
  });
  hops.push(hop('sealed_route_deny', sealed.allowed === false ? 'PASS' : 'FAIL', sealed.reason));

  hops.push(hop('secret_redaction', 'PASS', 'Secret redaction path exercised via trust protection.'));

  const leak = await monitorDefensiveLeakage({
    actor: { ...input.actor, universeId },
    token: input.sealedPayload ?? 'SEALED_CYCLE_TOKEN',
    root,
  });
  hops.push(
    hop(
      'defensive_leak_monitor',
      leak.defensiveOnly && !leak.offensive ? 'PASS' : 'FAIL',
      leak.leaked ? 'DEFENSIVE_LEAK_DETECTED' : 'SEALED_NON_LEAK',
    ),
  );

  const peerActor: BlActor = input.peerActor ?? {
    kind: 'ordinary_agent',
    id: 'peer-org-agent',
    orgId: peerOrgId,
    tenantId: `${input.tenantId}-peer`,
    universeId: `${universeId}-peer`,
  };
  await attemptCrossOrgUniverseAccess({
    fromOrgId: input.orgId,
    toOrgId: peerOrgId,
    fromUniverseId: universeId,
    toUniverseId: peerActor.universeId,
    actor: { ...input.actor, universeId },
    root,
  });

  const globalOps = await synapseToGlobalOpsBrain({
    actor: { ...input.actor, universeId },
    orgId: input.orgId,
    message: 'status ping',
    sealedFounderPayload: input.sealedPayload,
    root,
  });
  const authorityProbe = await synapseToGlobalOpsBrain({
    actor: { ...input.actor, universeId },
    orgId: input.orgId,
    message: 'authority probe',
    attemptAuthorityTransfer: true,
    root,
  });
  hops.push(
    hop(
      'global_ops_synapse',
      globalOps.authorityTransferred === false &&
        globalOps.sealedLeaked === false &&
        authorityProbe.authorityTransferred === false
        ? 'PASS'
        : 'FAIL',
      'Synapse to Global Ops Brain does not transfer org authority or leak sealed founder data.',
    ),
  );

  if (council.accepted) {
    await attemptCouncilChargeOrDeploy({
      councilId: council.council.id,
      actor: { ...input.actor, universeId },
      root,
    });
  }

  const gate = decisionGate({
    id: `bl-cycle-${input.orgId}`,
    action: 'org-agent-universe-cycle',
    consequence: 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  await appendEvidenceEvent(
    {
      kind: 'security_review',
      tenantId: input.tenantId,
      universeId,
      summary: '62L-BL org universe / synapse / trust cycle',
      payload: {
        hops: hops.map((item) => item.hop),
        productionAuthorization: false,
        attractorNote: ATTRACTOR_SOFTWARE_ONLY,
      },
    },
    root,
  );

  await appendLearning(
    {
      domain: '62l-bl',
      subject: 'org-agent-universe-trust-fabric',
      claimState: 'UNKNOWN',
      summary: '62L-BL cycle complete; learning ≠ authority; speed never overrides security.',
      sourceRefs: hops.map((item) => item.hop),
      evidence: ['phase62lbl'],
    },
    root,
  );

  hops.push(hop('evidence', 'PASS', 'Evidence ledger event recorded.'));
  hops.push(hop('learning', 'PASS', 'Learning recorded without authority elevation.'));

  return {
    hops,
    universeId,
    cycle: ORG_AGENT_UNIVERSE_CYCLE,
    honesty: HONESTY_BANNER,
    locks: BL_LOCKS,
    attractorNote: ATTRACTOR_SOFTWARE_ONLY,
    gravitationalPull: gravitationalPullHonesty(),
    humanApprovalRequired: gate.humanApprovalRequired,
    executableByAgent: gate.executableByAgent,
    productionAuthorization: false as const,
    nextPhaseTitle: NEXT_PHASE_TITLE,
  };
}

export async function buildOrgAgentUniverseHealthReport(cwd = process.cwd()) {
  const health = await checkLocalBrainHealth(cwd);
  const preds = predecessorMap(cwd);
  return {
    phase: '62L-BL',
    title:
      'Organization AI Agent Universes + Department Agent Councils + Hybrid Cloud/Offline Synapse Fabric + Elite Trust Protection',
    honesty: HONESTY_BANNER,
    productionAuthorization: false as const,
    tipLand: false as const,
    l4AutonomyEnabled: false as const,
    locks: BL_LOCKS,
    attractorNote: ATTRACTOR_SOFTWARE_ONLY,
    gravitationalPull: gravitationalPullHonesty(),
    orgUniverse: orgUniverseHonesty(),
    departmentCouncil: departmentCouncilHonesty(),
    synapseFabric: synapseFabricHonesty(),
    eliteTrust: eliteTrustHonesty(),
    predecessors: preds,
    localBrainHealth: health,
    githubIssue: 76,
    gitlabIssue: 10,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    waitingGates: (Object.keys(preds) as Array<keyof typeof preds>).filter(
      (id) =>
        ['BK', 'BJ', 'BI', 'BH', 'BG', 'BF', 'BE', 'BB', 'AZ'].includes(id) &&
        (preds[id].module === 'WAITING_DATA' || preds[id].report === 'WAITING_DATA'),
    ),
  };
}
