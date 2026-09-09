/**
 * Multimodal Knowledge Library — legal/authorized indexing contracts.
 * Source refs + permitted derived intelligence; no wholesale unauthorized copyright DB copy.
 */

import { MEDIA_ASSET_KINDS, type MediaAssetKind, type MediaRightsState } from './types';

export type MediaSource = {
  sourceId: string;
  uri: string;
  publisher: string;
  rights: MediaRightsState;
  authorized: boolean;
};

export type MediaRights = {
  rightsId: string;
  state: MediaRightsState;
  licenseRef: string | null;
  mayIndex: boolean;
  mayDeriveIntelligence: boolean;
  mayCopyWholesale: false;
};

export type MediaAsset = {
  assetId: string;
  kind: MediaAssetKind;
  source: MediaSource;
  rights: MediaRights;
  tenantId: string;
  universeId: string;
  title: string;
};

export type Transcript = {
  transcriptId: string;
  mediaAssetId: string;
  language: string;
  authorized: boolean;
};

export type Translation = {
  translationId: string;
  transcriptId: string;
  targetLanguage: string;
  certifiedLegal: false;
};

export type Topic = { topicId: string; label: string };
export type Entity = { entityId: string; label: string; kind: string };
export type Claim = { claimId: string; text: string; mediaAssetId: string; quality: 'UNVERIFIED' | 'SUPPORTED' | 'CONTRADICTED' };
export type Citation = { citationId: string; mediaAssetId: string; locator: string };
export type Evidence = { evidenceId: string; claimId: string; citationId: string; supports: boolean };
export type Summary = { summaryId: string; mediaAssetId: string; text: string; derivedOnly: true };
export type Embedding = { embeddingId: string; mediaAssetId: string; modelId: string; dimensions: number };
export type Relationship = {
  relationshipId: string;
  fromId: string;
  toId: string;
  kind: string;
};

export type MultimodalKnowledgeLibrary = {
  kinds: readonly MediaAssetKind[];
  assets: readonly MediaAsset[];
  wholesaleUnauthorizedCopyAllowed: false;
  sourceRefsRequired: true;
  permittedDerivedIntelligenceAllowed: true;
  productionLive: false;
};

export function listMediaAssetKinds(): readonly MediaAssetKind[] {
  return MEDIA_ASSET_KINDS;
}

export function openMultimodalKnowledgeLibrary(): MultimodalKnowledgeLibrary {
  return {
    kinds: MEDIA_ASSET_KINDS,
    assets: [],
    wholesaleUnauthorizedCopyAllowed: false,
    sourceRefsRequired: true,
    permittedDerivedIntelligenceAllowed: true,
    productionLive: false,
  };
}

/** Registry surface over the multimodal library — same rights invariants. */
export type MultimodalKnowledgeRegistry = MultimodalKnowledgeLibrary & {
  registry: true;
  rightsRequiredBeforeIndex: true;
};

export function openMultimodalKnowledgeRegistry(): MultimodalKnowledgeRegistry {
  return {
    ...openMultimodalKnowledgeLibrary(),
    registry: true,
    rightsRequiredBeforeIndex: true,
  };
}

export function createMediaRights(input: {
  rightsId: string;
  state: MediaRightsState;
  licenseRef?: string | null;
}): MediaRights {
  const mayIndex =
    input.state === 'LICENSED' ||
    input.state === 'PUBLIC_DOMAIN' ||
    input.state === 'CUSTOMER_OWNED' ||
    input.state === 'OPEN_DATA';
  const mayDeriveIntelligence = mayIndex || input.state === 'FAIR_USE_REVIEW';
  return {
    rightsId: input.rightsId,
    state: input.state,
    licenseRef: input.licenseRef ?? null,
    mayIndex,
    mayDeriveIntelligence,
    mayCopyWholesale: false,
  };
}

export function createMediaAsset(input: {
  assetId: string;
  kind: MediaAssetKind;
  source: MediaSource;
  rights: MediaRights;
  tenantId: string;
  universeId: string;
  title: string;
}): MediaAsset | { allowed: false; reason: string } {
  if (!input.rights.mayIndex || input.rights.state === 'DENIED' || !input.source.authorized) {
    return { allowed: false, reason: 'media_rights_deny_indexing' };
  }
  return { ...input };
}

export function extractStructuredIntelligence(asset: MediaAsset): {
  topics: readonly Topic[];
  entities: readonly Entity[];
  claims: readonly Claim[];
  summary: Summary;
  giantFileDump: false;
} {
  return {
    topics: [{ topicId: `topic-${asset.assetId}`, label: asset.title }],
    entities: [],
    claims: [
      {
        claimId: `claim-${asset.assetId}`,
        text: `Derived claim from ${asset.title}`,
        mediaAssetId: asset.assetId,
        quality: 'UNVERIFIED',
      },
    ],
    summary: {
      summaryId: `sum-${asset.assetId}`,
      mediaAssetId: asset.assetId,
      text: `Structured intelligence summary for ${asset.title}`,
      derivedOnly: true,
    },
    giantFileDump: false,
  };
}

export function wholesaleCopyrightDatabaseCopyAllowed(): false {
  return false;
}

export function indexingRequiresAuthorizedRights(): true {
  return true;
}
