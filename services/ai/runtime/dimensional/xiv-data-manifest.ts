/**
 * 12D-10 — Checksummed xiv-data manifest contracts.
 * Corpus packs require founder approval + manifest. No secrets.
 * Pocket Brain ingest may consume these manifests ONLY (not arbitrary paths).
 */
import { isomorphicContentHash } from './datagene';
import { UNIVERSES_ARE_SIMULATION_LAYERS_ONLY } from './universe-ethics';

export const XIV_DATA_MANIFEST_SCHEMA_VERSION = '12d10.1' as const;

export const XIV_DATA_MANIFEST_GUARDRAILS = {
  readOnly: true as const,
  productionAutoApply: false as const,
  autonomousProductionDDL: false as const,
  autonomousProductionDML: false as const,
  secretsAllowed: false as const,
  founderApprovalRequired: true as const,
  rootLabel: 'xiv-data' as const,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
} as const;

export type XivDataManifestEntry = {
  /** Path relative to xiv-data root (forward slashes). */
  relativePath: string;
  contentChecksum: string;
  bytes: number;
  contentType: string;
};

export type XivDataManifestProvenance = {
  source: string;
  capturedAt: string;
  founderApproved: boolean;
  operator?: string;
};

export type XivDataManifest = {
  manifestId: string;
  tenantId: string;
  rootLabel: 'xiv-data';
  schemaVersion: typeof XIV_DATA_MANIFEST_SCHEMA_VERSION;
  entries: readonly XivDataManifestEntry[];
  manifestChecksum: string;
  provenance: XivDataManifestProvenance;
  productionMutation: false;
  secretsAllowed: false;
  readOnly: true;
  productionAutoApply: false;
};

export type XivDataManifestInput = {
  manifestId: string;
  tenantId: string;
  entries: readonly {
    relativePath: string;
    content: string;
    contentType?: string;
  }[];
  provenance: Omit<XivDataManifestProvenance, 'founderApproved'> & {
    founderApproved?: boolean;
  };
};

function assertManifestGuardrails(): void {
  if (XIV_DATA_MANIFEST_GUARDRAILS.autonomousProductionDDL) {
    throw new Error('autonomousProductionDDL must remain false');
  }
  if (XIV_DATA_MANIFEST_GUARDRAILS.autonomousProductionDML) {
    throw new Error('autonomousProductionDML must remain false');
  }
  if (XIV_DATA_MANIFEST_GUARDRAILS.secretsAllowed) {
    throw new Error('secretsAllowed must remain false');
  }
}

function normalizeRelPath(p: string): string {
  const n = p.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!n || n.includes('..') || n.startsWith('xiv-data/')) {
    // Disallow traversal; rootLabel is implicit, not embedded in relativePath.
    if (!n || n.includes('..')) {
      throw new TypeError('relativePath must be non-empty and must not contain ..');
    }
  }
  if (n.includes('\0')) throw new TypeError('relativePath must not contain NUL');
  return n;
}

export function buildXivDataManifest(input: XivDataManifestInput): XivDataManifest {
  assertManifestGuardrails();
  if (!input.manifestId || !input.tenantId) {
    throw new TypeError('manifestId and tenantId are required');
  }
  const founderApproved = input.provenance.founderApproved ?? false;
  if (XIV_DATA_MANIFEST_GUARDRAILS.founderApprovalRequired && !founderApproved) {
    throw new Error('xiv-data corpus packs require founderApproved=true on manifest');
  }

  const entries = Object.freeze(
    input.entries
      .map((e) => {
        const relativePath = normalizeRelPath(e.relativePath);
        const contentChecksum = isomorphicContentHash(e.content);
        return {
          relativePath,
          contentChecksum,
          bytes: e.content.length,
          contentType: e.contentType ?? 'application/octet-stream',
        } satisfies XivDataManifestEntry;
      })
      .sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
  );

  const manifestChecksum = isomorphicContentHash(
    JSON.stringify({
      manifestId: input.manifestId,
      tenantId: input.tenantId,
      rootLabel: 'xiv-data',
      entries,
    }),
  );

  return {
    manifestId: input.manifestId,
    tenantId: input.tenantId,
    rootLabel: 'xiv-data',
    schemaVersion: XIV_DATA_MANIFEST_SCHEMA_VERSION,
    entries,
    manifestChecksum,
    provenance: {
      source: input.provenance.source,
      capturedAt: input.provenance.capturedAt,
      founderApproved: true,
      operator: input.provenance.operator,
    },
    productionMutation: false,
    secretsAllowed: false,
    readOnly: true,
    productionAutoApply: false,
  };
}

/**
 * Verify each entry checksum against provided content map (relativePath → content).
 * Missing content → integrity fail (does not invent bytes).
 */
export function verifyXivDataManifestContents(
  manifest: XivDataManifest,
  contents: ReadonlyMap<string, string>,
): { ok: true } | { ok: false; failures: string[] } {
  assertManifestGuardrails();
  const failures: string[] = [];
  for (const entry of manifest.entries) {
    const body = contents.get(entry.relativePath);
    if (body === undefined) {
      failures.push('missing:' + entry.relativePath);
      continue;
    }
    const hash = isomorphicContentHash(body);
    if (hash !== entry.contentChecksum) {
      failures.push('checksum_mismatch:' + entry.relativePath);
    }
  }
  return failures.length ? { ok: false, failures } : { ok: true };
}
