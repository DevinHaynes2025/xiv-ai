/**
 * 12D-10 — LOCAL Ollama writer loop (OFFLINE_PREFER_LOCAL).
 * Prefer http://127.0.0.1:11434 when reachable; else LOCAL_RULES / WAITING_PROVIDER.
 * Never claims VERIFIED GPU/NPU/QPU. Never production DDL/DML.
 * Probe fetch is injectable for isomorphic / offline tests.
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
import { DEFAULT_BUILDERS, selectBuilder } from '../builder/orchestrator';

/** Doctrine: when Ollama :11434 is up, prefer local offline writer. */
export const OFFLINE_PREFER_LOCAL = true as const;

export const OLLAMA_DEFAULT_ENDPOINT = 'http://127.0.0.1:11434' as const;

export const OLLAMA_WRITER_GUARDRAILS = {
  readOnlyArtifacts: true as const,
  productionAutoApply: false as const,
  autonomousProductionDDL: false as const,
  autonomousProductionDML: false as const,
  OFFLINE_PREFER_LOCAL,
  /** Never emit fake VERIFIED accelerator claims. */
  verifiedAcceleratorClaimAllowed: false as const,
  fakeVerifiedGpuNpuQpuAllowed: false as const,
  highAutonomyTargets: HIGH_AUTONOMY_TARGETS,
  businessBarMetrics: BUSINESS_BAR_METRICS,
  VALUATION_THEATER_ALLOWED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  checkpointIsReadReviewOnly: true as const,
  policyGateBypassAllowed: false as const,
  /** Agent Identity Checkpoint Ledger is the next ticket after this one. */
  nextTicket: '12D-11' as const,
} as const;

export type AcceleratorClaimStatus = 'UNVERIFIED' | 'UNAVAILABLE';

export type AcceleratorClaimBoard = {
  gpu: AcceleratorClaimStatus;
  npu: AcceleratorClaimStatus;
  qpu: AcceleratorClaimStatus;
  /** Hard ban: never VERIFIED without real evidence — and this module never emits VERIFIED. */
  anyVerifiedClaim: false;
};

export type OllamaProbeResult = {
  endpoint: string;
  reachable: boolean;
  preferLocal: typeof OFFLINE_PREFER_LOCAL;
  selectedProvider: 'OLLAMA' | 'LOCAL_RULES' | 'WAITING_PROVIDER';
  accelerators: AcceleratorClaimBoard;
  notes: string;
  liveCloudSyncClaimed: false;
};

export type LocalWriterArtifact = {
  artifactId: string;
  kind: 'SUMMARY' | 'NOTES' | 'INGEST_PLAN';
  body: string;
  contentChecksum: string;
  provider: 'OLLAMA' | 'LOCAL_RULES';
  productionMutation: false;
};

export type LocalWriterLoopResult = {
  provider: 'OLLAMA' | 'LOCAL_RULES' | 'WAITING_PROVIDER';
  artifacts: LocalWriterArtifact[];
  probe: OllamaProbeResult;
  productionAutoApply: false;
  autonomousProductionDDL: false;
  autonomousProductionDML: false;
  ethicsNotice: string;
  guardrails: typeof OLLAMA_WRITER_GUARDRAILS;
};

function assertWriterGuardrails(): void {
  if (OLLAMA_WRITER_GUARDRAILS.autonomousProductionDDL || BUILDER_GUARDRAILS.autonomousProductionDDL) {
    throw new Error('autonomousProductionDDL must remain false');
  }
  if (OLLAMA_WRITER_GUARDRAILS.autonomousProductionDML || BUILDER_GUARDRAILS.autonomousProductionDML) {
    throw new Error('autonomousProductionDML must remain false');
  }
  if (OLLAMA_WRITER_GUARDRAILS.verifiedAcceleratorClaimAllowed) {
    throw new Error('verifiedAcceleratorClaimAllowed must remain false');
  }
  if (OLLAMA_WRITER_GUARDRAILS.fakeVerifiedGpuNpuQpuAllowed) {
    throw new Error('fakeVerifiedGpuNpuQpuAllowed must remain false');
  }
  if (OLLAMA_WRITER_GUARDRAILS.policyGateBypassAllowed) {
    throw new Error('policyGateBypassAllowed must remain false');
  }
  if (!OLLAMA_WRITER_GUARDRAILS.OFFLINE_PREFER_LOCAL) {
    throw new Error('OFFLINE_PREFER_LOCAL must remain true for 12D-10');
  }
  const targets = OLLAMA_WRITER_GUARDRAILS.highAutonomyTargets;
  if (!targets.includes('LOCAL') || !targets.includes('CLOUD_SANDBOX') || targets.length !== 2) {
    throw new Error('highAutonomyTargets must be LOCAL|CLOUD_SANDBOX only');
  }
}

function unverifiedAccelerators(): AcceleratorClaimBoard {
  return {
    gpu: 'UNVERIFIED',
    npu: 'UNVERIFIED',
    qpu: 'UNVERIFIED',
    anyVerifiedClaim: false,
  };
}

