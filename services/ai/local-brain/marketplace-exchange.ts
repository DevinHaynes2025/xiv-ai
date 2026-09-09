import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { isFederated } from './logical-universe-graph';
import { getRegistryRecord, listPrivateCatalog, upsertRegistryRecord, withLifecycle } from './local-registry';
import { redactPackageExport, SEALED_REDACTION } from './export-redaction';
import { classificationGate } from './permission-classification-gate';
import { parsePackageManifest, recordPackageManifest } from './package-manifest';
import { DEFAULT_REPLICATION_POLICY } from './universe-os-types';
import type { PlatformEvidenceState } from './developer-platform-types';

type ExchangeStore = {
  shares: UniverseShare[];
  bundles: OfflineBundle[];
  syncs: SyncRecord[];
};

export type UniverseShare = {
  id: string;
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  packageId: string;
  state: PlatformEvidenceState;
  redacted: boolean;
  replicating: false;
  reason: string;
  createdAt: string;
};

export type OfflineBundle = {
  id: string;
  tenantId: string;
  universeId: string;
  packageIds: string[];
  envelopePayloads: string[];
  portable: true;
  onlineRequired: false;
  createdAt: string;
};

export type SyncRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  state: PlatformEvidenceState;
  reason: string;
  createdAt: string;
};

function storePath(root: string) {
  return xivLocalPath(root, 'marketplace-exchange.json');
}

async function load(root: string): Promise<ExchangeStore> {
  const parsed = await readJsonFile<ExchangeStore>(storePath(root), { shares: [], bundles: [], syncs: [] });
  return {
    shares: Array.isArray(parsed.shares) ? parsed.shares : [],
    bundles: Array.isArray(parsed.bundles) ? parsed.bundles : [],
    syncs: Array.isArray(parsed.syncs) ? parsed.syncs : [],
  };
}

async function save(root: string, store: ExchangeStore) {
  await writeJsonFileAtomic(storePath(root), {
    shares: store.shares.slice(-5_000),
    bundles: store.bundles.slice(-2_000),
    syncs: store.syncs.slice(-5_000),
  });
}

