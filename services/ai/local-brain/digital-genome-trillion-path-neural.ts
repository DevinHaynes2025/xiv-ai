/**
 * 62L-CQ Digital Genome & Trillion-Path Neural Infrastructure —
 * Digital Genome branching (approved templates; strip secrets/sealed/authority);
 * compressed trillion-path neural graphs as sparse logical infrastructure
 * (benchmark honesty — not physical trillion processes).
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CQ_LOCKS,
  GENOME_STRIP_SECRETS_SEALED_AUTHORITY,
  HONESTY_BANNER,
  LOGICAL_NEURAL_PATH_CEILING,
  MAX_ACTIVE_NEURAL_PATH_WALKERS,
  TRILLION_SCALE_LOGICAL_ONLY,
  type CqActor,
} from './offline-universe-quantum-genome-types';

export type GenomeGeneKind =
  | 'policy'
  | 'workflow'
  | 'role'
  | 'skill'
  | 'schema'
  | 'knowledge_reference'
  | 'operating_pattern';

export type GenomeTemplate = {
  id: string;
  orgId: string;
  tenantId: string;
  name: string;
  approved: boolean;
  geneDigests: string[];
  /** Source-only — never branched. */
  secrets: string[];
  sealedPayloads: string[];
  authorityLevel: number;
  createdAt: string;
  productionAuthorized: false;
};

export type GenomeBranch = {
  id: string;
  sourceTemplateId: string;
  orgId: string;
  tenantId: string;
  name: string;
  geneDigests: string[];
  secrets: [];
  sealedPayloads: [];
  authorityLevel: 0;
  stripped: Array<'secrets' | 'sealed' | 'authority'>;
  status: 'branched' | 'denied';
  reason: string;
  createdAt: string;
  productionAuthorized: false;
};

export type NeuralPathCatalog = {
  id: string;
  orgId: string;
  tenantId: string;
  logicalPathCount: number;
  activeWalkers: number;
  processesSpawned: 0;
  compressed: true;
  sparseLogical: true;
  physicalClaimVerified: false;
  createdAt: string;
  productionAuthorized: false;
};

