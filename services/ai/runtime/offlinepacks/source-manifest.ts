/**
 * 62L-EX14 — SourceManifest + rights/provenance gates.
 * No source without provenance. Denied classes → DENIED/QUARANTINED.
 */

import {
  createId,
  isAllowedSourceClass,
  isDeniedSourceClass,
  nowIso,
  sha256,
  type AllowedSourceClass,
  type DeniedSourceClass,
  type PackType,
  type ProvenanceRecord,
  type RightsManifest,
  type SourceManifest,
  type SourceManifestEntry,
} from './types.ts';

export type SourceGateResult =
  | { ok: true; entry: SourceManifestEntry; rights: RightsManifest; provenance: ProvenanceRecord }
  | {
      ok: false;
      disposition: 'DENIED' | 'QUARANTINED' | 'WAITING_DATA';
      reason: string;
      sourceClass: string;
    };

export function createRightsManifest(input: {
  sourceClass: AllowedSourceClass;
  licenseId?: string | null;
  rightsHolder?: string | null;
  allowedUses?: readonly string[];
  tenantPrivate?: boolean;
}): RightsManifest {
  return {
    rightsManifestId: createId('rights'),
    sourceClass: input.sourceClass,
    licenseId: input.licenseId ?? null,
    rightsHolder: input.rightsHolder ?? null,
    allowedUses: input.allowedUses ?? ['offline_research', 'local_retrieval'],
    prohibitedUses: [
      'dark_web_index',
      'credential_harvest',
      'illicit_redistribution',
      'cross_tenant_leak',
    ],
    darkWebAllowed: false,
    credentialHarvestAllowed: false,
    tenantPrivate: input.tenantPrivate ?? false,
    recordedAt: nowIso(),
  };
}

export function createProvenance(input: {
  sourceId: string;
  sourceUri?: string | null;
  sourceTitle: string;
  version: string;
  bodyForHash?: string;
  chainOfCustody?: readonly string[];
}): ProvenanceRecord {
  return {
    provenanceId: createId('prov'),
    sourceId: input.sourceId,
    sourceUri: input.sourceUri ?? null,
    sourceTitle: input.sourceTitle,
    capturedAt: nowIso(),
    version: input.version,
    hash: input.bodyForHash ? sha256(input.bodyForHash) : null,
    chainOfCustody: input.chainOfCustody ?? ['authorized_ingest'],
    fabricated: false,
  };
}

export function gateSource(input: {
  sourceClass: string;
  title: string;
  description?: string;
  version: string;
  contentClasses: SourceManifestEntry['contentClasses'];
  tenantId: string | null;
  universeId: string | null;
  requiresLiveWeb?: boolean;
  rights?: RightsManifest | null;
  provenance?: ProvenanceRecord | null;
  publishedAt?: string | null;
  body?: string;
  bytesEstimate?: number | null;
  networkAvailable?: boolean;
}): SourceGateResult {
  if (isDeniedSourceClass(input.sourceClass)) {
    return {
      ok: false,
      disposition: input.sourceClass === 'DARK_WEB_PUBLIC' ? 'QUARANTINED' : 'DENIED',
      reason: `Source class ${input.sourceClass} is DENIED/QUARANTINED — illicit or restricted material.`,
      sourceClass: input.sourceClass,
    };
  }

  if (!isAllowedSourceClass(input.sourceClass)) {
    return {
      ok: false,
      disposition: 'DENIED',
      reason: `Unknown source class ${input.sourceClass} — not in allowed set.`,
      sourceClass: input.sourceClass,
    };
  }

  if (input.requiresLiveWeb && input.networkAvailable === false) {
    return {
      ok: false,
      disposition: 'WAITING_DATA',
      reason: 'Live-web-required source while offline → WAITING_DATA (not FAIL).',
      sourceClass: input.sourceClass,
    };
  }

  if (!input.rights || !input.provenance) {
    return {
      ok: false,
      disposition: 'DENIED',
      reason: 'Source without rights manifest and/or provenance is denied — no fabricated provenance.',
      sourceClass: input.sourceClass,
    };
  }

  if (input.provenance.fabricated !== false) {
    return {
      ok: false,
      disposition: 'DENIED',
      reason: 'Fabricated provenance forbidden.',
      sourceClass: input.sourceClass,
    };
  }

  if (input.rights.darkWebAllowed !== false || input.rights.credentialHarvestAllowed !== false) {
    return {
      ok: false,
      disposition: 'QUARANTINED',
      reason: 'Dark-web / credential-harvest rights flags must remain false.',
      sourceClass: input.sourceClass,
    };
  }

  const sourceId = createId('src');
  const entry: SourceManifestEntry = {
    sourceId,
    sourceClass: input.sourceClass,
    title: input.title,
    description: input.description ?? '',
    publishedAt: input.publishedAt ?? null,
    capturedAt: nowIso(),
    version: input.version,
    rightsManifestId: input.rights.rightsManifestId,
    provenanceId: input.provenance.provenanceId,
    contentClasses: input.contentClasses,
    tenantId: input.tenantId,
    universeId: input.universeId,
    requiresLiveWeb: input.requiresLiveWeb ?? false,
    bytesEstimate: input.bytesEstimate ?? (input.body ? Buffer.byteLength(input.body, 'utf8') : null),
  };

  return { ok: true, entry, rights: input.rights, provenance: input.provenance };
}

export function createSourceManifest(input: {
  packType: PackType;
  tenantId: string;
  universeId: string;
  entries: readonly SourceManifestEntry[];
}): SourceManifest {
  const ts = nowIso();
  return {
    sourceManifestId: createId('sman'),
    packType: input.packType,
    tenantId: input.tenantId,
    universeId: input.universeId,
    entries: input.entries,
    createdAt: ts,
    updatedAt: ts,
  };
}

export function publicOpenSourceEligible(sourceClass: AllowedSourceClass | DeniedSourceClass): boolean {
  return sourceClass === 'PUBLIC_OPEN' || sourceClass === 'OFFICIAL';
}
