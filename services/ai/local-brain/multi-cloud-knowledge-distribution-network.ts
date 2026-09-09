/**
 * 62L-CP Multi-Cloud Knowledge Distribution Network —
 * signed distribution of approved plugin/knowledge packages only; revocable.
 * Sealed content never silent-routes via plugin cloud gateway.
 */

import { createHash } from 'node:crypto';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CP_LOCKS,
  HONESTY_BANNER,
  SEALED_SILENT_PLUGIN_CLOUD_DENIED,
  UNSIGNED_OR_REVOKED_PACKAGE_REJECTED,
  type CpActor,
} from './knowledge-supply-plugin-foundry-types';

export type DistributionPackage = {
  id: string;
  label: string;
  kind: 'plugin' | 'knowledge';
  payloadDigest: string;
  signature: string | null;
  signed: boolean;
  revoked: boolean;
  approved: boolean;
  status: 'candidate' | 'accepted' | 'rejected' | 'revoked';
  reason: string;
  createdAt: string;
};

export type DistributionApply = {
  id: string;
  packageId: string;
  status: 'accepted' | 'rejected';
  reason: string;
  at: string;
};

export type CloudRouteAttempt = {
  id: string;
  packageId: string | null;
  contentMode: 'open' | 'sealed' | 'local_only';
  silentCloudFallbackRequested: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  packages: DistributionPackage[];
  applies: DistributionApply[];
  routes: CloudRouteAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-cloud-knowledge-distribution-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    packages: [],
    applies: [],
    routes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function digest(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

export function distributionNetworkHonesty() {
  return {
    banner: HONESTY_BANNER,
    requiresSignature: CP_LOCKS.DISTRIBUTION_REQUIRES_SIGNATURE,
    revokable: CP_LOCKS.DISTRIBUTION_REVOKABLE,
    autoTrustUnsigned: CP_LOCKS.AUTO_TRUST_UNSIGNED_PACKAGES,
    sealedSilentPluginCloud: CP_LOCKS.SEALED_SILENT_PLUGIN_CLOUD_FALLBACK,
  };
}

export async function createDistributionPackage(input: {
  label: string;
  kind: 'plugin' | 'knowledge';
  payload: string;
  signature?: string | null;
  approved?: boolean;
  root: string;
  actor: CpActor;
}): Promise<DistributionPackage> {
  const store = await load(input.root);
  const signed =
    typeof input.signature === 'string' && input.signature.trim().length > 0;
  const approved = input.approved === true;
  const ok = signed && approved;
  const pkg: DistributionPackage = {
    id: id('dpack'),
    label: input.label,
    kind: input.kind,
    payloadDigest: digest(input.payload),
    signature: signed ? input.signature!.trim() : null,
    signed,
    revoked: false,
    approved,
    status: ok ? 'candidate' : 'rejected',
    reason: ok
      ? 'DISTRIBUTION_PACKAGE_SIGNED_APPROVED_CANDIDATE'
      : UNSIGNED_OR_REVOKED_PACKAGE_REJECTED,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.packages.push(pkg);
  await save(input.root, store);
  return pkg;
}

export async function revokeDistributionPackage(input: {
  packageId: string;
  root: string;
  actor: CpActor;
}): Promise<{ accepted: boolean; pkg: DistributionPackage | null; reason: string }> {
  const store = await load(input.root);
  const pkg = store.packages.find((p) => p.id === input.packageId) ?? null;
  void input.actor;
  if (!pkg) {
    return { accepted: false, pkg: null, reason: 'DISTRIBUTION_PACKAGE_NOT_FOUND' };
  }
  pkg.revoked = true;
  pkg.status = 'revoked';
  pkg.reason = UNSIGNED_OR_REVOKED_PACKAGE_REJECTED;
  await save(input.root, store);
  return { accepted: true, pkg, reason: pkg.reason };
}

export async function applyDistributionPackage(input: {
  packageId: string;
  root: string;
  actor: CpActor;
}): Promise<DistributionApply> {
  const store = await load(input.root);
  const pkg = store.packages.find((p) => p.id === input.packageId);
  void input.actor;

  if (!pkg || !pkg.signed || pkg.revoked || !pkg.approved || pkg.status === 'rejected') {
    const attempt: DistributionApply = {
      id: id('dapply'),
      packageId: input.packageId,
      status: 'rejected',
      reason: UNSIGNED_OR_REVOKED_PACKAGE_REJECTED,
      at: new Date().toISOString(),
    };
    store.applies.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  pkg.status = 'accepted';
  pkg.reason = 'DISTRIBUTION_PACKAGE_APPLIED_SIGNED_APPROVED';
  const attempt: DistributionApply = {
    id: id('dapply'),
    packageId: pkg.id,
    status: 'accepted',
    reason: pkg.reason,
    at: new Date().toISOString(),
  };
  store.applies.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function routeViaPluginCloudGateway(input: {
  packageId?: string | null;
  contentMode: 'open' | 'sealed' | 'local_only';
  silentCloudFallbackRequested?: boolean;
  root: string;
  actor: CpActor;
}): Promise<CloudRouteAttempt> {
  const store = await load(input.root);
  void input.actor;
  const silent = input.silentCloudFallbackRequested === true;
  const sealedOrLocal =
    input.contentMode === 'sealed' || input.contentMode === 'local_only';

  if (sealedOrLocal && silent) {
    const attempt: CloudRouteAttempt = {
      id: id('route'),
      packageId: input.packageId ?? null,
      contentMode: input.contentMode,
      silentCloudFallbackRequested: true,
      status: 'denied',
      reason: SEALED_SILENT_PLUGIN_CLOUD_DENIED,
      at: new Date().toISOString(),
    };
    store.routes.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  if (input.packageId) {
    const pkg = store.packages.find((p) => p.id === input.packageId);
    if (!pkg || !pkg.signed || pkg.revoked || !pkg.approved) {
      const attempt: CloudRouteAttempt = {
        id: id('route'),
        packageId: input.packageId,
        contentMode: input.contentMode,
        silentCloudFallbackRequested: silent,
        status: 'denied',
        reason: UNSIGNED_OR_REVOKED_PACKAGE_REJECTED,
        at: new Date().toISOString(),
      };
      store.routes.push(attempt);
      await save(input.root, store);
      return attempt;
    }
  }

  const attempt: CloudRouteAttempt = {
    id: id('route'),
    packageId: input.packageId ?? null,
    contentMode: input.contentMode,
    silentCloudFallbackRequested: silent,
    status: 'allowed',
    reason: 'PLUGIN_CLOUD_ROUTE_BOUNDED_EXPLICIT',
    at: new Date().toISOString(),
  };
  store.routes.push(attempt);
  await save(input.root, store);
  return attempt;
}
