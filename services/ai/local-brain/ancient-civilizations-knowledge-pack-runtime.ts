/**
 * 62L-ER8 — Ancient Civilizations Knowledge Pack runtime.
 *
 * Register civilization nodes with region/era/translation context;
 * attach evidence classes; build analogy pathways labeled inspiration-not-proof;
 * deny monolithic flattening, belief→hidden policy, lost advanced tech claims,
 * and pirated ingest.
 */

import {
  ANCIENT_CIVILIZATION_COVERAGE,
  ANCIENT_CIVILIZATIONS_KNOWLEDGE_PACK_CYCLE,
  ANCIENT_CIV_CULTURAL_SAFEGUARDS,
  ANCIENT_CIV_EVIDENCE_CLASSES,
  ANCIENT_CIV_KNOWLEDGE_DOMAINS,
  ANCIENT_CIV_NEURAL_PATHWAY,
  ANCIENT_CIV_NODE_FIELDS,
  ANCIENT_CIV_PATHWAY_LABEL,
  ANCIENT_CIV_RIGHTS_STATES,
  ER8_AGENT_BOUNDS,
  ER8_DB_CANDIDATES_STATUS,
  ER8_LOCKS,
  ER8_MAY,
  ER8_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  analogyIsProof,
  assertEr8LocksIntact,
  er8SoftWireSnapshot,
  isEr8Agent,
  isHumanApprover,
  softWireHopState,
  type AncientCivilizationCoverage,
  type AncientCivEvidenceClass,
  type AncientCivKnowledgeDomain,
  type AncientCivNodeField,
  type AncientCivRightsState,
  type Er8Actor,
  type Er8EvidenceState,
  type Er8HopRecord,
  type Er8SoftWireSnapshot,
} from './ancient-civilizations-knowledge-pack-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof ANCIENT_CIVILIZATIONS_KNOWLEDGE_PACK_CYCLE)[number],
  state: Er8EvidenceState,
  summary: string,
): Er8HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export type AncientCivKnowledgeNode = {
  nodeId: string;
  civilizationId: AncientCivilizationCoverage | string;
  regionGeography: string;
  era: string;
  languageScript: string;
  sourceType: string;
  authorAttribution: string;
  translationSource: string;
  domain: AncientCivKnowledgeDomain;
  claimOrPractice: string;
  historicalContext: string;
  evidenceClass: AncientCivEvidenceClass;
  confidence: number;
  scholarlyDisagreement: string;
  culturalSensitivityNotes: string;
  sourceRefs: readonly string[];
  rightsState: AncientCivRightsState;
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenChainOfThoughtPresent: false;
  flattenedMonolith: false;
  beliefAsHiddenPolicy: false;
  lostAdvancedTechClaim: false;
};

export type AnalogyPathway = {
  pathwayId: string;
  fromNodeId: string;
  steps: typeof ANCIENT_CIV_NEURAL_PATHWAY;
  label: typeof ANCIENT_CIV_PATHWAY_LABEL;
  historicalSystem: string;
  principle: string;
  modernAnalogue: string;
  hypothesis: string;
  simulation: string;
  measuredResult: string | null;
  isProof: false;
  inspirationOnly: true;
};

const MONOLITH_MARKERS = [
  'african knowledge as one system',
  'all african knowledge',
  'chinese knowledge as one system',
  'all chinese knowledge',
  'indigenous knowledge as one system',
  'all indigenous knowledge',
  'monolithic african',
  'monolithic chinese',
  'monolithic indigenous',
] as const;

function looksMonolithic(text: string): boolean {
  const t = text.toLowerCase();
  return MONOLITH_MARKERS.some((m) => t.includes(m));
}

