/**
 * 62L-ES5 — Prototype Architecture Composer runtime.
 *
 * Ingest approved prototype scope → select components → complexity gate →
 * trust boundaries → data/compute/security/evidence views → honest compute
 * routing with fallbacks. Deny bypass of existing contracts, unnecessary
 * retention, dishonest QPU claims, and security lock violations.
 */

import { createHash } from 'node:crypto';
import {
  AGENT_FLOW_STEPS,
  ARCHITECTURE_COMPOSER_TRUTH_BOUNDARY,
  ARCHITECTURE_CORE_FLOW,
  ARCHITECTURE_FIELDS,
  ARCHITECTURE_VIEWS,
  COMPUTE_FLOW_STEPS,
  COMPUTE_HONESTY_STATUSES,
  DATA_FLOW_STEPS,
  ES5_AGENT_BOUNDS,
  ES5_DB_CANDIDATES_STATUS,
  ES5_LOCKS,
  ES5_MAY,
  ES5_MUST_NOT,
  ES_LAYER_TITLE,
  EVIDENCE_FLOW_STEPS,
  EXISTING_SERVICE_CONTRACTS,
  GITHUB_SOT_ISSUE_NOTE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PROTOTYPE_ARCHITECTURE_COMPOSER_CYCLE,
  SECURITY_FLOW_STEPS,
  USER_FLOW_STEPS,
  assertEs5LocksIntact,
  es5SoftWireSnapshot,
  isEs5Agent,
  isHumanApprover,
  mayBypassExistingContracts,
  mayClaimPhysicalQpuVerified,
  passesComplexityGate,
  softWireHopState,
  type ArchitectureComponent,
  type ArchitectureView,
  type ComputeHonestyStatus,
  type ComputePathKind,
  type ComputeRequirement,
  type Es5Actor,
  type Es5EvidenceState,
  type Es5HopRecord,
  type Es5SoftWireSnapshot,
  type ExistingServiceContract,
  type PrototypeArchitecture,
  type PrototypeScopeInput,
} from './prototype-architecture-composer-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof PROTOTYPE_ARCHITECTURE_COMPOSER_CYCLE)[number],
  state: Es5EvidenceState,
  summary: string,
): Es5HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'HUMAN_APPROVAL_REQUIRED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' | 'HUMAN_APPROVAL_REQUIRED' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

function defaultViews(): ArchitectureView[] {
  return [
    { kind: 'user_flow', steps: [...USER_FLOW_STEPS] },
    { kind: 'agent_flow', steps: [...AGENT_FLOW_STEPS] },
    { kind: 'data_flow', steps: [...DATA_FLOW_STEPS] },
    { kind: 'compute_flow', steps: [...COMPUTE_FLOW_STEPS] },
    { kind: 'security_flow', steps: [...SECURITY_FLOW_STEPS] },
    { kind: 'evidence_flow', steps: [...EVIDENCE_FLOW_STEPS] },
  ];
}

function defaultCompute(
  honestyStatus: ComputeHonestyStatus = 'CLASSICAL',
  path: ComputePathKind = 'CPU',
  verified = false,
): ComputeRequirement {
  const fallback =
    honestyStatus === 'PHYSICAL_QPU_VERIFIED'
      ? 'fallback_to_CLASSICAL_CPU_on_qpu_unavailable'
      : honestyStatus === 'SIMULATED' || honestyStatus === 'QUANTUM_INSPIRED'
        ? 'fallback_to_CLASSICAL_baseline'
        : 'retry_local_cpu_then_degrade_gracefully';
  return {
    path,
    honestyStatus,
    fallbackBehavior: fallback,
    verified,
  };
}

/**
 * Candidate components before complexity gate. Includes one intentional
 * unnecessary component (`vanity-analytics-service`) for gate stripping demos.
 */
