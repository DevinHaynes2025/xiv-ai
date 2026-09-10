import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CompanyBrainRecord } from './persistent-company-brain';

export interface CompanyBrainSnapshot {
  version: 1;
  tenantId: string;
  updatedAt: string;
  records: CompanyBrainRecord[];
}

export const COMPANY_BRAIN_STORE_GUARDRAILS = Object.freeze({
  offlineFirst: true,
  atomicReplace: true,
  crossTenantRestoreAllowed: false,
  topSecretExportAllowed: false,
  productionDatabaseMutationAllowed: false,
});

export async function saveCompanyBrainSnapshot(
  filePath: string,
  snapshot: CompanyBrainSnapshot,
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(snapshot, null, 2), 'utf8');
  await fs.rename(tmp, filePath);
}

export async function loadCompanyBrainSnapshot(
  filePath: string,
  tenantId: string,
): Promise<CompanyBrainSnapshot | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as CompanyBrainSnapshot;
    if (parsed.version !== 1 || parsed.tenantId !== tenantId) return null;
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
