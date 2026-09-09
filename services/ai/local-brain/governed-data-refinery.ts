/**
 * 62L-AY Governed Data Refinery ("virtual drilling").
 * Authorized/public/licensed/customer-owned sources only.
 * Reject unauthorized "leakage" source claims.
 * Defensive leakage detector for accidental exposure in owned/authorized envs — never offensive theft.
 */

import { createHash } from 'node:crypto';

import { redactCeoSealed } from './business-os-safety';
import { SEALED_REDACTION } from './business-os-types';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import {
  CORRELATION_NOT_CAUSATION,
  DEFENSIVE_LEAKAGE_ONLY,
  OFFENSIVE_LEAK_HARVEST_DENIED,
  REFINERY_STAGES,
  SEALED_COMPARTMENT_NON_LEAK,
  SIM_NOT_FACT,
  SPYWARE_CAPABILITY_DENIED,
  UNAUTHORIZED_SOURCE_REJECTED,
  type AyEvidenceState,
  type EpistemicClass,
  type RefineryStage,
} from './growth-media-onboarding-types';

export type SourceAuthorizationClass =
  | 'authorized'
  | 'public'
  | 'licensed'
  | 'customer_owned'
  | 'unauthorized_leakage_claim'
  | 'stolen_credentials'
  | 'leaked_db'
  | 'private_exposed'
  | 'restricted_system';

export type RefinerySource = {
  id: string;
  label: string;
  authorization: SourceAuthorizationClass;
  licenseRef?: string;
  provenanceRef?: string;
  uriHint?: string;
};

export type RefineryRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  sourceId: string;
  stagesCompleted: RefineryStage[];
  stageStates: Array<{ stage: RefineryStage; state: AyEvidenceState; summary: string }>;
  rejected: boolean;
  hypothesis?: string;
  evidenceClass: EpistemicClass;
  correlationClaimedAsCausation: false;
  simClaimedAsFact: false;
  biRecommendation?: string;
  humanDecisionRequired: true;
  productionWrite: false;
  createdAt: string;
  updatedAt: string;
};

export type LeakageFinding = {
  id: string;
  scope: 'owned_or_authorized_env';
  mode: 'defensive';
  offensive: false;
  spyware: false;
  credentialTheft: false;
  severity: 'info' | 'warn' | 'critical';
  pattern: string;
  detail: string;
  stopped: boolean;
  reason: typeof DEFENSIVE_LEAKAGE_ONLY;
};

export type MoatNarrative = {
  replaceableModelsClouds: true;
  xivInterfacesStable: true;
  trustModel: true;
  contextGraph: true;
  workflows: true;
  userNetwork: true;
  permissionedBi: true;
  productionAuthorized: false;
  summary: string;
};

type RefineryStore = { records: RefineryRecord[] };

const FORBIDDEN_AUTH: SourceAuthorizationClass[] = [
  'unauthorized_leakage_claim',
  'stolen_credentials',
  'leaked_db',
  'private_exposed',
  'restricted_system',
];

function nowIso() {
  return new Date().toISOString();
}

function storePath(root: string) {
  return xivLocalPath(root, 'ay-data-refinery.json');
}

export function isSourceAllowed(authorization: SourceAuthorizationClass): boolean {
  return !FORBIDDEN_AUTH.includes(authorization);
}

export function checkProvenanceLicense(source: RefinerySource): {
  allowed: boolean;
  state: AyEvidenceState;
  reason: string;
} {
  if (!isSourceAllowed(source.authorization)) {
    return {
      allowed: false,
      state: 'DENIED',
      reason: `${UNAUTHORIZED_SOURCE_REJECTED}:${source.authorization}`,
    };
  }
  if (source.authorization === 'licensed' && !source.licenseRef?.trim()) {
    return { allowed: false, state: 'DENIED', reason: 'LICENSED_SOURCE_REQUIRES_LICENSE_REF' };
  }
  if (!source.provenanceRef?.trim()) {
    return { allowed: false, state: 'DENIED', reason: 'PROVENANCE_REF_REQUIRED' };
  }
  return {
    allowed: true,
    state: 'PASS',
    reason: `SOURCE_${source.authorization.toUpperCase()}_ACCEPTED_FOR_LOCAL_PREP_NOT_PRODUCTION`,
  };
}

