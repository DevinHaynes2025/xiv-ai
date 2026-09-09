import { createHash, randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BP_LOCKS,
  CLONE_ISOLATION,
  GENOME_AUTHORITY_DENIED,
  GENOME_PRIVATE_DENIED,
  GENOME_SEALED_DENIED,
  GENOME_SECRET_DENIED,
  GENOME_UNAPPROVED_DENIED,
  type GenomeForbiddenKind,
  type GenomeTemplateKind,
} from './cognitive-homeostasis-types';

/**
 * Organization Digital Genome Replication — clone **approved templates only**
 * (policies, workflows, roles, skills, schemas, knowledge references, operating
 * patterns) into a **new isolated Universe**. Hard-denies silent copy of
 * secrets, private data, sealed information, or authority. Label ≠ access.
 */

export const GENOME_STORE = 'organization-digital-genome.json';

export type GenomeTemplateGene = {
  id: string;
  kind: GenomeTemplateKind;
  label: string;
  /** Content digest only — never raw secrets. */
  contentDigest: string;
  approved: true;
  /** Knowledge references only — not private payloads. */
  isReference: boolean;
  sealed: false;
  containsSecret: false;
  containsPrivateData: false;
  containsAuthority: false;
};

export type OrganizationGenomeTemplate = {
  id: string;
  orgId: string;
  tenantId: string;
  name: string;
  approved: boolean;
  genes: GenomeTemplateGene[];
  /** Source private memory stays in source universe — never cloned. */
  privateMemoryRefs: string[];
  sealedPayloads: string[];
  secrets: string[];
  authorityLevel: number;
  createdAt: string;
  productionAuthorized: false;
};

export type ClonedGenomeUniverse = {
  id: string;
  sourceOrgId: string;
  sourceTemplateId: string;
  targetOrgId: string;
  tenantId: string;
  name: string;
  isolated: true;
  genes: GenomeTemplateGene[];
  /** Explicit empty — private memory not copied. */
  privateMemory: [];
  secrets: [];
  sealedPayloads: [];
  /** Authority starts at baseline — never silently copied from source. */
  authorityLevel: 0;
  labelIsAccess: false;
  createdAt: string;
  productionAuthorized: false;
};

export type GenomeCloneDenial = {
  id: string;
  at: string;
  sourceOrgId: string;
  targetOrgId: string;
  reason: string;
  forbiddenKind?: GenomeForbiddenKind | 'unapproved_template';
};

type GenomeStore = {
  templates: OrganizationGenomeTemplate[];
  clones: ClonedGenomeUniverse[];
  denials: GenomeCloneDenial[];
};

const MAX_TEMPLATES = 2_000;
const MAX_CLONES = 2_000;
const MAX_DENIALS = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, GENOME_STORE);
}

async function load(root: string): Promise<GenomeStore> {
  const parsed = await readJsonFile<GenomeStore>(storePath(root), {
    templates: [],
    clones: [],
    denials: [],
  });
  return {
    templates: Array.isArray(parsed.templates) ? parsed.templates : [],
    clones: Array.isArray(parsed.clones) ? parsed.clones : [],
    denials: Array.isArray(parsed.denials) ? parsed.denials : [],
  };
}

async function save(root: string, store: GenomeStore) {
  await writeJsonFileAtomic(storePath(root), {
    templates: store.templates.slice(-MAX_TEMPLATES),
    clones: store.clones.slice(-MAX_CLONES),
    denials: store.denials.slice(-MAX_DENIALS),
  });
}

function digest(content: string) {
  return createHash('sha256').update(content).digest('hex').slice(0, 24);
}

function cloneUniverseId(sourceOrgId: string, targetOrgId: string) {
  const h = createHash('sha256')
    .update(`genome-clone:${sourceOrgId}:${targetOrgId}:${randomUUID()}`)
    .digest('hex')
    .slice(0, 16);
  return `genome_univ_${h}`;
}

