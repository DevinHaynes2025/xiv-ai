/**
 * US-NS-01 -- Neural Search LOCAL v0.1 (schema-locked).
 * Plane: LOCAL-first · PRODUCTION hard-off · Policy Gate in front of every hop.
 * Motifs: RESEARCH_HYPOTHESIS | SIMULATION | METAPHOR_ONLY only — never quantum-advantage.
 * Lab deltas: requireSealed fail-closed · GATE_DENIED stops hops · scopeId bleed deny ·
 * MIXED/CLOUD_SANDBOX no auto-pull. tipSha never invented. Seed corpus WAITING_POCKET_BRAIN_INGEST OK.
 */

export const NEURAL_SEARCH_V0_POLICY = {
  schemaVersion: '0.1' as const,
  storyId: 'US-NS-01' as const,
  l4Autonomy: false as const,
  productionMutation: false as const,
  productionAuto: false as const,
  readOnly: true as const,
  layerKind: 'SIMULATION' as const,
  preferredPlane: 'LOCAL' as const,
  mayEnterGlobalBrain: false as const,
  liveCloudSyncClaimed: false as const,
  policyGateInFront: true as const,
  policyGateBypassAllowed: false as const,
  requireSealedFailClosed: true as const,
  multiHopStopOnGateDenied: true as const,
  scopeBleedDenied: true as const,
  cloudAutoPullForbidden: true as const,
  motifQuantumAdvantageForbidden: true as const,
  motifMysticalTechForbidden: true as const,
  inventedShaForbidden: true as const,
  inventedMetricsForbidden: true as const,
  aspirationalAsMeasuredForbidden: true as const,
  label: 'NEURAL_SEARCH_LOCAL_V0',
  neuralSearchV0Wire: 'WIRED' as const,
} as const;

export type NeuralSearchPlane = 'LOCAL' | 'CLOUD_SANDBOX' | 'MIXED';
export type NeuralSearchStatus =
  | 'HIT'
  | 'MISS'
  | 'PARTIAL'
  | 'WAITING'
  | 'GATE_DENIED'
  | 'SCOPE_DENIED';
export type GateOutcome = 'ALLOW' | 'GATE_DENIED';
export type HopSurface = 'POCKET_BRAIN' | 'BLUE_BRAIN' | 'COMPANY_BRAIN' | 'GLOBAL_BRAIN';
export type HonestyLabel =
  | 'MEASURED'
  | 'ASPIRATIONAL'
  | 'SEALED'
  | 'LIBRARY_CITE'
  | 'UNVERIFIED'
  | 'DETECTED'
  | 'VERIFIED'
  | 'SIMULATION'
  | 'LOCAL'
  | 'RESEARCH_HYPOTHESIS'
  | 'METAPHOR_ONLY';
export type WaitingCode =
  | 'WAITING_POCKET_BRAIN_INGEST'
  | 'WAITING_OLLAMA'
  | 'WAITING_SOURCE'
  | 'WAITING_CHECKSUM'
  | 'WAITING_SYNC'
  | 'WAITING_SCORER'
  | 'WAITING_CODE_SLICE'
  | 'WAITING_GATE'
  | 'WAITING_PROVIDER'
  | 'WAITING_DATA'
  | 'WAITING_SEAL'
  | 'WAITING_SCOPE'
  | 'WAITING_CLOUD_PULL';
export type ScaleKind = 'measured' | 'aspirational';
export type CellClassification = 'LOCAL' | 'SIMULATION' | 'CLOUD_SANDBOX';
export type Lane = 'HOT' | 'WARM' | 'COLD' | 'ARCHIVE';
export type MotifKind = 'QUANTUM_METAPHOR' | 'ANCIENT_EGYPTIAN_METAPHOR' | 'OTHER_METAPHOR';
export type MotifRequiredLabel = 'RESEARCH_HYPOTHESIS' | 'SIMULATION' | 'METAPHOR_ONLY';

export type PolicyGateToken = {
  allowed: boolean;
  reason: string | null;
  bypassAllowed: false;
};

export type MotifTag = {
  kind: MotifKind;
  labels: MotifRequiredLabel[];
  text: string;
  forbiddenExpansions: string[];
};

