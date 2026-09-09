/**
 * Multi-location storage / resilience — governed replication only.
 * DATA MAY ONLY MOVE TO DESTINATION ALLOWED BY REPLICATION POLICY.
 * SEALED_LOCAL never silent cloud. TENANT_PRIVATE never global training data.
 */

import { createHash } from 'node:crypto';
import {
  GOB_LOCKS,
  STORAGE_LOCATION_CLASSES,
  type RevocationState,
  type StorageLocationClass,
  type TenantScope,
} from './types.ts';

export type StorageObject = {
  objectId: string;
  owner: string;
  tenantId: string;
  universeId: string;
  dataClass: string;
  source: string;
  rights: string;
  retention: string;
  replicationPolicy: readonly StorageLocationClass[];
  encryptionState: 'NONE' | 'AT_REST' | 'SEALED';
  version: string;
  hash: string;
  freshness: string;
  revocationState: RevocationState;
  location: StorageLocationClass;
};

export type ReplicationResult =
  | { replicated: true; object: StorageObject; destination: StorageLocationClass }
  | { replicated: false; denied: true; reason: string };

export type StorageResilience = {
  put(input: {
    owner: string;
    scope: TenantScope;
    dataClass: string;
    source: string;
    rights: string;
    retention: string;
    replicationPolicy: readonly StorageLocationClass[];
    encryptionState: StorageObject['encryptionState'];
    version: string;
    freshness: string;
    location: StorageLocationClass;
    content: string;
  }): { stored: true; object: StorageObject };
  replicate(input: {
    objectId: string;
    scope: TenantScope;
    destination: StorageLocationClass;
  }): ReplicationResult;
  get(objectId: string, scope: TenantScope): StorageObject | null;
  list(scope: TenantScope): readonly StorageObject[];
  attemptSilentCloudSealedLocal(objectId: string, scope: TenantScope): ReplicationResult;
  attemptTenantPrivateGlobalTraining(objectId: string, scope: TenantScope): ReplicationResult;
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createStorageResilience(): StorageResilience {
  const byId = new Map<string, StorageObject>();

  return {
    put(input) {
      const hash = sha256(input.content);
      const object: StorageObject = {
        objectId: `obj-${hash.slice(0, 16)}`,
        owner: input.owner,
        tenantId: input.scope.tenantId,
        universeId: input.scope.universeId,
        dataClass: input.dataClass,
        source: input.source,
        rights: input.rights,
        retention: input.retention,
        replicationPolicy: [...input.replicationPolicy],
        encryptionState: input.encryptionState,
        version: input.version,
        hash,
        freshness: input.freshness,
        revocationState: 'ACTIVE',
        location: input.location,
      };
      byId.set(object.objectId, object);
      return { stored: true, object };
    },

    replicate(input) {
      const obj = this.get(input.objectId, input.scope);
      if (!obj) {
        return {
          replicated: false,
          denied: true,
          reason: 'OBJECT_NOT_FOUND',
        };
      }
      if (obj.revocationState === 'REVOKED') {
        return {
          replicated: false,
          denied: true,
          reason: 'OBJECT_REVOKED',
        };
      }
      if (!obj.replicationPolicy.includes(input.destination)) {
        return {
          replicated: false,
          denied: true,
          reason: `REPLICATION_POLICY_DENIES:${input.destination}`,
        };
      }
      if (
        obj.location === 'SEALED_LOCAL' &&
        input.destination === 'AUTHORIZED_CLOUD' &&
        GOB_LOCKS.SEALED_LOCAL_SILENT_CLOUD === false
      ) {
        return {
          replicated: false,
          denied: true,
          reason: 'SEALED_LOCAL_NEVER_SILENT_CLOUD',
        };
      }
      if (
        (obj.location === 'TENANT_PRIVATE' ||
          obj.dataClass === 'TENANT_PRIVATE') &&
        input.destination === 'AUTHORIZED_CLOUD' &&
        !obj.replicationPolicy.includes('AUTHORIZED_CLOUD')
      ) {
        return {
          replicated: false,
          denied: true,
          reason: 'TENANT_PRIVATE_NEVER_GLOBAL_TRAINING',
        };
      }
      const copy: StorageObject = {
        ...obj,
        objectId: `obj-${sha256(`${obj.objectId}:${input.destination}`).slice(0, 16)}`,
        location: input.destination,
        version: `${obj.version}+${input.destination}`,
      };
      byId.set(copy.objectId, copy);
      return {
        replicated: true,
        object: copy,
        destination: input.destination,
      };
    },

    get(objectId, scope) {
      const obj = byId.get(objectId);
      if (!obj) return null;
      if (
        obj.tenantId !== scope.tenantId ||
        obj.universeId !== scope.universeId
      ) {
        return null;
      }
      return obj;
    },

    list(scope) {
      return [...byId.values()].filter(
        (o) =>
          o.tenantId === scope.tenantId && o.universeId === scope.universeId,
      );
    },

    attemptSilentCloudSealedLocal(objectId, scope) {
      const obj = this.get(objectId, scope);
      if (!obj) {
        return {
          replicated: false,
          denied: true,
          reason: 'OBJECT_NOT_FOUND',
        };
      }
      return {
        replicated: false,
        denied: true,
        reason: 'SEALED_LOCAL_NEVER_SILENT_CLOUD',
      };
    },

    attemptTenantPrivateGlobalTraining(objectId, scope) {
      const obj = this.get(objectId, scope);
      if (!obj) {
        return {
          replicated: false,
          denied: true,
          reason: 'OBJECT_NOT_FOUND',
        };
      }
      if (GOB_LOCKS.TENANT_PRIVATE_GLOBAL_TRAINING === false) {
        return {
          replicated: false,
          denied: true,
          reason: 'TENANT_PRIVATE_NEVER_GLOBAL_TRAINING',
        };
      }
      return {
        replicated: false,
        denied: true,
        reason: 'TENANT_PRIVATE_NEVER_GLOBAL_TRAINING',
      };
    },
  };
}

export { STORAGE_LOCATION_CLASSES };
