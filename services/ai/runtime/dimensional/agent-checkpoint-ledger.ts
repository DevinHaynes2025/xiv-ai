/**
 * 12D-11 — Agent Identity + Checkpoint Ledger (append-only).
 * Per-agent-run identity + audit. NEVER a second production control plane.
 * NEVER bypass Policy Gate. ChatGPT checkpoint = read/review consumer only
 * (no authority to flip autonomousProduction*). Twin claim bans assertable.
 * Atomic Data Cells may be referenced as evidence units.
 */
import { isomorphicContentHash } from './datagene';
import {
  assertEthicsSafeCopy,
  BUSINESS_BAR_METRICS,
  HIGH_AUTONOMY_TARGETS,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  VALUATION_THEATER_ALLOWED,
} from './universe-ethics';
import { BUILDER_GUARDRAILS } from '../builder/policy';
import { FOUNDER_TWIN_GUARDRAILS } from './founder-twin-roster';
import { ATOMIC_DATA_CELL_GUARDRAILS } from './atomic-data-cell';

export const AGENT_CHECKPOINT_LEDGER_SCHEMA_VERSION = '12d11.1' as const;

/** Agents that may author ledger rows (Story Factory seats). */
export type CheckpointXivAgent = 'GROK' | 'OLLAMA' | 'CHATGPT' | 'GEMINI' | 'LOCAL_RULES';

/**
 * Environment *label* only — PRODUCTION is an audit label, not an autonomy grant.
 * High-autonomy targets remain LOCAL | CLOUD_SANDBOX.
 */
export type CheckpointEnvironmentLabel = 'LOCAL' | 'CLOUD_SANDBOX' | 'PRODUCTION';

export const AGENT_CHECKPOINT_LEDGER_GUARDRAILS = {
  appendOnly: true as const,
  mutable: false as const,
  deleteAllowed: false as const,
  rewriteAllowed: false as const,
  /** NEVER a second production control plane. */
  secondControlPlane: false as const,
  checkpointLedgerIsSecondControlPlane: false as const,
  /** NEVER bypass Policy Gate. */
  policyGateBypassAllowed: false as const,
  /** ChatGPT (and any consumer) = read/review only. */
  checkpointIsReadReviewOnly: true as const,
  chatgptAuthorityToFlipAutonomousProduction: false as const,
  autonomousProductionDDL: false as const,
  autonomousProductionDML: false as const,
  productionAutoApply: false as const,
  productionAutoMerge: false as const,
  productionAutoDeploy: false as const,
  highAutonomyTargets: HIGH_AUTONOMY_TARGETS,
  businessBarMetrics: BUSINESS_BAR_METRICS,
  VALUATION_THEATER_ALLOWED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  twinClaimBansAssertable: true as const,
  bioCloningAllowed: false as const,
  alwaysOnInfiniteClonesAllowed: false as const,
  atomDbClaimAllowed: false as const,
  atomicDataCellsMayBeEvidenceUnits: true as const,
  ticket: '12D-11' as const,
} as const;

export type AgentCheckpointLedgerEntry = {
  entryId: string;
  sequence: number;
  schemaVersion: typeof AGENT_CHECKPOINT_LEDGER_SCHEMA_VERSION;
  /** XIV-Agent */
  xivAgent: CheckpointXivAgent;
  /** Model */
  model: string;
  /** Story */
  story: string;
  /** Environment label only */
  environment: CheckpointEnvironmentLabel;
  /** Files-Changed */
  filesChanged: readonly string[];
  /** Tests-Passed */
  testsPassed: readonly string[];
  /** Tests-Failed */
  testsFailed: readonly string[];
  /** Database-Migrations */
  databaseMigrations: readonly string[];
  /** Evidence-Hash */
  evidenceHash: string;
  /** Debrief-ID */
  debriefId: string | null;
  /** Confidence 0..1 */
  confidence: number;
  /** Optional Atomic Data Cell ids referenced as evidence units */
  atomicCellIds: readonly string[];
  createdAt: string;
  immutable: true;
  policyGateBypass: false;
  secondControlPlane: false;
  autonomousProductionDDL: false;
  autonomousProductionDML: false;
  chatgptAuthorityToFlipAutonomousProduction: false;
};

export type AgentCheckpointAppendInput = {
  xivAgent: CheckpointXivAgent;
  model: string;
  story: string;
  environment: CheckpointEnvironmentLabel;
  filesChanged?: readonly string[];
  testsPassed?: readonly string[];
  testsFailed?: readonly string[];
  databaseMigrations?: readonly string[];
  evidenceHash?: string;
  debriefId?: string | null;
  confidence?: number;
  atomicCellIds?: readonly string[];
  createdAt?: string;
};