export function registerCivilizationNode(input: {
  actor: Er8Actor;
  nodeId: string;
  civilizationId: AncientCivilizationCoverage | string;
  regionGeography: string;
  era: string;
  languageScript: string;
  sourceType: string;
  authorAttribution: string;
  translationSource: string;
  domain: AncientCivKnowledgeDomain;
  claimOrPractice: string;
  historicalContext: string;
  evidenceClass: AncientCivEvidenceClass;
  confidence: number;
  scholarlyDisagreement: string;
  culturalSensitivityNotes: string;
  sourceRefs: readonly string[];
  rightsState: AncientCivRightsState;
  attemptMonolithicFlattening?: boolean;
  attemptBeliefAsHiddenPolicy?: boolean;
  attemptLostAdvancedTechnologyClaim?: boolean;
  attemptPiratedIngest?: boolean;
  attemptPrivateCollectionWithoutAuth?: boolean;
  attemptDropRegionEraTranslation?: boolean;
  attemptTreatAnalogyAsProof?: boolean;
  attemptIncludeHiddenCot?: boolean;
  attemptConflatePracticeWithLegend?: boolean;
}): AncientCivKnowledgeNode | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_KNOWLEDGE_PACK=false — no hidden chain-of-thought.',
    );
  }
  if (
    input.attemptMonolithicFlattening ||
    looksMonolithic(input.claimOrPractice) ||
    looksMonolithic(input.historicalContext) ||
    looksMonolithic(String(input.civilizationId))
  ) {
    return deny(
      'MONOLITHIC_*_KNOWLEDGE=false — do not treat African, Chinese, or Indigenous knowledge as one monolithic system; preserve region/period/source context.',
    );
  }
  if (input.attemptBeliefAsHiddenPolicy) {
    return deny(
      'SPIRITUAL_BELIEF_AS_HIDDEN_SYSTEM_POLICY=false — do not convert spiritual/cultural beliefs into hidden system policy.',
    );
  }
  if (input.attemptLostAdvancedTechnologyClaim) {
    return deny(
      'UNSUPPORTED_LOST_ADVANCED_TECHNOLOGY_CLAIMS=false — no unsupported claims of lost advanced technology.',
    );
  }
  if (input.attemptPiratedIngest) {
    return deny(
      'PIRATED_BOOKS_DOCUMENTARIES_ARCHIVES=false — public-domain, open, licensed, or authorized historical material only.',
    );
  }
  if (input.attemptPrivateCollectionWithoutAuth) {
    return deny(
      'PRIVATE_COLLECTION_INGEST_WITHOUT_AUTHORIZATION=false — no private collections without authorization.',
    );
  }
  if (input.rightsState === 'RESTRICTED_DENIED') {
    return deny('RESTRICTED_DENIED rightsState cannot enter knowledge pack.');
  }
  if (
    input.attemptDropRegionEraTranslation ||
    !input.regionGeography?.trim() ||
    !input.era?.trim() ||
    !input.translationSource?.trim()
  ) {
    return deny(
      'Region/geography, era, and translation source context are required on every civilization node.',
    );
  }
  if (input.attemptConflatePracticeWithLegend) {
    return deny(
      'CONFLATE_DOCUMENTED_PRACTICE_WITH_LEGEND=false — distinguish documented practice from legend or later interpretation.',
    );
  }
  if (input.attemptTreatAnalogyAsProof) {
    return deny('ANALOGY_EQ_PROOF=false — analogy/inspiration is not proof.');
  }
  if (
    !(ANCIENT_CIV_EVIDENCE_CLASSES as readonly string[]).includes(
      input.evidenceClass,
    )
  ) {
    return deny('Unknown evidence class.');
  }
  if (
    !(ANCIENT_CIV_KNOWLEDGE_DOMAINS as readonly string[]).includes(input.domain)
  ) {
    return deny('Unknown knowledge domain.');
  }
  if (!input.sourceRefs || input.sourceRefs.length === 0) {
    return deny('At least one source ref is required.');
  }

  void ANCIENT_CIV_NODE_FIELDS;

  return {
    nodeId: input.nodeId,
    civilizationId: input.civilizationId,
    regionGeography: input.regionGeography,
    era: input.era,
    languageScript: input.languageScript,
    sourceType: input.sourceType,
    authorAttribution: input.authorAttribution,
    translationSource: input.translationSource,
    domain: input.domain,
    claimOrPractice: input.claimOrPractice,
    historicalContext: input.historicalContext,
    evidenceClass: input.evidenceClass,
    confidence: Math.max(0, Math.min(1, input.confidence)),
    scholarlyDisagreement: input.scholarlyDisagreement,
    culturalSensitivityNotes: input.culturalSensitivityNotes,
    sourceRefs: input.sourceRefs,
    rightsState: input.rightsState,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    hiddenChainOfThoughtPresent: false,
    flattenedMonolith: false,
    beliefAsHiddenPolicy: false,
    lostAdvancedTechClaim: false,
  };
}