export type AtomicDataCell = {
  cellId: string;
  tipId: string | null;
  tipSha: string | null;
  scopeId: string;
  sealed: boolean | null;
  claim: string;
  provenance: string[];
  confidence: string;
  classification: CellClassification;
  tenant: string;
  checksum: string | null;
  timestamp: string | null;
  vector: { status: string; endpoint?: string; dims?: number };
  graph: { shelf: string; neighbors: string[] };
  replication: { mode: string; production_auto: false };
  scaleKind: ScaleKind;
  honesty: string[];
  motifTags?: MotifTag[];
  lane?: Lane;
};

export type NeuralSearchQuery = {
  schemaVersion: '0.1';
  queryId: string;
  issuedAt: string;
  plane: NeuralSearchPlane;
  cloudPullApproved: boolean;
  scopeId: string;
  text: string;
  filters?: {
    cellIds?: string[];
    tipIds?: string[];
    shelves?: string[];
    classification?: CellClassification[];
    lane?: Lane[];
    requireSealed?: boolean;
  };
  hopBudget: number;
  gate: PolicyGateToken;
  motifMode: 'OFF' | 'METAPHOR_ONLY';
  /** Optional override surfaces for multi-hop tests; default POCKET_BRAIN only. */
  hopSurfaces?: HopSurface[];
};

export type SearchHit = {
  rank: number;
  score: number | null;
  cellId: string;
  scopeId: string;
  tipId: string | null;
  tipSha: string | null;
  sealed: boolean | null;
  snippet: string;
  evidenceQuality: number | null;
  scaleKind: ScaleKind | null;
  labels: HonestyLabel[];
  sourceShelf: string | null;
};

export type HopTrace = {
  hop: number;
  surface: HopSurface;
  gateOutcome: GateOutcome;
  cellIdsTouched: string[];
  scopeId: string;
  note: string | null;
};

export type WaitingItem = {
  code: WaitingCode;
  detail: string;
  blocksHit: boolean;
};

export type HonestyBlock = {
  inventedShaForbidden: true;
  inventedMetricsForbidden: true;
  gateBypassForbidden: true;
  globalBrainForbidden: true;
  motifQuantumAdvantageForbidden: true;
  motifMysticalTechForbidden: true;
  aspirationalAsMeasuredForbidden: true;
  requireSealedFailClosed: true;
  multiHopStopOnGateDenied: true;
  scopeBleedDenied: true;
  cloudAutoPullForbidden: true;
  notes: string[];
};

export type NeuralSearchResult = {
  schemaVersion: '0.1';
  queryId: string;
  generatedAt: string;
  plane: NeuralSearchPlane;
  cloudPullUsed: false | true;
  scopeId: string;
  gateOutcome: GateOutcome;
  status: NeuralSearchStatus;
  hits: SearchHit[];
  waiting: WaitingItem[];
  hopTrace: HopTrace[];
  honesty: HonestyBlock;
  motifDisclosure: string | null;
};

export const MOTIF_REQUIRED_LABELS: MotifRequiredLabel[] = [
  'RESEARCH_HYPOTHESIS',
  'SIMULATION',
  'METAPHOR_ONLY',
];

export const MOTIF_FORBIDDEN_EXPANSIONS = [
  'quantum advantage',
  'QPU VERIFIED',
  'mystical tech',
  'oracle / destiny theater',
] as const;

export const DEFAULT_HONESTY_BLOCK: HonestyBlock = {
  inventedShaForbidden: true,
  inventedMetricsForbidden: true,
  gateBypassForbidden: true,
  globalBrainForbidden: true,
  motifQuantumAdvantageForbidden: true,
  motifMysticalTechForbidden: true,
  aspirationalAsMeasuredForbidden: true,
  requireSealedFailClosed: true,
  multiHopStopOnGateDenied: true,
  scopeBleedDenied: true,
  cloudAutoPullForbidden: true,
  notes: [
    'LOCAL shard only unless cloudPullApproved + Gate ALLOW',
    'Vectors: WAITING_POCKET_BRAIN_INGEST — ordinal rank OK',
    'Motifs never expand to quantum-advantage / QPU VERIFIED / mystical tech',
  ],
};

