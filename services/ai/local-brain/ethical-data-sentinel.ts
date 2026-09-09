import { redactSealedFields, SEALED_REDACTION } from './ceo-sealed-vault';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import {
  SENTINEL_REFUSED_MODES,
  SENTINEL_WATCH_KINDS,
  type EnsEvidenceState,
  type SentinelRefusedMode,
  type SentinelWatchKind,
} from './enterprise-nervous-types';

export type SentinelFinding = {
  id: string;
  tenantId: string;
  universeId: string;
  watch: SentinelWatchKind;
  flowId: string;
  state: EnsEvidenceState;
  summary: string;
  sealedPayload: typeof SEALED_REDACTION;
  spyware: false;
  covertSurveillance: false;
  authorizedFlow: true;
  createdAt: string;
  productionAuthorization: false;
};

type SentinelStore = { findings: SentinelFinding[] };

function storePath(root: string) {
  return xivLocalPath(root, 'ens-ethical-sentinel.json');
}

async function load(root: string): Promise<SentinelFinding[]> {
  const parsed = await readJsonFile<SentinelStore>(storePath(root), { findings: [] });
  return Array.isArray(parsed.findings) ? parsed.findings : [];
}

async function save(root: string, findings: SentinelFinding[]) {
  await writeJsonFileAtomic(storePath(root), { findings: findings.slice(-10_000) });
}

export function refuseSentinelSpyware(mode: SentinelRefusedMode | string): {
  allowed: false;
  state: 'FAIL';
  spyware: false;
  covertSurveillance: false;
  reason: string;
} {
  const refused = (SENTINEL_REFUSED_MODES as readonly string[]).includes(mode) || /spy|covert|keylog|clipboard|secret.?capture/i.test(mode);
  return {
    allowed: false,
    state: 'FAIL',
    spyware: false,
    covertSurveillance: false,
    reason: refused ? `SENTINEL_REFUSED_MODE:${mode}` : `SENTINEL_NOT_AUTHORIZED_WATCH:${mode}`,
  };
}

export async function watchAuthorizedXivFlow(input: {
  tenantId: string;
  universeId: string;
  flowId: string;
  watch: SentinelWatchKind | SentinelRefusedMode | string;
  authorizedFlow: boolean;
  destinationAuthorized: boolean;
  provenanceRefs: string[];
  classification: 'public' | 'internal' | 'confidential' | 'restricted' | 'sealed';
  retentionOk?: boolean;
  stale?: boolean;
  excessiveCollection?: boolean;
  sealedPayload?: string;
  actorHasAccess: boolean;
  root?: string;
}): Promise<
  | { allowed: false; state: 'FAIL'; spyware: false; covertSurveillance: false; reason: string }
  | { allowed: true; state: EnsEvidenceState; finding: SentinelFinding; spyware: false; covertSurveillance: false }
> {
  if ((SENTINEL_REFUSED_MODES as readonly string[]).includes(input.watch)) {
    return refuseSentinelSpyware(input.watch);
  }
  if (!input.authorizedFlow || !input.actorHasAccess) {
    return {
      allowed: false,
      state: 'FAIL',
      spyware: false,
      covertSurveillance: false,
      reason: 'SENTINEL_MAY_NOT_WATCH_UNAUTHORIZED_OR_COVERT_FLOWS',
    };
  }
  if (!(SENTINEL_WATCH_KINDS as readonly string[]).includes(input.watch)) {
    return refuseSentinelSpyware(input.watch);
  }

  let state: EnsEvidenceState = 'PASS';
  let summary = `Authorized XIV flow ${input.flowId} audited for ${input.watch}.`;
  if (input.watch === 'unauthorized_destination' && !input.destinationAuthorized) {
    state = 'FAIL';
    summary = 'Unauthorized destination refused.';
  } else if (input.watch === 'bad_provenance' && input.provenanceRefs.length === 0) {
    state = 'FAIL';
    summary = 'Missing provenance.';
  } else if (input.watch === 'stale_info' && input.stale) {
    state = 'FAIL';
    summary = 'Stale information flagged.';
  } else if (input.watch === 'excessive_collection' && input.excessiveCollection) {
    state = 'FAIL';
    summary = 'Excessive collection flagged.';
  } else if (input.watch === 'retention_violation' && input.retentionOk === false) {
    state = 'FAIL';
    summary = 'Retention violation flagged.';
  } else if (input.watch === 'classification_error' && input.classification === 'sealed') {
    state = 'FAIL';
    summary = 'Sealed classification cannot ride an ordinary flow.';
  } else if (input.watch === 'leakage' && input.sealedPayload) {
    state = 'FAIL';
    summary = 'Sealed payload leakage blocked.';
  }

  const redacted = redactSealedFields({
    sealedPayload: input.sealedPayload ?? '',
    payload: input.sealedPayload ?? '',
    secret: input.sealedPayload ?? '',
  });

  const finding: SentinelFinding = {
    id: cortexId('sentinel'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    watch: input.watch as SentinelWatchKind,
    flowId: input.flowId,
    state,
    summary,
    sealedPayload: SEALED_REDACTION,
    spyware: false,
    covertSurveillance: false,
    authorizedFlow: true,
    createdAt: new Date().toISOString(),
    productionAuthorization: false,
  };
  void redacted;
  const root = input.root ?? process.cwd();
  const findings = await load(root);
  findings.push(finding);
  await save(root, findings);
  return { allowed: true, state, finding, spyware: false, covertSurveillance: false };
}

export async function listSentinelFindings(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const findings = await load(input.root ?? process.cwd());
  return findings.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}
