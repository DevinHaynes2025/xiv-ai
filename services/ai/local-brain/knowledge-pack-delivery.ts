import { ingestLakeSource } from './knowledge-lake';
import { syncKnowledgePack } from './knowledge-pack-sync';
import { SEALED_REDACTION } from './ceo-sealed-vault';
import {
  activateVerifiedTransfer,
  resumeTransfer,
  startResumableTransfer,
} from './resumable-package-transfer';

export async function deliverKnowledgePack(input: {
  tenantId: string;
  universeId: string;
  fromNodeId: string;
  toNodeId: string;
  title: string;
  body: string;
  toUniverseId?: string;
  federated?: boolean;
  sealed?: boolean;
  destinationOnline?: boolean;
  root?: string;
}) {
  if (input.sealed) {
    return {
      delivered: false as const,
      state: 'denied' as const,
      reason: 'Sealed knowledge packs cannot enter transfer envelopes or cross-Universe sync.',
      redacted: SEALED_REDACTION,
    };
  }
  const lake = await ingestLakeSource({
    tenantId: input.tenantId,
    universeId: input.universeId,
    industry: 'operations',
    era: '2026',
    partition: 'business',
    sourceUri: `synthetic:62lal/${input.title}`,
    sourceLanguage: 'en',
    originalText: input.body.slice(0, 4_000),
    provenanceRefs: [`pack:${input.title}`],
    root: input.root,
  });
  const started = await startResumableTransfer({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    kind: 'knowledge_pack',
    bytes: `pack:${lake.object.contentHash}:${input.title}`,
    classification: 'internal',
    destinationOnline: input.destinationOnline,
    root: input.root,
  });
  if (!started.accepted) return { delivered: false as const, state: 'denied' as const, reason: started.reason, lakeObjectId: lake.object.id };
  if (started.transfer.state !== 'held_offline') {
    await resumeTransfer({
      transferId: started.transfer.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      root: input.root,
    });
    await activateVerifiedTransfer({
      transferId: started.transfer.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      root: input.root,
    });
  }
  let sync = null;
  if (input.toUniverseId && input.toUniverseId !== input.universeId) {
    sync = await syncKnowledgePack({
      tenantId: input.tenantId,
      fromUniverseId: input.universeId,
      toUniverseId: input.toUniverseId,
      lakeObjectId: lake.object.id,
      federated: input.federated === true,
      sealed: false,
      root: input.root,
    });
  }
  return {
    delivered: started.transfer.state !== 'held_offline',
    heldOffline: started.transfer.state === 'held_offline',
    transfer: started.transfer,
    lakeObjectId: lake.object.id,
    sync,
    authorityGranted: false as const,
  };
}