export type FetchLike = (
  input: string,
  init?: { method?: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number }>;

/**
 * Probe local Ollama. Injectable fetch for tests — never fabricates reachability.
 */
export async function probeOllamaLocal(input?: {
  endpoint?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}): Promise<OllamaProbeResult> {
  assertWriterGuardrails();
  const endpoint = input?.endpoint ?? OLLAMA_DEFAULT_ENDPOINT;
  const fetchImpl = input?.fetchImpl;
  let reachable = false;
  let notes = 'probe skipped (no fetchImpl) — treat as unreachable; OFFLINE_PREFER_LOCAL still set';

  if (fetchImpl) {
    try {
      const res = await fetchImpl(endpoint + '/api/tags', { method: 'GET' });
      reachable = res.ok;
      notes = reachable
        ? 'Ollama reachable on local endpoint — OFFLINE_PREFER_LOCAL selects OLLAMA'
        : 'Ollama probe non-OK status ' + String(res.status);
    } catch {
      reachable = false;
      notes = 'Ollama probe failed — fall back to LOCAL_RULES or WAITING_PROVIDER';
    }
  }

  let selectedProvider: OllamaProbeResult['selectedProvider'];
  if (reachable && OFFLINE_PREFER_LOCAL) {
    selectedProvider = 'OLLAMA';
  } else {
    const picked = selectBuilder(DEFAULT_BUILDERS, true);
    selectedProvider = picked?.provider === 'LOCAL_RULES' ? 'LOCAL_RULES' : 'WAITING_PROVIDER';
    if (!reachable && selectedProvider === 'LOCAL_RULES') {
      notes = notes + '; LOCAL_RULES enabled as offline fallback';
    }
  }

  return {
    endpoint,
    reachable,
    preferLocal: OFFLINE_PREFER_LOCAL,
    selectedProvider,
    accelerators: unverifiedAccelerators(),
    notes,
    liveCloudSyncClaimed: false,
  };
}

/**
 * Local writer loop: produce read-only summary/notes artifacts from approved text.
 * Does not call production DB. Does not claim VERIFIED accelerators.
 * When provider is OLLAMA but no generateImpl is given, emits a deterministic LOCAL stub
 * labeled with selected provider intent (tests inject generateImpl for OLLAMA path).
 */
export async function runLocalOllamaWriterLoop(input: {
  runId: string;
  sourceText: string;
  probe?: OllamaProbeResult;
  fetchImpl?: FetchLike;
  /** Optional OLLAMA generate hook (tests / local adapter). */
  generateImpl?: (prompt: string) => Promise<string>;
}): Promise<LocalWriterLoopResult> {
  assertWriterGuardrails();
  const probe = input.probe ?? (await probeOllamaLocal({ fetchImpl: input.fetchImpl }));

  const ethicsNotice =
    '12D-10 LOCAL writer loop is OFFLINE_PREFER_LOCAL. High-autonomy: LOCAL|CLOUD_SANDBOX only. ' +
    'No autonomous production DDL/DML. Accelerator claims remain UNVERIFIED (gpu/npu/qpu) — never fake VERIFIED. ' +
    'Checkpoint read/review only; no Policy Gate bypass. Business bar: adoption/reliability/security/unit_economics/customer_value.';
  assertEthicsSafeCopy(ethicsNotice, '12d10 writer ethicsNotice');

  if (probe.selectedProvider === 'WAITING_PROVIDER') {
    return {
      provider: 'WAITING_PROVIDER',
      artifacts: [],
      probe,
      productionAutoApply: false,
      autonomousProductionDDL: false,
      autonomousProductionDML: false,
      ethicsNotice,
      guardrails: OLLAMA_WRITER_GUARDRAILS,
    };
  }

  let body: string;
  let provider: 'OLLAMA' | 'LOCAL_RULES' = probe.selectedProvider === 'OLLAMA' ? 'OLLAMA' : 'LOCAL_RULES';
  if (provider === 'OLLAMA' && input.generateImpl) {
    body = await input.generateImpl(
      'Summarize for Pocket Brain ingest (read-only, no production DDL/DML):\n' + input.sourceText,
    );
  } else {
    // Deterministic local stub — honest about offline rules path when no generateImpl.
    provider = provider === 'OLLAMA' && !input.generateImpl ? 'OLLAMA' : 'LOCAL_RULES';
    body =
      '[LOCAL_WRITER_STUB] runId=' +
      input.runId +
      ' providerIntent=' +
      probe.selectedProvider +
      ' chars=' +
      String(input.sourceText.length) +
      ' checksum=' +
      isomorphicContentHash(input.sourceText);
    if (probe.selectedProvider === 'OLLAMA' && !input.generateImpl) {
      provider = 'OLLAMA';
      body = '[OLLAMA_PATH_NO_GENERATE_IMPL] ' + body;
    }
  }

  const artifact: LocalWriterArtifact = {
    artifactId: 'writer:' + input.runId,
    kind: 'SUMMARY',
    body,
    contentChecksum: isomorphicContentHash(body),
    provider,
    productionMutation: false,
  };

  return {
    provider,
    artifacts: [artifact],
    probe,
    productionAutoApply: false,
    autonomousProductionDDL: false,
    autonomousProductionDML: false,
    ethicsNotice,
    guardrails: OLLAMA_WRITER_GUARDRAILS,
  };
}