export async function registerApprovedGenomeTemplate(input: {
  orgId: string;
  tenantId: string;
  name: string;
  genes: Array<{
    kind: GenomeTemplateKind;
    label: string;
    content: string;
    isReference?: boolean;
  }>;
  /** Source-only — never eligible for clone. */
  privateMemoryRefs?: string[];
  sealedPayloads?: string[];
  secrets?: string[];
  authorityLevel?: number;
  approved?: boolean;
  root?: string;
}): Promise<{ accepted: true; template: OrganizationGenomeTemplate } | { accepted: false; reason: string }> {
  if (!input.orgId || !input.tenantId) {
    return { accepted: false, reason: 'ORG_AND_TENANT_REQUIRED' };
  }
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const now = new Date().toISOString();

  const genes: GenomeTemplateGene[] = input.genes.map((g, i) => ({
    id: `gene_${digest(`${input.orgId}:${g.kind}:${g.label}:${i}`)}`,
    kind: g.kind,
    label: g.label,
    contentDigest: digest(g.content),
    approved: true,
    isReference: g.isReference ?? g.kind === 'knowledge_references',
    sealed: false,
    containsSecret: false,
    containsPrivateData: false,
    containsAuthority: false,
  }));

  const template: OrganizationGenomeTemplate = {
    id: randomUUID(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    name: input.name,
    approved: input.approved !== false,
    genes,
    privateMemoryRefs: input.privateMemoryRefs ?? [],
    sealedPayloads: input.sealedPayloads ?? [],
    secrets: input.secrets ?? [],
    authorityLevel: input.authorityLevel ?? 0,
    createdAt: now,
    productionAuthorized: false,
  };

  store.templates.push(template);
  await save(root, store);
  return { accepted: true, template };
}

export type GenomeCloneInput = {
  sourceTemplateId: string;
  sourceOrgId: string;
  targetOrgId: string;
  tenantId: string;
  name: string;
  /** Hard-deny probes. */
  attemptCopySecrets?: boolean;
  attemptCopyPrivateData?: boolean;
  attemptCopySealed?: boolean;
  attemptCopyAuthority?: boolean;
  /** Force unapproved path. */
  forceUnapproved?: boolean;
  root?: string;
};

export type GenomeCloneResult =
  | {
      accepted: true;
      clone: ClonedGenomeUniverse;
      reason: string;
      stripped: GenomeForbiddenKind[];
      isolatedFromSourcePrivateMemory: true;
      labelIsAccess: false;
      productionAuthorization: false;
    }
  | {
      accepted: false;
      reason: string;
      denial: GenomeCloneDenial;
      productionAuthorization: false;
    };

export async function replicateOrganizationGenome(
  input: GenomeCloneInput,
): Promise<GenomeCloneResult> {
  const root = input.root ?? process.cwd();
  const store = await load(root);

  const deny = async (
    reason: string,
    forbiddenKind?: GenomeForbiddenKind | 'unapproved_template',
  ): Promise<GenomeCloneResult> => {
    const denial: GenomeCloneDenial = {
      id: randomUUID(),
      at: new Date().toISOString(),
      sourceOrgId: input.sourceOrgId,
      targetOrgId: input.targetOrgId,
      reason,
      forbiddenKind,
    };
    store.denials.push(denial);
    await save(root, store);
    return { accepted: false, reason, denial, productionAuthorization: false };
  };

  if (!input.sourceTemplateId || !input.sourceOrgId || !input.targetOrgId || !input.tenantId) {
    return deny('SOURCE_TARGET_TENANT_REQUIRED');
  }

  const template = store.templates.find(
    (t) => t.id === input.sourceTemplateId && t.orgId === input.sourceOrgId,
  );
  if (!template) {
    return deny('GENOME_TEMPLATE_NOT_FOUND');
  }

  if (!template.approved || input.forceUnapproved === true) {
    return deny(GENOME_UNAPPROVED_DENIED, 'unapproved_template');
  }

  // Secrets / private / sealed / authority are never copied; explicit attempts DENIED.
  if (input.attemptCopySecrets === true) {
    return deny(GENOME_SECRET_DENIED, 'secrets');
  }
  if (input.attemptCopyPrivateData === true) {
    return deny(GENOME_PRIVATE_DENIED, 'private_data');
  }
  if (input.attemptCopySealed === true) {
    return deny(GENOME_SEALED_DENIED, 'sealed_information');
  }
  if (input.attemptCopyAuthority === true) {
    return deny(GENOME_AUTHORITY_DENIED, 'authority');
  }

  // Always strip forbidden categories even when not probed.
  const stripped: GenomeForbiddenKind[] = [
    'secrets',
    'private_data',
    'sealed_information',
    'authority',
  ];

  const clone: ClonedGenomeUniverse = {
    id: cloneUniverseId(input.sourceOrgId, input.targetOrgId),
    sourceOrgId: input.sourceOrgId,
    sourceTemplateId: template.id,
    targetOrgId: input.targetOrgId,
    tenantId: input.tenantId,
    name: input.name,
    isolated: true,
    genes: template.genes.map((g) => ({ ...g })),
    privateMemory: [],
    secrets: [],
    sealedPayloads: [],
    authorityLevel: 0,
    labelIsAccess: false,
    createdAt: new Date().toISOString(),
    productionAuthorized: false,
  };

  store.clones.push(clone);
  await save(root, store);

  return {
    accepted: true,
    clone,
    reason: `${CLONE_ISOLATION}; approved template genes only; forbidden categories stripped.`,
    stripped,
    isolatedFromSourcePrivateMemory: true,
    labelIsAccess: false,
    productionAuthorization: false,
  };
}

export async function getClonedGenomeUniverse(input: {
  cloneId: string;
  requestingOrgId: string;
  root?: string;
}): Promise<
  | { allowed: true; clone: ClonedGenomeUniverse }
  | { allowed: false; reason: string }
> {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const clone = store.clones.find((c) => c.id === input.cloneId);
  if (!clone) return { allowed: false, reason: 'CLONE_NOT_FOUND' };
  if (clone.targetOrgId !== input.requestingOrgId) {
    return { allowed: false, reason: 'CROSS_ORG_CLONE_ACCESS_DENIED' };
  }
  return { allowed: true, clone };
}

export async function attemptReadSourcePrivateMemoryFromClone(input: {
  cloneId: string;
  sourcePrivateRef: string;
  requestingOrgId: string;
  root?: string;
}): Promise<{ allowed: false; reason: string; privateMemoryCopied: false }> {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const clone = store.clones.find((c) => c.id === input.cloneId);
  const denial: GenomeCloneDenial = {
    id: randomUUID(),
    at: new Date().toISOString(),
    sourceOrgId: clone?.sourceOrgId ?? 'unknown',
    targetOrgId: input.requestingOrgId,
    reason: CLONE_ISOLATION,
    forbiddenKind: 'private_data',
  };
  store.denials.push(denial);
  await save(root, store);
  return { allowed: false, reason: CLONE_ISOLATION, privateMemoryCopied: false };
}

export function organizationGenomeHonesty() {
  return {
    locks: BP_LOCKS,
    approvedTemplatesOnly: BP_LOCKS.GENOME_APPROVED_TEMPLATES_ONLY,
    silentSecretCopy: BP_LOCKS.GENOME_SILENT_SECRET_COPY,
    silentPrivateCopy: BP_LOCKS.GENOME_SILENT_PRIVATE_COPY,
    silentSealedCopy: BP_LOCKS.GENOME_SILENT_SEALED_COPY,
    silentAuthorityCopy: BP_LOCKS.GENOME_SILENT_AUTHORITY_COPY,
    cloneCreatesIsolatedUniverse: BP_LOCKS.CLONE_CREATES_ISOLATED_UNIVERSE,
    labelIsAccess: BP_LOCKS.LABEL_IS_ACCESS,
    productionAuthorization: false as const,
  };
}
