/**
 * US-PLG-01 â€” Plugin marketplace install (signed).
 * In-memory marketplace stub; signed packages later.
 * WAITING_SIGNING when signing unbound / no real verifier.
 * Never claim packages are cryptographically verified without a real verifier.
 * Install proposals requireApproval; L4 false; no production mutations.
 */

export const PLUGIN_MARKETPLACE_POLICY = {
  l4Autonomy: false as const,
  productionMutation: false as const,
  requiresApproval: true as const,
  cryptographicallyVerified: false as const,
  marketplaceMode: 'in_memory_stub' as const,
  signingMode: 'waiting_real_verifier' as const,
  label: 'PLUGIN_MARKETPLACE_IN_MEMORY_STUB',
} as const;

/** Signing stays WAITING_SIGNING until a real verifier is bound â€” never invent verification. */
export type PluginSigningGate = 'WAITING_SIGNING' | 'STUB_UNSIGNED';

export type PluginPackageKind = 'tool' | 'workflow' | 'connector' | 'ui_extension';

export type PluginSignatureStatus = {
  gate: PluginSigningGate;
  /** Always false until a real cryptographic verifier exists. */
  cryptographicallyVerified: false;
  /** Honest null â€” no forged signature digest. */
  signatureDigest: null;
  /** Honest null â€” no forged signer identity. */
  signerId: null;
  note: string;
};

export type PluginMarketplacePackage = {
  id: string;
  name: string;
  kind: PluginPackageKind;
  version: string;
  publisher: string;
  /** Explicit: in-memory stub listing only â€” not a signed production package. */
  stubOnly: true;
  liveSignedPackage: false;
  signature: PluginSignatureStatus;
};

export type PluginInstallProposal = {
  id: string;
  packageId: string;
  packageName: string;
  proposedAt: string;
  tenantId: string;
  status: 'pending_approval' | 'approved_session' | 'rejected';
  requiresApproval: true;
  /** Install never mutates production â€” session proposal only. */
  productionMutation: false;
  l4Autonomy: false;
  /** Signature honesty carried onto the proposal. */
  cryptographicallyVerified: false;
  signatureGate: PluginSigningGate;
  note: string;
};

export type PluginMarketplaceView = {
  status: 'READY' | 'WAITING_SIGNING' | 'WAITING_DATA';
  role: 'builder';
  l4Autonomy: false;
  productionMutation: false;
  requiresApproval: true;
  cryptographicallyVerified: false;
  marketplaceMode: 'in_memory_stub';
  signingGate: PluginSigningGate | 'WAITING_SIGNING';
  /** Active tenant scope; null when marketplace unbound. */
  tenantScope: string | null;
  /** null when signing/marketplace unbound â€” honest empty; never invent verified packages. */
  packages: PluginMarketplacePackage[] | null;
  /** Install proposals in session (requireApproval always). */
  proposals: PluginInstallProposal[];
  note: string;
};

const WAITING_SIGNATURE: PluginSignatureStatus = {
  gate: 'WAITING_SIGNING',
  cryptographicallyVerified: false,
  signatureDigest: null,
  signerId: null,
  note: 'WAITING_SIGNING â€” no real cryptographic verifier is bound; packages are not claimed verified.',
};

const STUB_UNSIGNED_SIGNATURE: PluginSignatureStatus = {
  gate: 'STUB_UNSIGNED',
  cryptographicallyVerified: false,
  signatureDigest: null,
  signerId: null,
  note: 'STUB_UNSIGNED â€” in-memory stub listing only; not cryptographically verified (real signed packages later).',
};