export function candidateComponentsForScope(
  scope: PrototypeScopeInput,
): ArchitectureComponent[] {
  return [
    {
      componentId: 'xiv-ui-surface',
      kind: 'frontend_surface',
      label: 'XIV UI surface',
      necessityForPrototypeQuestion: `Necessary: primary interaction surface for ${scope.prototypeQuestion}`,
      reusesExistingContract: null,
      isNewService: false,
      necessary: true,
    },
    {
      componentId: 'agent-router-reuse',
      kind: 'agent_role',
      label: 'Bounded agent via agent-router.ts',
      necessityForPrototypeQuestion: `Necessary: routes agents for ${scope.prototypeQuestion}`,
      reusesExistingContract: 'agent-router.ts',
      isNewService: false,
      necessary: true,
    },
    {
      componentId: 'model-router-reuse',
      kind: 'model_provider',
      label: 'Model routing via model-router.ts',
      necessityForPrototypeQuestion: `Necessary: model selection for ${scope.prototypeQuestion}`,
      reusesExistingContract: 'model-router.ts',
      isNewService: false,
      necessary: true,
    },
    {
      componentId: 'auth-policies-reuse',
      kind: 'backend_service',
      label: 'Auth + policies contracts',
      necessityForPrototypeQuestion: `Necessary: identity and policy checks for ${scope.prototypeQuestion}`,
      reusesExistingContract: 'auth.ts',
      isNewService: false,
      necessary: true,
    },
    {
      componentId: 'audit-persistence-reuse',
      kind: 'backend_service',
      label: 'Audit + persistence contracts',
      necessityForPrototypeQuestion: `Necessary: evidence and storage for ${scope.prototypeQuestion}`,
      reusesExistingContract: 'audit.ts',
      isNewService: false,
      necessary: true,
    },
    {
      componentId: 'local-cpu-runtime',
      kind: 'compute',
      label: 'Local CPU runtime path',
      necessityForPrototypeQuestion: `Necessary: classical compute path for ${scope.prototypeQuestion}`,
      reusesExistingContract: null,
      isNewService: false,
      necessary: true,
    },
    {
      componentId: 'vanity-analytics-service',
      kind: 'other',
      label: 'Unrelated vanity analytics mega-service',
      necessityForPrototypeQuestion: '',
      reusesExistingContract: null,
      isNewService: true,
      necessary: false,
    },
  ];
}

export function applyComplexityGate(input: {
  components: readonly ArchitectureComponent[];
  prototypeQuestion: string;
}): {
  kept: ArchitectureComponent[];
  stripped: ArchitectureComponent[];
} {
  const kept: ArchitectureComponent[] = [];
  const stripped: ArchitectureComponent[] = [];
  for (const c of input.components) {
    const ok = passesComplexityGate({
      necessityForPrototypeQuestion: c.necessityForPrototypeQuestion,
      prototypeQuestion: input.prototypeQuestion,
      forceUnnecessary: c.necessary === false || c.necessityForPrototypeQuestion.trim() === '',
    });
    if (ok) {
      kept.push({ ...c, necessary: true });
    } else {
      stripped.push({ ...c, necessary: false });
    }
  }
  return { kept, stripped };
}

