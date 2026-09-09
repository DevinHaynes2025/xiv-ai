/**
 * XIV Digital DNA — clone XIV-OWNED portable structure only.
 * NEVER clone vendor proprietary DBs, private infra, trade secrets,
 * firmware, restricted source, private chip IP, cross-tenant customer data.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GOB_LOCKS } from './types.ts';

export const DNA_PORTABLE_CATEGORIES = [
  'schemas',
  'ontologies',
  'agentManifests',
  'policyManifests',
  'workflowTemplates',
  'knowledgeGraphSchemas',
  'skillDefinitions',
  'benchmarkSchemas',
  'taskContracts',
  'dataLineage',
  'runtimeManifests',
  'configPatterns',
] as const;

export type DnaPortableCategory = (typeof DNA_PORTABLE_CATEGORIES)[number];

export const DNA_FORBIDDEN_CLONE_TARGETS = [
  'vendor_proprietary_databases',
  'private_infrastructure',
  'trade_secrets',
  'firmware',
  'restricted_source',
  'private_chip_ip',
  'cross_tenant_customer_data',
] as const;

export type XivDnaManifest = {
  dnaVersion: string;
  schemas: readonly string[];
  ontologies: readonly string[];
  skills: readonly string[];
  workflows: readonly string[];
  policies: readonly string[];
  runtimeContracts: readonly string[];
  compatibility: {
    minOrchestration: string;
    platforms: readonly string[];
  };
  sourceRights: 'XIV_OWNED_PORTABLE_ONLY';
  tests: readonly string[];
  hash: string;
  createdAt: string;
  rollbackVersion: string | null;
  forbiddenCloneTargets: typeof DNA_FORBIDDEN_CLONE_TARGETS;
};

export type DnaCloneResult =
  | { cloned: true; manifest: XivDnaManifest; path: string }
  | { cloned: false; denied: true; reason: string };

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function dnaDir(repoRoot?: string): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return repoRoot
    ? join(repoRoot, 'services/ai/orchestration/dna')
    : join(here, 'dna');
}

export function buildXivDnaManifest(input?: {
  dnaVersion?: string;
  rollbackVersion?: string | null;
}): XivDnaManifest {
  const dnaVersion = input?.dnaVersion ?? '1.0.0';
  const createdAt = new Date().toISOString();
  const body = {
    dnaVersion,
    schemas: [
      'agent-contract.schema.json',
      'message-envelope.schema.json',
      'checkpoint.schema.json',
      'offline-pack.schema.json',
      'storage-object.schema.json',
    ],
    ontologies: [
      'kg-pathway.ontology.json',
      'task-class.ontology.json',
      'compute-truth.ontology.json',
    ],
    skills: [
      'local-search.skill.json',
      'knowledge-retrieval.skill.json',
      'code-analysis.skill.json',
      'task-planning.skill.json',
      'evidence-review.skill.json',
    ],
    workflows: [
      'offline-research.workflow.json',
      'checkpoint-resume.workflow.json',
      'sync-revocation-first.workflow.json',
    ],
    policies: [
      'tenant-universe-isolation.policy.json',
      'replication-governance.policy.json',
      'no-hidden-cot.policy.json',
      'l4-autonomy-false.policy.json',
    ],
    runtimeContracts: [
      'local-worker.contract.json',
      'heartbeat.contract.json',
      'return-receipt.contract.json',
      'compute-adapter.contract.json',
    ],
    compatibility: {
      minOrchestration: '1.0.0',
      platforms: ['linux', 'windows', 'darwin'],
    },
    sourceRights: 'XIV_OWNED_PORTABLE_ONLY' as const,
    tests: ['phase62lgob-local-first.test.ts'],
    createdAt,
    rollbackVersion: input?.rollbackVersion ?? null,
    forbiddenCloneTargets: DNA_FORBIDDEN_CLONE_TARGETS,
  };
  const hash = sha256(JSON.stringify(body));
  return { ...body, hash };
}

export function attemptForbiddenClone(
  target: (typeof DNA_FORBIDDEN_CLONE_TARGETS)[number],
): DnaCloneResult {
  void target;
  if (
    GOB_LOCKS.CLONE_VENDOR_PROPRIETARY_DB === false &&
    GOB_LOCKS.CLONE_PRIVATE_INFRA_TRADE_SECRETS === false &&
    GOB_LOCKS.CLONE_FIRMWARE_RESTRICTED_SOURCE === false &&
    GOB_LOCKS.CLONE_PRIVATE_CHIP_IP === false &&
    GOB_LOCKS.CLONE_CROSS_TENANT_CUSTOMER_DATA === false
  ) {
    return {
      cloned: false,
      denied: true,
      reason: `FORBIDDEN_CLONE_TARGET:${target}`,
    };
  }
  return {
    cloned: false,
    denied: true,
    reason: 'LOCK_VIOLATION_FORBIDDEN_CLONE',
  };
}

export function writeXivDnaManifest(repoRoot?: string): DnaCloneResult {
  if (GOB_LOCKS.CLONE_VENDOR_PROPRIETARY_DB) {
    return {
      cloned: false,
      denied: true,
      reason: 'LOCK_VIOLATION',
    };
  }
  const dir = dnaDir(repoRoot);
  mkdirSync(dir, { recursive: true });
  const manifest = buildXivDnaManifest({ dnaVersion: '1.0.0', rollbackVersion: null });
  const path = join(dir, 'XIV_DNA_MANIFEST.json');
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  // Write portable stub schemas (XIV-owned structure only).
  const stubs: Record<string, unknown> = {
    'agent-contract.schema.json': {
      $id: 'xiv://dna/agent-contract',
      title: 'AgentContract',
      type: 'object',
      required: [
        'agentId',
        'agentType',
        'homeUniverseId',
        'tenantId',
        'missionId',
        'taskId',
        'allowedTools',
        'allowedDataClasses',
        'computeBudget',
        'storageBudget',
        'returnPath',
        'expiry',
        'revocationState',
      ],
    },
    'message-envelope.schema.json': {
      $id: 'xiv://dna/message-envelope',
      title: 'MessageEnvelope',
      type: 'object',
      required: [
        'messageId',
        'missionId',
        'taskId',
        'senderAgentId',
        'receiverAgentId',
        'tenantId',
        'homeUniverseId',
        'purpose',
        'dataClass',
        'payloadType',
        'signatureHash',
      ],
    },
    'offline-pack.schema.json': {
      $id: 'xiv://dna/offline-pack',
      title: 'OfflinePackManifest',
      type: 'object',
      required: [
        'packId',
        'packVersion',
        'rights',
        'hash',
        'revocationState',
        'tenantScope',
      ],
    },
  };
  for (const [name, content] of Object.entries(stubs)) {
    writeFileSync(join(dir, name), `${JSON.stringify(content, null, 2)}\n`, 'utf8');
  }

  return { cloned: true, manifest, path };
}

export function readXivDnaManifest(repoRoot?: string): XivDnaManifest | null {
  const path = join(dnaDir(repoRoot), 'XIV_DNA_MANIFEST.json');
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as XivDnaManifest;
}

export function validateXivDnaManifest(
  manifest: XivDnaManifest,
): { valid: true } | { valid: false; reason: string } {
  if (manifest.sourceRights !== 'XIV_OWNED_PORTABLE_ONLY') {
    return { valid: false, reason: 'SOURCE_RIGHTS_MUST_BE_XIV_OWNED' };
  }
  if (!manifest.dnaVersion || !manifest.hash) {
    return { valid: false, reason: 'MISSING_VERSION_OR_HASH' };
  }
  for (const cat of DNA_PORTABLE_CATEGORIES) {
    void cat;
  }
  return { valid: true };
}