/** Seed corpus stubs (ADC-12D-10…15) — vectors WAITING_POCKET_BRAIN_INGEST. */
export const BUILTIN_POCKET_BRAIN_CELLS: AtomicDataCell[] = [
  {
    cellId: 'ADC-12D-10',
    tipId: '12D-10',
    tipSha: '13e6dc5',
    scopeId: 'xiv-local',
    sealed: true,
    claim: 'Guardrail self-seal landed; OLLAMA_WRITER + POCKET_BRAIN autonomy self-asserted.',
    provenance: ['Offline Builder memory 2026-09-10', 'library/indexes/sealed-tips-12d.json'],
    confidence: 'sealed_index_cite',
    classification: 'LOCAL',
    tenant: 'xiv-local',
    checksum: null,
    timestamp: '2026-09-10T05:15:00Z',
    vector: { status: 'WAITING_POCKET_BRAIN_INGEST', endpoint: 'WAITING_OLLAMA_127.0.0.1:11434' },
    graph: { shelf: 'sealed-tips', neighbors: ['12D-10', '12D-11', '12D-12', '12D-13', '12D-14', '12D-15'] },
    replication: { mode: 'LOCAL_SHARD_ONLY', production_auto: false },
    scaleKind: 'measured',
    honesty: ['LIBRARY_CITE', 'SEALED', 'LOCAL'],
    lane: 'HOT',
  },
  {
    cellId: 'ADC-12D-11',
    tipId: '12D-11',
    tipSha: 'd5a1db6',
    scopeId: 'xiv-local',
    sealed: true,
    claim: 'Checkpoint Ledger polish; Merge/Deploy asserts; L4/destructive/secrets self-seals.',
    provenance: ['Offline Builder memory 2026-09-10', 'library/indexes/sealed-tips-12d.json'],
    confidence: 'sealed_index_cite',
    classification: 'LOCAL',
    tenant: 'xiv-local',
    checksum: null,
    timestamp: '2026-09-10T05:15:00Z',
    vector: { status: 'WAITING_POCKET_BRAIN_INGEST', endpoint: 'WAITING_OLLAMA_127.0.0.1:11434' },
    graph: { shelf: 'sealed-tips', neighbors: ['12D-10', '12D-11', '12D-12', '12D-13', '12D-14', '12D-15'] },
    replication: { mode: 'LOCAL_SHARD_ONLY', production_auto: false },
    scaleKind: 'measured',
    honesty: ['LIBRARY_CITE', 'SEALED', 'LOCAL'],
    lane: 'HOT',
  },
  {
    cellId: 'ADC-12D-12',
    tipId: '12D-12',
    tipSha: '06bc5a33954275a8d3e14e4f2d33f941d13731fe',
    scopeId: 'xiv-local',
    sealed: true,
    claim: 'Checkpoint Ledger consumer polish tip; prior 990ff590 was EQ2 PASS_WITH_NOTES.',
    provenance: ['Offline Builder + xiv ai memory 2026-09-10', 'library/indexes/sealed-tips-12d.json'],
    confidence: 'sealed_index_cite',
    classification: 'LOCAL',
    tenant: 'xiv-local',
    checksum: null,
    timestamp: '2026-09-10T05:20:00Z',
    vector: { status: 'WAITING_POCKET_BRAIN_INGEST', endpoint: 'WAITING_OLLAMA_127.0.0.1:11434' },
    graph: { shelf: 'sealed-tips', neighbors: ['12D-10', '12D-11', '12D-12', '12D-13', '12D-14', '12D-15'] },
    replication: { mode: 'LOCAL_SHARD_ONLY', production_auto: false },
    scaleKind: 'measured',
    honesty: ['LIBRARY_CITE', 'SEALED', 'LOCAL'],
    lane: 'WARM',
  },
  {
    cellId: 'ADC-12D-13',
    tipId: '12D-13',
    tipSha: '2ddc3b64',
    scopeId: 'xiv-local',
    sealed: true,
    claim: 'LOCAL ADC offline read-path polish sealed (device→local_shard; HOT SQLITE|OBJECT_STORE).',
    provenance: ['xiv ai tip refresh 2026-09-10', 'Offline Builder memory 2026-09-10'],
    confidence: 'sealed_eq3_tip_refresh',
    classification: 'LOCAL',
    tenant: 'xiv-local',
    checksum: null,
    timestamp: '2026-09-10T05:20:00Z',
    vector: { status: 'WAITING_POCKET_BRAIN_INGEST', endpoint: 'WAITING_OLLAMA_127.0.0.1:11434' },
    graph: { shelf: 'sealed-tips', neighbors: ['12D-10', '12D-11', '12D-12', '12D-13', '12D-14', '12D-15'] },
    replication: { mode: 'LOCAL_SHARD_ONLY', production_auto: false },
    scaleKind: 'measured',
    honesty: ['LIBRARY_CITE', 'SEALED', 'LOCAL'],
    lane: 'HOT',
  },
  {
    cellId: 'ADC-12D-14',
    tipId: '12D-14',
    tipSha: '149610248a2899358ab1938c01492a5bd7c23a4f',
    scopeId: 'xiv-local',
    sealed: true,
    claim: 'SIMULATION LOCAL virtual mini-city stubs sealed. measured=null honesty.',
    provenance: ['Offline Builder memory 2026-09-10', 'xiv ai memory 2026-09-10'],
    confidence: 'sealed_eq3_tip_board',
    classification: 'SIMULATION',
    tenant: 'xiv-local',
    checksum: null,
    timestamp: '2026-09-10T05:27:00Z',
    vector: { status: 'WAITING_POCKET_BRAIN_INGEST', endpoint: 'WAITING_OLLAMA_127.0.0.1:11434' },
    graph: { shelf: 'sealed-tips', neighbors: ['12D-10', '12D-11', '12D-12', '12D-13', '12D-14', '12D-15'] },
    replication: { mode: 'LOCAL_SHARD_ONLY', production_auto: false },
    scaleKind: 'aspirational',
    honesty: ['LIBRARY_CITE', 'SEALED', 'SIMULATION', 'ASPIRATIONAL'],
    lane: 'WARM',
  },
  {
    cellId: 'ADC-12D-15',
    tipId: '12D-15',
    tipSha: '5bbf1d32a81bfd197aa077baa812784a191ad690',
    scopeId: 'xiv-local',
    sealed: true,
    claim: 'Blue Brain LOCAL surface sealed. SIMULATION fixtures only; no live Global.',
    provenance: ['Offline Builder memory 2026-09-10', 'xiv ai tip board: 12D-15 Blue Brain'],
    confidence: 'sealed_eq3_tip_board',
    classification: 'LOCAL',
    tenant: 'xiv-local',
    checksum: null,
    timestamp: '2026-09-10T05:27:00Z',
    vector: { status: 'WAITING_POCKET_BRAIN_INGEST', endpoint: 'WAITING_OLLAMA_127.0.0.1:11434' },
    graph: { shelf: 'sealed-tips', neighbors: ['12D-10', '12D-11', '12D-12', '12D-13', '12D-14', '12D-15'] },
    replication: { mode: 'LOCAL_SHARD_ONLY', production_auto: false },
    scaleKind: 'measured',
    honesty: ['LIBRARY_CITE', 'SEALED', 'LOCAL'],
    lane: 'HOT',
  },
  /** Unsealed stub for requireSealed fail-closed tests — tipSha null, never invent. */
  {
    cellId: 'ADC-UNSEALED-STUB',
    tipId: 'UNSEALED-01',
    tipSha: null,
    scopeId: 'xiv-local',
    sealed: false,
    claim: 'Unsealed pocket stub — WAITING_SEAL; tipSha unobserved.',
    provenance: [],
    confidence: 'unverified',
    classification: 'LOCAL',
    tenant: 'xiv-local',
    checksum: null,
    timestamp: null,
    vector: { status: 'WAITING_POCKET_BRAIN_INGEST' },
    graph: { shelf: 'pocket-brain-cells', neighbors: ['12D-15'] },
    replication: { mode: 'LOCAL_SHARD_ONLY', production_auto: false },
    scaleKind: 'aspirational',
    honesty: ['UNVERIFIED', 'ASPIRATIONAL', 'LOCAL'],
    lane: 'COLD',
  },
  /** Cross-scope cell — bleed deny. */
  {
    cellId: 'ADC-OTHER-SCOPE',
    tipId: 'OTHER-01',
    tipSha: 'deadbeef',
    scopeId: 'other-tenant',
    sealed: true,
    claim: 'Foreign scope cell — must never merge into xiv-local hits.',
    provenance: ['fixture'],
    confidence: 'sealed_index_cite',
    classification: 'LOCAL',
    tenant: 'other-tenant',
    checksum: null,
    timestamp: '2026-09-10T00:00:00Z',
    vector: { status: 'WAITING_POCKET_BRAIN_INGEST' },
    graph: { shelf: 'sealed-tips', neighbors: ['12D-15'] },
    replication: { mode: 'LOCAL_SHARD_ONLY', production_auto: false },
    scaleKind: 'measured',
    honesty: ['SEALED', 'LOCAL'],
    lane: 'ARCHIVE',
  },
];

