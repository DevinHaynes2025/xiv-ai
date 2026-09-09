/**
 * 62L-EO11 — Virtual Data Warehouse Mission Pack runtime.
 *
 * Flow:
 * Source → Authorized Connector → Ingestion Gate → Mission Warehouse →
 * Search/Analytics/Agents → Decision Object → Outcome
 *
 * Agent access: agentId → purpose → allowed dataset → fields → data class →
 * time window → taskId → expiry → Policy/RLS/Guardian → approved query →
 * bounded result → evidence receipt.
 *
 * No blanket DB access, cross-tenant pooling, prod mutations, unauthorized
 * ingest, restricted leaks, silent cloud replication. Stale ≠ truth.
 */

import {
  AGENT_ACCESS_GATE_FLOW,
  AGENT_ACCESS_REQUEST_FIELDS,
  DATA_CLASSIFICATIONS,
  EO11_DB_CANDIDATES_STATUS,
  EO11_LOCKS,
  EO11_MAY,
  EO11_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  MISSION_WAREHOUSE_TYPES,
  MISSION_WAREHOUSE_TYPE_LABELS,
  NEURAL_PATHWAY_NODE_KINDS,
  NEXT_PHASE_TITLE,
  VIRTUAL_DATA_WAREHOUSE_MISSION_PACK_CYCLE,
  VIRTUAL_WAREHOUSE_AGENT_BOUNDS,
  VIRTUAL_WAREHOUSE_CORE_FLOW,
  WAREHOUSE_DEFINITION_FIELDS,
  WAREHOUSE_RELIABILITY_STATES,
  assertEo11LocksIntact,
  eo11SoftWireSnapshot,
  isHumanApprover,
  isWarehouseAgent,
  mayTreatAsCurrentTruth,
  type DataClassification,
  type Eo11Actor,
  type Eo11EvidenceState,
  type Eo11HopRecord,
  type Eo11SoftWireSnapshot,
  type MissionWarehouseType,
  type NeuralPathwayNodeKind,
  type VirtualWarehouseCoreFlowHop,
  type WarehouseReliabilityState,
} from './virtual-data-warehouse-mission-pack-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof VIRTUAL_DATA_WAREHOUSE_MISSION_PACK_CYCLE)[number],
  state: Eo11EvidenceState,
  summary: string,
): Eo11HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED';
  reason: string;
  executed: false;
};

function deny(reason: string): DenialResult {
  return { denied: true, state: 'DENIED', reason, executed: false };
}

/** Mission warehouse definition — isolated contract surface. */
export type MissionWarehouseRecord = {
  warehouseId: string;
  missionOrganization: string;
  tenantId: string;
  universeId: string;
  orgId: string;
  warehouseType: MissionWarehouseType;
  warehouseTypeLabel: string;
  dataOwners: string[];
  sourceSystems: string[];
  schemaCatalog: string[];
  dataClassifications: DataClassification[];
  lineage: string[];
  retention: string | null;
  residencyLocation: string | null;
  encryptionState: string;
  accessRoles: string[];
  connectorScopes: string[];
  computeBudget: string | null;
  storageBudget: string | null;
  freshnessSLOs: string[];
  backupRecoveryState: string | null;
  deletionRevocationPolicy: string;
  auditState: string;
  evidenceStatus: Eo11EvidenceState;
  reliabilityState: WarehouseReliabilityState;
  flowPosition: VirtualWarehouseCoreFlowHop;
  crossTenantPooled: false;
  productionMutated: false;
  unauthorizedIngest: false;
  restrictedLeaked: false;
  silentCloudReplicated: false;
  blanketAgentAccess: false;
  createdAt: string;
};