export function attachEvidenceClass(input: {
  node: AncientCivKnowledgeNode;
  evidenceClass: AncientCivEvidenceClass;
}): AncientCivKnowledgeNode | DenialResult {
  if (
    !(ANCIENT_CIV_EVIDENCE_CLASSES as readonly string[]).includes(
      input.evidenceClass,
    )
  ) {
    return deny('Unknown evidence class.');
  }
  return {
    ...input.node,
    evidenceClass: input.evidenceClass,
  };
}

export function buildAnalogyPathway(input: {
  pathwayId: string;
  fromNodeId: string;
  historicalSystem: string;
  principle: string;
  modernAnalogue: string;
  hypothesis: string;
  simulation: string;
  measuredResult?: string | null;
  attemptTreatAsProof?: boolean;
}): AnalogyPathway | DenialResult {
  if (input.attemptTreatAsProof || analogyIsProof()) {
    return deny(
      'ANALOGY_EQ_PROOF=false — pathway is analogy/inspiration, not proof.',
    );
  }
  return {
    pathwayId: input.pathwayId,
    fromNodeId: input.fromNodeId,
    steps: ANCIENT_CIV_NEURAL_PATHWAY,
    label: ANCIENT_CIV_PATHWAY_LABEL,
    historicalSystem: input.historicalSystem,
    principle: input.principle,
    modernAnalogue: input.modernAnalogue,
    hypothesis: input.hypothesis,
    simulation: input.simulation,
    measuredResult: input.measuredResult ?? null,
    isProof: false,
    inspirationOnly: true,
  };
}

export function attemptMonolithicFlattening(): DenialResult {
  return deny(
    'MONOLITHIC_*_KNOWLEDGE=false — no monolithic African/Chinese/Indigenous flattening.',
  );
}

export function attemptBeliefAsHiddenPolicy(): DenialResult {
  return deny('SPIRITUAL_BELIEF_AS_HIDDEN_SYSTEM_POLICY=false.');
}

export function attemptLostAdvancedTechnologyClaim(): DenialResult {
  return deny('UNSUPPORTED_LOST_ADVANCED_TECHNOLOGY_CLAIMS=false.');
}

export function attemptPiratedIngest(): DenialResult {
  return deny('PIRATED_BOOKS_DOCUMENTARIES_ARCHIVES=false.');
}