/** Minimal debrief shape for optional Story Factory hook (avoids hard cycle). */
export type CheckpointDebriefLike = {
  debriefId: string;
  agent: CheckpointXivAgent;
  storyIds: readonly string[];
  completed: readonly string[];
  failed: readonly string[];
  blocked: readonly string[];
  evidenceRefs: readonly string[];
  createdAt: string;
};

export type CheckpointCouncilLearningLike = {
  samples: number;
  biasByTag: Readonly<Record<string, number>>;
};

function assertLedgerGuardrails(): void {
  if (!AGENT_CHECKPOINT_LEDGER_GUARDRAILS.appendOnly) {
    throw new Error('appendOnly must remain true');
  }
  if (AGENT_CHECKPOINT_LEDGER_GUARDRAILS.mutable || AGENT_CHECKPOINT_LEDGER_GUARDRAILS.deleteAllowed || AGENT_CHECKPOINT_LEDGER_GUARDRAILS.rewriteAllowed) {
    throw new Error('ledger must remain append-only (no mutate/delete/rewrite)');
  }
  if (AGENT_CHECKPOINT_LEDGER_GUARDRAILS.secondControlPlane || AGENT_CHECKPOINT_LEDGER_GUARDRAILS.checkpointLedgerIsSecondControlPlane) {
    throw new Error('checkpoint ledger must NEVER be a second production control plane');
  }
  if (AGENT_CHECKPOINT_LEDGER_GUARDRAILS.policyGateBypassAllowed) {
    throw new Error('policyGateBypassAllowed must remain false — NEVER bypass Policy Gate');
  }
  if (!AGENT_CHECKPOINT_LEDGER_GUARDRAILS.checkpointIsReadReviewOnly) {
    throw new Error('checkpointIsReadReviewOnly must remain true');
  }
  if (AGENT_CHECKPOINT_LEDGER_GUARDRAILS.chatgptAuthorityToFlipAutonomousProduction) {
    throw new Error('ChatGPT checkpoint has no authority to flip autonomousProduction*');
  }
  if (
    AGENT_CHECKPOINT_LEDGER_GUARDRAILS.autonomousProductionDDL ||
    AGENT_CHECKPOINT_LEDGER_GUARDRAILS.autonomousProductionDML ||
    BUILDER_GUARDRAILS.autonomousProductionDDL ||
    BUILDER_GUARDRAILS.autonomousProductionDML
  ) {
    throw new Error('autonomousProductionDDL/DML must remain false');
  }
  if (AGENT_CHECKPOINT_LEDGER_GUARDRAILS.productionAutoApply || AGENT_CHECKPOINT_LEDGER_GUARDRAILS.productionAutoMerge || AGENT_CHECKPOINT_LEDGER_GUARDRAILS.productionAutoDeploy) {
    throw new Error('production auto flags must remain false');
  }
  const targets = AGENT_CHECKPOINT_LEDGER_GUARDRAILS.highAutonomyTargets;
  if (!targets.includes('LOCAL') || !targets.includes('CLOUD_SANDBOX') || targets.length !== 2) {
    throw new Error('highAutonomyTargets must be LOCAL|CLOUD_SANDBOX only');
  }
  if (!AGENT_CHECKPOINT_LEDGER_GUARDRAILS.twinClaimBansAssertable) {
    throw new Error('twinClaimBansAssertable must remain true');
  }
  if (FOUNDER_TWIN_GUARDRAILS.bioCloningAllowed || FOUNDER_TWIN_GUARDRAILS.alwaysOnInfiniteClonesAllowed) {
    throw new Error('Founder Twin claim bans must hold');
  }
  if (ATOMIC_DATA_CELL_GUARDRAILS.atomDbClaimAllowed) {
    throw new Error('atomDbClaimAllowed must remain false');
  }
  if (VALUATION_THEATER_ALLOWED) {
    throw new Error('VALUATION_THEATER_ALLOWED must remain false');
  }
}

function hashEvidence(parts: readonly string[]): string {
  return isomorphicContentHash(parts.join('|'));
}

/**
 * In-memory append-only Agent Identity Checkpoint Ledger.
 * Not hosted Postgres. Not a production control plane.
 */
export class AgentCheckpointLedger {
  private readonly entries: AgentCheckpointLedgerEntry[] = [];