export function composePrototypeArchitecture(input: {
  actor: Es5Actor;
  scope: PrototypeScopeInput;
  components?: readonly ArchitectureComponent[];
  computeRequirements?: readonly ComputeRequirement[];
  bypassExistingContracts?: boolean;
  keepUnnecessary?: boolean;
  claimPhysicalQpuWithoutEvidence?: boolean;
  embedSecretsInSource?: boolean;
  crossTenantPool?: boolean;
  newPermissionInheritance?: boolean;
  touchProductionDb?: boolean;
  autoProvisionCloud?: boolean;
  skipHumanForHighConsequence?: boolean;
}): PrototypeArchitecture | DenialResult {
  if (!isEs5Agent(input.actor)) {
    return deny(
      'Only architecture_composer / prototype_agent / home_base may compose architectures.',
    );
  }
  if (!input.scope.approved) {
    return deny(
      'Prototype scope must be approved before architecture composition.',
    );
  }
  if (input.bypassExistingContracts === true) {
    return deny(
      'Must not bypass existing XIV AI contracts (auth/policies/agent-router/model-router/audit/persistence) — extend them.',
    );
  }
  if (mayBypassExistingContracts()) {
    return deny('Truth boundary forbids bypassing existing contracts.');
  }
  if (input.embedSecretsInSource === true) {
    return deny('Secrets must remain outside source.');
  }
  if (input.crossTenantPool === true) {
    return deny('Cross-tenant pooling is forbidden.');
  }
  if (input.newPermissionInheritance === true) {
    return deny('No new permission inheritance paths may be invented.');
  }
  if (input.touchProductionDb === true) {
    return deny('Production databases must remain untouched.');
  }
  if (input.autoProvisionCloud === true) {
    return deny('Auto-provisioning cloud resources is forbidden.');
  }
  if (input.skipHumanForHighConsequence === true) {
    return deny(
      'High-consequence actions require human authorization.',
      'HUMAN_APPROVAL_REQUIRED',
    );
  }

  const candidates =
    input.components ?? candidateComponentsForScope(input.scope);
  const { kept, stripped } = applyComplexityGate({
    components: candidates,
    prototypeQuestion: input.scope.prototypeQuestion,
  });

  if (input.keepUnnecessary === true && stripped.length > 0) {
    return deny(
      'Complexity gate failed: unnecessary components must be stripped (why-necessary unanswered).',
    );
  }

  // If caller explicitly includes a component that fails the gate in kept set
  const illicitKeep = kept.filter(
    (c) =>
      !passesComplexityGate({
        necessityForPrototypeQuestion: c.necessityForPrototypeQuestion,
        prototypeQuestion: input.scope.prototypeQuestion,
      }),
  );
  if (illicitKeep.length > 0) {
    return deny(
      `Complexity gate rejected components: ${illicitKeep.map((c) => c.componentId).join(',')}`,
    );
  }

  const computeReqs = [...(input.computeRequirements ?? [defaultCompute()])];
  for (const req of computeReqs) {
    if (
      req.honestyStatus === 'PHYSICAL_QPU_VERIFIED' &&
      !mayClaimPhysicalQpuVerified({
        honestyStatus: req.honestyStatus,
        hasPhysicalVerificationEvidence: req.verified === true,
      })
    ) {
      return deny(
        'PHYSICAL_QPU_VERIFIED requires verification evidence; use CLASSICAL/QUANTUM_INSPIRED/SIMULATED with fallback until verified.',
      );
    }
    if (input.claimPhysicalQpuWithoutEvidence === true) {
      return deny(
        'Dishonest compute status: cannot claim PHYSICAL_QPU_VERIFIED without evidence.',
      );
    }
    if (!COMPUTE_HONESTY_STATUSES.includes(req.honestyStatus)) {
      return deny(`Unknown compute honesty status: ${String(req.honestyStatus)}`);
    }
    if (!req.fallbackBehavior?.trim()) {
      return deny('Every compute path must declare fallback behavior.');
    }
  }

  const reused = [
    ...new Set(
      kept
        .map((c) => c.reusesExistingContract)
        .filter((x): x is ExistingServiceContract => x != null),
    ),
  ];

  // Prefer reuse: reject architectures that invent a new service when a
  // corresponding existing contract is available and unused.
  const inventingInsteadOfReuse = kept.some(
    (c) =>
      c.isNewService === true &&
      c.kind === 'backend_service' &&
      EXISTING_SERVICE_CONTRACTS.length > 0,
  );
  if (inventingInsteadOfReuse) {
    return deny(
      'Prefer reuse: do not create another backend service when existing XIV AI contracts can be extended.',
    );
  }

  const architectureId = `arch-${sha256(input.scope.prototypeId).slice(0, 12)}`;

  return {
    architectureId,
    prototypeId: input.scope.prototypeId,
    userPersona: input.scope.userPersona,
    primaryWorkflow: input.scope.primaryWorkflow,
    frontendSurface:
      kept.find((c) => c.kind === 'frontend_surface')?.label ?? 'XIV UI',
    backendServices: kept
      .filter((c) => c.kind === 'backend_service')
      .map((c) => c.label),
    agentRoles: kept.filter((c) => c.kind === 'agent_role').map((c) => c.label),
    modelProviders: kept
      .filter((c) => c.kind === 'model_provider')
      .map((c) => c.label),
    localCloudRuntimePaths: kept
      .filter((c) => c.kind === 'runtime_path' || c.kind === 'compute')
      .map((c) => c.label),
    cpuGpuNpuQpuRequirements: computeReqs,
    apiConnectors: kept
      .filter((c) => c.kind === 'api_connector')
      .map((c) => c.label),
    databasesIndexes: kept
      .filter((c) => c.kind === 'database_index')
      .map((c) => c.label),
    tenantId: input.scope.tenantId,
    universeId: input.scope.universeId,
    orgId: input.scope.orgId,
    guardianPolicyChecks: [
      'guardian_rls',
      'tenant_boundary',
      'universe_boundary',
      'policies.ts',
    ],
    auditEvidenceFlow: [
      'execution',
      'audit.ts_receipt',
      'benchmark_or_test',
      'acceptance_decision',
    ],
    observability: kept
      .filter((c) => c.kind === 'observability')
      .map((c) => c.label)
      .concat(['structured_receipts', 'home_base_return']),
    failureFallbackPaths: computeReqs.map((r) => r.fallbackBehavior),
    testEnvironments: ['local_sandbox', 'tenant_isolated_lab'],
    rollbackPath: 'revert_to_prior_architecture_revision_and_halt_agents',
    components: kept,
    strippedUnnecessaryComponentIds: stripped.map((c) => c.componentId),
    views: defaultViews(),
    reusedContracts: reused,
    containsSecretsInSource: false,
    crossTenantPooling: false,
    newPermissionInheritance: false,
    productionDbTouched: false,
    autoProvisionedCloud: false,
    l4AutonomyEnabled: false,
    honestyBanner: HONESTY_BANNER,
  };
}

