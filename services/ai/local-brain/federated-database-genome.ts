/**
 * 62L-ED Module B — Federated Database Genome.
 * Built from original XIV schemas + lawful patterns only.
 * Deny proprietary DB/source copy (incl. Oracle reverse-copy).
 * “Oracle-compatible” = authorized adapter/interface contracts only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  GENOME_ORIGINAL_XIV_ONLY,
  MAX_GENOME_EVENTS,
  ORACLE_COMPATIBLE_CONTRACT_ONLY,
  PROPRIETARY_DB_COPY_DENIED,
  type EdActor,
  type EdEvidenceState,
} from './data-galaxy-industry-memory-os-types';

export type GenomeSchemaRegistration = {
  id: string;
  schemaId: string;
  source: 'original_xiv' | 'lawful_pattern' | 'proprietary_copy' | 'oracle_source';
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type ProprietaryCopyDenial = {
  id: string;
  attemptKind: 'proprietary_db_copy' | 'oracle_reverse_copy' | 'vendor_source_copy';
  status: 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type OracleCompatibleContract = {
  id: string;
  connectorId: string;
  authorizedAdapterContract: boolean;
  proprietaryCopyAttempted: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  schemas: GenomeSchemaRegistration[];
  denials: ProprietaryCopyDenial[];
  oracleContracts: OracleCompatibleContract[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'federated-database-genome.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    schemas: [],
    denials: [],
    oracleContracts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function federatedDatabaseGenomeHonesty() {
  return {
    originalXivSchemasOnly: true,
    lawfulPatternsOnly: true,
    proprietaryDbCopyDenied: true,
    oracleReverseCopyDenied: true,
    oracleCompatibleMeansAuthorizedAdapterContractsOnly: true,
    genomeNeqCopiedProprietarySource: true,
    l4AutonomyEnabled: false,
  };
}

export async function registerGenomeSchema(input: {
  schemaId: string;
  source: GenomeSchemaRegistration['source'];
  root: string;
  actor: EdActor;
}): Promise<GenomeSchemaRegistration> {
  const store = await load(input.root);
  void input.actor;
  if (store.schemas.length >= MAX_GENOME_EVENTS) {
    throw new Error('MAX_GENOME_EVENTS');
  }
  const allowed =
    input.source === 'original_xiv' || input.source === 'lawful_pattern';
  const row: GenomeSchemaRegistration = {
    id: id('edgenome'),
    schemaId: input.schemaId,
    source: input.source,
    status: allowed ? 'ok' : 'denied',
    state: allowed
      ? input.source === 'original_xiv'
        ? 'ORIGINAL_XIV_SCHEMA'
        : 'LAWFUL_PATTERN'
      : 'DENIED',
    reason: allowed ? GENOME_ORIGINAL_XIV_ONLY : PROPRIETARY_DB_COPY_DENIED,
    at: new Date().toISOString(),
  };
  store.schemas.push(row);
  await save(input.root, store);
  return row;
}

export async function denyProprietaryDbCopy(input: {
  attemptKind: ProprietaryCopyDenial['attemptKind'];
  root: string;
  actor: EdActor;
}): Promise<ProprietaryCopyDenial> {
  const store = await load(input.root);
  void input.actor;
  if (store.denials.length >= MAX_GENOME_EVENTS) {
    throw new Error('MAX_GENOME_EVENTS');
  }
  const row: ProprietaryCopyDenial = {
    id: id('edcopydeny'),
    attemptKind: input.attemptKind,
    status: 'denied',
    state: 'DENIED',
    reason: PROPRIETARY_DB_COPY_DENIED,
    at: new Date().toISOString(),
  };
  store.denials.push(row);
  await save(input.root, store);
  return row;
}

export async function registerOracleCompatibleContract(input: {
  connectorId: string;
  authorizedAdapterContract: boolean;
  proprietaryCopyAttempted?: boolean;
  root: string;
  actor: EdActor;
}): Promise<OracleCompatibleContract> {
  const store = await load(input.root);
  void input.actor;
  if (store.oracleContracts.length >= MAX_GENOME_EVENTS) {
    throw new Error('MAX_GENOME_EVENTS');
  }
  const denied =
    input.proprietaryCopyAttempted === true ||
    input.authorizedAdapterContract !== true;
  const row: OracleCompatibleContract = {
    id: id('edoracle'),
    connectorId: input.connectorId,
    authorizedAdapterContract: input.authorizedAdapterContract,
    proprietaryCopyAttempted: Boolean(input.proprietaryCopyAttempted),
    status: denied ? 'denied' : 'ok',
    state: denied ? 'DENIED' : 'ORACLE_COMPATIBLE_CONTRACT',
    reason: denied
      ? input.proprietaryCopyAttempted
        ? PROPRIETARY_DB_COPY_DENIED
        : ORACLE_COMPATIBLE_CONTRACT_ONLY
      : ORACLE_COMPATIBLE_CONTRACT_ONLY,
    at: new Date().toISOString(),
  };
  store.oracleContracts.push(row);
  await save(input.root, store);
  return row;
}
