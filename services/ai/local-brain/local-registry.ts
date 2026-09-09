import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { evaluateSandboxWrite } from './sandbox-guard';
import {
  PLATFORM_HONESTY,
  type PackageLifecycle,
  type PackageManifest,
  type PackagePermission,
  type RegistryRecord,
} from './developer-platform-types';

type RegistryStore = { records: RegistryRecord[] };

const MAX_RECORDS = 2_000;

function storePath(root: string) {
  return xivLocalPath(root, 'package-registry.json');
}

function catalogPath(root: string) {
  return xivLocalPath(root, 'marketplace-catalog.json');
}

async function load(root: string): Promise<RegistryStore> {
  const parsed = await readJsonFile<RegistryStore>(storePath(root), { records: [] });
  return { records: Array.isArray(parsed.records) ? parsed.records : [] };
}

async function save(root: string, store: RegistryStore) {
  await writeJsonFileAtomic(storePath(root), { records: store.records.slice(-MAX_RECORDS) });
}

export function emptyRegistryRecord(manifest: PackageManifest, reason: string): RegistryRecord {
  return {
    manifest,
    lifecycle: 'verified_candidate',
    grantedPermissions: [],
    authorityGranted: false,
    installedAsAuthorized: false,
    activatedLocal: false,
    quarantined: false,
    integrity: 'UNKNOWN',
    lastReason: reason,
  };
}

export async function upsertRegistryRecord(record: RegistryRecord, root = process.cwd()) {
  const store = await load(root);
  const index = store.records.findIndex((item) => item.manifest.id === record.manifest.id);
  if (index >= 0) store.records[index] = record;
  else store.records.push(record);
  await save(root, store);
  await refreshPrivateCatalog(root);
  return record;
}

export async function getRegistryRecord(packageId: string, tenantId: string, universeId: string, root = process.cwd()) {
  const store = await load(root);
  return store.records.find(
    (item) => item.manifest.id === packageId && item.manifest.tenantId === tenantId && item.manifest.universeId === universeId,
  );
}

export async function listRegistryRecords(input: {
  tenantId: string;
  universeId: string;
  root?: string;
  includeQuarantined?: boolean;
}) {
  const store = await load(input.root ?? process.cwd());
  return store.records.filter(
    (item) =>
      item.manifest.tenantId === input.tenantId &&
      item.manifest.universeId === input.universeId &&
      (input.includeQuarantined || !item.quarantined),
  );
}

export async function refreshPrivateCatalog(root = process.cwd()) {
  const store = await load(root);
  const listings = store.records
    .filter((item) => !item.quarantined && item.lifecycle !== 'integrity_failed')
    .map((item) => ({
      packageId: item.manifest.id,
      name: item.manifest.name,
      version: item.manifest.version,
      kind: item.manifest.kind,
      tenantId: item.manifest.tenantId,
      universeId: item.manifest.universeId,
      classification: item.manifest.classification,
      lifecycle: item.lifecycle,
      verifiedCandidate: true as const,
      deployed: false as const,
      published: false as const,
      customerAuthorized: false as const,
      authorityGranted: false as const,
      installedAsAuthorized: false as const,
    }));
  await writeJsonFileAtomic(catalogPath(root), { listings: listings.slice(-MAX_RECORDS), private: true, customerMarketplace: false });
  return listings;
}

export async function listPrivateCatalog(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const listings = await refreshPrivateCatalog(input.root ?? process.cwd());
  return listings.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}

export function packageDir(root: string, packageId: string) {
  return xivLocalPath(root, join('packages', packageId));
}

export async function writeSandboxFiles(input: {
  manifest: PackageManifest;
  root: string;
}) {
  const target = packageDir(input.root, input.manifest.id);
  await mkdir(target, { recursive: true });
  for (const [relative, content] of Object.entries(input.manifest.files)) {
    const sandboxPath = `.xiv-local/packages/${input.manifest.id}/${relative}`;
    const verdict = evaluateSandboxWrite({ path: sandboxPath, kind: 'file' });
    if (!verdict.allowed) {
      throw new Error(`SANDBOX_WRITE_DENIED:${verdict.reason}`);
    }
    const full = join(target, relative);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content, { encoding: 'utf8', mode: 0o600 });
  }
  return target;
}

export async function removeSandboxFiles(packageId: string, root: string) {
  await rm(packageDir(root, packageId), { recursive: true, force: true });
}

export async function activateLocalRegistry(input: {
  packageId: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const record = await getRegistryRecord(input.packageId, input.tenantId, input.universeId, root);
  if (!record) return { activated: false as const, reason: 'Package is not in the local registry.' };
  if (record.quarantined) return { activated: false as const, reason: 'Quarantined packages cannot be activated.', record };
  if (record.lifecycle !== 'installed_sandbox' && record.lifecycle !== 'activated_local') {
    return { activated: false as const, reason: `Lifecycle ${record.lifecycle} is not eligible for local activation.`, record };
  }
  const next: RegistryRecord = {
    ...record,
    lifecycle: 'activated_local',
    activatedLocal: true,
    authorityGranted: false,
    installedAsAuthorized: false,
    lastReason: 'Activated in the local registry only. Not published, deployed, or customer-authorized.',
  };
  await upsertRegistryRecord(next, root);
  return { activated: true as const, record: next, honesty: PLATFORM_HONESTY };
}

export function withLifecycle(
  record: RegistryRecord,
  lifecycle: PackageLifecycle,
  reason: string,
  extra?: Partial<RegistryRecord>,
): RegistryRecord {
  return {
    ...record,
    lifecycle,
    lastReason: reason,
    ...extra,
    authorityGranted: false,
    installedAsAuthorized: false,
    grantedPermissions: (extra?.grantedPermissions ?? record.grantedPermissions) as PackagePermission[],
  };
}