let corpusOverride: AtomicDataCell[] | null = null;

export function neuralSearchV0WireStatus(): 'WIRED' {
  return NEURAL_SEARCH_V0_POLICY.neuralSearchV0Wire;
}

export function dumpNeuralSearchHonesty(): HonestyBlock {
  return { ...DEFAULT_HONESTY_BLOCK, notes: [...DEFAULT_HONESTY_BLOCK.notes] };
}

export function getNeuralSearchCorpus(): AtomicDataCell[] {
  return (corpusOverride ?? BUILTIN_POCKET_BRAIN_CELLS).map((c) => ({
    ...c,
    provenance: [...c.provenance],
    honesty: [...c.honesty],
    graph: { shelf: c.graph.shelf, neighbors: [...c.graph.neighbors] },
    vector: { ...c.vector },
    replication: { ...c.replication },
    motifTags: c.motifTags ? c.motifTags.map((m) => ({ ...m, labels: [...m.labels], forbiddenExpansions: [...m.forbiddenExpansions] })) : undefined,
  }));
}

export function setNeuralSearchCorpusForTests(cells: AtomicDataCell[] | null): void {
  corpusOverride = cells;
}

export function resetNeuralSearchSession(): void {
  corpusOverride = null;
}

export function neuralSearchAllowsL4(): false {
  return NEURAL_SEARCH_V0_POLICY.l4Autonomy;
}