export async function sharePackageAcrossUniverses(input: {
  packageId: string;
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const record = await getRegistryRecord(input.packageId, input.tenantId, input.fromUniverseId, root);
  const store = await load(root);
  if (!record) {
    const share: UniverseShare = {
      id: `share_${randomUUID()}`,
      tenantId: input.tenantId,
      fromUniverseId: input.fromUniverseId,
      toUniverseId: input.toUniverseId,
      packageId: input.packageId,
      state: 'FAIL',
      redacted: false,
      replicating: false,
      reason: 'Source package is not in this tenant/Universe registry.',
      createdAt: new Date().toISOString(),
    };
    store.shares.push(share);
    await save(root, store);
    return share;
  }
  if (record.quarantined) {
    const share: UniverseShare = {
      id: `share_${randomUUID()}`,
      tenantId: input.tenantId,
      fromUniverseId: input.fromUniverseId,
      toUniverseId: input.toUniverseId,
      packageId: input.packageId,
      state: 'DENIED' as never,
      redacted: false,
      replicating: false,
      reason: 'Quarantined packages cannot be shared.',
      createdAt: new Date().toISOString(),
    };
    store.shares.push({ ...share, state: 'FAIL' });
    await save(root, store);
    return { ...share, state: 'FAIL' as const };
  }
  const gate = classificationGate(record.manifest.classification);
  const replication = DEFAULT_REPLICATION_POLICY[record.manifest.classification];
  if (replication === 'never' || record.manifest.classification === 'sealed_founder_priority' || !gate.replicating) {
    if (replication === 'never' || record.manifest.classification === 'sealed_founder_priority' || record.manifest.classification === 'restricted') {
      const exported = redactPackageExport({ manifest: record.manifest });
      const share: UniverseShare = {
        id: `share_${randomUUID()}`,
        tenantId: input.tenantId,
        fromUniverseId: input.fromUniverseId,
        toUniverseId: input.toUniverseId,
        packageId: input.packageId,
        state: 'FAIL',
        redacted: true,
        replicating: false,
        reason: `${gate.reason} Export payload=${exported.envelope.payload}`,
        createdAt: new Date().toISOString(),
      };
      store.shares.push(share);
      await save(root, store);
      return { ...share, redactedPayload: exported.envelope.payload, sealedToken: SEALED_REDACTION };
    }
  }
  const federated = await isFederated({
    tenantId: input.tenantId,
    fromUniverseId: input.fromUniverseId,
    toUniverseId: input.toUniverseId,
    root,
  });
  if (!federated && input.fromUniverseId !== input.toUniverseId) {
    const share: UniverseShare = {
      id: `share_${randomUUID()}`,
      tenantId: input.tenantId,
      fromUniverseId: input.fromUniverseId,
      toUniverseId: input.toUniverseId,
      packageId: input.packageId,
      state: 'FAIL',
      redacted: false,
      replicating: false,
      reason: 'Universe-to-Universe package sharing requires an explicit logical federation link.',
      createdAt: new Date().toISOString(),
    };
    store.shares.push(share);
    await save(root, store);
    return share;
  }

  const replica = await recordPackageManifest(
    parsePackageManifest({
      tenantId: input.tenantId,
      universeId: input.toUniverseId,
      name: record.manifest.name,
      version: record.manifest.version,
      kind: record.manifest.kind,
      payload: record.manifest.payload,
      requestedPermissions: [...record.manifest.requestedPermissions],
      classification: record.manifest.classification,
      os: [...record.manifest.os],
      hardware: [...record.manifest.hardware],
      files: { ...record.manifest.files },
    }),
    root,
  );
  await upsertRegistryRecord(
    withLifecycle(
      {
        manifest: replica,
        lifecycle: 'verified_candidate',
        grantedPermissions: [],
        authorityGranted: false,
        installedAsAuthorized: false,
        activatedLocal: false,
        quarantined: false,
        integrity: 'UNKNOWN',
        lastReason: 'Replica registered as a verified candidate in the destination Universe. Not auto-installed or authorized.',
      },
      'verified_candidate',
      'Replica registered as a verified candidate in the destination Universe. Not auto-installed or authorized.',
    ),
    root,
  );
  const share: UniverseShare = {
    id: `share_${randomUUID()}`,
    tenantId: input.tenantId,
    fromUniverseId: input.fromUniverseId,
    toUniverseId: input.toUniverseId,
    packageId: replica.id,
    state: 'PASS',
    redacted: false,
    replicating: false,
    reason: 'Shared as a verified candidate replica. Destination install still requires the human gate. CEO-sealed content did not replicate.',
    createdAt: new Date().toISOString(),
  };
  store.shares.push(share);
  await save(root, store);
  return share;
}

export async function buildOfflineBundle(input: {
  tenantId: string;
  universeId: string;
  packageIds: string[];
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const envelopePayloads: string[] = [];
  for (const packageId of input.packageIds) {
    const record = await getRegistryRecord(packageId, input.tenantId, input.universeId, root);
    if (!record) continue;
    const exported = redactPackageExport({ manifest: record.manifest });
    envelopePayloads.push(exported.envelope.payload);
  }
  const bundle: OfflineBundle = {
    id: `bundle_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    packageIds: [...input.packageIds],
    envelopePayloads,
    portable: true,
    onlineRequired: false,
    createdAt: new Date().toISOString(),
  };
  store.bundles.push(bundle);
  await save(root, store);
  return bundle;
}

export async function syncOfflineMarketplace(input: {
  tenantId: string;
  universeId: string;
  needsInternet?: boolean;
  needsCloudMarketplace?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  if (input.needsInternet) {
    const sync: SyncRecord = {
      id: `sync_${randomUUID()}`,
      tenantId: input.tenantId,
      universeId: input.universeId,
      state: 'WAITING_DATA',
      reason: 'Offline marketplace sync will not invent external catalog freshness.',
      createdAt: new Date().toISOString(),
    };
    store.syncs.push(sync);
    await save(root, store);
    return sync;
  }
  if (input.needsCloudMarketplace) {
    const sync: SyncRecord = {
      id: `sync_${randomUUID()}`,
      tenantId: input.tenantId,
      universeId: input.universeId,
      state: 'UNAVAILABLE',
      reason: 'Unconfigured cloud marketplace remains UNAVAILABLE.',
      createdAt: new Date().toISOString(),
    };
    store.syncs.push(sync);
    await save(root, store);
    return sync;
  }
  const listings = await listPrivateCatalog(input);
  const sync: SyncRecord = {
    id: `sync_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    state: 'PASS',
    reason: `Local private catalog synchronized (${listings.length} listings). Not a public customer marketplace publish.`,
    createdAt: new Date().toISOString(),
  };
  store.syncs.push(sync);
  await save(root, store);
  return sync;
}

export async function listShares(root = process.cwd()) {
  return (await load(root)).shares;
}

export async function listBundles(root = process.cwd()) {
  return (await load(root)).bundles;
}