/** Builtin in-memory stub packages â€” session demo only; never claimed signed/verified. */
export const BUILTIN_STUB_PACKAGES: readonly Omit<PluginMarketplacePackage, 'signature'>[] = [
  {
    id: 'stub-plugin-ops-brief-tools',
    name: 'Ops Brief Tools',
    kind: 'tool',
    version: '0.1.0-stub',
    publisher: 'xiv-stub-publisher',
    stubOnly: true,
    liveSignedPackage: false,
  },
  {
    id: 'stub-plugin-approval-workflow',
    name: 'Approval Workflow Pack',
    kind: 'workflow',
    version: '0.1.0-stub',
    publisher: 'xiv-stub-publisher',
    stubOnly: true,
    liveSignedPackage: false,
  },
  {
    id: 'stub-plugin-csv-connector',
    name: 'CSV Connector Extension',
    kind: 'connector',
    version: '0.1.0-stub',
    publisher: 'xiv-stub-publisher',
    stubOnly: true,
    liveSignedPackage: false,
  },
  {
    id: 'stub-plugin-builder-ui',
    name: 'Builder UI Extension',
    kind: 'ui_extension',
    version: '0.1.0-stub',
    publisher: 'xiv-stub-publisher',
    stubOnly: true,
    liveSignedPackage: false,
  },
] as const;

type SessionMarketplace = {
  boundAt: string;
  tenantId: string;
  packages: PluginMarketplacePackage[];
  proposals: PluginInstallProposal[];
};

const globalStore = globalThis as typeof globalThis & {
  __xivPluginMarketplace?: SessionMarketplace | null;
};

function withHonestSignature(
  row: Omit<PluginMarketplacePackage, 'signature'>,
): PluginMarketplacePackage {
  return {
    ...row,
    signature: { ...STUB_UNSIGNED_SIGNATURE },
  };
}

export function resetPluginMarketplaceSession() {
  globalStore.__xivPluginMarketplace = null;
}

export function pluginMarketplaceAllowsL4(): false {
  return false;
}

export function pluginMarketplaceAllowsProductionMutation(): false {
  return false;
}

export function pluginMarketplaceRequiresApproval(): true {
  return true;
}

export function pluginMarketplaceClaimsCryptographicVerification(): false {
  return false;
}

export function isPluginMarketplaceBound(): boolean {
  return Boolean(globalStore.__xivPluginMarketplace);
}

/**
 * Bind the in-memory marketplace stub for a tenant/org scope.
 * Explicit demo action only â€” does not invent cryptographic verification.
 */
export function bindInMemoryPluginMarketplace(input: { tenantId: string }): SessionMarketplace {
  const tenantId = (input.tenantId ?? '').trim();
  if (!tenantId) {
    throw new Error('tenant_required â€” in-memory marketplace bind requires a non-empty tenantId');
  }

  const packages = BUILTIN_STUB_PACKAGES.map((row) => withHonestSignature(row));

  const bundle: SessionMarketplace = {
    boundAt: new Date().toISOString(),
    tenantId,
    packages,
    proposals: [],
  };
  globalStore.__xivPluginMarketplace = bundle;
  return bundle;
}

export function clearInMemoryPluginMarketplace() {
  globalStore.__xivPluginMarketplace = null;
}

