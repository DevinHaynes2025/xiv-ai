import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  emptyRegistryRecord,
  getRegistryRecord,
  packageDir,
  removeSandboxFiles,
  upsertRegistryRecord,
  withLifecycle,
  writeSandboxFiles,
} from './local-registry';
import { installAuthorityGate, refusePermissionExpansion } from './permission-classification-gate';
import { verifyPackageIntegrity } from './package-integrity';
import { resolvePackageDependencies } from './package-dependencies';
import { resolvePackageCompatibility } from './package-compatibility';
import type { PackageManifest, PlatformEvidenceState, RegistryRecord } from './developer-platform-types';

export type InstallPlan = {
  packageId: string;
  version: string;
  sandboxPath: string;
  humanGateRequired: boolean;
  authorityGranted: false;
  installedAsAuthorized: false;
  reason: string;
};

export type InstallResult = {
  state: PlatformEvidenceState | 'HUMAN_GATE';
  record: RegistryRecord;
  plan: InstallPlan;
  rolledBack: boolean;
  authorityGranted: false;
  installedAsAuthorized: false;
  reason: string;
};

async function snapshotFiles(packageId: string, root: string) {
  const dir = packageDir(root, packageId);
  try {
    const readme = await readFile(join(dir, 'README.txt'), 'utf8');
    return { README: readme };
  } catch {
    return null;
  }
}

async function restoreSnapshot(packageId: string, snapshot: { README: string } | null, root: string) {
  if (!snapshot) {
    await removeSandboxFiles(packageId, root);
    return;
  }
  await mkdir(packageDir(root, packageId), { recursive: true });
  await writeFile(join(packageDir(root, packageId), 'README.txt'), snapshot.README, { encoding: 'utf8', mode: 0o600 });
}

export function planLocalInstall(manifest: PackageManifest, root: string): InstallPlan {
  return {
    packageId: manifest.id,
    version: manifest.version,
    sandboxPath: `.xiv-local/packages/${manifest.id}`,
    humanGateRequired: true,
    authorityGranted: false,
    installedAsAuthorized: false,
    reason: 'Local sandbox install plan only. Human gate is mandatory. Plan is not authority.',
  };
}

