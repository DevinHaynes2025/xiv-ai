import { createHash } from 'node:crypto';

export type RuntimeClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
export type RuntimeRecordKind = 'AGENT_STATE' | 'TASK' | 'MESSAGE' | 'MEETING' | 'LESSON' | 'CHECKPOINT';

export interface RuntimeRecord {
  tenantId: string;
  id: string;
  kind: RuntimeRecordKind;
  classification: RuntimeClassification;
  payload: unknown;
  createdAt: string;
  updatedAt: string;
  sha256: string;
}

export interface FileBackedRuntimeStoreConfig {
  rootDir: string;
  encryptedAtRest: boolean;
  externalNetworkAllowed: false;
}

export class FileBackedRuntimeStore {
  constructor(readonly config: FileBackedRuntimeStoreConfig) {
    if (!config.encryptedAtRest) throw new Error('encrypted-at-rest-required');
    if (config.externalNetworkAllowed !== false) throw new Error('external-network-must-be-disabled');
  }

  createRecord(input: Omit<RuntimeRecord, 'sha256'>): RuntimeRecord {
    if (!input.tenantId || !input.id) throw new Error('tenant-and-id-required');
    const sha256 = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    return { ...input, sha256 };
  }

  canExternalSync(record: RuntimeRecord): boolean {
    return record.classification !== 'TOP_SECRET' && this.config.externalNetworkAllowed === false;
  }
}