type Store = {
  templates: GenomeTemplate[];
  branches: GenomeBranch[];
  neuralCatalogs: NeuralPathCatalog[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'digital-genome-trillion-path-neural.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    templates: [],
    branches: [],
    neuralCatalogs: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function digest(content: string) {
  return createHash('sha256').update(content).digest('hex').slice(0, 24);
}

export function digitalGenomeNeuralHonesty() {
  return {
    banner: HONESTY_BANNER,
    approvedTemplatesOnly: CQ_LOCKS.GENOME_APPROVED_TEMPLATES_ONLY,
    silentCopySecrets: CQ_LOCKS.GENOME_SILENT_COPY_SECRETS,
    silentCopySealed: CQ_LOCKS.GENOME_SILENT_COPY_SEALED,
    silentCopyAuthority: CQ_LOCKS.GENOME_SILENT_COPY_AUTHORITY,
    trillionScaleIsLogical: CQ_LOCKS.TRILLION_SCALE_IS_LOGICAL_ADDRESS_SPACE,
    maxActiveWalkers: MAX_ACTIVE_NEURAL_PATH_WALKERS,
  };
}

export async function registerApprovedGenomeTemplate(input: {
  orgId: string;
  tenantId: string;
  name: string;
  genes: Array<{ kind: GenomeGeneKind; label: string; content: string }>;
  secrets?: string[];
  sealedPayloads?: string[];
  authorityLevel?: number;
  approved?: boolean;
  root: string;
  actor: CqActor;
}): Promise<GenomeTemplate> {
  const store = await load(input.root);
  const template: GenomeTemplate = {
    id: id('gnt'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    name: input.name.trim() || 'genome-template',
    approved: input.approved !== false,
    geneDigests: input.genes.map((g) => digest(`${g.kind}:${g.label}:${g.content}`)),
    secrets: input.secrets ?? [],
    sealedPayloads: input.sealedPayloads ?? [],
    authorityLevel: input.authorityLevel ?? 0,
    createdAt: new Date().toISOString(),
    productionAuthorized: false,
  };
  void input.actor;
  store.templates.push(template);
  await save(input.root, store);
  return template;
}

export async function branchDigitalGenome(input: {
  sourceTemplateId: string;
  orgId: string;
  tenantId: string;
  name: string;
  /** Hostile probes — always stripped / denied if sole intent. */
  attemptCopySecrets?: boolean;
  attemptCopySealed?: boolean;
  attemptCopyAuthority?: boolean;
  forceUnapproved?: boolean;
  root: string;
  actor: CqActor;
}): Promise<GenomeBranch> {
  const store = await load(input.root);
  const template = store.templates.find((t) => t.id === input.sourceTemplateId);

  if (!template || !template.approved || input.forceUnapproved) {
    const denied: GenomeBranch = {
      id: id('gnb'),
      sourceTemplateId: input.sourceTemplateId,
      orgId: input.orgId,
      tenantId: input.tenantId,
      name: input.name,
      geneDigests: [],
      secrets: [],
      sealedPayloads: [],
      authorityLevel: 0,
      stripped: ['secrets', 'sealed', 'authority'],
      status: 'denied',
      reason: 'GENOME_UNAPPROVED_TEMPLATE_DENIED',
      createdAt: new Date().toISOString(),
      productionAuthorized: false,
    };
    void input.actor;
    store.branches.push(denied);
    await save(input.root, store);
    return denied;
  }

  // Always strip secrets/sealed/authority — even if probe requests copy.
  const stripped: GenomeBranch['stripped'] = ['secrets', 'sealed', 'authority'];
  void input.attemptCopySecrets;
  void input.attemptCopySealed;
  void input.attemptCopyAuthority;

  const branch: GenomeBranch = {
    id: id('gnb'),
    sourceTemplateId: template.id,
    orgId: input.orgId,
    tenantId: input.tenantId,
    name: input.name.trim() || `${template.name}-branch`,
    geneDigests: [...template.geneDigests],
    secrets: [],
    sealedPayloads: [],
    authorityLevel: 0,
    stripped,
    status: 'branched',
    reason: GENOME_STRIP_SECRETS_SEALED_AUTHORITY,
    createdAt: new Date().toISOString(),
    productionAuthorized: false,
  };
  void input.actor;
  store.branches.push(branch);
  await save(input.root, store);
  return branch;
}

export async function createTrillionPathNeuralCatalog(input: {
  orgId: string;
  tenantId: string;
  /** Logical sparse path count (compressed address space). */
  logicalPathCount: number;
  root: string;
  actor: CqActor;
}): Promise<NeuralPathCatalog> {
  const store = await load(input.root);
  const logical = Math.min(
    Math.max(0, Math.floor(input.logicalPathCount)),
    LOGICAL_NEURAL_PATH_CEILING,
  );
  const catalog: NeuralPathCatalog = {
    id: id('npc'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    logicalPathCount: logical,
    activeWalkers: 0,
    processesSpawned: 0,
    compressed: true,
    sparseLogical: true,
    physicalClaimVerified: false,
    createdAt: new Date().toISOString(),
    productionAuthorized: false,
  };
  void input.actor;
  store.neuralCatalogs.push(catalog);
  await save(input.root, store);
  return catalog;
}

export async function activateNeuralPathWalkers(input: {
  catalogId: string;
  count: number;
  root: string;
  actor: CqActor;
}): Promise<
  | { accepted: true; activeWalkers: number; processesSpawned: 0; reason: string }
  | { accepted: false; reason: string; status: 'DENIED' }
> {
  const store = await load(input.root);
  const catalog = store.neuralCatalogs.find((c) => c.id === input.catalogId);
  if (!catalog) {
    return { accepted: false, reason: 'NEURAL_CATALOG_NOT_FOUND', status: 'DENIED' };
  }
  const requested = Math.max(0, Math.floor(input.count));
  const next = catalog.activeWalkers + requested;
  if (next > MAX_ACTIVE_NEURAL_PATH_WALKERS) {
    return {
      accepted: false,
      reason: `ACTIVATION_BOUNDED_MAX_WALKERS_${MAX_ACTIVE_NEURAL_PATH_WALKERS}`,
      status: 'DENIED',
    };
  }
  catalog.activeWalkers = next;
  void input.actor;
  await save(input.root, store);
  return {
    accepted: true,
    activeWalkers: catalog.activeWalkers,
    processesSpawned: 0,
    reason: TRILLION_SCALE_LOGICAL_ONLY,
  };
}