  append(input: AgentCheckpointAppendInput): AgentCheckpointLedgerEntry {
    assertLedgerGuardrails();
    const ethics =
      'Agent Checkpoint Ledger is append-only identity+audit. SIMULATION layers only. Twin claim bans hold. ChatGPT read/review only — never Policy Gate bypass, never second control plane.';
    assertEthicsSafeCopy(ethics, 'agent-checkpoint-ledger');

    if (!input.xivAgent || !input.model || !input.story) {
      throw new TypeError('xivAgent, model, and story are required');
    }
    if (!['LOCAL', 'CLOUD_SANDBOX', 'PRODUCTION'].includes(input.environment)) {
      throw new TypeError('environment must be LOCAL | CLOUD_SANDBOX | PRODUCTION (label only)');
    }
    // PRODUCTION is label-only: still not a high-autonomy grant
    if (input.environment === 'PRODUCTION') {
      // recording allowed; autonomy flags stay false on the entry
    }
    const confidence = input.confidence ?? 0.5;
    if (confidence < 0 || confidence > 1) {
      throw new RangeError('confidence must be 0..1');
    }

    const filesChanged = Object.freeze([...(input.filesChanged ?? [])]);
    const testsPassed = Object.freeze([...(input.testsPassed ?? [])]);
    const testsFailed = Object.freeze([...(input.testsFailed ?? [])]);
    const databaseMigrations = Object.freeze([...(input.databaseMigrations ?? [])]);
    const atomicCellIds = Object.freeze([...(input.atomicCellIds ?? [])]);
    const debriefId = input.debriefId ?? null;
    const createdAt = input.createdAt ?? new Date().toISOString();
    const sequence = this.entries.length + 1;

    const evidenceHash =
      input.evidenceHash ??
      hashEvidence([
        input.xivAgent,
        input.model,
        input.story,
        input.environment,
        ...filesChanged,
        ...testsPassed,
        ...testsFailed,
        ...databaseMigrations,
        ...atomicCellIds,
        debriefId ?? '',
        String(confidence),
        createdAt,
      ]);

    const entryId = isomorphicContentHash(
      JSON.stringify({
        sequence,
        xivAgent: input.xivAgent,
        model: input.model,
        story: input.story,
        environment: input.environment,
        evidenceHash,
        debriefId,
        createdAt,
      }),
    );

    const entry: AgentCheckpointLedgerEntry = {
      entryId,
      sequence,
      schemaVersion: AGENT_CHECKPOINT_LEDGER_SCHEMA_VERSION,
      xivAgent: input.xivAgent,
      model: input.model,
      story: input.story,
      environment: input.environment,
      filesChanged,
      testsPassed,
      testsFailed,
      databaseMigrations,
      evidenceHash,
      debriefId,
      confidence,
      atomicCellIds,
      createdAt,
      immutable: true,
      policyGateBypass: false,
      secondControlPlane: false,
      autonomousProductionDDL: false,
      autonomousProductionDML: false,
      chatgptAuthorityToFlipAutonomousProduction: false,
    };

    this.entries.push(entry);
    return entry;
  }

  list(): readonly AgentCheckpointLedgerEntry[] {
    return Object.freeze([...this.entries]);
  }

  getById(entryId: string): AgentCheckpointLedgerEntry | undefined {
    return this.entries.find((e) => e.entryId === entryId);
  }

  size(): number {
    return this.entries.length;
  }

  /** Explicitly banned — append-only. */
  rewrite(_entryId: string): never {
    throw new Error('rewrite banned — Agent Checkpoint Ledger is append-only');
  }

  /** Explicitly banned — append-only. */
  delete(_entryId: string): never {
    throw new Error('delete banned — Agent Checkpoint Ledger is append-only');
  }

  /** Explicitly banned — never a control plane. */
  flipAutonomousProduction(_flag: 'DDL' | 'DML', _value: boolean): never {
    throw new Error('checkpoint ledger cannot flip autonomousProduction* — not a control plane');
  }

  /** Explicitly banned — never bypass Policy Gate. */
  bypassPolicyGate(): never {
    throw new Error('NEVER bypass Policy Gate via checkpoint ledger');
  }
}

/** Test helper — fresh ledger instance (no shared mutable singleton required). */
export function createAgentCheckpointLedger(): AgentCheckpointLedger {
  assertLedgerGuardrails();
  return new AgentCheckpointLedger();
}

/**
 * ChatGPT (and any agent) checkpoint consumer = read/review only.
 * Returns a frozen view; never mutates ledger; never flips production flags.
 */
