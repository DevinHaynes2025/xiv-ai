import { randomUUID } from 'node:crypto';

import {
  BA_LOCKS,
  type IndexCandidate,
  type MigrationCandidate,
  type RollbackCandidate,
  type SchemaCandidate,
  type WorkloadClass,
} from './neural-database-types';

export type WorkloadProfile = {
  class: WorkloadClass;
  readHeavy: boolean;
  writeHeavy: boolean;
  analytical: boolean;
  latencySensitive: boolean;
  notes: string;
};

export function classifyWorkload(input: {
  statementsPerSecond?: number;
  analyticalShare?: number;
  vectorQueries?: boolean;
  timeSeries?: boolean;
  documentHeavy?: boolean;
  graphHeavy?: boolean;
  streaming?: boolean;
}): WorkloadProfile {
  if (input.streaming) {
    return {
      class: 'streaming',
      readHeavy: true,
      writeHeavy: true,
      analytical: false,
      latencySensitive: true,
      notes: 'Streaming workload classification is advisory only.',
    };
  }
  if (input.vectorQueries) {
    return {
      class: 'vector_search',
      readHeavy: true,
      writeHeavy: false,
      analytical: false,
      latencySensitive: true,
      notes: 'Vector search classification does not imply a live vector engine.',
    };
  }
  if (input.timeSeries) {
    return {
      class: 'time_series',
      readHeavy: true,
      writeHeavy: true,
      analytical: true,
      latencySensitive: false,
      notes: 'Time-series classification is a candidate hint.',
    };
  }
  if (input.documentHeavy) {
    return {
      class: 'document',
      readHeavy: true,
      writeHeavy: true,
      analytical: false,
      latencySensitive: false,
      notes: 'Document workload hint only.',
    };
  }
  if (input.graphHeavy) {
    return {
      class: 'graph',
      readHeavy: true,
      writeHeavy: false,
      analytical: true,
      latencySensitive: false,
      notes: 'Graph workload hint only.',
    };
  }
  const analyticalShare = input.analyticalShare ?? 0;
  const sps = input.statementsPerSecond ?? 0;
  if (analyticalShare >= 0.6 && sps > 100) {
    return {
      class: 'htap',
      readHeavy: true,
      writeHeavy: true,
      analytical: true,
      latencySensitive: true,
      notes: 'HTAP classification is a recommendation input, not a deploy decision.',
    };
  }
  if (analyticalShare >= 0.6) {
    return {
      class: 'olap',
      readHeavy: true,
      writeHeavy: false,
      analytical: true,
      latencySensitive: false,
      notes: 'OLAP classification is advisory.',
    };
  }
  if (sps > 50) {
    return {
      class: 'oltp',
      readHeavy: true,
      writeHeavy: true,
      analytical: false,
      latencySensitive: true,
      notes: 'OLTP classification is advisory.',
    };
  }
  return {
    class: 'mixed',
    readHeavy: true,
    writeHeavy: false,
    analytical: analyticalShare > 0.2,
    latencySensitive: false,
    notes: 'Mixed / unknown workload; prefer conservative candidates.',
  };
}

export function compileSchemaCandidate(input: {
  table: string;
  columns: Array<{ name: string; type: string; nullable?: boolean }>;
  primaryKey?: string[];
}): SchemaCandidate {
  if (!input.table.trim() || input.columns.length === 0) {
    throw new Error('SCHEMA_CANDIDATE_REQUIRES_TABLE_AND_COLUMNS');
  }
  return {
    id: `sch_${randomUUID()}`,
    table: input.table.trim(),
    columns: input.columns.map((c) => ({ ...c, name: c.name.trim() })),
    primaryKey: input.primaryKey,
    evidence: 'RECOMMENDED',
    productionApplied: false,
    automaticAlterAllowed: false,
  };
}

export function compileIndexCandidate(input: {
  table: string;
  columns: string[];
  kind?: IndexCandidate['kind'];
  workload?: WorkloadClass;
}): IndexCandidate {
  if (!input.table.trim() || input.columns.length === 0) {
    throw new Error('INDEX_CANDIDATE_REQUIRES_TABLE_AND_COLUMNS');
  }
  let kind: IndexCandidate['kind'] = input.kind ?? 'btree';
  if (!input.kind) {
    if (input.workload === 'vector_search') kind = 'vector';
    else if (input.workload === 'document') kind = 'gin';
    else if (input.columns.length > 1) kind = 'covering';
  }
  return {
    id: `idx_${randomUUID()}`,
    table: input.table.trim(),
    columns: input.columns.map((c) => c.trim()),
    kind,
    evidence: 'RECOMMENDED',
    productionApplied: false,
    automaticAlterAllowed: false,
  };
}

export type PartitionShardSim = {
  strategy: 'range' | 'hash' | 'list' | 'none';
  shardCount: number;
  simulated: true;
  productionApplied: false;
  notes: string;
};

