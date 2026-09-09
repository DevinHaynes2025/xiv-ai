import { randomUUID } from 'node:crypto';

import { ingestLakeSource, listLakeObjects } from './knowledge-lake';
import { syncKnowledgePack } from './knowledge-pack-sync';
import { localModelStatus } from './local-model';
import { providerSlots } from './provider-fabric';
import { cloudPeerSlots, describeCloudPeer } from './cloud-peer-adapters';
import { parsePackageManifest, recordPackageManifest } from './package-manifest';
import { emptyRegistryRecord, upsertRegistryRecord } from './local-registry';
import type { PackageManifest, PlatformEvidenceState } from './developer-platform-types';
import type { CloudPeerId } from './hybrid-edge-cloud-types';

export type SkillBundle = {
  id: string;
  tenantId: string;
  universeId: string;
  skill: string;
  manifest: PackageManifest;
  grantsAgentAuthority: false;
  productionAuthorization: false;
};

export async function registerSkillBundle(input: {
  tenantId: string;
  universeId: string;
  skill: string;
  payload: string;
  root?: string;
}) {
  const manifest = parsePackageManifest({
    tenantId: input.tenantId,
    universeId: input.universeId,
    name: `skill:${input.skill}`,
    kind: 'skill',
    payload: input.payload,
    requestedPermissions: ['local_sandbox_read', 'local_sandbox_write'],
    classification: 'internal',
  });
  const root = input.root ?? process.cwd();
  await recordPackageManifest(manifest, root);
  await upsertRegistryRecord(emptyRegistryRecord(manifest, 'Skill bundle recorded as a verified candidate. Does not grant agent authority.'), root);
  const bundle: SkillBundle = {
    id: `skill_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    skill: input.skill,
    manifest,
    grantsAgentAuthority: false,
    productionAuthorization: false,
  };
  return bundle;
}

export async function manageKnowledgePack(input: {
  tenantId: string;
  universeId: string;
  title: string;
  originalText: string;
  sourceUri: string;
  industry?: string;
  federateToUniverseId?: string;
  sealed?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (input.sealed) {
    return {
      state: 'FAIL' as const,
      reason: 'Sealed founder-priority knowledge packs cannot be managed as replicating marketplace packages.',
      object: null,
    };
  }
  const ingested = await ingestLakeSource({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: input.industry ?? 'technology',
    partition: 'company',
    sourceUri: input.sourceUri,
    sourceLanguage: 'en',
    originalText: input.originalText,
    provenanceRefs: [`marketplace:${input.title}`],
    classification: 'internal',
    root,
  });
  const manifest = parsePackageManifest({
    tenantId: input.tenantId,
    universeId: input.universeId,
    name: `knowledge-pack:${input.title}`,
    kind: 'knowledge_pack',
    payload: ingested.object.contentHash,
    classification: ingested.object.classification,
  });
  await recordPackageManifest(manifest, root);
  await upsertRegistryRecord(emptyRegistryRecord(manifest, 'Knowledge-pack candidate wraps a Knowledge Lake object. Not a duplicate pack store.'), root);
  let sync: Awaited<ReturnType<typeof syncKnowledgePack>> | null = null;
  if (input.federateToUniverseId) {
    sync = await syncKnowledgePack({
      tenantId: input.tenantId,
      fromUniverseId: input.universeId,
      toUniverseId: input.federateToUniverseId,
      lakeObjectId: ingested.object.id,
      federated: true,
      sealed: false,
      root,
    });
  }
  return {
    state: 'PASS' as const,
    object: ingested.object,
    manifest,
    sync,
    lakeObjects: await listLakeObjects({ tenantId: input.tenantId, universeId: input.universeId, root }),
  };
}

export async function manageModelAdapter(input: {
  tenantId: string;
  universeId: string;
  adapter: 'local_ollama' | 'aws' | 'azure' | 'gcp' | 'google_ai_studio';
  root?: string;
}) {
  const model = await localModelStatus();
  const providers = providerSlots();
  let availability: PlatformEvidenceState = 'UNAVAILABLE';
  let reason = 'Unconfigured model adapter remains UNAVAILABLE.';
  if (input.adapter === 'local_ollama') {
    availability = model.availability === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE';
    reason = model.reason;
  } else {
    const slot = providers.find((item) => item.provider === input.adapter);
    if (!slot || !slot.configured || !slot.authorized || slot.evidenceRefs.length === 0) {
      availability = 'UNAVAILABLE';
      reason = `${input.adapter} is not detected, configured, authorized, and verified.`;
    } else {
      availability = slot.state === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE';
      reason = slot.notes;
    }
  }
  const manifest = parsePackageManifest({
    tenantId: input.tenantId,
    universeId: input.universeId,
    name: `model-adapter:${input.adapter}`,
    kind: 'model_adapter',
    payload: `${input.adapter}:${availability}`,
    requestedPermissions: ['local_sandbox_read'],
    classification: 'internal',
  });
  const root = input.root ?? process.cwd();
  await recordPackageManifest(manifest, root);
  await upsertRegistryRecord(emptyRegistryRecord(manifest, reason), root);
  return {
    adapter: input.adapter,
    availability,
    reason,
    manifest,
    productionAuthorization: false as const,
  };
}

export async function manageConnector(input: {
  tenantId: string;
  universeId: string;
  peer: CloudPeerId | 'plugin_registry';
  root?: string;
}) {
  if (input.peer === 'plugin_registry') {
    return {
      peer: input.peer,
      availability: 'WAITING_DATA' as const,
      reason: '62L-AJ Offline Software Factory / Plugin Registry is not on this parent. Connector slot stays WAITING_DATA.',
      productionAuthorization: false as const,
    };
  }
  const slot = describeCloudPeer(input.peer);
  const availability: PlatformEvidenceState = slot.state === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE';
  const manifest = parsePackageManifest({
    tenantId: input.tenantId,
    universeId: input.universeId,
    name: `connector:${input.peer}`,
    kind: 'connector',
    payload: `${input.peer}:${slot.state}`,
    requestedPermissions: ['external_networking'],
    classification: 'internal',
  });
  const root = input.root ?? process.cwd();
  await recordPackageManifest(manifest, root);
  await upsertRegistryRecord(emptyRegistryRecord(manifest, slot.notes), root);
  return {
    peer: input.peer,
    availability,
    reason: slot.notes,
    manifest,
    peers: cloudPeerSlots().map((item) => ({ peer: item.peer, state: item.state })),
    productionAuthorization: false as const,
  };
}