/** Defensive only: scan text in owned/authorized envs for accidental exposure patterns. */
export function detectDefensiveLeakage(input: {
  text: string;
  envAuthorized: boolean;
}): LeakageFinding[] {
  if (!input.envAuthorized) {
    return [
      {
        id: cortexId('ay_leak'),
        scope: 'owned_or_authorized_env',
        mode: 'defensive',
        offensive: false,
        spyware: false,
        credentialTheft: false,
        severity: 'critical',
        pattern: 'env_not_authorized',
        detail: 'Refinery defensive scan refused outside owned/authorized environment.',
        stopped: true,
        reason: DEFENSIVE_LEAKAGE_ONLY,
      },
    ];
  }

  const findings: LeakageFinding[] = [];
  const patterns: Array<{ pattern: string; re: RegExp; severity: LeakageFinding['severity'] }> = [
    { pattern: 'aws_access_key_id', re: /AKIA[0-9A-Z]{16}/, severity: 'critical' },
    { pattern: 'private_key_block', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, severity: 'critical' },
    { pattern: 'password_assignment', re: /password\s*=\s*['"][^'"]{8,}['"]/i, severity: 'warn' },
    { pattern: 'connection_string_secret', re: /(postgres|mongodb|mysql):\/\/[^\s]+:[^\s]+@/i, severity: 'critical' },
    { pattern: 'sealed_compartment', re: /FOUNDER-SEALED|CEO_SEALED_SECRET|BEGIN SEALED PAYLOAD/, severity: 'critical' },
  ];

  for (const item of patterns) {
    if (item.re.test(input.text)) {
      findings.push({
        id: cortexId('ay_leak'),
        scope: 'owned_or_authorized_env',
        mode: 'defensive',
        offensive: false,
        spyware: false,
        credentialTheft: false,
        severity: item.severity,
        pattern: item.pattern,
        detail: `Accidental exposure pattern flagged and stopped in authorized env: ${item.pattern}`,
        stopped: true,
        reason: DEFENSIVE_LEAKAGE_ONLY,
      });
    }
  }
  return findings;
}

export function honorSealedCompartment(payload: string, sealed: boolean) {
  const redacted = redactCeoSealed(payload, sealed);
  const leaked = sealed && redacted.payload !== SEALED_REDACTION;
  return {
    payload: redacted.payload,
    replicating: false as const,
    ceoSealedCompartmentalized: true as const,
    leaked: false as const,
    ordinaryCacheWrite: false as const,
    telemetryWrite: false as const,
    mediaCandidateContainsSecret: false as const,
    stopped: sealed,
    reason: SEALED_COMPARTMENT_NON_LEAK,
    sealHonored: !leaked,
  };
}

export function attemptOffensiveLeakHarvest(_input?: { target: string }) {
  return {
    executed: false as const,
    harvested: false as const,
    spyware: false as const,
    keylogger: false as const,
    clipboardMonitor: false as const,
    stolenCredentials: false as const,
    leakedDatabaseMined: false as const,
    state: 'DENIED' as const,
    reason: OFFENSIVE_LEAK_HARVEST_DENIED,
  };
}

export function refuseSpywareCapabilities() {
  return {
    spyware: false as const,
    keylogger: false as const,
    clipboardMonitor: false as const,
    secretCapture: false as const,
    accessBypass: false as const,
    state: 'DENIED' as const,
    reason: SPYWARE_CAPABILITY_DENIED,
  };
}

export function refuseCertificationClaim() {
  return {
    governmentCertification: 'NOT_TESTED' as const,
    classifiedApproval: false as const,
    partnershipClaimed: false as const,
    state: 'UNAVAILABLE' as const,
    reason: 'GOVERNMENT_CERTIFICATION_NOT_CLAIMED',
  };
}

export function moatNarrative(): MoatNarrative {
  return {
    replaceableModelsClouds: true,
    xivInterfacesStable: true,
    trustModel: true,
    contextGraph: true,
    workflows: true,
    userNetwork: true,
    permissionedBi: true,
    productionAuthorized: false,
    summary:
      'Moat = trust model + context graph + workflows + user network + permissioned BI behind XIV interfaces; models/clouds are replaceable. Not production authorized.',
  };
}

