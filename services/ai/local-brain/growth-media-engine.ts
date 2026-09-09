/**
 * 62L-AY Growth Media Engine — media / post / graphic preparation pipelines.
 * Candidates and drafts only. No auto-publish without human decision gate.
 * Founder/exec media prep surfaces are contracts/stubs for future AZ command center.
 */

import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { decisionGate } from './decision-gate';
import {
  MEDIA_NO_AUTO_PUBLISH,
  type AyEvidenceState,
  type EpistemicClass,
} from './growth-media-onboarding-types';

export type MediaKind = 'post' | 'graphic' | 'video_script' | 'founder_brief' | 'exec_surface';

export type MediaPipelineStage =
  | 'candidate'
  | 'draft'
  | 'review_gate'
  | 'human_decision'
  | 'publish_blocked'
  | 'publish_authorized';

export type MediaArtifact = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: MediaKind;
  title: string;
  body: string;
  stage: MediaPipelineStage;
  autoPublished: false;
  published: boolean;
  humanDecisionRequired: true;
  epistemicClass: EpistemicClass;
  founderSurface: boolean;
  execSurface: boolean;
  reviewState: AyEvidenceState;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

type MediaStore = { artifacts: MediaArtifact[] };

function nowIso() {
  return new Date().toISOString();
}

function storePath(root: string) {
  return xivLocalPath(root, 'ay-media-engine.json');
}

export const FOUNDER_MEDIA_PREP_SURFACE = Object.freeze({
  id: 'founder_media_prep_stub',
  status: 'STUB' as const,
  autoPublish: false as const,
  alignedForPhase: '62L-AZ' as const,
  productionAuthorized: false as const,
  reason: 'Founder media prep surface is a contract/stub for future AZ command center — not live publish.',
});

export const EXEC_MEDIA_PREP_SURFACE = Object.freeze({
  id: 'exec_media_prep_stub',
  status: 'STUB' as const,
  autoPublish: false as const,
  alignedForPhase: '62L-AZ' as const,
  productionAuthorized: false as const,
  reason: 'Exec media prep surface is a contract/stub — preparation only.',
});

export async function prepareMediaCandidate(input: {
  tenantId: string;
  universeId: string;
  kind: MediaKind;
  title: string;
  body: string;
  root?: string;
}): Promise<MediaArtifact> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.title.trim() || !input.body.trim()) throw new Error('MEDIA_TITLE_AND_BODY_REQUIRED');

  const root = input.root ?? process.cwd();
  const artifact: MediaArtifact = {
    id: cortexId('ay_media'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    title: input.title.trim(),
    body: input.body.trim(),
    stage: 'candidate',
    autoPublished: false,
    published: false,
    humanDecisionRequired: true,
    epistemicClass: 'HYPOTHESIS',
    founderSurface: input.kind === 'founder_brief',
    execSurface: input.kind === 'exec_surface',
    reviewState: 'WAITING_DATA',
    reason: 'CANDIDATE_PREPARED_NOT_PUBLISHED',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  const store = await readJsonFile<MediaStore>(storePath(root), { artifacts: [] });
  store.artifacts.push(artifact);
  await writeJsonFileAtomic(storePath(root), { artifacts: store.artifacts.slice(-5_000) });
  return artifact;
}

export async function advanceMediaDraft(id: string, root = process.cwd()) {
  const store = await readJsonFile<MediaStore>(storePath(root), { artifacts: [] });
  const artifact = store.artifacts.find((a) => a.id === id);
  if (!artifact) throw new Error('MEDIA_NOT_FOUND');
  if (artifact.stage === 'candidate') {
    artifact.stage = 'draft';
    artifact.reason = 'DRAFT_PREPARED_AWAITING_REVIEW_GATE';
    artifact.updatedAt = nowIso();
  }
  await writeJsonFileAtomic(storePath(root), store);
  return artifact;
}

export async function runMediaReviewGate(id: string, root = process.cwd()) {
  const store = await readJsonFile<MediaStore>(storePath(root), { artifacts: [] });
  const artifact = store.artifacts.find((a) => a.id === id);
  if (!artifact) throw new Error('MEDIA_NOT_FOUND');

  const gate = decisionGate({
    id: artifact.id,
    action: 'media_external_publication',
    consequence: 'HIGH',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: true,
  });

  artifact.stage = 'review_gate';
  artifact.reviewState = gate.humanApprovalRequired ? 'DENIED' : 'PASS';
  artifact.reason = `${MEDIA_NO_AUTO_PUBLISH}; ${gate.reason}`;
  artifact.published = false;
  artifact.autoPublished = false;
  artifact.updatedAt = nowIso();
  await writeJsonFileAtomic(storePath(root), store);
  return artifact;
}

export async function humanDecideMediaPublish(input: {
  id: string;
  humanPrincipal: 'human_founder' | 'human_exec' | 'agent_media';
  approvePublish: boolean;
  root?: string;
}): Promise<MediaArtifact> {
  const root = input.root ?? process.cwd();
  const store = await readJsonFile<MediaStore>(storePath(root), { artifacts: [] });
  const artifact = store.artifacts.find((a) => a.id === input.id);
  if (!artifact) throw new Error('MEDIA_NOT_FOUND');

  if (input.humanPrincipal === 'agent_media') {
    artifact.stage = 'publish_blocked';
    artifact.published = false;
    artifact.reviewState = 'DENIED';
    artifact.reason = 'AGENT_CANNOT_AUTHORIZE_PUBLISH';
    artifact.updatedAt = nowIso();
    await writeJsonFileAtomic(storePath(root), store);
    return artifact;
  }

  artifact.stage = 'human_decision';
  if (!input.approvePublish) {
    artifact.stage = 'publish_blocked';
    artifact.published = false;
    artifact.reviewState = 'DENIED';
    artifact.reason = 'HUMAN_DECLINED_PUBLISH';
  } else {
    // Even with human approval in this stub, we mark authorize intent without live external publish.
    artifact.stage = 'publish_authorized';
    artifact.published = false;
    artifact.reviewState = 'PASS';
    artifact.reason =
      'HUMAN_AUTHORIZED_PUBLISH_INTENT_STUB_NOT_LIVE_EXTERNAL_PUBLISH; production publish remains NOT_TESTED';
    artifact.epistemicClass = 'HYPOTHESIS';
  }
  artifact.autoPublished = false;
  artifact.updatedAt = nowIso();
  await writeJsonFileAtomic(storePath(root), store);
  return artifact;
}

/** Explicit deny path for any auto-publish attempt. */
export function attemptAutoPublish(): {
  published: false;
  autoPublished: false;
  executed: false;
  reason: string;
} {
  return {
    published: false,
    autoPublished: false,
    executed: false,
    reason: MEDIA_NO_AUTO_PUBLISH,
  };
}

export async function listMediaArtifacts(root = process.cwd()) {
  const store = await readJsonFile<MediaStore>(storePath(root), { artifacts: [] });
  return store.artifacts;
}