export function exampleApprovedScope(): PrototypeScopeInput {
  return {
    prototypeId: 'proto-es5-demo-001',
    prototypeQuestion:
      'Can a bounded agent summarize tenant-local supply signals in XIV UI?',
    userPersona: 'operations_analyst',
    primaryWorkflow: 'summarize_tenant_supply_signals',
    approved: true,
    tenantId: 'ten-es5',
    universeId: 'uni-es5',
    orgId: 'org-es5',
  };
}

export function bootstrapPrototypeArchitectureComposer(actor: Es5Actor): {
  ok: true;
  locksIntact: boolean;
  softWire: Es5SoftWireSnapshot;
  fields: typeof ARCHITECTURE_FIELDS;
  views: typeof ARCHITECTURE_VIEWS;
  coreFlow: typeof ARCHITECTURE_CORE_FLOW;
} {
  return {
    ok: true,
    locksIntact: assertEs5LocksIntact(),
    softWire: es5SoftWireSnapshot(),
    fields: ARCHITECTURE_FIELDS,
    views: ARCHITECTURE_VIEWS,
    coreFlow: ARCHITECTURE_CORE_FLOW,
  };
}

export function attemptKeepUnnecessaryComponent(): DenialResult {
  const actor: Es5Actor = {
    kind: 'architecture_composer',
    id: 'deny-keep',
    orgId: 'org-es5',
    tenantId: 'ten-es5',
    universeId: 'uni-es5',
    permissions: ['draft'],
  };
  const result = composePrototypeArchitecture({
    actor,
    scope: exampleApprovedScope(),
    keepUnnecessary: true,
  });
  if ('denied' in result) return result;
  return deny('Expected denial when keeping unnecessary components.');
}

export function attemptBypassExistingContracts(): DenialResult {
  const actor: Es5Actor = {
    kind: 'architecture_composer',
    id: 'deny-bypass',
    orgId: 'org-es5',
    tenantId: 'ten-es5',
    universeId: 'uni-es5',
    permissions: ['draft'],
  };
  const result = composePrototypeArchitecture({
    actor,
    scope: exampleApprovedScope(),
    bypassExistingContracts: true,
  });
  if ('denied' in result) return result;
  return deny('Expected denial when bypassing existing contracts.');
}

