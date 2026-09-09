import type { BusinessEntity, BusinessRelationship } from './types';

export function createInMemoryGraph() {
  const entities: BusinessEntity[] = [];
  const relationships: BusinessRelationship[] = [];
  return {
    persisted: false as const,
    addEntity(entity: BusinessEntity) {
      entities.push({ ...entity, persisted: false });
    },
    addRelationship(relationship: BusinessRelationship) {
      relationships.push({ ...relationship, persisted: false });
    },
    list() {
      return { entities: [...entities], relationships: [...relationships], persisted: false as const };
    },
  };
}

export type { BusinessEntity, BusinessEntityKind, BusinessRelationship, BusinessRelationshipKind } from './types';