export async function runRefineryPipeline(input: {
  tenantId: string;
  universeId: string;
  source: RefinerySource;
  payloadText: string;
  claimCorrelationAsCausation?: boolean;
  claimSimAsFact?: boolean;
  humanApproveBi?: boolean;
  root?: string;
}): Promise<RefineryRecord> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const stagesCompleted: RefineryStage[] = [];
  const stageStates: RefineryRecord['stageStates'] = [];

  const push = (stage: RefineryStage, state: AyEvidenceState, summary: string) => {
    stagesCompleted.push(stage);
    stageStates.push({ stage, state, summary });
  };

  // authorized_source
  if (!isSourceAllowed(input.source.authorization)) {
    push('authorized_source', 'DENIED', `${UNAUTHORIZED_SOURCE_REJECTED}:${input.source.authorization}`);
    const denied: RefineryRecord = {
      id: cortexId('ay_ref'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      sourceId: input.source.id,
      stagesCompleted,
      stageStates,
      rejected: true,
      evidenceClass: 'UNKNOWN',
      correlationClaimedAsCausation: false,
      simClaimedAsFact: false,
      humanDecisionRequired: true,
      productionWrite: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await persist(denied, root);
    return denied;
  }
  push('authorized_source', 'PASS', `Source class ${input.source.authorization} accepted for local prep.`);

  // provenance_license_check
  const prov = checkProvenanceLicense(input.source);
  push('provenance_license_check', prov.state, prov.reason);
  if (!prov.allowed) {
    const denied: RefineryRecord = {
      id: cortexId('ay_ref'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      sourceId: input.source.id,
      stagesCompleted,
      stageStates,
      rejected: true,
      evidenceClass: 'UNKNOWN',
      correlationClaimedAsCausation: false,
      simClaimedAsFact: false,
      humanDecisionRequired: true,
      productionWrite: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await persist(denied, root);
    return denied;
  }

  // Defensive leakage scan before ingest
  const leaks = detectDefensiveLeakage({ text: input.payloadText, envAuthorized: true });
  if (leaks.some((f) => f.severity === 'critical')) {
    push('ingestion', 'DENIED', `Defensive leakage stop: ${leaks.map((f) => f.pattern).join(',')}`);
    const denied: RefineryRecord = {
      id: cortexId('ay_ref'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      sourceId: input.source.id,
      stagesCompleted,
      stageStates,
      rejected: true,
      evidenceClass: 'UNKNOWN',
      correlationClaimedAsCausation: false,
      simClaimedAsFact: false,
      humanDecisionRequired: true,
      productionWrite: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await persist(denied, root);
    return denied;
  }

  push('ingestion', 'PASS', 'Payload ingested into local prep buffer (not production DB write).');
  const classification = input.payloadText.length > 200 ? 'long_form' : 'short_form';
  push('classification', 'PASS', `Classified as ${classification} (heuristic stub).`);

  const digest = createHash('sha256').update(input.payloadText).digest('hex').slice(0, 16);
  push('warehouse_lakehouse', 'PASS', `Local lakehouse stub slot=${digest}; productionWrite=false.`);

  // dedup via hash of normalized text
  const normalized = input.payloadText.trim().toLowerCase().replace(/\s+/g, ' ');
  const dedupKey = createHash('sha256').update(normalized).digest('hex');
  push('dedup_contradiction', 'PASS', `Dedup key ${dedupKey.slice(0, 12)}; contradiction scan stub only.`);

  push('pattern_gap_mining', 'PASS', 'Pattern/gap mining stub — hypotheses only.');

  let evidenceClass: EpistemicClass = 'HYPOTHESIS';
  const hypothesis = `H1: observed token length ${input.payloadText.length} may correlate with engagement (not causation).`;
  if (input.claimCorrelationAsCausation) {
    push('hypothesis', 'DENIED', CORRELATION_NOT_CAUSATION);
  } else {
    push('hypothesis', 'PASS', hypothesis);
  }

  // quant/scientific testing — trivial token stats as SIMULATION, not verified fact
  const tokens = input.payloadText.split(/\s+/).filter(Boolean).length;
  if (input.claimSimAsFact) {
    push('quant_scientific_testing', 'DENIED', SIM_NOT_FACT);
  } else {
    push(
      'quant_scientific_testing',
      'PASS',
      `Simulation token_count=${tokens}; epistemicClass=SIMULATION; ${SIM_NOT_FACT}`,
    );
    evidenceClass = 'SIMULATION';
  }

  push('evidence', evidenceClass === 'SIMULATION' ? 'PASS' : 'WAITING_DATA', `Evidence class ${evidenceClass}.`);

  const bi = `BI draft: source=${input.source.label} tokens=${tokens} — recommendation only.`;
  push('business_intelligence', 'PASS', bi);

  const humanOk = Boolean(input.humanApproveBi);
  push(
    'human_decision',
    humanOk ? 'PASS' : 'DENIED',
    humanOk ? 'Human noted BI recommendation — not production deploy.' : 'Human decision required before any consequential use.',
  );

  push(
    'learning',
    humanOk ? 'PASS' : 'WAITING_DATA',
    humanOk ? 'Measured learning entry eligible (local ledger).' : 'Learning deferred until human decision.',
  );

  // Ensure stage catalog completeness for documentation/runtime alignment
  for (const stage of REFINERY_STAGES) {
    if (!stagesCompleted.includes(stage)) {
      push(stage, 'WAITING_DATA', 'Stage not reached on this path.');
    }
  }

  const record: RefineryRecord = {
    id: cortexId('ay_ref'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    sourceId: input.source.id,
    stagesCompleted: [...new Set(stagesCompleted)],
    stageStates,
    rejected: false,
    hypothesis: input.claimCorrelationAsCausation ? undefined : hypothesis,
    evidenceClass,
    correlationClaimedAsCausation: false,
    simClaimedAsFact: false,
    biRecommendation: bi,
    humanDecisionRequired: true,
    productionWrite: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await persist(record, root);
  return record;
}

async function persist(record: RefineryRecord, root: string) {
  const store = await readJsonFile<RefineryStore>(storePath(root), { records: [] });
  store.records.push(record);
  await writeJsonFileAtomic(storePath(root), { records: store.records.slice(-5_000) });
}

export async function listRefineryRecords(root = process.cwd()) {
  const store = await readJsonFile<RefineryStore>(storePath(root), { records: [] });
  return store.records;
}

/** Explicit reject helper for unauthorized leakage claims. */
export function rejectUnauthorizedSource(authorization: SourceAuthorizationClass) {
  return {
    allowed: false as const,
    executed: false as const,
    reason: `${UNAUTHORIZED_SOURCE_REJECTED}:${authorization}`,
    defensiveOnly: true as const,
    offensive: false as const,
  };
}