export function reviewCheckpointAsChatGPT(
  ledger: AgentCheckpointLedger,
  entryId: string,
): {
  entry: AgentCheckpointLedgerEntry;
  role: 'READ_REVIEW_CONSUMER';
  mayFlipAutonomousProduction: false;
  mayBypassPolicyGate: false;
  isControlPlane: false;
} {
  assertLedgerGuardrails();
  const entry = ledger.getById(entryId);
  if (!entry) {
    throw new Error(`unknown checkpoint entry: ${entryId}`);
  }
  return {
    entry: Object.freeze({ ...entry }),
    role: 'READ_REVIEW_CONSUMER',
    mayFlipAutonomousProduction: false,
    mayBypassPolicyGate: false,
    isControlPlane: false,
  };
}

/**
 * Optional hook: append a ledger row from a Story Factory debrief.
 * Does not grant production authority; environment defaults to LOCAL.
 */
export function appendCheckpointFromStoryDebrief(
  ledger: AgentCheckpointLedger,
  debrief: CheckpointDebriefLike,
  opts?: {
    model?: string;
    environment?: CheckpointEnvironmentLabel;
    filesChanged?: readonly string[];
    testsPassed?: readonly string[];
    testsFailed?: readonly string[];
    databaseMigrations?: readonly string[];
    atomicCellIds?: readonly string[];
    confidence?: number;
  },
): AgentCheckpointLedgerEntry {
  const story =
    debrief.storyIds[0] ??
    debrief.completed[0] ??
    debrief.failed[0] ??
    debrief.blocked[0] ??
    `debrief:${debrief.debriefId.slice(0, 12)}`;
  const evidenceHash =
    debrief.evidenceRefs.length > 0
      ? hashEvidence([...debrief.evidenceRefs, debrief.debriefId])
      : hashEvidence([debrief.debriefId, ...debrief.completed, ...debrief.failed]);
  return ledger.append({
    xivAgent: debrief.agent,
    model: opts?.model ?? `storyfactory:${debrief.agent}`,
    story,
    environment: opts?.environment ?? 'LOCAL',
    filesChanged: opts?.filesChanged,
    testsPassed: opts?.testsPassed ?? [...debrief.completed],
    testsFailed: opts?.testsFailed ?? [...debrief.failed],
    databaseMigrations: opts?.databaseMigrations,
    evidenceHash,
    debriefId: debrief.debriefId,
    confidence: opts?.confidence ?? (debrief.evidenceRefs.length > 0 ? 0.75 : 0.4),
    atomicCellIds: opts?.atomicCellIds,
    createdAt: debrief.createdAt,
  });
}

/**
 * Optional hook: append a ledger row after Adaptive Council learning update.
 * Audit of learning samples only — never flips production or Policy Gate.
 */
export function appendCheckpointFromAdaptiveCouncil(
  ledger: AgentCheckpointLedger,
  input: {
    xivAgent?: CheckpointXivAgent;
    model?: string;
    story: string;
    learning: CheckpointCouncilLearningLike;
    debriefId?: string | null;
    environment?: CheckpointEnvironmentLabel;
    atomicCellIds?: readonly string[];
    confidence?: number;
  },
): AgentCheckpointLedgerEntry {
  const evidenceHash = hashEvidence([
    'adaptive-council',
    input.story,
    String(input.learning.samples),
    JSON.stringify(input.learning.biasByTag),
    input.debriefId ?? '',
  ]);
  return ledger.append({
    xivAgent: input.xivAgent ?? 'LOCAL_RULES',
    model: input.model ?? 'adaptive-council:LOCAL_RULES',
    story: input.story,
    environment: input.environment ?? 'LOCAL',
    evidenceHash,
    debriefId: input.debriefId ?? null,
    confidence: input.confidence ?? Math.min(1, 0.3 + input.learning.samples * 0.02),
    atomicCellIds: input.atomicCellIds,
    testsPassed: [],
    testsFailed: [],
    filesChanged: [],
    databaseMigrations: [],
  });
}

export function assertAgentCheckpointTwinBans(): void {
  assertLedgerGuardrails();
  if (FOUNDER_TWIN_GUARDRAILS.biologicalDnaCloningCapability) {
    throw new Error('biological DNA cloning capability must remain false');
  }
  if (!FOUNDER_TWIN_GUARDRAILS.wormholesAreSparseSimulationPathwaysOnly) {
    throw new Error('wormholes must remain sparse SIMULATION pathways only');
  }
  if (!UNIVERSES_ARE_SIMULATION_LAYERS_ONLY) {
    throw new Error('universes must remain SIMULATION layers only');
  }
}