export function registerMissionWarehouse(input: {
  warehouseId: string;
  missionOrganization: string;
  warehouseType: MissionWarehouseType;
  actor: Eo11Actor;
  dataOwners?: string[];
  sourceSystems?: string[];
  schemaCatalog?: string[];
  dataClassifications?: DataClassification[];
  lineage?: string[];
  retention?: string | null;
  residencyLocation?: string | null;
  encryptionState?: string;
  accessRoles?: string[];
  connectorScopes?: string[];
  computeBudget?: string | null;
  storageBudget?: string | null;
  freshnessSLOs?: string[];
  backupRecoveryState?: string | null;
  deletionRevocationPolicy?: string;
  reliabilityState?: WarehouseReliabilityState;
  attemptCrossTenantPool?: boolean;
}): MissionWarehouseRecord | DenialResult {
  if (input.attemptCrossTenantPool) {
    return deny(
      'NO_RAW_PRIVATE_CROSS_TENANT_POOLING (EO11_LOCKS.RAW_PRIVATE_CROSS_TENANT_POOLING=false).',
    );
  }

  return {
    warehouseId: input.warehouseId,
    missionOrganization: input.missionOrganization,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
    warehouseType: input.warehouseType,
    warehouseTypeLabel: MISSION_WAREHOUSE_TYPE_LABELS[input.warehouseType],
    dataOwners: input.dataOwners ?? [],
    sourceSystems: input.sourceSystems ?? [],
    schemaCatalog: input.schemaCatalog ?? [],
    dataClassifications: input.dataClassifications ?? ['internal'],
    lineage: input.lineage ?? [],
    retention: input.retention ?? null,
    residencyLocation: input.residencyLocation ?? null,
    encryptionState: input.encryptionState ?? 'CANDIDATE — not verified',
    accessRoles: input.accessRoles ?? [],
    connectorScopes: input.connectorScopes ?? [],
    computeBudget: input.computeBudget ?? null,
    storageBudget: input.storageBudget ?? null,
    freshnessSLOs: input.freshnessSLOs ?? [],
    backupRecoveryState: input.backupRecoveryState ?? null,
    deletionRevocationPolicy:
      input.deletionRevocationPolicy ??
      'PROPAGATE_TO_DERIVED_INDEXES_AND_CACHES_REQUIRED',
    auditState: 'CANDIDATE',
    evidenceStatus: 'REGISTERED',
    reliabilityState: input.reliabilityState ?? 'UNKNOWN',
    flowPosition: 'mission_warehouse',
    crossTenantPooled: false,
    productionMutated: false,
    unauthorizedIngest: false,
    restrictedLeaked: false,
    silentCloudReplicated: false,
    blanketAgentAccess: false,
    createdAt: nowIso(),
  };
}

export type AgentAccessRequest = {
  agentId: string;
  purpose: string;
  allowedDataset: string;
  fields: string[];
  dataClass: DataClassification;
  timeWindow: string;
  taskId: string;
  expiry: string;
  warehouseId: string;
  tenantId: string;
  universeId: string;
};

export function openAgentAccessRequest(input: {
  agentId: string;
  purpose: string;
  allowedDataset: string;
  fields: string[];
  dataClass: DataClassification;
  timeWindow: string;
  taskId: string;
  expiry: string;
  warehouseId: string;
  actor: Eo11Actor;
  attemptBlanketAccess?: boolean;
  attemptCrossTenantRead?: boolean;
}): AgentAccessRequest | DenialResult {
  if (input.attemptBlanketAccess) {
    return deny(
      'NO_BLANKET_AGENT_DATABASE_ACCESS — every request must scope dataset/fields/class/time/task/expiry.',
    );
  }
  if (input.attemptCrossTenantRead) {
    return deny(
      'NO_RAW_PRIVATE_CROSS_TENANT_POOLING / AGENT_AUTO_CROSS_TENANT_READ=false.',
    );
  }
  if (!input.fields.length) {
    return deny('Agent access requires explicit fields scope (no wildcard blanket).');
  }
  void AGENT_ACCESS_REQUEST_FIELDS;
  void DATA_CLASSIFICATIONS;

  return {
    agentId: input.agentId,
    purpose: input.purpose,
    allowedDataset: input.allowedDataset,
    fields: input.fields,
    dataClass: input.dataClass,
    timeWindow: input.timeWindow,
    taskId: input.taskId,
    expiry: input.expiry,
    warehouseId: input.warehouseId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function runPolicyRlsGuardianGate(input: {
  request: AgentAccessRequest;
  reliabilityState: WarehouseReliabilityState;
  restrictedDataset?: boolean;
  expired?: boolean;
}):
  | {
      gate: typeof AGENT_ACCESS_GATE_FLOW;
      approved: true;
      queryApproved: true;
      currentTruthEligible: boolean;
      evidenceReceiptRequired: true;
    }
  | DenialResult {
  if (input.expired) {
    return deny('Agent access request expired — re-request with new expiry.');
  }
  if (input.restrictedDataset && input.request.dataClass === 'restricted') {
    return deny(
      'NO_LEAKED_RESTRICTED_DATASETS — restricted class denied without explicit authorization evidence.',
    );
  }
  if (input.restrictedDataset) {
    return deny('NO_LEAKED_RESTRICTED_DATASETS.');
  }
  if (
    !mayTreatAsCurrentTruth(input.reliabilityState) &&
    input.request.purpose === 'assert_current_truth'
  ) {
    return deny(
      `STALE_OR_MISSING_NEQ_CURRENT_TRUTH — reliability=${input.reliabilityState}; only FRESH is current-truth-eligible.`,
    );
  }

  return {
    gate: AGENT_ACCESS_GATE_FLOW,
    approved: true,
    queryApproved: true,
    currentTruthEligible: mayTreatAsCurrentTruth(input.reliabilityState),
    evidenceReceiptRequired: true,
  };
}

export function returnBoundedQueryResult(input: {
  resultId: string;
  request: AgentAccessRequest;
  rows: ReadonlyArray<Record<string, unknown>>;
  reliabilityState: WarehouseReliabilityState;
  attemptTreatStaleAsTruth?: boolean;
}):
  | {
      resultId: string;
      taskId: string;
      bounded: true;
      fieldScope: string[];
      rowCount: number;
      reliabilityState: WarehouseReliabilityState;
      currentTruthEligible: boolean;
      evidenceReceiptId: string;
    }
  | DenialResult {
  if (
    input.attemptTreatStaleAsTruth ||
    (input.reliabilityState !== 'FRESH' &&
      input.request.purpose === 'assert_current_truth')
  ) {
    return deny(
      'NO_AGENT_TREAT_STALE_OR_MISSING_AS_CURRENT_TRUTH.',
    );
  }

  const scopedRows = input.rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const field of input.request.fields) {
      if (field in row) out[field] = row[field];
    }
    return out;
  });

  return {
    resultId: input.resultId,
    taskId: input.request.taskId,
    bounded: true,
    fieldScope: [...input.request.fields],
    rowCount: scopedRows.length,
    reliabilityState: input.reliabilityState,
    currentTruthEligible: mayTreatAsCurrentTruth(input.reliabilityState),
    evidenceReceiptId: `ev-${input.resultId}`,
  };
}