export function neuralSearchAllowsProductionMutation(): false {
  return NEURAL_SEARCH_V0_POLICY.productionMutation;
}

export function neuralSearchIsReadOnly(): true {
  return NEURAL_SEARCH_V0_POLICY.readOnly;
}

export function neuralSearchCloudAutoPullForbidden(): true {
  return NEURAL_SEARCH_V0_POLICY.cloudAutoPullForbidden;
}

export function neuralSearchScopeBleedDenied(): true {
  return NEURAL_SEARCH_V0_POLICY.scopeBleedDenied;
}

export function neuralSearchRequireSealedFailClosed(): true {
  return NEURAL_SEARCH_V0_POLICY.requireSealedFailClosed;
}

export function neuralSearchMultiHopStopOnGateDenied(): true {
  return NEURAL_SEARCH_V0_POLICY.multiHopStopOnGateDenied;
}

export function neuralSearchMotifQuantumAdvantageForbidden(): true {
  return NEURAL_SEARCH_V0_POLICY.motifQuantumAdvantageForbidden;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeQueryId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
  return `ns-q-${stamp}-v0`;
}

function normalizeMotifTags(tags: MotifTag[] | undefined): MotifTag[] {
  if (!tags?.length) return [];
  return tags.map((t) => ({
    kind: t.kind,
    labels: [...MOTIF_REQUIRED_LABELS],
    text: t.text,
    forbiddenExpansions: [...MOTIF_FORBIDDEN_EXPANSIONS],
  }));
}

function cellMatchesText(cell: AtomicDataCell, text: string): boolean {
  const q = text.trim().toLowerCase();
  if (!q) return true;
  const hay = `${cell.cellId} ${cell.tipId ?? ''} ${cell.claim} ${cell.honesty.join(' ')} ${cell.graph.shelf}`.toLowerCase();
  return q.split(/\s+/).some((tok) => hay.includes(tok));
}