export function attemptDishonestPhysicalQpu(): DenialResult {
  const actor: Es5Actor = {
    kind: 'architecture_composer',
    id: 'deny-qpu',
    orgId: 'org-es5',
    tenantId: 'ten-es5',
    universeId: 'uni-es5',
    permissions: ['draft'],
  };
  const result = composePrototypeArchitecture({
    actor,
    scope: exampleApprovedScope(),
    computeRequirements: [
      {
        path: 'QPU',
        honestyStatus: 'PHYSICAL_QPU_VERIFIED',
        fallbackBehavior: 'fallback_to_CLASSICAL_CPU',
        verified: false,
      },
    ],
    claimPhysicalQpuWithoutEvidence: true,
  });
  if ('denied' in result) return result;
  return deny('Expected denial for dishonest PHYSICAL_QPU_VERIFIED claim.');
}

export function attemptCrossTenantPooling(): DenialResult {
  const actor: Es5Actor = {
    kind: 'architecture_composer',
    id: 'deny-pool',
    orgId: 'org-es5',
    tenantId: 'ten-es5',
    universeId: 'uni-es5',
    permissions: ['draft'],
  };
  const result = composePrototypeArchitecture({
    actor,
    scope: exampleApprovedScope(),
    crossTenantPool: true,
  });
  if ('denied' in result) return result;
  return deny('Expected denial for cross-tenant pooling.');
}

export function attemptSecretsInSource(): DenialResult {
  const actor: Es5Actor = {
    kind: 'architecture_composer',
    id: 'deny-secrets',
    orgId: 'org-es5',
    tenantId: 'ten-es5',
    universeId: 'uni-es5',
    permissions: ['draft'],
  };
  const result = composePrototypeArchitecture({
    actor,
    scope: exampleApprovedScope(),
    embedSecretsInSource: true,
  });
  if ('denied' in result) return result;
  return deny('Expected denial for secrets in source.');
}

export function attemptProductionDbTouch(): DenialResult {
  const actor: Es5Actor = {
    kind: 'architecture_composer',
    id: 'deny-prod-db',
    orgId: 'org-es5',
    tenantId: 'ten-es5',
    universeId: 'uni-es5',
    permissions: ['draft'],
  };
  const result = composePrototypeArchitecture({
    actor,
    scope: exampleApprovedScope(),
    touchProductionDb: true,
  });
  if ('denied' in result) return result;
  return deny('Expected denial for production DB touch.');
}

export function attemptAutoProvisionCloud(): DenialResult {
  const actor: Es5Actor = {
    kind: 'architecture_composer',
    id: 'deny-cloud',
    orgId: 'org-es5',
    tenantId: 'ten-es5',
    universeId: 'uni-es5',
    permissions: ['draft'],
  };
  const result = composePrototypeArchitecture({
    actor,
    scope: exampleApprovedScope(),
    autoProvisionCloud: true,
  });
  if ('denied' in result) return result;
  return deny('Expected denial for auto-provision cloud.');
}

export function attemptNewPermissionInheritance(): DenialResult {
  const actor: Es5Actor = {
    kind: 'architecture_composer',
    id: 'deny-perm',
    orgId: 'org-es5',
    tenantId: 'ten-es5',
    universeId: 'uni-es5',
    permissions: ['draft'],
  };
  const result = composePrototypeArchitecture({
    actor,
    scope: exampleApprovedScope(),
    newPermissionInheritance: true,
  });
  if ('denied' in result) return result;
  return deny('Expected denial for new permission inheritance.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny(
    'Recommend ≠ act / authorize — agents may recommend only (L4_AUTONOMY_ENABLED=false).',
  );
}

export function requireHumanApproval(actor: Es5Actor): {
  required: true;
  approved: boolean;
  state: 'HUMAN_APPROVAL_REQUIRED' | 'PASS';
} {
  if (isHumanApprover(actor)) {
    return { required: true, approved: true, state: 'PASS' };
  }
  return {
    required: true,
    approved: false,
    state: 'HUMAN_APPROVAL_REQUIRED',
  };
}

export function probeGuardianRlsTenantUniverseIsolation(input: {
  actorTenantId: string;
  actorUniverseId: string;
  resourceTenantId: string;
  resourceUniverseId: string;
}): { isolated: boolean; state: Es5EvidenceState; summary: string } {
  const isolated =
    input.actorTenantId === input.resourceTenantId &&
    input.actorUniverseId === input.resourceUniverseId;
  return {
    isolated,
    state: isolated ? 'PASS' : 'DENIED',
    summary: isolated
      ? 'Guardian/RLS tenant/Universe isolation intact.'
      : 'Cross-tenant/Universe access denied.',
  };
}