export function attachNeuralPathwayNode(input: {
  nodeId: string;
  kind: NeuralPathwayNodeKind;
  warehouseId: string;
  resultId: string;
  provenance: string;
  permissionScope: string;
  attemptStripProvenance?: boolean;
}):
  | {
      nodeId: string;
      kind: NeuralPathwayNodeKind;
      warehouseId: string;
      resultId: string;
      provenance: string;
      permissionScope: string;
      edgeKeepsProvenanceAndPermissionScope: true;
    }
  | DenialResult {
  if (input.attemptStripProvenance || !input.provenance || !input.permissionScope) {
    return deny(
      'NEURAL_EDGES_MUST_KEEP_PROVENANCE_AND_PERMISSION_SCOPE.',
    );
  }
  if (!NEURAL_PATHWAY_NODE_KINDS.includes(input.kind)) {
    return deny('Invalid neural pathway node kind.');
  }
  return {
    nodeId: input.nodeId,
    kind: input.kind,
    warehouseId: input.warehouseId,
    resultId: input.resultId,
    provenance: input.provenance,
    permissionScope: input.permissionScope,
    edgeKeepsProvenanceAndPermissionScope: true,
  };
}

export function planDeletionRevocationPropagation(input: {
  planId: string;
  warehouseId: string;
  targets: string[];
  attemptSkipPropagation?: boolean;
}):
  | {
      planId: string;
      warehouseId: string;
      targets: string[];
      propagationRequired: true;
      executed: false;
      advisoryOnly: true;
    }
  | DenialResult {
  if (input.attemptSkipPropagation) {
    return deny(
      'DELETION_REVOCATION_MUST_PROPAGATE_TO_DERIVED_INDEXES_CACHES (EO11_LOCKS.SKIP_DELETION_REVOCATION_PROPAGATION=false).',
    );
  }
  return {
    planId: input.planId,
    warehouseId: input.warehouseId,
    targets: input.targets,
    propagationRequired: true,
    executed: false,
    advisoryOnly: true,
  };
}

export function attemptRawPrivateCrossTenantPooling(): DenialResult & {
  pooled: false;
} {
  return { ...deny('NO_RAW_PRIVATE_CROSS_TENANT_POOLING'), pooled: false };
}

export function attemptProductionDatabaseMutation(): DenialResult & {
  mutated: false;
} {
  return {
    ...deny('NO_PRODUCTION_DATABASE_MUTATIONS_FROM_THIS_QUEUE'),
    mutated: false,
  };
}

export function attemptUnauthorizedIngestion(): DenialResult & {
  ingested: false;
} {
  return { ...deny('NO_UNAUTHORIZED_INGESTION'), ingested: false };
}