function labelsForCell(cell: AtomicDataCell): HonestyLabel[] {
  const out: HonestyLabel[] = ['LIBRARY_CITE'];
  if (cell.sealed === true && cell.tipSha) out.push('SEALED');
  if (cell.classification === 'LOCAL') out.push('LOCAL');
  if (cell.classification === 'SIMULATION') out.push('SIMULATION');
  if (cell.scaleKind === 'aspirational') out.push('ASPIRATIONAL');
  if (cell.scaleKind === 'measured' && cell.tipSha) out.push('MEASURED');
  if (!cell.tipSha) out.push('UNVERIFIED');
  if (cell.motifTags?.length) {
    out.push('RESEARCH_HYPOTHESIS', 'METAPHOR_ONLY', 'SIMULATION');
  }
  return Array.from(new Set(out));
}

function isSealedEligible(cell: AtomicDataCell): boolean {
  return cell.sealed === true && typeof cell.tipSha === 'string' && cell.tipSha.length > 0;
}

function defaultSurfaces(budget: number): HopSurface[] {
  const base: HopSurface[] = ['POCKET_BRAIN'];
  if (budget >= 2) base.push('BLUE_BRAIN');
  return base.slice(0, Math.max(1, budget));
}

/**
 * Core LOCAL retrieval. Gate before every hop; GATE_DENIED stops; scope bleed deny;
 * requireSealed fail-closed; MIXED/CLOUD never auto-pull.
 */