export async function transactionalInstall(input: {
  manifest: PackageManifest;
  humanApprovedInstall: boolean;
  humanApprovedPermissionExpansion?: boolean;
  forceHealthFail?: boolean;
  root?: string;
}): Promise<InstallResult> {
  const root = input.root ?? process.cwd();
  const existing = (await getRegistryRecord(input.manifest.id, input.manifest.tenantId, input.manifest.universeId, root))
    ?? emptyRegistryRecord(input.manifest, 'Verified candidate registered. Not deployed.');
  const plan = planLocalInstall(input.manifest, root);
  const snapshot = await snapshotFiles(input.manifest.id, root);
  const previous = existing.installedVersion;

  const integrity = verifyPackageIntegrity(input.manifest);
  if (integrity.state === 'FAIL') {
    const record = withLifecycle(existing, 'integrity_failed', integrity.reason, { integrity: 'FAIL' });
    await upsertRegistryRecord(record, root);
    return {
      state: 'FAIL',
      record,
      plan,
      rolledBack: false,
      authorityGranted: false,
      installedAsAuthorized: false,
      reason: integrity.reason,
    };
  }

  const deps = await resolvePackageDependencies({ manifest: input.manifest, root });
  if (deps.state !== 'PASS') {
    const record = withLifecycle(existing, 'verified_candidate', deps.reason, { integrity: integrity.state });
    await upsertRegistryRecord(record, root);
    return {
      state: deps.state,
      record,
      plan,
      rolledBack: false,
      authorityGranted: false,
      installedAsAuthorized: false,
      reason: deps.reason,
    };
  }

  const compatibility = await resolvePackageCompatibility({ manifest: input.manifest });
  if (compatibility.state !== 'PASS') {
    const record = withLifecycle(existing, 'verified_candidate', compatibility.reason, { integrity: integrity.state });
    await upsertRegistryRecord(record, root);
    return {
      state: compatibility.state,
      record,
      plan,
      rolledBack: false,
      authorityGranted: false,
      installedAsAuthorized: false,
      reason: compatibility.reason,
    };
  }

  const gate = installAuthorityGate({
    manifest: input.manifest,
    humanApprovedInstall: input.humanApprovedInstall,
    humanApprovedPermissionExpansion: input.humanApprovedPermissionExpansion,
  });
  refusePermissionExpansion({ humanApprovedPermissionExpansion: input.humanApprovedPermissionExpansion });
  if (!gate.allowed) {
    const record = withLifecycle(existing, 'human_gate', gate.reason, {
      integrity: integrity.state,
      grantedPermissions: [],
    });
    await upsertRegistryRecord(record, root);
    return {
      state: 'HUMAN_GATE',
      record,
      plan,
      rolledBack: false,
      authorityGranted: false,
      installedAsAuthorized: false,
      reason: gate.reason,
    };
  }

  try {
    await writeSandboxFiles({ manifest: input.manifest, root });
  } catch (error) {
    await restoreSnapshot(input.manifest.id, snapshot, root);
    const record = withLifecycle(existing, previous ? 'installed_sandbox' : 'verified_candidate', String(error), {
      integrity: integrity.state,
    });
    await upsertRegistryRecord(record, root);
    return {
      state: 'FAIL',
      record,
      plan,
      rolledBack: Boolean(snapshot),
      authorityGranted: false,
      installedAsAuthorized: false,
      reason: `Sandbox write failed: ${String(error)}`,
    };
  }

  const healthOk = input.forceHealthFail !== true && Object.keys(input.manifest.files).length > 0;
  if (!healthOk) {
    await restoreSnapshot(input.manifest.id, snapshot, root);
    const record = withLifecycle(existing, snapshot ? 'rolled_back' : 'health_failed', 'Post-install health/test failed. Transaction rolled back.', {
      integrity: integrity.state,
      grantedPermissions: gate.grantedPermissions,
      previousVersion: previous,
      installedVersion: snapshot ? previous : undefined,
    });
    await upsertRegistryRecord(record, root);
    return {
      state: 'FAIL',
      record,
      plan,
      rolledBack: true,
      authorityGranted: false,
      installedAsAuthorized: false,
      reason: record.lastReason,
    };
  }

  const record = withLifecycle(existing, 'installed_sandbox', gate.reason, {
    integrity: 'PASS',
    grantedPermissions: gate.grantedPermissions,
    installedVersion: input.manifest.version,
    previousVersion: previous,
    activatedLocal: false,
  });
  await upsertRegistryRecord(record, root);
  return {
    state: 'PASS',
    record,
    plan,
    rolledBack: false,
    authorityGranted: false,
    installedAsAuthorized: false,
    reason: 'Sandboxed install completed. Not installed as authorized. Not deployed or published.',
  };
}

export async function rollbackInstall(input: {
  packageId: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const record = await getRegistryRecord(input.packageId, input.tenantId, input.universeId, root);
  if (!record) return { rolledBack: false as const, reason: 'No registry record to roll back.' };
  await removeSandboxFiles(input.packageId, root);
  const next = withLifecycle(record, 'rolled_back', 'Human or health-triggered rollback removed the sandbox files.', {
    activatedLocal: false,
    installedVersion: undefined,
  });
  await upsertRegistryRecord(next, root);
  return { rolledBack: true as const, record: next, authorityGranted: false as const };
}

export async function quarantinePackage(input: {
  packageId: string;
  tenantId: string;
  universeId: string;
  reason: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const record = await getRegistryRecord(input.packageId, input.tenantId, input.universeId, root);
  if (!record) return { quarantined: false as const, reason: 'Package not found.' };
  const next = withLifecycle(record, 'quarantined', input.reason, {
    quarantined: true,
    activatedLocal: false,
  });
  await upsertRegistryRecord(next, root);
  return { quarantined: true as const, record: next, authorityGranted: false as const, installedAsAuthorized: false as const };
}

export async function updatePackage(input: {
  current: RegistryRecord;
  nextManifest: PackageManifest;
  humanApprovedInstall: boolean;
  forceHealthFail?: boolean;
  root?: string;
}) {
  return transactionalInstall({
    manifest: { ...input.nextManifest, id: input.current.manifest.id },
    humanApprovedInstall: input.humanApprovedInstall,
    forceHealthFail: input.forceHealthFail,
    root: input.root,
  });
}