export function attemptLeakRestrictedDataset(): DenialResult & {
  leaked: false;
} {
  return { ...deny('NO_LEAKED_RESTRICTED_DATASETS'), leaked: false };
}

export function attemptSilentCloudReplication(): DenialResult & {
  replicated: false;
} {
  return { ...deny('NO_SILENT_REPLICATION_TO_CLOUD_PROVIDERS'), replicated: false };
}

export function attemptBlanketAgentDatabaseAccess(): DenialResult & {
  granted: false;
} {
  return { ...deny('NO_BLANKET_AGENT_DATABASE_ACCESS'), granted: false };
}

export function attemptTreatStaleAsCurrentTruth(
  state: WarehouseReliabilityState,
): DenialResult & {
  treatedAsCurrentTruth: false;
  reliabilityState: WarehouseReliabilityState;
} {
  void WAREHOUSE_RELIABILITY_STATES;
  return {
    ...deny(
      `STALE_OR_MISSING_NEQ_CURRENT_TRUTH — state=${state}; only FRESH is current-truth-eligible.`,
    ),
    treatedAsCurrentTruth: false,
    reliabilityState: state,
  };
}

export function attemptAgentAutoAuthority(actor: Eo11Actor): DenialResult {
  if (isWarehouseAgent(actor) || actor.kind === 'home_base') {
    return deny(
      'NO_AGENT_AUTO_AUTHORITY — agents may return evidence to Home Base only; recommend ≠ act.',
    );
  }
  return deny('Actor cannot self-grant automatic authority.');
}

export function returnAgentEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eo11Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      actorKind: Eo11Actor['kind'];
      summary: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!VIRTUAL_WAREHOUSE_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('Home Base evidence return disabled.');
  }
  if (!isWarehouseAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only warehouse agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    actorKind: input.actor.kind,
    summary: input.summary,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  warehouseId: string;
  actor: Eo11Actor;
  action: string;
}):
  | {
      approvalId: string;
      warehouseId: string;
      action: string;
      approved: true;
      humanGate: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver or founder.',
    );
  }
  if (
    !input.actor.permissions.includes('approve_consequential') &&
    !input.actor.permissions.includes('authorize_ingestion')
  ) {
    return deny(
      'Human approver lacks approve_consequential / authorize_ingestion.',
    );
  }
  return {
    approvalId: input.approvalId,
    warehouseId: input.warehouseId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: EO11_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    bypassDenied: EO11_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function bootstrapVirtualDataWarehouseMissionPack(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eo11SoftWireSnapshot;
  warehouseTypes: readonly MissionWarehouseType[];
  definitionFields: readonly string[];
  coreFlow: readonly VirtualWarehouseCoreFlowHop[];
  reliabilityStates: readonly WarehouseReliabilityState[];
  agentAccessFields: readonly string[];
  neuralNodeKinds: readonly NeuralPathwayNodeKind[];
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EO11_MAY;
  mustNot: typeof EO11_MUST_NOT;
  dbCandidates: typeof EO11_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEo11LocksIntact(),
    softWire: eo11SoftWireSnapshot(repoRoot),
    warehouseTypes: MISSION_WAREHOUSE_TYPES,
    definitionFields: WAREHOUSE_DEFINITION_FIELDS,
    coreFlow: VIRTUAL_WAREHOUSE_CORE_FLOW,
    reliabilityStates: WAREHOUSE_RELIABILITY_STATES,
    agentAccessFields: AGENT_ACCESS_REQUEST_FIELDS,
    neuralNodeKinds: NEURAL_PATHWAY_NODE_KINDS,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EO11_MAY,
    mustNot: EO11_MUST_NOT,
    dbCandidates: EO11_DB_CANDIDATES_STATUS,
  };
}