function nextProposalId(): string {
  return `plugin-install-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Propose a plugin install. Always requiresApproval; never production mutation.
 * Unbound marketplace â†’ WAITING_SIGNING error. Unknown package â†’ error.
 * Cryptographic verification is never claimed.
 */
export function proposePluginInstall(input: {
  packageId: string;
  tenantId: string;
}): PluginInstallProposal {
  const market = globalStore.__xivPluginMarketplace ?? null;
  if (!market) {
    throw new Error('WAITING_SIGNING â€” in-memory marketplace stub is not bound; signed packages later');
  }

  const tenantId = (input.tenantId ?? '').trim();
  if (!tenantId) {
    throw new Error('tenant_required â€” install proposal requires tenantId');
  }
  if (tenantId !== market.tenantId) {
    throw new Error('WAITING_DATA â€” tenant scope mismatch; cross-tenant plugin install proposals are refused');
  }

  const packageId = (input.packageId ?? '').trim();
  const pkg = market.packages.find((row) => row.id === packageId);
  if (!pkg) {
    throw new Error('plugin_package_not_found â€” unknown packageId in in-memory stub');
  }

  if (pkg.signature.cryptographicallyVerified !== false) {
    throw new Error('integrity_violation â€” stub packages must not claim cryptographic verification');
  }

  const proposal: PluginInstallProposal = {
    id: nextProposalId(),
    packageId: pkg.id,
    packageName: pkg.name,
    proposedAt: new Date().toISOString(),
    tenantId,
    status: 'pending_approval',
    requiresApproval: true,
    productionMutation: false,
    l4Autonomy: false,
    cryptographicallyVerified: false,
    signatureGate: pkg.signature.gate,
    note: `Install proposal for ${pkg.name} (${pkg.id}). requiresApproval=true; L4 false; no production mutation; cryptographicallyVerified=false (${pkg.signature.gate}).`,
  };

  market.proposals = [proposal, ...market.proposals];
  return proposal;
}

/**
 * Decide an install proposal in-session only.
 * Approve does NOT install production packages â€” session acknowledgment only.
 */
export function decidePluginInstallProposal(input: {
  proposalId: string;
  tenantId: string;
  decision: 'approve' | 'reject';
}): PluginInstallProposal {
  const market = globalStore.__xivPluginMarketplace ?? null;
  if (!market) {
    throw new Error('WAITING_SIGNING â€” marketplace stub not bound');
  }

  const tenantId = (input.tenantId ?? '').trim();
  if (!tenantId || tenantId !== market.tenantId) {
    throw new Error('WAITING_DATA â€” tenant scope mismatch for install decision');
  }

  const proposal = market.proposals.find((row) => row.id === input.proposalId);
  if (!proposal) {
    throw new Error('proposal_not_found');
  }
  if (proposal.status !== 'pending_approval') {
    throw new Error('proposal_already_decided');
  }

  proposal.status = input.decision === 'approve' ? 'approved_session' : 'rejected';
  proposal.note =
    input.decision === 'approve'
      ? `Session-approved install proposal for ${proposal.packageName}. Not a production mutation; package remains cryptographicallyVerified=false (${proposal.signatureGate}). L4 false.`
      : `Rejected install proposal for ${proposal.packageName}. No production mutation. L4 false.`;

  return proposal;
}

/**
 * Plugin marketplace view for Builder.
 * Unbound â†’ WAITING_SIGNING with null packages.
 * Bound stub â†’ READY with STUB_UNSIGNED packages; never claims cryptographic verification.
 */
export function listPluginMarketplaceView(input?: {
  tenantId?: string;
}): PluginMarketplaceView {
  const market = globalStore.__xivPluginMarketplace ?? null;

  if (!market) {
    return {
      status: 'WAITING_SIGNING',
      role: 'builder',
      l4Autonomy: false,
      productionMutation: false,
      requiresApproval: true,
      cryptographicallyVerified: false,
      marketplaceMode: 'in_memory_stub',
      signingGate: 'WAITING_SIGNING',
      tenantScope: null,
      packages: null,
      proposals: [],
      note: 'WAITING_SIGNING â€” in-memory marketplace stub not bound. Signed packages later; no cryptographic verification claimed. Install proposals requireApproval; L4 false; no production mutations.',
    };
  }

  const requestedTenant = (input?.tenantId ?? market.tenantId).trim();
  if (!requestedTenant || requestedTenant !== market.tenantId) {
    return {
      status: 'WAITING_DATA',
      role: 'builder',
      l4Autonomy: false,
      productionMutation: false,
      requiresApproval: true,
      cryptographicallyVerified: false,
      marketplaceMode: 'in_memory_stub',
      signingGate: 'STUB_UNSIGNED',
      tenantScope: market.tenantId,
      packages: [],
      proposals: [],
      note: 'WAITING_DATA â€” tenant scope mismatch; cross-tenant marketplace packages/proposals are not returned. Cryptographic verification is not claimed. L4 false; no production mutations.',
    };
  }

  return {
    status: 'READY',
    role: 'builder',
    l4Autonomy: false,
    productionMutation: false,
    requiresApproval: true,
    cryptographicallyVerified: false,
    marketplaceMode: 'in_memory_stub',
    signingGate: 'STUB_UNSIGNED',
    tenantScope: market.tenantId,
    packages: market.packages.map((row) => withHonestSignature(row)),
    proposals: market.proposals.slice(),
    note: `STUB_UNSIGNED â€” in-memory marketplace for tenant ${market.tenantId} (bound ${market.boundAt}). Packages are stub listings only; cryptographicallyVerified=false (real signed packages later). Install proposals requireApproval; L4 false; no production mutations.`,
  };
}
