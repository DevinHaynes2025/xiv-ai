import { createHash, randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AUTHORITY_PERMISSIONS,
  type PackageClassification,
  type PackageHardwareClass,
  type PackageKind,
  type PackageManifest,
  type PackageOsClass,
  type PackagePermission,
} from './developer-platform-types';

type ManifestStore = { manifests: PackageManifest[] };

const MAX_MANIFESTS = 2_000;

function storePath(root: string) {
  return xivLocalPath(root, 'package-manifests.json');
}

export function packageDigest(payload: string) {
  return createHash('sha256').update(payload).digest('hex');
}

export function parsePackageManifest(input: {
  tenantId: string;
  universeId: string;
  name: string;
  version?: string;
  kind?: PackageKind;
  payload: string;
  dependencies?: Array<{ name: string; version: string }>;
  requestedPermissions?: PackagePermission[];
  classification?: PackageClassification;
  os?: PackageOsClass[];
  hardware?: PackageHardwareClass[];
  files?: Record<string, string>;
  digest?: string;
}): PackageManifest {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.name.trim() || !input.payload.trim()) throw new Error('PACKAGE_NAME_AND_PAYLOAD_REQUIRED');
  const payload = input.payload.trim().slice(0, 32_000);
  return {
    id: `pkg_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    name: input.name.trim(),
    version: input.version?.trim() || '0.0.1',
    kind: input.kind ?? 'app',
    payload,
    digest: input.digest ?? packageDigest(payload),
    dependencies: (input.dependencies ?? []).map((dep) => ({ name: dep.name.trim(), version: dep.version.trim() })),
    requestedPermissions: [...(input.requestedPermissions ?? ['local_sandbox_read', 'local_sandbox_write'])],
    classification: input.classification ?? 'internal',
    os: [...(input.os ?? ['linux', 'windows', 'macos'])],
    hardware: [...(input.hardware ?? ['cpu'])],
    files: { ...(input.files ?? { 'README.txt': payload }) },
    verifiedCandidate: true,
    deployed: false,
    published: false,
    customerAuthorized: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
}

export function manifestRequestsAuthority(manifest: PackageManifest) {
  return manifest.requestedPermissions.some((permission) =>
    (AUTHORITY_PERMISSIONS as readonly PackagePermission[]).includes(permission),
  );
}

export async function recordPackageManifest(manifest: PackageManifest, root = process.cwd()) {
  const store = await readJsonFile<ManifestStore>(storePath(root), { manifests: [] });
  const manifests = Array.isArray(store.manifests) ? store.manifests : [];
  manifests.push(manifest);
  await writeJsonFileAtomic(storePath(root), { manifests: manifests.slice(-MAX_MANIFESTS) });
  return manifest;
}

export async function listPackageManifests(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const store = await readJsonFile<ManifestStore>(storePath(input.root ?? process.cwd()), { manifests: [] });
  const manifests = Array.isArray(store.manifests) ? store.manifests : [];
  return manifests.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}
