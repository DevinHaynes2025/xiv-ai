/**
 * 12D-10 — Pocket Brain ingest from checksummed xiv-data manifests ONLY.
 * Rejects unverified paths / checksum failures / secrets.
 * No production DDL/DML. Twin gates + Atomic Data Cells stand.
 */
import { isomorphicContentHash } from './datagene';
import {
  assertEthicsSafeCopy,
  BUSINESS_BAR_METRICS,
  HIGH_AUTONOMY_TARGETS,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
} from './universe-ethics';
import {
  buildAtomicDataCell,
  type AtomicDataCell,
  ATOMIC_DATA_CELL_GUARDRAILS,
} from './atomic-data-cell';
import {
  verifyXivDataManifestContents,
  type XivDataManifest,
  XIV_DATA_MANIFEST_GUARDRAILS,
} from './xiv-data-manifest';
import type { LocalWriterArtifact } from './ollama-local-writer';
import { OLLAMA_WRITER_GUARDRAILS } from './ollama-local-writer';

export const POCKET_BRAIN_INGEST_GUARDRAILS = {
  readOnly: true as const,
  productionAutoApply: false as const,
  autonomousProductionDDL: false as const,
  autonomousProductionDML: false as const,
  /** Ingest sources must be checksummed xiv-data manifests only. */
  ingestFromXivDataManifestsOnly: true as const,
  mayEnterGlobalBrain: false as const,
  secretsAllowed: false as const,
  verifiedAcceleratorClaimAllowed: false as const,
  highAutonomyTargets: HIGH_AUTONOMY_TARGETS,
  businessBarMetrics: BUSINESS_BAR_METRICS,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  atomDbClaimAllowed: false as const,
  policyGateBypassAllowed: false as const,
  checkpointIsReadReviewOnly: true as const,
  /** Append-only Agent Identity Checkpoint Ledger is 12D-11 (not a second control plane). */
  checkpointLedgerTicket: '12D-11' as const,
  checkpointLedgerIsSecondControlPlane: false as const,
} as const;

export type PocketBrainIngestRecord = {
  recordId: string;
  manifestId: string;
  relativePath: string;
  contentChecksum: string;
  cached: true;
  mayEnterGlobalBrain: false;
  classification: 'TENANT_PRIVATE' | 'OFFLINE_CACHEABLE';
  atomicCell: AtomicDataCell;
  writerArtifactId: string | null;
  productionMutation: false;
};

export type PocketBrainIngestResult = {
  ok: boolean;
  records: PocketBrainIngestRecord[];
  rejected: string[];
  ethicsNotice: string;
  productionAutoApply: false;
  autonomousProductionDDL: false;
  autonomousProductionDML: false;
  liveCloudSyncClaimed: false;
  guardrails: typeof POCKET_BRAIN_INGEST_GUARDRAILS;
};

function assertIngestGuardrails(): void {
  if (!POCKET_BRAIN_INGEST_GUARDRAILS.ingestFromXivDataManifestsOnly) {
    throw new Error('ingestFromXivDataManifestsOnly must remain true');
  }
  if (POCKET_BRAIN_INGEST_GUARDRAILS.autonomousProductionDDL) {
    throw new Error('autonomousProductionDDL must remain false');
  }
  if (POCKET_BRAIN_INGEST_GUARDRAILS.autonomousProductionDML) {
    throw new Error('autonomousProductionDML must remain false');
  }
  if (POCKET_BRAIN_INGEST_GUARDRAILS.mayEnterGlobalBrain) {
    throw new Error('mayEnterGlobalBrain must remain false');
  }
  if (POCKET_BRAIN_INGEST_GUARDRAILS.verifiedAcceleratorClaimAllowed) {
    throw new Error('verifiedAcceleratorClaimAllowed must remain false');
  }
  if (POCKET_BRAIN_INGEST_GUARDRAILS.checkpointLedgerIsSecondControlPlane) {
    throw new Error('Checkpoint Ledger must not be a second production control plane');
  }
  if (POCKET_BRAIN_INGEST_GUARDRAILS.policyGateBypassAllowed || OLLAMA_WRITER_GUARDRAILS.policyGateBypassAllowed) {
    throw new Error('policyGateBypassAllowed must remain false');
  }
  if (ATOMIC_DATA_CELL_GUARDRAILS.atomDbClaimAllowed) {
    throw new Error('atomDbClaimAllowed must remain false');
  }
  if (!XIV_DATA_MANIFEST_GUARDRAILS.founderApprovalRequired) {
    throw new Error('founderApprovalRequired must remain true');
  }
}

