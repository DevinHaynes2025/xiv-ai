import { packageDigest } from './package-manifest';
import type { PackageManifest, PlatformEvidenceState } from './developer-platform-types';

export function verifyPackageIntegrity(manifest: PackageManifest, payload = manifest.payload): {
  state: PlatformEvidenceState;
  expected: string;
  observed: string;
  reason: string;
} {
  const observed = packageDigest(payload);
  if (observed !== manifest.digest) {
    return {
      state: 'FAIL',
      expected: manifest.digest,
      observed,
      reason: 'Package integrity digest mismatch. Candidate is not installed.',
    };
  }
  return {
    state: 'PASS',
    expected: manifest.digest,
    observed,
    reason: 'Payload digest matches the manifest. Integrity pass is not deployment or customer authorization.',
  };
}
