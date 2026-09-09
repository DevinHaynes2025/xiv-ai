import type { EnterpriseEntityKind } from './enterprise-ontology';
import { validateSnapshot, type EnterpriseSnapshot } from './enterprise-ontology';

export type SchemaField = {
  name: string;
  type: string;
  store: string;
  ontologyKind?: EnterpriseEntityKind;
};

export type SchemaBridge = {
  fromStore: string;
  toStore: string;
  fromField: string;
  toField: string;
  ontologyKind: EnterpriseEntityKind;
  copiesPayload: false;
  movementBytes: 0;
};

export function bridgeSchemaFields(input: {
  from: SchemaField;
  to: SchemaField;
  ontologyKind: EnterpriseEntityKind;
}): { accepted: boolean; bridge?: SchemaBridge; fragmentation: boolean; reason: string } {
  if (input.from.type !== input.to.type && !input.ontologyKind) {
    return {
      accepted: false,
      fragmentation: true,
      reason: 'Schema fragmentation: types differ and no ontology kind was provided. Redesign the shared concept instead of copying rows.',
    };
  }
  if (input.from.store === input.to.store && input.from.name === input.to.name) {
    return {
      accepted: false,
      fragmentation: false,
      reason: 'Bridge is a no-op; query the field in place.',
    };
  }
  return {
    accepted: true,
    fragmentation: input.from.type !== input.to.type,
    bridge: {
      fromStore: input.from.store,
      toStore: input.to.store,
      fromField: input.from.name,
      toField: input.to.name,
      ontologyKind: input.ontologyKind,
      copiesPayload: false,
      movementBytes: 0,
    },
    reason: 'Ontology bridge maps concepts without moving records into a unified warehouse.',
  };
}

export function ontologySnapshotHealth(snapshot: EnterpriseSnapshot) {
  const validity = validateSnapshot(snapshot);
  const missingProvenance = snapshot.entities.filter((entity) => entity.sourceRefs.length === 0).length;
  return {
    valid: validity.valid,
    errors: validity.errors,
    missingProvenance,
    weakProvenance: missingProvenance > 0,
    copiesPayload: false as const,
  };
}