export function searchNeuralV0(query: NeuralSearchQuery): NeuralSearchResult {
  const honesty = dumpNeuralSearchHonesty();
  const waiting: WaitingItem[] = [];
  const hopTrace: HopTrace[] = [];
  const hits: SearchHit[] = [];
  const plane = query.plane ?? 'LOCAL';
  const scopeId = (query.scopeId ?? '').trim();
  const hopBudget = Number.isFinite(query.hopBudget) ? Math.max(0, Math.floor(query.hopBudget)) : 1;
  const surfaces = (query.hopSurfaces?.length ? query.hopSurfaces : defaultSurfaces(Math.max(hopBudget, 1))).slice(
    0,
    Math.max(hopBudget, 1),
  );

  let cloudPullUsed: false | true = false;
  let gateOutcome: GateOutcome = 'ALLOW';
  let motifDisclosure: string | null = null;

  if (!scopeId) {
    waiting.push({ code: 'WAITING_SCOPE', detail: 'scopeId required — bleed deny', blocksHit: true });
    return {
      schemaVersion: '0.1',
      queryId: query.queryId || makeQueryId(),
      generatedAt: nowIso(),
      plane,
      cloudPullUsed: false,
      scopeId: '',
      gateOutcome: 'GATE_DENIED',
      status: 'SCOPE_DENIED',
      hits: [],
      waiting,
      hopTrace,
      honesty,
      motifDisclosure: null,
    };
  }

  if (!query.gate || query.gate.bypassAllowed !== false) {
    waiting.push({ code: 'WAITING_GATE', detail: 'gate.bypassAllowed must be literal false', blocksHit: true });
  }

  // MIXED / CLOUD_SANDBOX: no auto-pull
  if (plane === 'MIXED' || plane === 'CLOUD_SANDBOX') {
    if (query.cloudPullApproved === true && query.gate?.allowed === true) {
      // Approved pull still does not invent remote corpus in v0 — stay LOCAL shard; mark waiting.
      waiting.push({
        code: 'WAITING_CLOUD_PULL',
        detail: 'cloudPullApproved but remote corpus not wired in v0 — LOCAL shard only',
        blocksHit: false,
      });
      cloudPullUsed = false;
    } else {
      waiting.push({
        code: 'WAITING_CLOUD_PULL',
        detail: `${plane} requested without approved pull — no auto-pull; LOCAL shard only`,
        blocksHit: false,
      });
      cloudPullUsed = false;
    }
  }

  waiting.push({
    code: 'WAITING_POCKET_BRAIN_INGEST',
    detail: 'Vector index not ingested — ordinal rank only',
    blocksHit: false,
  });
  waiting.push({
    code: 'WAITING_SCORER',
    detail: 'Similarity scorer not wired — score=null',
    blocksHit: false,
  });

  const corpus = getNeuralSearchCorpus();
  let stoppedOnDeny = false;
  let scopeDeniedOnly = false;
  let sealExcluded = 0;

  const maxHops = Math.max(hopBudget, 0);
  for (let i = 0; i < maxHops; i++) {
    const surface = surfaces[i] ?? surfaces[surfaces.length - 1] ?? 'POCKET_BRAIN';

    // Gate before hop
    let hopGate: GateOutcome = query.gate?.allowed === true ? 'ALLOW' : 'GATE_DENIED';
    let note: string | null = query.gate?.reason ?? null;
    if (surface === 'GLOBAL_BRAIN') {
      hopGate = 'GATE_DENIED';
      note = 'GLOBAL_BRAIN surface always GATE_DENIED (mayEnterGlobalBrain=false)';
    }
    if (query.gate?.bypassAllowed !== false) {
      hopGate = 'GATE_DENIED';
      note = 'bypassAllowed must be false';
    }

    const touched: string[] = [];

    if (hopGate === 'GATE_DENIED') {
      hopTrace.push({
        hop: i,
        surface,
        gateOutcome: 'GATE_DENIED',
        cellIdsTouched: touched,
        scopeId,
        note,
      });
      gateOutcome = 'GATE_DENIED';
      stoppedOnDeny = true;
      break; // stop — no resume/skip
    }

    // ALLOW hop — retrieve from LOCAL shard only
    const requireSealed = query.filters?.requireSealed === true;
    let hopHadScopeBleed = false;

    for (const cell of corpus) {
      if (cell.scopeId !== scopeId) {
        hopHadScopeBleed = true;
        continue; // bleed deny — never merge
      }

      // Neighbor walk must not cross scope (graph neighbors are tipIds; resolve within scope only)
      const crossNeighbor = cell.graph.neighbors.some((n) => {
        const neigh = corpus.find((c) => c.tipId === n || c.cellId === n);
        return neigh != null && neigh.scopeId !== scopeId;
      });
      if (crossNeighbor) {
        // still allow the cell itself if in-scope; neighbor merge forbidden separately
      }

      if (query.filters?.cellIds?.length && !query.filters.cellIds.includes(cell.cellId)) continue;
      if (query.filters?.tipIds?.length && (!cell.tipId || !query.filters.tipIds.includes(cell.tipId))) continue;
      if (query.filters?.shelves?.length && !query.filters.shelves.includes(cell.graph.shelf)) continue;
      if (query.filters?.classification?.length && !query.filters.classification.includes(cell.classification)) continue;
      if (query.filters?.lane?.length && cell.lane && !query.filters.lane.includes(cell.lane)) continue;

      if (requireSealed && !isSealedEligible(cell)) {
        sealExcluded += 1;
        continue; // fail-closed — never soft-include
      }

      if (!cellMatchesText(cell, query.text)) continue;

      touched.push(cell.cellId);
      if (hits.some((h) => h.cellId === cell.cellId)) continue;

      const labels = labelsForCell(cell);
      hits.push({
        rank: hits.length + 1,
        score: null,
        cellId: cell.cellId,
        scopeId: cell.scopeId,
        tipId: cell.tipId,
        tipSha: cell.tipSha, // never invent
        sealed: cell.sealed,
        snippet: cell.claim,
        evidenceQuality: null,
        scaleKind: cell.scaleKind,
        labels,
        sourceShelf: cell.graph.shelf,
      });

      if (cell.motifTags?.length || query.motifMode === 'METAPHOR_ONLY') {
        const tags = normalizeMotifTags(cell.motifTags);
        if (tags.length || query.motifMode === 'METAPHOR_ONLY') {
          motifDisclosure =
            'Motif tags are RESEARCH_HYPOTHESIS|SIMULATION|METAPHOR_ONLY only — never quantum-advantage, QPU VERIFIED, or mystical-tech claims.';
        }
      }
    }

    hopTrace.push({
      hop: i,
      surface,
      gateOutcome: 'ALLOW',
      cellIdsTouched: touched,
      scopeId,
      note: surface === 'COMPANY_BRAIN' ? 'COMPANY_BRAIN out of preferred scope — LOCAL shard filter only' : null,
    });

    if (hopHadScopeBleed && hits.length === 0 && touched.length === 0) {
      scopeDeniedOnly = true;
    }
  }

  if (sealExcluded > 0) {
    waiting.push({
      code: 'WAITING_SEAL',
      detail: `requireSealed fail-closed excluded ${sealExcluded} unsealed/null-tipSha cell(s)`,
      blocksHit: hits.length === 0,
    });
  }

  const foreignOnly =
    corpus.some((c) => cellMatchesText(c, query.text) && c.scopeId !== scopeId) &&
    !corpus.some((c) => cellMatchesText(c, query.text) && c.scopeId === scopeId && (!query.filters?.requireSealed || isSealedEligible(c)));

  if (foreignOnly || (scopeDeniedOnly && hits.length === 0 && !stoppedOnDeny)) {
    waiting.push({ code: 'WAITING_SCOPE', detail: 'Cross-scope path denied — no bleed merge', blocksHit: true });
  }

  let status: NeuralSearchStatus;
  if (stoppedOnDeny && hits.length === 0) {
    status = 'GATE_DENIED';
  } else if (stoppedOnDeny && hits.length > 0) {
    status = 'PARTIAL';
    gateOutcome = 'GATE_DENIED';
  } else if (hits.length === 0 && (foreignOnly || scopeDeniedOnly)) {
    status = 'SCOPE_DENIED';
  } else if (hits.length === 0 && waiting.some((w) => w.blocksHit)) {
    status = 'WAITING';
  } else if (hits.length === 0) {
    status = 'MISS';
  } else if (waiting.some((w) => w.code === 'WAITING_SEAL' || w.code === 'WAITING_CLOUD_PULL')) {
    status = hits.length > 0 ? 'HIT' : 'PARTIAL';
  } else {
    status = 'HIT';
  }

  // Re-rank ordinal
  hits.forEach((h, idx) => {
    h.rank = idx + 1;
  });

  return {
    schemaVersion: '0.1',
    queryId: query.queryId || makeQueryId(),
    generatedAt: nowIso(),
    plane,
    cloudPullUsed,
    scopeId,
    gateOutcome,
    status,
    hits,
    waiting,
    hopTrace,
    honesty,
    motifDisclosure,
  };
}

