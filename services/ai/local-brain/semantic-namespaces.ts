import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';

export type SemanticNamespaceRecord = {
  id: string;
  iri: string;
  tenantId: string;
  universeId: string;
  domain: string;
  label: string;
  schemaRef: string;
  createdAt: string;
  productionAuthorization: false;
};

export type NamespaceCollision =
  | { kind: 'iri_schema_conflict'; iri: string; existingId: string; incomingLabel: string; reason: string }
  | { kind: 'label_alias'; label: string; existingIri: string; incomingIri: string; reason: string }
  | { kind: 'cross_tenant_iri'; iri: string; reason: string };

type NamespaceStore = { namespaces: SemanticNamespaceRecord[] };

const MAX_NAMESPACES = 4_000;

function storePath(root: string) {
  return xivLocalPath(root, 'semantic-namespaces.json');
}

async function load(root: string): Promise<NamespaceStore> {
  const parsed = await readJsonFile<NamespaceStore>(storePath(root), { namespaces: [] });
  return { namespaces: Array.isArray(parsed.namespaces) ? parsed.namespaces : [] };
}

async function save(root: string, store: NamespaceStore) {
  await writeJsonFileAtomic(storePath(root), { namespaces: store.namespaces.slice(-MAX_NAMESPACES) });
}

export function canonicalNamespaceIri(input: {
  tenantId: string;
  universeId: string;
  domain: string;
  name: string;
}) {
  const domain = input.domain.trim().toLowerCase();
  const name = input.name.trim().toLowerCase().replace(/\s+/g, '-');
  return `xiv://${input.tenantId}/${input.universeId}/${domain}/${name}`;
}

export function detectNamespaceCollisions(
  existing: SemanticNamespaceRecord[],
  candidate: Pick<SemanticNamespaceRecord, 'iri' | 'tenantId' | 'universeId' | 'label' | 'schemaRef'>,
): NamespaceCollision[] {
  const collisions: NamespaceCollision[] = [];
  for (const item of existing) {
    if (item.iri === candidate.iri && (item.tenantId !== candidate.tenantId || item.universeId !== candidate.universeId)) {
      collisions.push({
        kind: 'cross_tenant_iri',
        iri: candidate.iri,
        reason: 'Namespace IRIs are tenant/Universe scoped and cannot be reused across enterprises.',
      });
    }
    if (item.iri === candidate.iri && item.schemaRef !== candidate.schemaRef) {
      collisions.push({
        kind: 'iri_schema_conflict',
        iri: candidate.iri,
        existingId: item.id,
        incomingLabel: candidate.label,
        reason: 'Same IRI with a different schema is a namespace collision, not an automatic merge.',
      });
    }
    if (
      item.label.trim().toLowerCase() === candidate.label.trim().toLowerCase() &&
      item.iri !== candidate.iri &&
      item.tenantId === candidate.tenantId &&
      item.universeId === candidate.universeId
    ) {
      collisions.push({
        kind: 'label_alias',
        label: candidate.label,
        existingIri: item.iri,
        incomingIri: candidate.iri,
        reason: 'Same display label maps to different IRIs; treat as an alias, not a merge of raw data.',
      });
    }
  }
  return collisions;
}

export async function registerSemanticNamespace(input: {
  tenantId: string;
  universeId: string;
  domain: string;
  name: string;
  label: string;
  schemaRef: string;
  root?: string;
}): Promise<
  | { accepted: true; namespace: SemanticNamespaceRecord; collisions: NamespaceCollision[] }
  | { accepted: false; collisions: NamespaceCollision[]; reason: string }
> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.domain.trim() || !input.name.trim() || !input.label.trim() || !input.schemaRef.trim()) {
    throw new Error('NAMESPACE_METADATA_REQUIRED');
  }
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const iri = canonicalNamespaceIri(input);
  const collisions = detectNamespaceCollisions(store.namespaces, {
    iri,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: input.label,
    schemaRef: input.schemaRef,
  });
  const blocking = collisions.filter((item) => item.kind !== 'label_alias');
  if (blocking.length > 0) {
    return { accepted: false, collisions, reason: 'NAMESPACE_COLLISION' };
  }
  const duplicate = store.namespaces.find(
    (item) => item.iri === iri && item.schemaRef === input.schemaRef && item.tenantId === input.tenantId,
  );
  if (duplicate) {
    return { accepted: true, namespace: duplicate, collisions };
  }
  const namespace: SemanticNamespaceRecord = {
    id: `ns_${randomUUID()}`,
    iri,
    tenantId: input.tenantId,
    universeId: input.universeId,
    domain: input.domain.trim().toLowerCase(),
    label: input.label.trim(),
    schemaRef: input.schemaRef.trim(),
    createdAt: new Date().toISOString(),
    productionAuthorization: false,
  };
  store.namespaces.push(namespace);
  await save(root, store);
  return { accepted: true, namespace, collisions };
}

export async function listSemanticNamespaces(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  return store.namespaces.filter(
    (item) => item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
}
