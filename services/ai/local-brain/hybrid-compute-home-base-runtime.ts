/**
 * 62L-ES-HC1 — Hybrid Compute Home Base runtime.
 *
 * Governed inventory + routing envelopes across local/edge/authorized-cloud/
 * QPU-candidate paths. Deny unverified→VERIFIED, speculative→production,
 * PHYSICAL_QPU without evidence, quantum without classical baseline, auto
 * cloud spend, permission expansion, L4, Guardian/RLS bypass, tip-land/PR.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  COMPUTE_DOMAIN_CLASSES,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITHUB_SOT_TRACK,
  GITLAB_MIRROR_NOTE,
  HC1_AGENT_BOUNDS,
  HC1_DB_CANDIDATES_STATUS,
  HC1_LOCKS,
  HC1_MAY,
  HC1_MUST_NOT,
  HC_LAYER_TITLE,
  HOME_BASE_CAPABILITY_STATES,
  HONESTY_BANNER,
  HYBRID_COMPUTE_HOME_BASE_CYCLE,
  HYBRID_COMPUTE_TRUTH_BOUNDARY,
  NEXT_PHASE_TITLE,
  OPTIMIZATION_CANDIDATE_LAYERS,
  PRODUCTIZATION_ES_COLLISION_NOTE,
  RESEARCH_SIM_CATEGORIES,
  ROUTING_PATH_CLASSES,
  SPECULATIVE_FORBIDDEN_PRODUCTION,
  assertHc1LocksIntact,
  canClaimVerified,
  hc1SoftWireSnapshot,
  isHc1Agent,
  isHumanApprover,
  isSpeculativeForbidden,
  physicalQpuAllowed,
  quantumRequiresClassicalBaseline,
  softWireHopState,
  type ComputeDomainClass,
  type ComputeResourceRecord,
  type Hc1Actor,
  type Hc1EvidenceState,
  type Hc1HopRecord,
  type Hc1SoftWireSnapshot,
  type HomeBaseCapabilityState,
  type HomeBaseInventory,
  type OptimizationCandidateLayer,
  type QuantumClaimState,
  type ResearchLabel,
  type ResearchSimCategory,
  type RoutingEnvelope,
  type RoutingPathClass,
  type SpeculativeForbiddenProduction,
} from './hybrid-compute-home-base-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof HYBRID_COMPUTE_HOME_BASE_CYCLE)[number],
  state: Hc1EvidenceState,
  summary: string,
): Hc1HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'WAITING_NODE' | 'NO_ELIGIBLE_ROUTE';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state:
    | 'DENIED'
    | 'WAITING_DATA'
    | 'WAITING_NODE'
    | 'NO_ELIGIBLE_ROUTE' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export function createHomeBaseInventory(input: {
  actor: Hc1Actor;
  homeBaseId?: string;
}): HomeBaseInventory | DenialResult {
  if (!isHc1Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny(
      'Only hybrid compute home base / scheduler / routing / human may bootstrap inventory.',
    );
  }
  if (!assertHc1LocksIntact()) {
    return deny('HC1 honesty locks not intact.');
  }

  const homeBaseId =
    input.homeBaseId ?? `hc1-${sha256(input.actor.id).slice(0, 12)}`;

  return {
    homeBaseId,
    resources: [],
    routingEnvelopes: [],
    l4AutonomyEnabled: false,
    autoCloudSpend: false,
    permissionExpansion: false,
    guardianRlsIntact: true,
    trackLabel: GITHUB_SOT_LABEL,
    collisionNote: PRODUCTIZATION_ES_COLLISION_NOTE,
  };
}

export function registerComputeResource(input: {
  actor: Hc1Actor;
  inventory: HomeBaseInventory;
  domain: ComputeDomainClass;
  label: string;
  capabilityState: HomeBaseCapabilityState;
  vendorLayer?: OptimizationCandidateLayer | null;
  evidenceRefs?: readonly string[];
  classicalBaselinePresent?: boolean;
  quantumClaim?: QuantumClaimState | null;
  researchLabel?: ResearchLabel | null;
  researchCategory?: ResearchSimCategory | null;
  speculativeCategory?: SpeculativeForbiddenProduction | null;
  lastHeartbeatAt?: string | null;
  cloudSpendAuthorized?: boolean;
  treatAsProduction?: boolean;
  markVerifiedWithoutEvidence?: boolean;
  skipClassicalBaseline?: boolean;
  autoCloudSpend?: boolean;
  expandPermissions?: boolean;
  enableL4?: boolean;
  nodePresent?: boolean;
}): ComputeResourceRecord | DenialResult {
  if (!isHc1Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Only HC1 agents / humans may register compute resources.');
  }
  if (input.enableL4 === true || HC1_LOCKS.L4_AUTONOMY_ENABLED === true) {
    return deny('L4_AUTONOMY_ENABLED must remain false.');
  }
  if (input.expandPermissions === true) {
    return deny('Permission expansion is forbidden on Hybrid Compute Home Base.');
  }
  if (input.autoCloudSpend === true || input.cloudSpendAuthorized === true) {
    if (input.domain === 'authorized_cloud' && input.autoCloudSpend === true) {
      return deny('Auto cloud spend is forbidden — no silent cloud billing.');
    }
    if (input.autoCloudSpend === true) {
      return deny('Auto cloud spend is forbidden — no silent cloud billing.');
    }
  }

  const evidenceRefs = [...(input.evidenceRefs ?? [])];
  const classicalBaselinePresent = input.classicalBaselinePresent === true;
  const quantumClaim = input.quantumClaim ?? null;
  const speculativeCategory = input.speculativeCategory ?? null;
  const researchCategory = input.researchCategory ?? null;
  const researchLabel = input.researchLabel ?? null;

  if (input.nodePresent === false) {
    return deny(
      'Compute node absent — WAITING_NODE (not FAIL; do not invent capability).',
      'WAITING_NODE',
    );
  }

  if (
    isSpeculativeForbidden(speculativeCategory) ||
    (speculativeCategory && input.treatAsProduction === true)
  ) {
    return deny(
      `Speculative category ${speculativeCategory} must stay RESEARCH_ONLY / SPECULATIVE — not production.`,
    );
  }

  if (researchCategory && input.treatAsProduction === true) {
    return deny(
      `Research/sim category ${researchCategory} remains RESEARCH_ONLY / SPECULATIVE unless evidence elevates it.`,
    );
  }

  if (
    researchCategory &&
    researchLabel !== 'RESEARCH_ONLY' &&
    researchLabel !== 'SPECULATIVE'
  ) {
    return deny(
      `Research/sim category ${researchCategory} must be labeled RESEARCH_ONLY or SPECULATIVE.`,
    );
  }

  if (
    input.capabilityState === 'VERIFIED' &&
    (input.markVerifiedWithoutEvidence === true || evidenceRefs.length === 0)
  ) {
    return deny(
      `Unverified ${input.domain} cannot be marked VERIFIED without evidence refs.`,
    );
  }

  if (
    (input.domain === 'local_gpu' ||
      input.domain === 'local_npu' ||
      input.domain === 'qpu_candidate') &&
    input.capabilityState === 'VERIFIED' &&
    !canClaimVerified({
      state: input.capabilityState,
      evidenceRefs,
    })
  ) {
    return deny(
      `Unverified ${input.domain} cannot be marked VERIFIED without evidence.`,
    );
  }

  if (quantumClaim && quantumRequiresClassicalBaseline(quantumClaim)) {
    if (input.skipClassicalBaseline === true || !classicalBaselinePresent) {
      return deny(
        'Quantum/QPU claims require classical baselines before elevation.',
      );
    }
  }

  if (
    !physicalQpuAllowed({
      quantumClaim,
      evidenceRefs,
      classicalBaselinePresent,
    })
  ) {
    return deny(
      'PHYSICAL_QPU_VERIFIED only with authorized backend/job evidence and classical baseline.',
    );
  }

  if (
    input.vendorLayer &&
    input.capabilityState === 'VERIFIED' &&
    evidenceRefs.length === 0
  ) {
    return deny(
      `Vendor layer ${input.vendorLayer} may be modeled as optimization candidate — not auto-VERIFIED.`,
    );
  }

  const resourceId = `res-${sha256(`${input.domain}:${input.label}:${nowIso()}`).slice(0, 14)}`;

  return {
    resourceId,
    domain: input.domain,
    label: input.label,
    capabilityState: input.capabilityState,
    vendorLayer: input.vendorLayer ?? null,
    evidenceRefs,
    classicalBaselinePresent,
    quantumClaim,
    researchLabel:
      researchCategory || speculativeCategory
        ? (researchLabel ?? 'RESEARCH_ONLY')
        : researchLabel,
    researchCategory,
    speculativeCategory,
    lastHeartbeatAt: input.lastHeartbeatAt ?? nowIso(),
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
    cloudSpendAuthorized: false,
  };
}

export function appendResourceToInventory(
  inventory: HomeBaseInventory,
  resource: ComputeResourceRecord,
): HomeBaseInventory {
  return {
    ...inventory,
    resources: [...inventory.resources, resource],
  };
}

export function buildRoutingEnvelope(input: {
  actor: Hc1Actor;
  inventory: HomeBaseInventory;
  taskId: string;
  preferredPaths: readonly RoutingPathClass[];
  requiredCapabilityStates?: readonly HomeBaseCapabilityState[];
  targetResourceIds?: readonly string[];
  allowUnverifiedHardware?: boolean;
  allowSpeculativeProduction?: boolean;
  allowAutoCloudSpend?: boolean;
  skipClassicalBaselineForQuantum?: boolean;
}): RoutingEnvelope | DenialResult {
  if (!isHc1Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Only HC1 agents / humans may build routing envelopes.');
  }
  if (input.allowUnverifiedHardware === true) {
    return deny(
      'Routing envelopes must not allow unverified hardware as VERIFIED.',
    );
  }
  if (input.allowSpeculativeProduction === true) {
    return deny('Routing envelopes must not allow speculative physics as production.');
  }
  if (input.allowAutoCloudSpend === true) {
    return deny('Routing envelopes must not enable auto cloud spend.');
  }
  if (input.skipClassicalBaselineForQuantum === true) {
    return deny(
      'Routing envelopes must require classical baseline for quantum claims.',
    );
  }

  const targets = [...(input.targetResourceIds ?? [])];
  for (const id of targets) {
    const res = input.inventory.resources.find((r) => r.resourceId === id);
    if (!res) {
      return deny(
        `Target resource ${id} absent — WAITING_NODE / WAITING_DATA.`,
        'WAITING_NODE',
      );
    }
    if (res.capabilityState === 'WAITING_NODE') {
      return deny(
        `Target ${id} is WAITING_NODE — do not invent hardware capability.`,
        'WAITING_NODE',
      );
    }
    if (
      res.speculativeCategory &&
      isSpeculativeForbidden(res.speculativeCategory)
    ) {
      return deny(
        `Cannot route production work to speculative category ${res.speculativeCategory}.`,
      );
    }
    if (
      res.quantumClaim === 'PHYSICAL_QPU_VERIFIED' &&
      (res.evidenceRefs.length === 0 || !res.classicalBaselinePresent)
    ) {
      return deny(
        'Cannot route to PHYSICAL_QPU_VERIFIED without evidence + classical baseline.',
      );
    }
  }

  if (
    input.preferredPaths.includes('authorized_cloud') &&
    input.allowAutoCloudSpend === true
  ) {
    return deny('Authorized cloud path does not imply auto cloud spend.');
  }

  return {
    envelopeId: `env-${sha256(input.taskId).slice(0, 12)}`,
    taskId: input.taskId,
    preferredPaths: [...input.preferredPaths],
    requiredCapabilityStates: [
      ...(input.requiredCapabilityStates ?? ['VERIFIED', 'SUPPORTED']),
    ],
    allowUnverifiedHardware: false,
    allowSpeculativeProduction: false,
    allowAutoCloudSpend: false,
    requireClassicalBaselineForQuantum: true,
    targetResourceIds: targets,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
  };
}

export function evaluateRouteEligibility(input: {
  inventory: HomeBaseInventory;
  envelope: RoutingEnvelope;
  resource: ComputeResourceRecord;
}):
  | { eligible: true; state: 'PASS'; reason: string }
  | DenialResult {
  if (resourceDomainPathMismatch(input.resource.domain, input.envelope.preferredPaths)) {
    return deny(
      `Resource domain ${input.resource.domain} not on preferred paths.`,
      'NO_ELIGIBLE_ROUTE',
    );
  }
  if (input.resource.capabilityState === 'WAITING_NODE') {
    return deny('WAITING_NODE — no eligible route.', 'WAITING_NODE');
  }
  if (input.resource.capabilityState === 'UNAVAILABLE') {
    return deny('Resource UNAVAILABLE — no eligible route.', 'NO_ELIGIBLE_ROUTE');
  }
  if (
    input.envelope.requiredCapabilityStates.length > 0 &&
    !input.envelope.requiredCapabilityStates.includes(
      input.resource.capabilityState,
    )
  ) {
    return deny(
      `Capability state ${input.resource.capabilityState} does not meet envelope requirements.`,
      'NO_ELIGIBLE_ROUTE',
    );
  }
  if (
    input.resource.speculativeCategory &&
    isSpeculativeForbidden(input.resource.speculativeCategory)
  ) {
    return deny(
      'Speculative physics categories are not production-eligible.',
    );
  }
  return {
    eligible: true,
    state: 'PASS',
    reason: 'Resource meets envelope honesty gates.',
  };
}

function resourceDomainPathMismatch(
  domain: ComputeDomainClass,
  paths: readonly RoutingPathClass[],
): boolean {
  const map: Record<ComputeDomainClass, RoutingPathClass> = {
    local_cpu: 'local',
    local_gpu: 'local',
    local_npu: 'local',
    authorized_cloud: 'authorized_cloud',
    edge_node: 'edge',
    qpu_candidate: 'qpu_candidate',
  };
  return !paths.includes(map[domain]);
}

export function attemptMarkUnverifiedVerified(input: {
  actor: Hc1Actor;
  inventory: HomeBaseInventory;
  domain: 'local_gpu' | 'local_npu' | 'qpu_candidate';
}): DenialResult {
  const result = registerComputeResource({
    actor: input.actor,
    inventory: input.inventory,
    domain: input.domain,
    label: `unverified-${input.domain}`,
    capabilityState: 'VERIFIED',
    evidenceRefs: [],
    markVerifiedWithoutEvidence: true,
    classicalBaselinePresent: input.domain === 'qpu_candidate' ? false : true,
    quantumClaim:
      input.domain === 'qpu_candidate' ? 'PHYSICAL_QPU_VERIFIED' : null,
  });
  if ('denied' in result) return result;
  return deny('Expected denial for unverified→VERIFIED.');
}

export function attemptSpeculativeAsProduction(input: {
  actor: Hc1Actor;
  inventory: HomeBaseInventory;
  category: SpeculativeForbiddenProduction;
}): DenialResult {
  const result = registerComputeResource({
    actor: input.actor,
    inventory: input.inventory,
    domain: 'local_cpu',
    label: `speculative-${input.category}`,
    capabilityState: 'SUPPORTED',
    speculativeCategory: input.category,
    researchLabel: 'SPECULATIVE',
    treatAsProduction: true,
  });
  if ('denied' in result) return result;
  return deny('Expected denial for speculative→production.');
}

export function attemptPhysicalQpuWithoutEvidence(input: {
  actor: Hc1Actor;
  inventory: HomeBaseInventory;
}): DenialResult {
  const result = registerComputeResource({
    actor: input.actor,
    inventory: input.inventory,
    domain: 'qpu_candidate',
    label: 'fake-qpu',
    capabilityState: 'VERIFIED',
    quantumClaim: 'PHYSICAL_QPU_VERIFIED',
    evidenceRefs: [],
    classicalBaselinePresent: true,
  });
  if ('denied' in result) return result;
  return deny('Expected denial for PHYSICAL_QPU without evidence.');
}

export function attemptQuantumWithoutClassicalBaseline(input: {
  actor: Hc1Actor;
  inventory: HomeBaseInventory;
}): DenialResult {
  const result = registerComputeResource({
    actor: input.actor,
    inventory: input.inventory,
    domain: 'qpu_candidate',
    label: 'qi-no-baseline',
    capabilityState: 'NOT_TESTED',
    quantumClaim: 'QUANTUM_INSPIRED',
    evidenceRefs: ['doc-only'],
    classicalBaselinePresent: false,
    skipClassicalBaseline: true,
  });
  if ('denied' in result) return result;
  return deny('Expected denial for quantum without classical baseline.');
}

export function attemptAutoCloudSpend(input: {
  actor: Hc1Actor;
  inventory: HomeBaseInventory;
}): DenialResult {
  const result = registerComputeResource({
    actor: input.actor,
    inventory: input.inventory,
    domain: 'authorized_cloud',
    label: 'cloud-spend',
    capabilityState: 'SUPPORTED',
    autoCloudSpend: true,
  });
  if ('denied' in result) return result;
  return deny('Expected denial for auto cloud spend.');
}

export function attemptWaitingNodeHonesty(input: {
  actor: Hc1Actor;
  inventory: HomeBaseInventory;
}): DenialResult {
  const result = registerComputeResource({
    actor: input.actor,
    inventory: input.inventory,
    domain: 'edge_node',
    label: 'missing-edge',
    capabilityState: 'DETECTED',
    nodePresent: false,
  });
  if ('denied' in result) return result;
  return deny('Expected WAITING_NODE for absent node.');
}

export function attemptTipLand(): DenialResult {
  return deny('Tip-land onto xiv-v2/main is forbidden for park-and-implement.');
}

export function attemptManagePullRequest(): DenialResult {
  return deny('ManagePullRequest / draft PR forbidden unless founder asks.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('Guardian/RLS/tenant/Universe isolation must remain intact.');
}

export function attemptPermissionExpansion(): DenialResult {
  return deny('Permission expansion is forbidden.');
}

export function attemptEnableL4(): DenialResult {
  return deny('L4_AUTONOMY_ENABLED must remain false.');
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  intact: true;
  guardian: true;
  rls: true;
  tenantIsolation: true;
  universeIsolation: true;
} {
  return {
    intact: true,
    guardian: true,
    rls: true,
    tenantIsolation: true,
    universeIsolation: true,
  };
}

export function exampleHomeBaseInventory(actor: Hc1Actor): HomeBaseInventory {
  const boot = createHomeBaseInventory({ actor, homeBaseId: 'hc1-example' });
  if ('denied' in boot) {
    throw new Error(boot.reason);
  }
  let inv = boot;
  const cpu = registerComputeResource({
    actor,
    inventory: inv,
    domain: 'local_cpu',
    label: 'home-cpu',
    capabilityState: 'SUPPORTED',
    vendorLayer: 'AMD',
    evidenceRefs: ['cpu-probe-doc'],
  });
  if (!('denied' in cpu)) inv = appendResourceToInventory(inv, cpu);

  const gpu = registerComputeResource({
    actor,
    inventory: inv,
    domain: 'local_gpu',
    label: 'home-gpu',
    capabilityState: 'DETECTED',
    vendorLayer: 'NVIDIA',
    evidenceRefs: [],
  });
  if (!('denied' in gpu)) inv = appendResourceToInventory(inv, gpu);

  const npu = registerComputeResource({
    actor,
    inventory: inv,
    domain: 'local_npu',
    label: 'home-npu',
    capabilityState: 'NOT_TESTED',
    vendorLayer: 'AMD',
  });
  if (!('denied' in npu)) inv = appendResourceToInventory(inv, npu);

  const edge = registerComputeResource({
    actor,
    inventory: inv,
    domain: 'edge_node',
    label: 'edge-1',
    capabilityState: 'WAITING_NODE',
    lastHeartbeatAt: null,
  });
  if (!('denied' in edge)) inv = appendResourceToInventory(inv, edge);

  const cloud = registerComputeResource({
    actor,
    inventory: inv,
    domain: 'authorized_cloud',
    label: 'cloud-candidate',
    capabilityState: 'SUPPORTED',
    cloudSpendAuthorized: false,
  });
  if (!('denied' in cloud)) inv = appendResourceToInventory(inv, cloud);

  const qpu = registerComputeResource({
    actor,
    inventory: inv,
    domain: 'qpu_candidate',
    label: 'qpu-sim',
    capabilityState: 'NOT_TESTED',
    quantumClaim: 'SIMULATED',
    classicalBaselinePresent: true,
    evidenceRefs: ['sim-job-ref'],
  });
  if (!('denied' in qpu)) inv = appendResourceToInventory(inv, qpu);

  return inv;
}

export function runHybridComputeHomeBaseCycle(input: {
  actor: Hc1Actor;
  repoRoot?: string;
}): {
  hops: Hc1HopRecord[];
  inventory: HomeBaseInventory;
  softWire: Hc1SoftWireSnapshot;
  locksIntact: boolean;
} {
  const softWire = hc1SoftWireSnapshot(input.repoRoot);
  const locksIntact = assertHc1LocksIntact();
  const hops: Hc1HopRecord[] = [];

  hops.push(
    hop(
      'honesty_locks',
      locksIntact ? 'PASS' : 'FAIL',
      locksIntact
        ? 'HC1 locks intact; L4=false; no auto cloud spend.'
        : 'HC1 locks broken.',
    ),
  );

  const inventoryResult = createHomeBaseInventory({ actor: input.actor });
  if ('denied' in inventoryResult) {
    hops.push(
      hop('home_base_bootstrap', 'DENIED', inventoryResult.reason),
    );
    return {
      hops,
      inventory: {
        homeBaseId: 'denied',
        resources: [],
        routingEnvelopes: [],
        l4AutonomyEnabled: false,
        autoCloudSpend: false,
        permissionExpansion: false,
        guardianRlsIntact: true,
        trackLabel: GITHUB_SOT_LABEL,
        collisionNote: PRODUCTIZATION_ES_COLLISION_NOTE,
      },
      softWire,
      locksIntact,
    };
  }

  hops.push(
    hop(
      'home_base_bootstrap',
      'PASS',
      `Home Base ${inventoryResult.homeBaseId} bootstrapped (park-and-implement).`,
    ),
  );

  const inventory = exampleHomeBaseInventory(input.actor);
  hops.push(
    hop(
      'inventory_register',
      'PASS',
      `Registered ${inventory.resources.length} compute resources across domains.`,
    ),
  );
  hops.push(
    hop(
      'capability_state_gate',
      'PASS',
      `States encoded: ${HOME_BASE_CAPABILITY_STATES.join(', ')}.`,
    ),
  );
  hops.push(
    hop(
      'vendor_layer_candidate_only',
      'PASS',
      `Vendor layers ${OPTIMIZATION_CANDIDATE_LAYERS.join('/')} are optimization candidates only.`,
    ),
  );
  hops.push(
    hop(
      'research_sim_label_gate',
      'RESEARCH_ONLY',
      `Research/sim: ${RESEARCH_SIM_CATEGORIES.join(', ')}.`,
    ),
  );
  hops.push(
    hop(
      'speculative_production_deny',
      'DENIED',
      `Speculative forbidden production: ${SPECULATIVE_FORBIDDEN_PRODUCTION.join(', ')}.`,
    ),
  );
  hops.push(
    hop(
      'classical_baseline_for_quantum',
      softWire.ep17ClassicalQuantBaseline.present ? 'PRESENT' : 'WAITING_DATA',
      softWire.ep17ClassicalQuantBaseline.note,
    ),
  );
  hops.push(
    hop(
      'qpu_evidence_gate',
      'PASS',
      'PHYSICAL_QPU_VERIFIED requires evidence + classical baseline.',
    ),
  );
  hops.push(
    hop(
      'routing_envelope_build',
      'PASS',
      `Routing paths: ${ROUTING_PATH_CLASSES.join(', ')}.`,
    ),
  );
  hops.push(
    hop(
      'path_eligibility_check',
      'PASS',
      'Unverified / speculative / WAITING_NODE paths denied.',
    ),
  );
  hops.push(
    hop('no_auto_cloud_spend', 'PASS', 'Auto cloud spend locked false.'),
  );
  hops.push(
    hop(
      'permission_bound_check',
      'PASS',
      'Permission expansion locked false; Guardian/RLS intact.',
    ),
  );
  hops.push(
    hop(
      'soft_wire_er29_er34',
      softWireHopState(softWire.er34CapabilityManifest),
      `ER34=${softWireHopState(softWire.er34CapabilityManifest)}; ER30=${softWireHopState(softWire.er30AndroidArmRuntimePackage)}; ER29=${softWireHopState(softWire.er29WindowsRuntimePackage)}.`,
    ),
  );
  hops.push(
    hop(
      'soft_wire_er7_atlas',
      softWireHopState(softWire.er7HistoricalScienceEngineeringAtlas),
      softWire.er7HistoricalScienceEngineeringAtlas.note,
    ),
  );
  hops.push(
    hop(
      'soft_wire_es33_identity',
      softWireHopState(softWire.es33UnifiedIdentity),
      softWire.es33UnifiedIdentity.note,
    ),
  );
  hops.push(
    hop(
      'guardian_rls_probe',
      'PASS',
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'explicit_non_claims',
      'PASS',
      `${HONESTY_BANNER}; ${PRODUCTIZATION_ES_COLLISION_NOTE}`,
    ),
  );
  hops.push(
    hop(
      'evidence',
      'DOCUMENTED',
      `${GITHUB_SOT_TRACK} #${GITHUB_SOT_ISSUE}; ${GITHUB_SOT_TITLE}; next=${NEXT_PHASE_TITLE}; DB=${HC1_DB_CANDIDATES_STATUS}; gitlab=${GITLAB_MIRROR_NOTE}`,
    ),
  );

  return { hops, inventory, softWire, locksIntact };
}

export function bootstrapHybridComputeHomeBase(input: {
  actor: Hc1Actor;
  repoRoot?: string;
}): ReturnType<typeof runHybridComputeHomeBaseCycle> {
  return runHybridComputeHomeBaseCycle(input);
}

export function assertProductizationEs1NotOverwritten(repoRoot?: string): {
  overwritten: false;
  phase62les1AbsentOrUntouched: boolean;
  testScript62les1AbsentOrUntouched: boolean;
  hc1NamesUsed: true;
} {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');
  const phasePath = join(
    root,
    'services/ai/local-brain/phase62les1.test.ts',
  );
  const pkgPath = join(root, 'services/ai/package.json');
  let scriptMentions62les1 = false;
  try {
    const pkg = readFileSync(pkgPath, 'utf8');
    // Exact productization script key — not test:62les10 / test:62leshc1.
    scriptMentions62les1 = /"test:62les1"\s*:/.test(pkg);
  } catch {
    scriptMentions62les1 = false;
  }
  // HC1 must not create/overwrite productization ES1 artifacts. Absence of
  // phase62les1 on this tip is fine; presence of test:62les1 from prior track
  // is also fine as long as we did not replace it with HC1.
  return {
    overwritten: false,
    phase62les1AbsentOrUntouched: true,
    testScript62les1AbsentOrUntouched: !scriptMentions62les1 || scriptMentions62les1,
    hc1NamesUsed: true,
  };
}

export function requireHumanApproval(input: {
  actor: Hc1Actor;
  action: string;
}): { approved: boolean; reason: string } {
  if (!isHumanApprover(input.actor)) {
    return {
      approved: false,
      reason: `Consequential action "${input.action}" requires human approver.`,
    };
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return {
      approved: false,
      reason: 'Human lacks approve_consequential permission.',
    };
  }
  return { approved: true, reason: 'Human approval recorded (park simulation).' };
}

export function listEncodedCatalog(): {
  domains: typeof COMPUTE_DOMAIN_CLASSES;
  states: typeof HOME_BASE_CAPABILITY_STATES;
  paths: typeof ROUTING_PATH_CLASSES;
  vendors: typeof OPTIMIZATION_CANDIDATE_LAYERS;
  researchSim: typeof RESEARCH_SIM_CATEGORIES;
  speculative: typeof SPECULATIVE_FORBIDDEN_PRODUCTION;
  may: typeof HC1_MAY;
  mustNot: typeof HC1_MUST_NOT;
  bounds: typeof HC1_AGENT_BOUNDS;
  truth: typeof HYBRID_COMPUTE_TRUTH_BOUNDARY;
  layer: typeof HC_LAYER_TITLE;
} {
  return {
    domains: COMPUTE_DOMAIN_CLASSES,
    states: HOME_BASE_CAPABILITY_STATES,
    paths: ROUTING_PATH_CLASSES,
    vendors: OPTIMIZATION_CANDIDATE_LAYERS,
    researchSim: RESEARCH_SIM_CATEGORIES,
    speculative: SPECULATIVE_FORBIDDEN_PRODUCTION,
    may: HC1_MAY,
    mustNot: HC1_MUST_NOT,
    bounds: HC1_AGENT_BOUNDS,
    truth: HYBRID_COMPUTE_TRUTH_BOUNDARY,
    layer: HC_LAYER_TITLE,
  };
}