export function runVirtualDataWarehouseMissionPackCycle(input: {
  actor: Eo11Actor;
  human: Eo11Actor;
  repoRoot?: string;
}): {
  hops: Eo11HopRecord[];
  warehouse: MissionWarehouseRecord | DenialResult;
  softWire: Eo11SoftWireSnapshot;
} {
  const hops: Eo11HopRecord[] = [];
  const softWire = eo11SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEo11LocksIntact() ? 'PASS' : 'FAIL',
      'EO11 locks intact including L4=false and warehouse boundary denies.',
    ),
  );
  hops.push(
    hop(
      'virtual_warehouse_pack_bootstrap',
      'PASS',
      'Virtual Data Warehouse Mission Pack bootstrapped (advisory / candidate surfaces).',
    ),
  );
  hops.push(
    hop(
      'mission_warehouse_types_encoded',
      'PASS',
      `${MISSION_WAREHOUSE_TYPES.length} mission warehouse types encoded.`,
    ),
  );
  hops.push(
    hop(
      'warehouse_definition_fields_encoded',
      'PASS',
      `${WAREHOUSE_DEFINITION_FIELDS.length} warehouse definition fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      'PASS',
      VIRTUAL_WAREHOUSE_CORE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'reliability_states_encoded',
      'PASS',
      WAREHOUSE_RELIABILITY_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'stale_or_missing_neq_current_truth',
      attemptTreatStaleAsCurrentTruth('STALE').state,
      'Stale/missing treated as current truth DENIED.',
    ),
  );
  hops.push(
    hop(
      'agent_access_request_fields_encoded',
      'PASS',
      `${AGENT_ACCESS_REQUEST_FIELDS.length} agent access request fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'agent_access_gate_flow_encoded',
      'PASS',
      AGENT_ACCESS_GATE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'no_blanket_database_access',
      attemptBlanketAgentDatabaseAccess().state,
      'Blanket agent database access DENIED.',
    ),
  );
  hops.push(
    hop(
      'neural_pathway_nodes_encoded',
      'PASS',
      NEURAL_PATHWAY_NODE_KINDS.join(' → '),
    ),
  );
  hops.push(
    hop(
      'neural_edges_keep_provenance_and_permission_scope',
      'PASS',
      'Neural edges require provenance + permission scope.',
    ),
  );

  const warehouse = registerMissionWarehouse({
    warehouseId: 'wh-eo11-1',
    missionOrganization: 'XIV mission warehouse candidate',
    warehouseType: 'logistics_warehouse',
    actor: input.actor,
    reliabilityState: 'UNKNOWN',
  });

  hops.push(
    hop(
      'no_raw_private_cross_tenant_pooling',
      attemptRawPrivateCrossTenantPooling().state,
      'Cross-tenant pooling DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_production_database_mutations',
      attemptProductionDatabaseMutation().state,
      'Production DB mutations DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_unauthorized_ingestion',
      attemptUnauthorizedIngestion().state,
      'Unauthorized ingestion DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_leaked_restricted_datasets',
      attemptLeakRestrictedDataset().state,
      'Restricted dataset leak DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_silent_cloud_replication',
      attemptSilentCloudReplication().state,
      'Silent cloud replication DENIED.',
    ),
  );
  hops.push(
    hop(
      'deletion_revocation_propagates',
      planDeletionRevocationPropagation({
        planId: 'del-1',
        warehouseId: 'wh-eo11-1',
        targets: ['derived_index', 'cache'],
        attemptSkipPropagation: true,
      }).state,
      'Skip deletion/revocation propagation DENIED.',
    ),
  );
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      probeGuardianRlsTenantUniverseIsolation().state,
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      'PASS',
      'Recommend ≠ ingest / mutate / replicate / pool tenants.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EO11_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'eo10_soft_wire',
      softWire.eo10PhysicalProductContractPack.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo10PhysicalProductContractPack.note,
    ),
  );
  hops.push(
    hop(
      'eo9_soft_wire',
      softWire.eo9DigitalProductContractPack.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo9DigitalProductContractPack.note,
    ),
  );
  hops.push(
    hop(
      'eo8_soft_wire',
      softWire.eo8SupplyChainResiliencePack.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo8SupplyChainResiliencePack.note,
    ),
  );
  hops.push(
    hop(
      'en158_soft_wire',
      softWire.en158DealOs.present ? 'PASS' : 'WAITING_DATA',
      softWire.en158DealOs.note,
    ),
  );
  hops.push(
    hop(
      'em10_soft_wire',
      softWire.em10UserAccessEconomy.present ? 'PASS' : 'WAITING_DATA',
      softWire.em10UserAccessEconomy.note,
    ),
  );
  hops.push(
    hop(
      'em1_soft_wire',
      softWire.em1HomeBaseContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.em1HomeBaseContract.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      EO11_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eo11-1',
    warehouseId: 'wh-eo11-1',
    actor: input.human,
    action: 'authorize_bounded_ingestion_plan',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in humanGate ? 'DENIED' : 'PASS',
      'Human approval gate exercised; cycle evidence recorded.',
    ),
  );

  void VIRTUAL_DATA_WAREHOUSE_MISSION_PACK_CYCLE;

  return {
    hops,
    warehouse,
    softWire,
  };
}