/**
 * Ingest Pocket Brain cache records exclusively from a verified xiv-data manifest.
 * Optional writer artifacts attach as provenance links (Atomic Data Cell graph).
 */
export function ingestXivDataManifestToPocketBrain(input: {
  manifest: XivDataManifest;
  contents: ReadonlyMap<string, string>;
  writerArtifacts?: readonly LocalWriterArtifact[];
}): PocketBrainIngestResult {
  assertIngestGuardrails();

  const ethicsNotice =
    'Pocket Brain ingest is READ ONLY from checksummed xiv-data manifests only. ' +
    'No production DDL/DML. mayEnterGlobalBrain=false. Accelerators UNVERIFIED — never fake VERIFIED GPU/NPU/QPU. ' +
    'Atomic Data Cells = software knowledge records (naming ALIGN). Checkpoint Ledger = 12D-11 append-only audit (not a control plane).';
  assertEthicsSafeCopy(ethicsNotice, '12d10 pocket ingest ethicsNotice');

  const rejected: string[] = [];
  if (!input.manifest.provenance.founderApproved) {
    return {
      ok: false,
      records: [],
      rejected: ['founder_approval_required'],
      ethicsNotice,
      productionAutoApply: false,
      autonomousProductionDDL: false,
      autonomousProductionDML: false,
      liveCloudSyncClaimed: false,
      guardrails: POCKET_BRAIN_INGEST_GUARDRAILS,
    };
  }
  if (input.manifest.secretsAllowed) {
    return {
      ok: false,
      records: [],
      rejected: ['secrets_not_allowed'],
      ethicsNotice,
      productionAutoApply: false,
      autonomousProductionDDL: false,
      autonomousProductionDML: false,
      liveCloudSyncClaimed: false,
      guardrails: POCKET_BRAIN_INGEST_GUARDRAILS,
    };
  }

  const verified = verifyXivDataManifestContents(input.manifest, input.contents);
  if (!verified.ok) {
    return {
      ok: false,
      records: [],
      rejected: verified.failures,
      ethicsNotice,
      productionAutoApply: false,
      autonomousProductionDDL: false,
      autonomousProductionDML: false,
      liveCloudSyncClaimed: false,
      guardrails: POCKET_BRAIN_INGEST_GUARDRAILS,
    };
  }

  const writerId = input.writerArtifacts?.[0]?.artifactId ?? null;
  const records: PocketBrainIngestRecord[] = [];

  for (const entry of input.manifest.entries) {
    const body = input.contents.get(entry.relativePath);
    if (body === undefined) {
      rejected.push('missing:' + entry.relativePath);
      continue;
    }
    // Soft secret heuristic — reject obvious secret-looking filenames.
    if (/(^|\/)(\.env|secrets?|credentials|id_rsa)/i.test(entry.relativePath)) {
      rejected.push('secret_path_blocked:' + entry.relativePath);
      continue;
    }
    const cell = buildAtomicDataCell({
      cellId: 'adc:pocket:' + input.manifest.manifestId + ':' + entry.relativePath,
      tenantId: input.manifest.tenantId,
      body: {
        kind: 'pocket_brain_ingest',
        manifestId: input.manifest.manifestId,
        relativePath: entry.relativePath,
        preview: body.slice(0, 240),
      },
      provenance: [
        '12d10:pocket-brain-ingest',
        'manifest:' + input.manifest.manifestId,
        'checksum:' + entry.contentChecksum,
      ],
      timestamp: input.manifest.provenance.capturedAt,
      confidence: 0.8,
      graphLinks: writerId
        ? [{ rel: 'derived_from_writer', targetCellId: 'adc:writer:' + writerId, correlationWeight: 0.5 }]
        : [],
      replication: { offlineEligible: true, maxReplicas: 64 },
    });

    records.push({
      recordId: 'pocket:' + isomorphicContentHash(input.manifest.manifestId + ':' + entry.relativePath),
      manifestId: input.manifest.manifestId,
      relativePath: entry.relativePath,
      contentChecksum: entry.contentChecksum,
      cached: true,
      mayEnterGlobalBrain: false,
      classification: 'OFFLINE_CACHEABLE',
      atomicCell: cell,
      writerArtifactId: writerId,
      productionMutation: false,
    });
  }

  return {
    ok: rejected.length === 0 && records.length > 0,
    records,
    rejected,
    ethicsNotice,
    productionAutoApply: false,
    autonomousProductionDDL: false,
    autonomousProductionDML: false,
    liveCloudSyncClaimed: false,
    guardrails: POCKET_BRAIN_INGEST_GUARDRAILS,
  };
}