export function simulatePartitionSharding(input: {
  workload: WorkloadClass;
  estimatedRows: number;
}): PartitionShardSim {
  if (input.estimatedRows < 100_000) {
    return {
      strategy: 'none',
      shardCount: 1,
      simulated: true,
      productionApplied: false,
      notes: 'Small dataset — partition/shard simulation recommends none. Simulation ≠ production DDL.',
    };
  }
  if (input.workload === 'time_series' || input.workload === 'olap') {
    return {
      strategy: 'range',
      shardCount: Math.min(16, Math.max(2, Math.ceil(input.estimatedRows / 1_000_000))),
      simulated: true,
      productionApplied: false,
      notes: 'Range partition simulation only. Automatic production partitioning denied.',
    };
  }
  return {
    strategy: 'hash',
    shardCount: Math.min(8, Math.max(2, Math.ceil(input.estimatedRows / 500_000))),
    simulated: true,
    productionApplied: false,
    notes: 'Hash shard simulation only. L4 autonomy disabled.',
  };
}

export type CachePolicyRecommendation = {
  policy: 'none' | 'lru' | 'ttl' | 'write_through' | 'read_through';
  ttlSeconds?: number;
  evidence: 'RECOMMENDED';
  productionApplied: false;
  notes: string;
};

export function recommendCachePolicy(input: { workload: WorkloadClass; sealed: boolean }): CachePolicyRecommendation {
  if (input.sealed) {
    return {
      policy: 'none',
      evidence: 'RECOMMENDED',
      productionApplied: false,
      notes: 'Sealed data must not enter ordinary caches. Cache policy = none.',
    };
  }
  if (input.workload === 'oltp' || input.workload === 'vector_search') {
    return {
      policy: 'lru',
      ttlSeconds: 60,
      evidence: 'RECOMMENDED',
      productionApplied: false,
      notes: 'LRU cache recommendation for latency-sensitive reads. Not auto-deployed.',
    };
  }
  if (input.workload === 'olap') {
    return {
      policy: 'ttl',
      ttlSeconds: 300,
      evidence: 'RECOMMENDED',
      productionApplied: false,
      notes: 'TTL cache recommendation for analytical reads.',
    };
  }
  return {
    policy: 'read_through',
    ttlSeconds: 120,
    evidence: 'RECOMMENDED',
    productionApplied: false,
    notes: 'Conservative read-through recommendation.',
  };
}

export type CompressionPolicyRecommendation = {
  codec: 'none' | 'zstd' | 'lz4' | 'dictionary';
  evidence: 'RECOMMENDED';
  productionApplied: false;
  notes: string;
};

export function recommendCompressionPolicy(input: {
  workload: WorkloadClass;
  storageBound: boolean;
}): CompressionPolicyRecommendation {
  if (input.workload === 'oltp' && !input.storageBound) {
    return {
      codec: 'none',
      evidence: 'RECOMMENDED',
      productionApplied: false,
      notes: 'OLTP prefers no compression unless storage-bound.',
    };
  }
  if (input.workload === 'olap' || input.workload === 'time_series') {
    return {
      codec: 'zstd',
      evidence: 'RECOMMENDED',
      productionApplied: false,
      notes: 'Analytical/time-series compression recommendation (zstd). Not auto-applied.',
    };
  }
  return {
    codec: input.storageBound ? 'lz4' : 'dictionary',
    evidence: 'RECOMMENDED',
    productionApplied: false,
    notes: 'Balanced compression recommendation.',
  };
}

export function compileSchemaEvolutionCandidate(input: {
  table: string;
  addColumns?: Array<{ name: string; type: string }>;
  dropColumns?: string[];
}): SchemaCandidate {
  const columns = [
    ...(input.addColumns ?? []).map((c) => ({ ...c, nullable: true })),
    ...(input.dropColumns ?? []).map((name) => ({ name, type: 'TO_DROP', nullable: true })),
  ];
  const candidate = compileSchemaCandidate({
    table: input.table,
    columns: columns.length ? columns : [{ name: '_noop', type: 'void' }],
  });
  return { ...candidate, evidence: 'RECOMMENDED' };
}

export function compileMigrationDryRun(input: {
  fromVersion: string;
  toVersion: string;
  steps: string[];
}): MigrationCandidate {
  if (BA_LOCKS.AUTO_PRODUCTION_DDL) {
    throw new Error('INVARIANT_BROKEN_AUTO_PRODUCTION_DDL_MUST_BE_FALSE');
  }
  return {
    id: `mig_${randomUUID()}`,
    fromVersion: input.fromVersion,
    toVersion: input.toVersion,
    steps: [...input.steps],
    dryRunOnly: true,
    productionApplied: false,
    automaticAlterAllowed: false,
    evidence: 'DRY_RUN_TESTED',
  };
}

export function compileRollbackCandidate(input: {
  migrationId: string;
  steps: string[];
}): RollbackCandidate {
  return {
    id: `rb_${randomUUID()}`,
    migrationId: input.migrationId,
    steps: [...input.steps],
    productionApplied: false,
    automaticAlterAllowed: false,
    evidence: 'RECOMMENDED',
  };
}

export function honestyLocksIntact(): boolean {
  return (
    BA_LOCKS.L4_AUTONOMY_ENABLED === false &&
    BA_LOCKS.AUTO_PRODUCTION_DDL === false &&
    BA_LOCKS.AUTO_PRODUCTION_DML === false &&
    BA_LOCKS.AUTO_PRODUCTION_SCHEMA_CHANGE === false &&
    BA_LOCKS.RECOMMENDATION_IS_NOT_DEPLOY === true &&
    BA_LOCKS.SEALED_DATA_WEAKENING === false &&
    BA_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    BA_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    BA_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false
  );
}
