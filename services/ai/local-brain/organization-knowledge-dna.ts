import { createHash, randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BO_LOCKS,
  CROSS_ORG_DNA_DENIED,
  type KnowledgeDnaKind,
} from './superbrain-neuroplasticity-types';

/**
 * Organization Knowledge DNA — versioned per-org representation of durable
 * knowledge, policies, workflows, lessons, skills, evidence lineage, and
 * operating patterns. Isolation across orgs; no default raw global pooling.
 */

export const KNOWLEDGE_DNA_STORE = 'organization-knowledge-dna.json';

export type KnowledgeDnaGene = {
  id: string;
  kind: KnowledgeDnaKind;
  label: string;
  contentDigest: string;
  evidenceLineage: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationKnowledgeDna = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  version: number;
  genes: KnowledgeDnaGene[];
  isolated: true;
  rawGlobalPooling: false;
  productionAuthorized: false;
  createdAt: string;
  updatedAt: string;
};

export type CrossOrgDnaLeakAttempt = {
  id: string;
  at: string;
  fromOrgId: string;
  toOrgId: string;
  actorId: string;
  allowed: false;
  reason: string;
};

type DnaStore = {
  genomes: OrganizationKnowledgeDna[];
  crossOrgDenials: CrossOrgDnaLeakAttempt[];
};

const MAX_GENOMES = 2_000;
const MAX_DENIALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, KNOWLEDGE_DNA_STORE);
}

async function load(root: string): Promise<DnaStore> {
  const parsed = await readJsonFile<DnaStore>(storePath(root), {
    genomes: [],
    crossOrgDenials: [],
  });
  return {
    genomes: Array.isArray(parsed.genomes) ? parsed.genomes : [],
    crossOrgDenials: Array.isArray(parsed.crossOrgDenials) ? parsed.crossOrgDenials : [],
  };
}

async function save(root: string, store: DnaStore) {
  await writeJsonFileAtomic(storePath(root), {
    genomes: store.genomes.slice(-MAX_GENOMES),
    crossOrgDenials: store.crossOrgDenials.slice(-MAX_DENIALS),
  });
}

function digest(content: string) {
  return createHash('sha256').update(content).digest('hex').slice(0, 24);
}

export async function upsertOrganizationKnowledgeDna(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  genes: Array<{
    kind: KnowledgeDnaKind;
    label: string;
    content: string;
    evidenceLineage?: string[];
  }>;
  root?: string;
}): Promise<{ accepted: true; dna: OrganizationKnowledgeDna } | { accepted: false; reason: string }> {
  if (!input.orgId || !input.tenantId || !input.universeId) {
    return { accepted: false, reason: 'ORG_TENANT_UNIVERSE_REQUIRED' };
  }
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const now = new Date().toISOString();
  let dna = store.genomes.find(
    (g) => g.orgId === input.orgId && g.universeId === input.universeId,
  );

  const genes: KnowledgeDnaGene[] = input.genes.map((g, i) => ({
    id: `gene_${digest(`${input.orgId}:${g.kind}:${g.label}:${i}`)}`,
    kind: g.kind,
    label: g.label,
    contentDigest: digest(g.content),
    evidenceLineage: g.evidenceLineage ?? [],
    version: 1,
    createdAt: now,
    updatedAt: now,
  }));

  if (!dna) {
    dna = {
      id: randomUUID(),
      orgId: input.orgId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      version: 1,
      genes,
      isolated: true,
      rawGlobalPooling: false,
      productionAuthorized: false,
      createdAt: now,
      updatedAt: now,
    };
    store.genomes.push(dna);
  } else {
    dna.version += 1;
    dna.updatedAt = now;
    for (const gene of genes) {
      const existing = dna.genes.find((x) => x.kind === gene.kind && x.label === gene.label);
      if (existing) {
        existing.contentDigest = gene.contentDigest;
        existing.evidenceLineage = gene.evidenceLineage;
        existing.version += 1;
        existing.updatedAt = now;
      } else {
        dna.genes.push(gene);
      }
    }
  }

  await save(root, store);
  return { accepted: true, dna };
}

export async function readOrganizationKnowledgeDna(input: {
  orgId: string;
  universeId: string;
  /** Requesting org — must match target org or access is DENIED. */
  requestingOrgId: string;
  actorId?: string;
  root?: string;
}): Promise<
  | { allowed: true; dna: OrganizationKnowledgeDna }
  | { allowed: false; reason: string; denial: CrossOrgDnaLeakAttempt }
> {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  if (input.requestingOrgId !== input.orgId) {
    const denial: CrossOrgDnaLeakAttempt = {
      id: randomUUID(),
      at: new Date().toISOString(),
      fromOrgId: input.requestingOrgId,
      toOrgId: input.orgId,
      actorId: input.actorId ?? 'unknown',
      allowed: false,
      reason: CROSS_ORG_DNA_DENIED,
    };
    store.crossOrgDenials.push(denial);
    await save(root, store);
    return { allowed: false, reason: CROSS_ORG_DNA_DENIED, denial };
  }

  const dna = store.genomes.find(
    (g) => g.orgId === input.orgId && g.universeId === input.universeId,
  );
  if (!dna) {
    return {
      allowed: false,
      reason: 'KNOWLEDGE_DNA_NOT_FOUND',
      denial: {
        id: randomUUID(),
        at: new Date().toISOString(),
        fromOrgId: input.requestingOrgId,
        toOrgId: input.orgId,
        actorId: input.actorId ?? 'unknown',
        allowed: false,
        reason: 'KNOWLEDGE_DNA_NOT_FOUND',
      },
    };
  }

  return { allowed: true, dna };
}

export function knowledgeDnaHonesty() {
  return {
    locks: BO_LOCKS,
    orgIsolation: BO_LOCKS.ORG_ISOLATION,
    crossOrgDnaPoolingDefault: BO_LOCKS.CROSS_ORG_DNA_POOLING_DEFAULT,
    rawGlobalKnowledgePooling: BO_LOCKS.RAW_GLOBAL_KNOWLEDGE_POOLING,
    productionAuthorization: false as const,
  };
}
