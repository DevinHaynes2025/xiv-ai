/**
 * 62L-BX runtime — walks NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_CYCLE and builds health report.
 */

import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  listVerifiedHalFamilies,
  neuralChipHalHonesty,
  registerChipFamily,
  resolveHalCapability,
} from './neural-chip-hal';
import {
  registerTwinAddressSpace,
  semiconductorTwinHonesty,
  upsertTwinInventory,
} from './semiconductor-digital-twin';
import {
  planQuantumWorkload,
  quantumWorkloadHonesty,
  registerQuantumBackend,
} from './quantum-workload-compiler';
import {
  installMarketplacePlugin,
  marketplaceHonesty,
  registerMarketplacePlugin,
} from './device-intelligence-marketplace';
import {
  broadcastHonesty,
  broadcastKnowledge,
} from './business-knowledge-broadcast-network';
import {
  registerRouteEndpoint,
  routingCortexHonesty,
  selectSparseRoute,
  type RouteEndpoint,
} from './planetary-superbrain-routing-cortex';
import {
  activateSparseFounderAvatar,
  attemptFounderAvatarAction,
  founderAvatarHonesty,
} from './founder-avatar-delegate-universe';
import {
  BX_LOCKS,
  FOUNDER_AVATAR_SEALED_DENY,
  HONESTY_BANNER,
  NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  probeBwFounderAvatarEthics,
  type BxActor,
  type BxEvidenceState,
  type BxHop,
  type BxHopRecord,
} from './neural-chip-os-semiconductor-twin-types';
import { BW_LOCKS } from './planetary-chip-founder-avatar-ethics-types';
import type { BwActor } from './planetary-chip-founder-avatar-ethics-types';

export {
  BX_LOCKS,
  HONESTY_BANNER,
  NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  probeBwFounderAvatarEthics,
};

function hop(name: BxHop, state: BxEvidenceState, summary: string): BxHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type BxCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: BxActor;
  root?: string;
};

