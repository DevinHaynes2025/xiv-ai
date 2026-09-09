import type { PackageManifest, PlatformEvidenceState } from './developer-platform-types';
import { listRegistryRecords } from './local-registry';

export type DependencyResolution = {
  state: PlatformEvidenceState;
  resolved: Array<{ name: string; version: string; packageId: string }>;
  missing: Array<{ name: string; version: string }>;
  cyclic: boolean;
  reason: string;
};

function versionSatisfied(have: string, want: string) {
  return have === want || want === '*' || want === 'any';
}

export async function resolvePackageDependencies(input: {
  manifest: PackageManifest;
  visiting?: string[];
  root?: string;
}): Promise<DependencyResolution> {
  const visiting = input.visiting ?? [];
  if (visiting.includes(input.manifest.name)) {
    return {
      state: 'FAIL',
      resolved: [],
      missing: [],
      cyclic: true,
      reason: `Dependency cycle involving ${input.manifest.name}.`,
    };
  }
  const records = await listRegistryRecords({
    tenantId: input.manifest.tenantId,
    universeId: input.manifest.universeId,
    root: input.root,
  });
  const resolved: DependencyResolution['resolved'] = [];
  const missing: DependencyResolution['missing'] = [];
  for (const dep of input.manifest.dependencies) {
    const match = records.find(
      (record) =>
        record.manifest.name === dep.name &&
        versionSatisfied(record.manifest.version, dep.version) &&
        !record.quarantined &&
        (record.lifecycle === 'installed_sandbox' || record.lifecycle === 'activated_local'),
    );
    if (!match) {
      missing.push(dep);
      continue;
    }
    resolved.push({ name: dep.name, version: match.manifest.version, packageId: match.manifest.id });
  }
  if (missing.length > 0) {
    return {
      state: 'UNAVAILABLE',
      resolved,
      missing,
      cyclic: false,
      reason: 'One or more dependencies are not installed locally.',
    };
  }
  return {
    state: 'PASS',
    resolved,
    missing,
    cyclic: false,
    reason: 'Local dependencies resolved. Resolution is not a production publish.',
  };
}