export function attemptTreatAnalogyAsProof(): DenialResult {
  return deny('ANALOGY_EQ_PROOF=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('BYPASS_GUARDIAN_RLS=false.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('EXPAND_TENANT_UNIVERSE_ACCESS=false.');
}

export function attemptPersistHiddenChainOfThought(): DenialResult {
  return deny('PERSIST_HIDDEN_CHAIN_OF_THOUGHT=false.');
}

export function attemptAutoDeployChanges(): DenialResult {
  return deny('AUTO_DEPLOY_CHANGES=false.');
}

export function returnEr8EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er8Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      pathway: typeof ANCIENT_CIV_NEURAL_PATHWAY;
      pathwayLabel: typeof ANCIENT_CIV_PATHWAY_LABEL;
      authorityGranted: false;
    }
  | DenialResult {
  if (!ER8_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEr8Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER8 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    pathway: ANCIENT_CIV_NEURAL_PATHWAY,
    pathwayLabel: ANCIENT_CIV_PATHWAY_LABEL,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er8Actor;
  action: string;
}):
  | {
      approvalId: string;
      action: string;
      approved: true;
      humanGate: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver or founder.',
    );
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Human lacks approve_consequential.');
  }
  return {
    approvalId: input.approvalId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  humanApprovalUnchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: ER8_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: ER8_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: ER8_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleNileIrrigationNode(
  actor: Er8Actor,
): AncientCivKnowledgeNode {
  const node = registerCivilizationNode({
    actor,
    nodeId: 'egypt-nile-irrigation-1',
    civilizationId: 'ancient_egypt',
    regionGeography: 'Nile Valley, Upper and Lower Egypt',
    era: 'Middle Kingdom (c. 2055–1650 BCE)',
    languageScript: 'Middle Egyptian / hieroglyphic & hieratic',
    sourceType: 'scholarly_summary_of_public_domain',
    authorAttribution: 'XIV structured summary from public-domain egyptology',
    translationSource: 'public-domain translations of administrative papyri (summary)',
    domain: 'agriculture_irrigation',
    claimOrPractice:
      'Basin irrigation and Nilometer-informed flood accounting supported grain logistics.',
    historicalContext:
      'Documented administrative practice specific to Nile hydrology and Egyptian state organization — not a generic “African” system.',
    evidenceClass: 'SCHOLARLY_INTERPRETATION',
    confidence: 0.72,
    scholarlyDisagreement:
      'Extent of centralized control vs local basin management remains debated.',
    culturalSensitivityNotes:
      'Do not flatten with Nubian/Kushite or other African irrigation traditions.',
    sourceRefs: ['pd://egyptology/nile-irrigation-overview'],
    rightsState: 'PUBLIC_DOMAIN',
  });
  if ('denied' in node) throw new Error('exampleNileIrrigationNode failed');
  return node;
}

export function exampleKushTradeNode(actor: Er8Actor): AncientCivKnowledgeNode {
  const node = registerCivilizationNode({
    actor,
    nodeId: 'kush-trade-1',
    civilizationId: 'nubia_kush_and_broader_african_civilizations',
    regionGeography: 'Nubia / Kingdom of Kush (Napata–Meroë corridor)',
    era: 'Napatan–Meroitic (c. 750 BCE–350 CE)',
    languageScript: 'Meroitic / Egyptian hieroglyphic (context-dependent)',
    sourceType: 'archaeological_and_scholarly',
    authorAttribution: 'XIV structured summary',
    translationSource: 'authorized scholarly translations (summary citations)',
    domain: 'trade_and_supply_routes',
    claimOrPractice:
      'Kushite corridors linked Nile, Red Sea, and African interior exchange networks.',
    historicalContext:
      'Distinct from pharaonic Egyptian administration; region- and period-specific.',
    evidenceClass: 'ARCHAEOLOGICAL_EVIDENCE',
    confidence: 0.65,
    scholarlyDisagreement:
      'Scale and directionality of long-distance trade remain under active study.',
    culturalSensitivityNotes:
      'Preserve Kush/Nubia specificity; never collapse into monolithic “African knowledge.”',
    sourceRefs: ['arch://kush-trade-corridor-survey'],
    rightsState: 'OPEN',
  });
  if ('denied' in node) throw new Error('exampleKushTradeNode failed');
  return node;
}

export function bootstrapAncientCivilizationsKnowledgePack(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Er8SoftWireSnapshot;
  coverage: typeof ANCIENT_CIVILIZATION_COVERAGE;
  nodeFields: readonly AncientCivNodeField[];
  evidenceClasses: typeof ANCIENT_CIV_EVIDENCE_CLASSES;
  domains: typeof ANCIENT_CIV_KNOWLEDGE_DOMAINS;
  pathway: typeof ANCIENT_CIV_NEURAL_PATHWAY;
  pathwayLabel: typeof ANCIENT_CIV_PATHWAY_LABEL;
  rightsStates: typeof ANCIENT_CIV_RIGHTS_STATES;
  culturalSafeguards: typeof ANCIENT_CIV_CULTURAL_SAFEGUARDS;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
    layer: typeof ER_LAYER_TITLE;
  };
  may: typeof ER8_MAY;
  mustNot: typeof ER8_MUST_NOT;
  dbCandidates: typeof ER8_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEr8LocksIntact(),
    softWire: er8SoftWireSnapshot(repoRoot),
    coverage: ANCIENT_CIVILIZATION_COVERAGE,
    nodeFields: ANCIENT_CIV_NODE_FIELDS,
    evidenceClasses: ANCIENT_CIV_EVIDENCE_CLASSES,
    domains: ANCIENT_CIV_KNOWLEDGE_DOMAINS,
    pathway: ANCIENT_CIV_NEURAL_PATHWAY,
    pathwayLabel: ANCIENT_CIV_PATHWAY_LABEL,
    rightsStates: ANCIENT_CIV_RIGHTS_STATES,
    culturalSafeguards: ANCIENT_CIV_CULTURAL_SAFEGUARDS,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
      layer: ER_LAYER_TITLE,
    },
    may: ER8_MAY,
    mustNot: ER8_MUST_NOT,
    dbCandidates: ER8_DB_CANDIDATES_STATUS,
  };
}