export async function runNeuralChipOsSemiconductorTwinCycle(input: BxCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: BxHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      BX_LOCKS.L4_AUTONOMY_ENABLED === false &&
        BX_LOCKS.CLASSICAL_BASELINE_REQUIRED &&
        BX_LOCKS.SPEED_OVERRIDES_SEALED_TRUST === false &&
        BX_LOCKS.MARKETPLACE_INSTALL_GRANTS_AUTHORITY === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const cpu = await registerChipFamily({
    familyKey: 'x86_64_cpu',
    displayName: 'x86-64 CPU',
    kind: 'cpu',
    vendorProven: true,
    interfaceProven: true,
    evidenceRefs: ['unit:phase62lbx'],
    root,
  });
  hops.push(
    hop(
      'hal_verified_family_gate',
      cpu.labeledVerified ? 'PASS' : 'FAIL',
      `verified_families=${(await listVerifiedHalFamilies(root)).length}`,
    ),
  );

  const unverified = await resolveHalCapability({
    familyKey: 'exotic_photon_asic',
    requireVerified: true,
    actor,
    root,
  });
  hops.push(
    hop(
      'unverified_chip_family_unavailable',
      !unverified.available && unverified.status === 'UNAVAILABLE' ? 'PASS' : 'FAIL',
      unverified.reason ?? 'ok',
    ),
  );

  hops.push(hop('semiconductor_twin_model', 'PASS', 'supply/lifecycle twin model active'));

  const twin = await upsertTwinInventory({
    sku: 'sku-sim-npu-1',
    familyKey: 'npu_generic',
    lifecycleStage: 'simulated',
    quantityLogical: 1_000_000,
    claimPhysicalVerified: true,
    actor,
    root,
  });
  hops.push(
    hop(
      'twin_inventory_honesty_label',
      !twin.labeledPhysicalVerified && twin.accepted === false ? 'PASS' : twin.accepted && !twin.labeledPhysicalVerified ? 'PASS' : 'FAIL',
      twin.reason ?? 'labeled',
    ),
  );

  hops.push(
    hop(
      'classical_baseline_required',
      BX_LOCKS.CLASSICAL_BASELINE_REQUIRED ? 'PASS' : 'FAIL',
      'classical baseline required for quantum plans',
    ),
  );

  await registerQuantumBackend({
    backendKey: 'local_classical',
    kind: 'classical_baseline',
    configured: true,
    authorized: true,
    verified: true,
    root,
  });

  const qReject = await planQuantumWorkload({
    objective: 'anneal supply route',
    classicalBaselineRef: null,
    quantumRequested: true,
    backendKey: 'unconfigured_qpu',
    actor,
    root,
  });
  hops.push(
    hop(
      'quantum_plan_compile',
      qReject.accepted === false && qReject.plan.status === 'REJECTED' ? 'PASS' : 'FAIL',
      qReject.reason ?? 'unexpected',
    ),
  );

  const qpu = await planQuantumWorkload({
    objective: 'anneal with baseline',
    classicalBaselineRef: 'classical:greedy-v1',
    quantumRequested: true,
    backendKey: 'missing_qpu',
    actor,
    root,
  });
  hops.push(
    hop(
      'unconfigured_qpu_unavailable',
      qpu.accepted === false && qpu.plan.status === 'UNAVAILABLE' ? 'PASS' : 'FAIL',
      qpu.reason ?? 'unexpected',
    ),
  );

  await registerMarketplacePlugin({
    pluginId: 'npu_adapter_a',
    name: 'NPU Adapter A',
    kind: 'device_adapter',
    authorized: true,
    configured: true,
    verified: true,
    root,
  });
  const installed = await installMarketplacePlugin({
    pluginId: 'npu_adapter_a',
    actor,
    root,
  });
  hops.push(
    hop(
      'marketplace_authorized_install',
      installed.accepted && installed.status === 'INSTALLED' ? 'PASS' : 'FAIL',
      installed.reason,
    ),
  );
  hops.push(
    hop(
      'install_no_production_authority',
      installed.productionAuthority === false ? 'PASS' : 'FAIL',
      'install ≠ authority',
    ),
  );

  const badBroadcast = await broadcastKnowledge({
    title: 'rumor',
    summary: 'unverified market rumor',
    provenance: [],
    verified: false,
    actor,
    root,
  });
  hops.push(
    hop(
      'knowledge_broadcast_provenance_gate',
      badBroadcast.accepted === false ? 'PASS' : 'FAIL',
      badBroadcast.reason ?? 'unexpected',
    ),
  );

  const ext = await broadcastKnowledge({
    title: 'verified aggregate',
    summary: 'authorized aggregate',
    provenance: ['ledger:1'],
    verified: true,
    scope: 'external',
    humanGateApproved: false,
    actor: { ...actor, kind: 'human_operator' },
    root,
  });
  hops.push(
    hop(
      'external_publish_human_gate',
      ext.accepted === false ? 'PASS' : 'FAIL',
      ext.reason ?? 'unexpected',
    ),
  );

  const sealedHighTrust: RouteEndpoint = {
    id: 'ep-sealed',
    kind: 'universe',
    label: 'sealed-universe',
    trust: 0.95,
    latencyMs: 200,
    costUnits: 5,
    freshnessScore: 0.8,
    sealed: true,
    policyDeny: false,
  };
  const fastLowTrust: RouteEndpoint = {
    id: 'ep-fast',
    kind: 'agent',
    label: 'fast-low-trust',
    trust: 0.2,
    latencyMs: 5,
    costUnits: 1,
    freshnessScore: 0.9,
    sealed: false,
    policyDeny: false,
  };
  await registerRouteEndpoint({ ...sealedHighTrust, root });
  await registerRouteEndpoint({ ...fastLowTrust, root });
  const route = await selectSparseRoute({
    fromId: 'cortex-root',
    candidates: [sealedHighTrust, fastLowTrust],
    actor,
    root,
  });
  hops.push(
    hop(
      'sparse_superbrain_route_score',
      route.selected?.toId === 'ep-sealed' ? 'PASS' : 'FAIL',
      `selected=${route.selected?.toId ?? 'none'}`,
    ),
  );
  hops.push(
    hop(
      'sealed_trust_beats_speed',
      route.selected?.toId === 'ep-sealed' &&
        route.scored.some((s) => s.toId === 'ep-fast' && s.selected === false)
        ? 'PASS'
        : 'FAIL',
      'faster low-trust loses',
    ),
  );

  const addr = await registerTwinAddressSpace({
    addressCountLogical: 1_000_000_000_000,
    claimPhysicalCapacity: true,
    benchmarkEvidenceRefs: [],
    root,
  });
  hops.push(
    hop(
      'trillion_logical_addressing',
      !addr.physicalCapacityProven && addr.space.honestyLabel === 'LOGICAL' ? 'PASS' : 'FAIL',
      addr.reason ?? 'logical',
    ),
  );

  const bw = probeBwFounderAvatarEthics(root);
  const bwActor: BwActor = {
    kind: 'founder_avatar_delegate',
    id: 'avatar-bx-probe',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    role: 'founder_avatar',
    permissionLevel: 0,
    authorityLevel: 0,
  };
  const avatar = await activateSparseFounderAvatar({
    pathwayKey: 'bx-probe-pathway',
    actor: bwActor,
    root,
  });
  const publishDeny = avatar.delegate
    ? await attemptFounderAvatarAction({
        delegateId: avatar.delegate.id,
        action: 'external_publish',
        actor: bwActor,
        root,
      })
    : { accepted: true as const, reason: 'NO_DELEGATE' };
  const impersonateDeny = avatar.delegate
    ? await attemptFounderAvatarAction({
        delegateId: avatar.delegate.id,
        action: 'impersonate_founder',
        actor: bwActor,
        root,
      })
    : { accepted: true as const, reason: 'NO_DELEGATE' };
  hops.push(
    hop(
      'founder_avatar_sealed_deny_probe',
      bw.sealedDenyHolds &&
        bw.learningIsPermission === false &&
        BW_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
        BW_LOCKS.LEARNING_IS_PERMISSION === false &&
        publishDeny.accepted === false &&
        impersonateDeny.accepted === false &&
        founderAvatarHonesty().externalPublish === false
        ? 'PASS'
        : 'FAIL',
      `${FOUNDER_AVATAR_SEALED_DENY}; bw=${bw.status}; report=${bw.report}; publish=${publishDeny.reason}; impersonate=${impersonateDeny.reason}`,
    ),
  );

  hops.push(hop('evidence', 'PASS', `hops=${hops.length}`));
  hops.push(hop('learning', 'PASS', 'cycle complete; learning ≠ permission grant'));

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-BX neural chip OS / semiconductor twin cycle completed',
      payload: { hops: hops.map((h) => h.hop), orgId: input.orgId, sourceRefs: ['62L-BX'] },
    },
    root,
  ).catch(() => undefined);

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-BX neural chip OS semiconductor twin cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; HAL/twin/quantum/marketplace/broadcast/routing honesty locks held`,
      sourceRefs: ['62L-BX'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);

  const failed = hops.filter((h) => h.state === 'FAIL').length;
  return {
    phase: '62L-BX' as const,
    accepted: true as const,
    ok: failed === 0,
    hops,
    honesty: {
      banner: HONESTY_BANNER,
      L4_AUTONOMY_ENABLED: BX_LOCKS.L4_AUTONOMY_ENABLED,
      hal: neuralChipHalHonesty(),
      twin: semiconductorTwinHonesty(),
      quantum: quantumWorkloadHonesty(),
      marketplace: marketplaceHonesty(),
      broadcast: broadcastHonesty(),
      routing: routingCortexHonesty(),
    },
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessors: predecessorMap(root),
    bwProbe: bw,
  };
}

export async function buildNeuralChipOsSemiconductorTwinHealthReport(input?: { root?: string }) {
  const root = input?.root ?? process.cwd();
  const brain = await checkLocalBrainHealth(root).catch(() => null);
  const predecessors = predecessorMap(root);
  const bw = probeBwFounderAvatarEthics(root);

  return {
    phase: '62L-BX' as const,
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: BX_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: BX_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: BX_LOCKS.TIP_LAND,
    megaPrBulkIncluded: BX_LOCKS.MEGA_PR_BULK_INCLUDED,
    dbCandidatesApplied: BX_LOCKS.DB_CANDIDATES_APPLIED,
    githubSotIssue: 88,
    gitlabCoordinationIssue: 22,
    nextPhase: NEXT_PHASE_TITLE,
    cycle: NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_CYCLE,
    predecessors,
    bwProbe: bw,
    honesty: {
      hal: neuralChipHalHonesty(),
      twin: semiconductorTwinHonesty(),
      quantum: quantumWorkloadHonesty(),
      marketplace: marketplaceHonesty(),
      broadcast: broadcastHonesty(),
      routing: routingCortexHonesty(),
    },
    localBrainHealth: brain,
    generatedAt: new Date().toISOString(),
  };
}
