/**
 * 12D-09 / CEO doctrine â€” Atomic Data Cells (software contracts).
 * Tiny addressable knowledge records: provenance, checksum, tenant, timestamp,
 * confidence, optional vector, graph links, replication rules.
 * NOT literal atom / atomic-physics databases. Analogy only.
 *
 * Agent Identity + Checkpoint Ledger wired in 12D-11 (append-only; not a second control plane).
 * Checkpoint Ledger consumer (Command Center / offline) wired in 12D-12 (read-only).
 * ADC offline snapshot READ path (device→local_shard HOT hydrate) wired in 12D-13.
 * Quantum entanglement elsewhere = simulated pathway correlation only.
 */
import { isomorphicContentHash } from './datagene';
import { UNIVERSES_ARE_SIMULATION_LAYERS_ONLY } from './universe-ethics';

export const ATOMIC_DATA_CELL_SCHEMA_VERSION = '12d09.1' as const;

export const ATOMIC_DATA_CELL_GUARDRAILS = {
  readOnly: true as const,
  productionAutoApply: false as const,
  literalAtomicPhysicsStorage: false as const,
  /** Naming ALIGN: Atomic Data Cells are software records, never atom-DB claims. */
  atomDbClaimAllowed: false as const,
  biologicalDnaCloning: false as const,
  quantumEntanglementIsSimulatedCorrelationOnly: true as const,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  /** Fuller identity + checkpoint ledger integration. */
  agentCheckpointLedgerWire: 'WIRED' as const,
  checkpointLedgerConsumerWire: 'WIRED' as const,
  adcOfflineReadPathWire: 'WIRED' as const,
  ticketFollowUp: '12D-13' as const,
} as const;

export type AtomicDataCellReplicationRule = {
  offlineEligible: boolean;
  maxReplicas: number;
  crossTenantCopyAllowed: false;
  liveCloudSyncRequired: false;
};

export type AtomicDataCellGraphLink = {
  rel: string;
  targetCellId: string;
  /** Simulated pathway correlation weight only â€” not physical entanglement. */
  correlationWeight?: number;
};

export type AtomicDataCell = {
  cellId: string;
  tenantId: string;
  schemaVersion: typeof ATOMIC_DATA_CELL_SCHEMA_VERSION;
  /** Opaque JSON-serializable body (knowledge payload). */
  body: unknown;
  provenance: readonly string[];
  timestamp: string;
  confidence: number;
  checksum: string;
  /** Optional embedding / similarity vector (software only). */
  vector?: readonly number[];
  graphLinks: readonly AtomicDataCellGraphLink[];
  replication: AtomicDataCellReplicationRule;
  layerKind: 'SIMULATION';
  readOnly: true;
  productionAutoApply: false;
};

export type AtomicDataCellInput = {
  cellId: string;
  tenantId: string;
  body: unknown;
  provenance?: readonly string[];
  timestamp?: string;
  confidence?: number;
  vector?: readonly number[];
  graphLinks?: readonly AtomicDataCellGraphLink[];
  replication?: Partial<AtomicDataCellReplicationRule>;
};

function assertCellGuardrails(): void {
  if (ATOMIC_DATA_CELL_GUARDRAILS.literalAtomicPhysicsStorage) {
    throw new Error('literalAtomicPhysicsStorage must remain false');
  }
  if (ATOMIC_DATA_CELL_GUARDRAILS.atomDbClaimAllowed) {
    throw new Error('atomDbClaimAllowed must remain false â€” Atomic Data Cells are software records only');
  }
  if (ATOMIC_DATA_CELL_GUARDRAILS.biologicalDnaCloning) {
    throw new Error('biologicalDnaCloning must remain false');
  }
  if (!ATOMIC_DATA_CELL_GUARDRAILS.quantumEntanglementIsSimulatedCorrelationOnly) {
    throw new Error('quantum entanglement must remain simulated pathway correlation only');
  }
  if (ATOMIC_DATA_CELL_GUARDRAILS.productionAutoApply) {
    throw new Error('productionAutoApply must remain false');
  }
}

/**
 * Build a tiny addressable Atomic Data Cell with checksum + default replication rules.
 */
export function buildAtomicDataCell(input: AtomicDataCellInput): AtomicDataCell {
  assertCellGuardrails();
  if (!input.cellId || !input.tenantId) {
    throw new TypeError('cellId and tenantId are required');
  }
  const confidence = input.confidence ?? 0.5;
  if (confidence < 0 || confidence > 1) {
    throw new RangeError('confidence must be 0..1');
  }
  const timestamp = input.timestamp ?? new Date().toISOString();
  const provenance = Object.freeze([...(input.provenance ?? ['local:12d09'])]);
  const graphLinks = Object.freeze([...(input.graphLinks ?? [])]);
  const replication: AtomicDataCellReplicationRule = {
    offlineEligible: input.replication?.offlineEligible ?? true,
    maxReplicas: input.replication?.maxReplicas ?? 64,
    crossTenantCopyAllowed: false,
    liveCloudSyncRequired: false,
  };
  if (replication.maxReplicas > 64) {
    throw new RangeError('maxReplicas must not exceed FOUNDER_TWIN hard cap analogy (64)');
  }
  const checksum = isomorphicContentHash(
    JSON.stringify({
      cellId: input.cellId,
      tenantId: input.tenantId,
      body: input.body,
      provenance,
      timestamp,
      confidence,
      vector: input.vector ?? null,
      graphLinks,
      replication,
    }),
  );
  return {
    cellId: input.cellId,
    tenantId: input.tenantId,
    schemaVersion: ATOMIC_DATA_CELL_SCHEMA_VERSION,
    body: input.body,
    provenance,
    timestamp,
    confidence,
    checksum,
    vector: input.vector ? Object.freeze([...input.vector]) : undefined,
    graphLinks,
    replication,
    layerKind: 'SIMULATION',
    readOnly: true,
    productionAutoApply: false,
  };
}

/** Verify cell checksum matches canonical rebuild (integrity check). */
export function verifyAtomicDataCellChecksum(cell: AtomicDataCell): boolean {
  const rebuilt = isomorphicContentHash(
    JSON.stringify({
      cellId: cell.cellId,
      tenantId: cell.tenantId,
      body: cell.body,
      provenance: cell.provenance,
      timestamp: cell.timestamp,
      confidence: cell.confidence,
      vector: cell.vector ?? null,
      graphLinks: cell.graphLinks,
      replication: cell.replication,
    }),
  );
  return rebuilt === cell.checksum;
}