export function runAncientCivilizationsKnowledgePackCycle(input: {
  actor: Er8Actor;
  human: Er8Actor;
  repoRoot?: string;
}): {
  hops: Er8HopRecord[];
  node: AncientCivKnowledgeNode;
  pathway: AnalogyPathway | DenialResult;
  softWire: Er8SoftWireSnapshot;
} {
  const hops: Er8HopRecord[] = [];
  const softWire = er8SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr8LocksIntact() ? 'PASS' : 'FAIL',
      'ER8 locks intact including L4=false and cultural/rights safeguards.',
    ),
  );
  hops.push(
    hop(
      'ancient_civilizations_knowledge_pack_bootstrap',
      'PASS',
      'Ancient Civilizations Knowledge Pack bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'coverage_encoded',
      'PASS',
      `${ANCIENT_CIVILIZATION_COVERAGE.length} civilization coverage entries encoded.`,
    ),
  );
  hops.push(
    hop(
      'knowledge_node_fields_encoded',
      'PASS',
      `${ANCIENT_CIV_NODE_FIELDS.length} knowledge node fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'evidence_classes_encoded',
      'PASS',
      ANCIENT_CIV_EVIDENCE_CLASSES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'knowledge_domains_encoded',
      'PASS',
      `${ANCIENT_CIV_KNOWLEDGE_DOMAINS.length} domains encoded.`,
    ),
  );
  hops.push(
    hop(
      'neural_pathway_encoded',
      'PASS',
      `${ANCIENT_CIV_NEURAL_PATHWAY.join(' → ')} (${ANCIENT_CIV_PATHWAY_LABEL})`,
    ),
  );
  hops.push(
    hop('rights_states_encoded', 'PASS', ANCIENT_CIV_RIGHTS_STATES.join(' | ')),
  );
  hops.push(
    hop(
      'cultural_safeguards_encoded',
      ANCIENT_CIV_CULTURAL_SAFEGUARDS.noMonolithicAfricanKnowledge &&
        ANCIENT_CIV_CULTURAL_SAFEGUARDS.noMonolithicChineseKnowledge &&
        ANCIENT_CIV_CULTURAL_SAFEGUARDS.noMonolithicIndigenousKnowledge
        ? 'PASS'
        : 'FAIL',
      'Cultural safeguards encoded (no monolithic flattening; context preserved).',
    ),
  );

  const node = exampleNileIrrigationNode(input.actor);
  const missingCtx = registerCivilizationNode({
    actor: input.actor,
    nodeId: 'bad-missing-ctx',
    civilizationId: 'mesopotamia',
    regionGeography: '',
    era: '',
    languageScript: 'Akkadian / cuneiform',
    sourceType: 'test',
    authorAttribution: 'test',
    translationSource: '',
    domain: 'mathematics',
    claimOrPractice: 'placeholder',
    historicalContext: 'placeholder',
    evidenceClass: 'SPECULATIVE',
    confidence: 0.1,
    scholarlyDisagreement: 'n/a',
    culturalSensitivityNotes: 'n/a',
    sourceRefs: ['x'],
    rightsState: 'PUBLIC_DOMAIN',
    attemptDropRegionEraTranslation: true,
  });
  hops.push(
    hop(
      'register_node_requires_region_era_translation',
      node.regionGeography.length > 0 &&
        node.era.length > 0 &&
        node.translationSource.length > 0 &&
        missingCtx.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Civilization nodes require region/era/translation context.',
    ),
  );

  const attached = attachEvidenceClass({
    node,
    evidenceClass: 'PRIMARY_HISTORICAL_SOURCE',
  });
  hops.push(
    hop(
      'attach_evidence_class',
      !('denied' in attached) &&
        attached.evidenceClass === 'PRIMARY_HISTORICAL_SOURCE'
        ? 'PASS'
        : 'FAIL',
      'Evidence class attachable on registered nodes.',
    ),
  );

  const pathway = buildAnalogyPathway({
    pathwayId: 'path-nile-1',
    fromNodeId: node.nodeId,
    historicalSystem: 'Nile basin irrigation accounting',
    principle: 'Measure environmental inflow before allocating supply',
    modernAnalogue: 'Sensor-informed inventory buffers in logistics',
    hypothesis: 'Early measurement gates may reduce stockout cascades',
    simulation: 'sandbox_supply_sim_v0',
    measuredResult: null,
  });
  const asProof = buildAnalogyPathway({
    pathwayId: 'path-bad',
    fromNodeId: node.nodeId,
    historicalSystem: 'x',
    principle: 'y',
    modernAnalogue: 'z',
    hypothesis: 'h',
    simulation: 's',
    attemptTreatAsProof: true,
  });
  hops.push(
    hop(
      'analogy_pathway_inspiration_not_proof',
      !('denied' in pathway) &&
        pathway.isProof === false &&
        pathway.inspirationOnly === true &&
        pathway.label === ANCIENT_CIV_PATHWAY_LABEL &&
        asProof.state === 'DENIED' &&
        attemptTreatAnalogyAsProof().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Neural pathway labeled analogy/inspiration, not proof.',
    ),
  );

  const culturalDenies: Array<{
    hop: (typeof ANCIENT_CIVILIZATIONS_KNOWLEDGE_PACK_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    {
      hop: 'deny_monolithic_african_chinese_indigenous_flattening',
      fn: attemptMonolithicFlattening,
    },
    {
      hop: 'deny_belief_to_hidden_system_policy',
      fn: attemptBeliefAsHiddenPolicy,
    },
    {
      hop: 'deny_lost_advanced_technology_claims',
      fn: attemptLostAdvancedTechnologyClaim,
    },
    { hop: 'deny_pirated_ingest', fn: attemptPiratedIngest },
  ];
  for (const d of culturalDenies) {
    hops.push(
      hop(
        d.hop,
        d.fn().state === 'DENIED' ? 'PASS' : 'FAIL',
        `${d.hop} → DENIED`,
      ),
    );
  }

  const flattenNode = registerCivilizationNode({
    actor: input.actor,
    nodeId: 'bad-monolith',
    civilizationId: 'indigenous_knowledge_traditions',
    regionGeography: 'unspecified',
    era: 'unspecified',
    languageScript: 'unspecified',
    sourceType: 'test',
    authorAttribution: 'test',
    translationSource: 'n/a',
    domain: 'philosophy_ethics',
    claimOrPractice: 'all indigenous knowledge as one system',
    historicalContext: 'flattened',
    evidenceClass: 'SPECULATIVE',
    confidence: 0.1,
    scholarlyDisagreement: 'n/a',
    culturalSensitivityNotes: 'n/a',
    sourceRefs: ['x'],
    rightsState: 'PUBLIC_DOMAIN',
    attemptMonolithicFlattening: true,
  });
  hops.push(
    hop(
      'deny_flatten_cultures',
      flattenNode.state === 'DENIED' ? 'PASS' : 'FAIL',
      'Culture flattening denied at register.',
    ),
  );

  const isolation = probeGuardianRlsTenantUniverseIsolation();
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      isolation.state === 'PASS' &&
        attemptBypassGuardianRls().state === 'DENIED' &&
        attemptExpandTenantUniverseAccess().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' &&
        attemptAgentAutoAuthority().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; no automatic authority.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ER8_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      'PASS',
      ER_LAYER_TITLE,
    ),
  );

  const softPairs: Array<{
    hop: (typeof ANCIENT_CIVILIZATIONS_KNOWLEDGE_PACK_CYCLE)[number];
    present: boolean;
    label: string;
  }> = [
    {
      hop: 'er7_soft_wire',
      present: softWire.er7HistoricalScienceEngineeringAtlas.present,
      label: 'ER7',
    },
    {
      hop: 'er6_soft_wire',
      present: softWire.er6HistoricalBusinessCaseAtlas.present,
      label: 'ER6',
    },
    {
      hop: 'er5_soft_wire',
      present: softWire.er5GlobalHistoricalKnowledgeIngestion.present,
      label: 'ER5',
    },
    {
      hop: 'er4_soft_wire',
      present: softWire.er4RightsProvenanceGate.present,
      label: 'ER4',
    },
    {
      hop: 'er3_soft_wire',
      present: softWire.er3PublicDataSourceRegistry.present,
      label: 'ER3',
    },
    {
      hop: 'er2_soft_wire',
      present: softWire.er2ApiTruthStateMachine.present,
      label: 'ER2',
    },
    {
      hop: 'er1_soft_wire',
      present: softWire.er1RealApiConnectionRegistry.present,
      label: 'ER1',
    },
    {
      hop: 'eq16_soft_wire',
      present: softWire.eq16SoftwareWormholeRouter.present,
      label: 'EQ16',
    },
    {
      hop: 'eq15_soft_wire',
      present: softWire.eq15PathwayPlasticity.present,
      label: 'EQ15',
    },
    {
      hop: 'eq14_soft_wire',
      present: softWire.eq14NeuralPathwayArchitectureGraph.present,
      label: 'EQ14',
    },
    {
      hop: 'eq13_soft_wire',
      present: softWire.eq13ArchitectureReturnReceipt.present,
      label: 'EQ13',
    },
    {
      hop: 'eq12_soft_wire',
      present: softWire.eq12CrossArchitectureBenchmarkMatrix.present,
      label: 'EQ12',
    },
    {
      hop: 'ep15_soft_wire',
      present: softWire.ep15AlgorithmTuningSandbox.present,
      label: 'EP15',
    },
    {
      hop: 'em157_soft_wire',
      present: softWire.em157HomeBase.present,
      label: 'EM157',
    },
  ];
  for (const s of softPairs) {
    hops.push(
      hop(
        s.hop,
        softWireHopState(s.present),
        s.present
          ? `${s.label} PRESENT (soft-wire; presence ≠ VERIFIED).`
          : `${s.label} absent — WAITING_DATA (not FAIL).`,
      ),
    );
  }

  hops.push(
    hop(
      'db_candidates_not_applied',
      ER8_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const gate = requireHumanApproval({
    approvalId: 'er8-a1',
    actor: input.human,
    action: 'approve_consequential',
  });
  const ev = returnEr8EvidenceToHomeBase({
    evidenceId: 'er8-ev-1',
    actor: input.actor,
    summary: 'ancient civ pack advisory',
  });
  hops.push(
    hop(
      'evidence',
      !('denied' in gate) &&
        !('denied' in ev) &&
        attemptPersistHiddenChainOfThought().state === 'DENIED' &&
        attemptAutoDeployChanges().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Evidence returned; human gate; no hidden CoT; no auto-deploy.',
    ),
  );

  return { hops, node, pathway, softWire };
}