export function explainHit(hit: SearchHit): { cell: AtomicDataCell; labels: HonestyLabel[] } {
  const cell = getNeuralSearchCorpus().find((c) => c.cellId === hit.cellId);
  if (!cell) {
    throw new Error('hit_cell_not_found');
  }
  return { cell, labels: [...hit.labels] };
}

export function buildNeuralSearchQuery(partial: Partial<NeuralSearchQuery> & { text: string; scopeId: string }): NeuralSearchQuery {
  return {
    schemaVersion: '0.1',
    queryId: partial.queryId ?? makeQueryId(),
    issuedAt: partial.issuedAt ?? nowIso(),
    plane: partial.plane ?? 'LOCAL',
    cloudPullApproved: partial.cloudPullApproved === true ? true : false,
    scopeId: partial.scopeId,
    text: partial.text,
    filters: partial.filters,
    hopBudget: partial.hopBudget ?? 1,
    gate: partial.gate ?? { allowed: true, reason: null, bypassAllowed: false },
    motifMode: partial.motifMode ?? 'OFF',
    hopSurfaces: partial.hopSurfaces,
  };
}

/* ---- Banned capability names (assertable: must throw / never succeed) ---- */

export function claimQuantumAdvantageViaSearch(): never {
  throw new Error('banned:claimQuantumAdvantageViaSearch');
}

export function verifyQpuViaNeuralSearch(): never {
  throw new Error('banned:verifyQpuViaNeuralSearch');
}

export function bypassPolicyGateViaNeuralSearch(): never {
  throw new Error('banned:bypassPolicyGateViaNeuralSearch');
}

export function promoteSearchHitToGlobalBrain(): never {
  throw new Error('banned:promoteSearchHitToGlobalBrain');
}

export function labelAspirationalAdcScaleAsMeasured(): never {
  throw new Error('banned:labelAspirationalAdcScaleAsMeasured');
}

export function inventTipShaForHit(): never {
  throw new Error('banned:inventTipShaForHit');
}

export function continueHopsAfterGateDenied(): never {
  throw new Error('banned:continueHopsAfterGateDenied');
}

export function mergeCrossScopeHits(): never {
  throw new Error('banned:mergeCrossScopeHits');
}

export function autoPullCloudCorpusViaSearch(): never {
  throw new Error('banned:autoPullCloudCorpusViaSearch');
}

export function softIncludeUnsealedWhenRequired(): never {
  throw new Error('banned:softIncludeUnsealedWhenRequired');
}
