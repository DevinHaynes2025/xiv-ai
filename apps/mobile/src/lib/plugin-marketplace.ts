import {
  bindInMemoryPluginMarketplace,
  clearInMemoryPluginMarketplace,
  decidePluginInstallProposal,
  listPluginMarketplaceView,
  proposePluginInstall,
  type PluginInstallProposal,
  type PluginMarketplaceView,
} from '@/lib/ai';

/**
 * US-PLG-01 — mobile helper for Plugin marketplace install (Builder).
 * In-memory marketplace stub. WAITING_SIGNING when unbound.
 * Never claims cryptographic verification. Install proposals requireApproval.
 * L4 false; no production mutations.
 */

export const DEFAULT_DEMO_BUILDER_TENANT_ID = 'demo-tenant-builder';

export type PluginMarketplaceSessionResult = {
  view: PluginMarketplaceView;
  proposal?: PluginInstallProposal;
};

export function sessionPluginMarketplaceView(input?: {
  tenantId?: string;
}): PluginMarketplaceView {
  return listPluginMarketplaceView({
    tenantId: input?.tenantId,
  });
}

export function bindSessionInMemoryPluginMarketplace(input?: {
  tenantId?: string;
}): PluginMarketplaceSessionResult {
  const tenantId = (input?.tenantId ?? DEFAULT_DEMO_BUILDER_TENANT_ID).trim();
  bindInMemoryPluginMarketplace({ tenantId });
  return { view: listPluginMarketplaceView({ tenantId }) };
}

export function proposeSessionPluginInstall(input: {
  packageId: string;
  tenantId?: string;
}): PluginMarketplaceSessionResult {
  const tenantId = (input.tenantId ?? DEFAULT_DEMO_BUILDER_TENANT_ID).trim();
  const proposal = proposePluginInstall({ packageId: input.packageId, tenantId });
  return { view: listPluginMarketplaceView({ tenantId }), proposal };
}

export function decideSessionPluginInstallProposal(input: {
  proposalId: string;
  tenantId?: string;
  decision: 'approve' | 'reject';
}): PluginMarketplaceSessionResult {
  const tenantId = (input.tenantId ?? DEFAULT_DEMO_BUILDER_TENANT_ID).trim();
  const proposal = decidePluginInstallProposal({
    proposalId: input.proposalId,
    tenantId,
    decision: input.decision,
  });
  return { view: listPluginMarketplaceView({ tenantId }), proposal };
}

export function clearSessionInMemoryPluginMarketplace(): PluginMarketplaceSessionResult {
  clearInMemoryPluginMarketplace();
  return { view: listPluginMarketplaceView() };
}