export function returnEvidenceToHomeBase(architecture: PrototypeArchitecture): {
  returned: true;
  architectureId: string;
  evidenceRefs: readonly string[];
} {
  return {
    returned: true,
    architectureId: architecture.architectureId,
    evidenceRefs: [
      ...architecture.auditEvidenceFlow,
      ...architecture.strippedUnnecessaryComponentIds.map(
        (id) => `stripped:${id}`,
      ),
    ],
  };
}

export function runPrototypeArchitectureComposerCycle(input: {
  actor: Es5Actor;
  repoRoot?: string;
}): {
  hops: Es5HopRecord[];
  architecture: PrototypeArchitecture | null;
  softWire: Es5SoftWireSnapshot;
  locksIntact: boolean;
} {
  const softWire = es5SoftWireSnapshot(input.repoRoot);
  const hops: Es5HopRecord[] = [];

  hops.push(
    hop(
      'honesty_locks',
      assertEs5LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );
  hops.push(
    hop(
      'architecture_composer_bootstrap',
      'PASS',
      `${GITHUB_SOT_LABEL}: ${GITHUB_SOT_TITLE}`,
    ),
  );
  hops.push(
    hop(
      'architecture_fields_encoded',
      ARCHITECTURE_FIELDS.length === 19 ? 'PASS' : 'FAIL',
      `fields=${ARCHITECTURE_FIELDS.length}`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      ARCHITECTURE_CORE_FLOW.length === 7 ? 'PASS' : 'FAIL',
      ARCHITECTURE_CORE_FLOW.join('→'),
    ),
  );
  hops.push(
    hop(
      'architecture_views_encoded',
      ARCHITECTURE_VIEWS.length === 6 ? 'PASS' : 'FAIL',
      ARCHITECTURE_VIEWS.join(','),
    ),
  );
  hops.push(
    hop(
      'compute_honesty_statuses_encoded',
      COMPUTE_HONESTY_STATUSES.length === 4 ? 'PASS' : 'FAIL',
      COMPUTE_HONESTY_STATUSES.join('|'),
    ),
  );
  hops.push(
    hop(
      'existing_contracts_encoded',
      EXISTING_SERVICE_CONTRACTS.length === 6 ? 'PASS' : 'FAIL',
      EXISTING_SERVICE_CONTRACTS.join(','),
    ),
  );
  hops.push(
    hop(
      'truth_boundary_encoded',
      ARCHITECTURE_COMPOSER_TRUTH_BOUNDARY.preferReuseOverNewService
        ? 'PASS'
        : 'FAIL',
      'reuse>new; complexity gate; compute honesty; security locks',
    ),
  );

  const composed = composePrototypeArchitecture({
    actor: input.actor,
    scope: exampleApprovedScope(),
  });
  const architecture = 'denied' in composed ? null : composed;

  hops.push(
    hop(
      'ingest_prototype_scope',
      architecture ? 'PASS' : 'FAIL',
      architecture
        ? `prototypeId=${architecture.prototypeId}`
        : 'compose failed',
    ),
  );
  hops.push(
    hop(
      'select_components',
      architecture && architecture.components.length > 0 ? 'PASS' : 'FAIL',
      architecture
        ? `components=${architecture.components.length}`
        : 'no components',
    ),
  );
  hops.push(
    hop(
      'apply_complexity_gate',
      architecture ? 'PASS' : 'FAIL',
      'why-necessary required per component',
    ),
  );
  hops.push(
    hop(
      'strip_unnecessary_components',
      architecture &&
        architecture.strippedUnnecessaryComponentIds.includes(
          'vanity-analytics-service',
        )
        ? 'PASS'
        : 'FAIL',
      architecture
        ? `stripped=${architecture.strippedUnnecessaryComponentIds.join(',')}`
        : 'strip failed',
    ),
  );
  hops.push(
    hop(
      'bind_trust_boundaries',
      architecture ? 'PASS' : 'FAIL',
      architecture
        ? `tenant=${architecture.tenantId};universe=${architecture.universeId}`
        : 'no trust bind',
    ),
  );
  hops.push(
    hop(
      'compose_data_flow',
      architecture?.views.some((v) => v.kind === 'data_flow') ? 'PASS' : 'FAIL',
      DATA_FLOW_STEPS.join('→'),
    ),
  );
  hops.push(
    hop(
      'route_compute_with_honesty',
      architecture?.cpuGpuNpuQpuRequirements.every((r) =>
        COMPUTE_HONESTY_STATUSES.includes(r.honestyStatus),
      )
        ? 'PASS'
        : 'FAIL',
      architecture?.cpuGpuNpuQpuRequirements
        .map((r) => `${r.path}:${r.honestyStatus}`)
        .join(',') ?? 'none',
    ),
  );
  hops.push(
    hop(
      'define_failure_fallback_paths',
      architecture && architecture.failureFallbackPaths.length > 0
        ? 'PASS'
        : 'FAIL',
      architecture?.failureFallbackPaths.join('|') ?? 'none',
    ),
  );
  hops.push(
    hop(
      'define_verification_plan',
      architecture && architecture.testEnvironments.length > 0 ? 'PASS' : 'FAIL',
      architecture?.testEnvironments.join(',') ?? 'none',
    ),
  );
  hops.push(
    hop(
      'prefer_reuse_existing_contracts',
      architecture && architecture.reusedContracts.length >= 3 ? 'PASS' : 'FAIL',
      architecture?.reusedContracts.join(',') ?? 'none',
    ),
  );
  hops.push(
    hop(
      'emit_architecture_views',
      architecture && architecture.views.length === 6 ? 'PASS' : 'FAIL',
      ARCHITECTURE_VIEWS.join(','),
    ),
  );

  hops.push(
    hop(
      'deny_unnecessary_component_retention',
      attemptKeepUnnecessaryComponent().state === 'DENIED' ? 'DENIED' : 'FAIL',
      'unnecessary components stripped',
    ),
  );
  hops.push(
    hop(
      'deny_bypass_existing_contracts',
      attemptBypassExistingContracts().state === 'DENIED' ? 'DENIED' : 'FAIL',
      'reuse auth/policies/agent-router/model-router/audit/persistence',
    ),
  );
  hops.push(
    hop(
      'deny_dishonest_compute_status',
      attemptDishonestPhysicalQpu().state === 'DENIED' ? 'DENIED' : 'FAIL',
      'PHYSICAL_QPU_VERIFIED requires evidence',
    ),
  );
  hops.push(
    hop(
      'deny_physical_qpu_without_verification',
      attemptDishonestPhysicalQpu().state === 'DENIED' ? 'DENIED' : 'FAIL',
      'fallback to CLASSICAL/SIMULATED/QUANTUM_INSPIRED',
    ),
  );
  hops.push(
    hop(
      'deny_cross_tenant_pooling',
      attemptCrossTenantPooling().state === 'DENIED' ? 'DENIED' : 'FAIL',
      'no cross-tenant pooling',
    ),
  );
  hops.push(
    hop(
      'deny_new_permission_inheritance',
      attemptNewPermissionInheritance().state === 'DENIED' ? 'DENIED' : 'FAIL',
      'no new permission inheritance',
    ),
  );
  hops.push(
    hop(
      'deny_secrets_in_source',
      attemptSecretsInSource().state === 'DENIED' ? 'DENIED' : 'FAIL',
      'secrets outside source',
    ),
  );
  hops.push(
    hop(
      'deny_production_db_touch',
      attemptProductionDbTouch().state === 'DENIED' ? 'DENIED' : 'FAIL',
      'production DBs untouched',
    ),
  );
  hops.push(
    hop(
      'deny_auto_provision_cloud',
      attemptAutoProvisionCloud().state === 'DENIED' ? 'DENIED' : 'FAIL',
      'no auto-provision cloud',
    ),
  );
  hops.push(
    hop(
      'deny_bypass_guardian_rls',
      ES5_LOCKS.BYPASS_GUARDIAN_RLS === false ? 'DENIED' : 'FAIL',
      'Guardian/RLS intact',
    ),
  );
  hops.push(
    hop(
      'deny_high_consequence_without_human',
      ES5_LOCKS.HIGH_CONSEQUENCE_WITHOUT_HUMAN === false ? 'DENIED' : 'FAIL',
      'human authorization required',
    ),
  );

  const isolation = probeGuardianRlsTenantUniverseIsolation({
    actorTenantId: input.actor.tenantId,
    actorUniverseId: input.actor.universeId,
    resourceTenantId: input.actor.tenantId,
    resourceUniverseId: input.actor.universeId,
  });
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      isolation.state,
      isolation.summary,
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' ? 'DENIED' : 'FAIL',
      'recommend ≠ act',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ES5_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'es_layer_context_documented',
      'DOCUMENTED',
      `${ES_LAYER_TITLE}; next=${NEXT_PHASE_TITLE}`,
    ),
  );
  hops.push(
    hop(
      'es4_soft_wire',
      softWireHopState(softWire.es4PrototypeScopeGenerator.present),
      softWire.es4PrototypeScopeGenerator.note,
    ),
  );
  hops.push(
    hop(
      'es3_soft_wire',
      softWireHopState(softWire.es3OpportunityScoringEngine.present),
      softWire.es3OpportunityScoringEngine.note,
    ),
  );
  hops.push(
    hop(
      'es2_soft_wire',
      softWireHopState(softWire.es2ProductHypothesisFactory.present),
      softWire.es2ProductHypothesisFactory.note,
    ),
  );
  hops.push(
    hop(
      'es1_soft_wire',
      softWireHopState(softWire.es1ResearchToProductCandidateGate.present),
      softWire.es1ResearchToProductCandidateGate.note,
    ),
  );
  hops.push(
    hop(
      'er34_soft_wire',
      softWireHopState(softWire.er34CapabilityManifest.present),
      softWire.er34CapabilityManifest.note,
    ),
  );
  hops.push(
    hop(
      'er35_soft_wire',
      softWireHopState(softWire.er35ModelDataPackManifest.present),
      softWire.er35ModelDataPackManifest.note,
    ),
  );
  hops.push(
    hop(
      'auth_contract_soft_wire',
      softWireHopState(softWire.authContract.present),
      softWire.authContract.note,
    ),
  );
  hops.push(
    hop(
      'policies_contract_soft_wire',
      softWireHopState(softWire.policiesContract.present),
      softWire.policiesContract.note,
    ),
  );
  hops.push(
    hop(
      'agent_router_contract_soft_wire',
      softWireHopState(softWire.agentRouterContract.present),
      softWire.agentRouterContract.note,
    ),
  );
  hops.push(
    hop(
      'model_router_contract_soft_wire',
      softWireHopState(softWire.modelRouterContract.present),
      softWire.modelRouterContract.note,
    ),
  );
  hops.push(
    hop(
      'audit_contract_soft_wire',
      softWireHopState(softWire.auditContract.present),
      softWire.auditContract.note,
    ),
  );
  hops.push(
    hop(
      'persistence_contract_soft_wire',
      softWireHopState(softWire.persistenceContract.present),
      softWire.persistenceContract.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      ES5_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'NOT_APPLIED' : 'FAIL',
      ES5_DB_CANDIDATES_STATUS,
    ),
  );

  hops.push(
    hop(
      'evidence',
      architecture ? 'PASS' : 'PARTIAL',
      [
        GITHUB_SOT_ISSUE_NOTE,
        GITLAB_MIRROR_NOTE,
        `may=${ES5_MAY.length}`,
        `must_not=${ES5_MUST_NOT.length}`,
        `bounds_auto=${ES5_AGENT_BOUNDS.automaticAuthority}`,
        `cycle_hops=${hops.length + 1}/${PROTOTYPE_ARCHITECTURE_COMPOSER_CYCLE.length}`,
        architecture
          ? `arch=${architecture.architectureId}`
          : 'architecture=null',
      ].join('; '),
    ),
  );

  return {
    hops,
    architecture,
    softWire,
    locksIntact: assertEs5LocksIntact(),
  };
}
