import { decisionGate } from './decision-gate';
import {
  AUTHORITY_PERMISSIONS,
  BASELINE_PERMISSIONS,
  type PackageClassification,
  type PackageManifest,
  type PackagePermission,
} from './developer-platform-types';

export type PermissionDiff = {
  requested: PackagePermission[];
  grantedBaseline: PackagePermission[];
  broader: PackagePermission[];
  humanGateRequired: boolean;
  authorityGranted: false;
  reason: string;
};

export function permissionDiff(manifest: PackageManifest): PermissionDiff {
  const requested = [...manifest.requestedPermissions];
  const grantedBaseline = [...BASELINE_PERMISSIONS];
  const broader = requested.filter(
    (permission) =>
      (AUTHORITY_PERMISSIONS as readonly PackagePermission[]).includes(permission) ||
      !(BASELINE_PERMISSIONS as readonly PackagePermission[]).includes(permission),
  );
  const humanGateRequired = broader.length > 0;
  return {
    requested,
    grantedBaseline,
    broader,
    humanGateRequired,
    authorityGranted: false,
    reason: humanGateRequired
      ? `Permission diff requires a human gate: ${broader.join(', ')}. Installation never grants authority.`
      : 'Requested permissions stay inside the local sandbox baseline. Installation still does not grant authority.',
  };
}

export function classificationGate(classification: PackageClassification): {
  exportable: boolean;
  replicating: boolean;
  cloudRoutable: boolean;
  humanGateRequired: boolean;
  reason: string;
} {
  if (classification === 'sealed_founder_priority') {
    return {
      exportable: false,
      replicating: false,
      cloudRoutable: false,
      humanGateRequired: true,
      reason: 'CEO-sealed packages are non-replicating and cannot be exported or cloud-routed.',
    };
  }
  if (classification === 'restricted') {
    return {
      exportable: false,
      replicating: false,
      cloudRoutable: false,
      humanGateRequired: true,
      reason: 'Restricted classification requires a human gate and export redaction.',
    };
  }
  if (classification === 'confidential') {
    return {
      exportable: true,
      replicating: false,
      cloudRoutable: false,
      humanGateRequired: true,
      reason: 'Confidential packages stay local unless a human approves a redacted local share.',
    };
  }
  return {
    exportable: classification === 'public' || classification === 'internal',
    replicating: false,
    cloudRoutable: false,
    humanGateRequired: false,
    reason: 'Local catalog classification only. Cloud routing stays closed in this slice.',
  };
}

export function installAuthorityGate(input: {
  manifest: PackageManifest;
  humanApprovedInstall: boolean;
  humanApprovedPermissionExpansion?: boolean;
}) {
  const diff = permissionDiff(input.manifest);
  const classification = classificationGate(input.manifest.classification);
  const gate = decisionGate({
    id: `pkg-gate:${input.manifest.id}`,
    action: `install ${input.manifest.kind} ${input.manifest.name}@${input.manifest.version}`,
    consequence: diff.humanGateRequired || classification.humanGateRequired ? 'HIGH' : 'LOW',
    production: input.manifest.requestedPermissions.includes('production_capabilities'),
    financialCommitment: false,
    legalCommitment: false,
    permissionChange:
      diff.humanGateRequired || input.manifest.requestedPermissions.includes('permission_expansion'),
    externalPublication: input.manifest.published,
  });

  if (!input.humanApprovedInstall) {
    return {
      allowed: false as const,
      state: 'HUMAN_GATE' as const,
      diff,
      classification,
      decision: gate,
      authorityGranted: false as const,
      grantedPermissions: [] as PackagePermission[],
      reason: 'Human gate: sandboxed install requires explicit human approval. Approval is not customer authorization.',
    };
  }

  if (diff.humanGateRequired) {
    return {
      allowed: true as const,
      state: 'SANDBOX_ONLY' as const,
      diff,
      classification,
      decision: gate,
      authorityGranted: false as const,
      grantedPermissions: [...diff.grantedBaseline],
      reason:
        'Human approved a sandboxed install. Broader permissions, restricted data, networking, shell, and production capabilities were not granted. Installation never grants authority.',
    };
  }

  return {
    allowed: true as const,
    state: 'SANDBOX_ONLY' as const,
    diff,
    classification,
    decision: gate,
    authorityGranted: false as const,
    grantedPermissions: [...diff.grantedBaseline],
    reason: 'Human approved a sandboxed install of a baseline-permission candidate. Not deployed, published, or customer-authorized.',
  };
}

export function refusePermissionExpansion(input: { humanApprovedPermissionExpansion?: boolean }) {
  return {
    expanded: false as const,
    authorityGranted: false as const,
    evenIfHumanAsked: Boolean(input.humanApprovedPermissionExpansion),
    reason: 'This slice cannot expand package permissions. Human approval of an install is not permission expansion.',
  };
}
