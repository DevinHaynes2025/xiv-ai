/**
 * US-NS-01 Neural Search LOCAL v0.1 — honesty contract.
 * Run: npx tsx neural-search-v0.test.ts
 */

import assert from 'node:assert/strict';

import {
  BUILTIN_POCKET_BRAIN_CELLS,
  DEFAULT_HONESTY_BLOCK,
  MOTIF_FORBIDDEN_EXPANSIONS,
  MOTIF_REQUIRED_LABELS,
  NEURAL_SEARCH_V0_POLICY,
  autoPullCloudCorpusViaSearch,
  buildNeuralSearchQuery,
  bypassPolicyGateViaNeuralSearch,
  claimQuantumAdvantageViaSearch,
  continueHopsAfterGateDenied,
  dumpNeuralSearchHonesty,
  explainHit,
  inventTipShaForHit,
  labelAspirationalAdcScaleAsMeasured,
  mergeCrossScopeHits,
  neuralSearchAllowsL4,
  neuralSearchAllowsProductionMutation,
  neuralSearchCloudAutoPullForbidden,
  neuralSearchIsReadOnly,
  neuralSearchMotifQuantumAdvantageForbidden,
  neuralSearchMultiHopStopOnGateDenied,
  neuralSearchRequireSealedFailClosed,
  neuralSearchScopeBleedDenied,
  neuralSearchV0WireStatus,
  promoteSearchHitToGlobalBrain,
  resetNeuralSearchSession,
  searchNeuralV0,
  setNeuralSearchCorpusForTests,
  softIncludeUnsealedWhenRequired,
  verifyQpuViaNeuralSearch,
  type AtomicDataCell,
  type MotifTag,
} from './neural-search-v0';

function main() {
  assert.equal(NEURAL_SEARCH_V0_POLICY.schemaVersion, '0.1');
  assert.equal(NEURAL_SEARCH_V0_POLICY.storyId, 'US-NS-01');
  assert.equal(NEURAL_SEARCH_V0_POLICY.l4Autonomy, false);
  assert.equal(NEURAL_SEARCH_V0_POLICY.productionMutation, false);
  assert.equal(NEURAL_SEARCH_V0_POLICY.productionAuto, false);
  assert.equal(NEURAL_SEARCH_V0_POLICY.readOnly, true);
  assert.equal(NEURAL_SEARCH_V0_POLICY.layerKind, 'SIMULATION');
  assert.equal(NEURAL_SEARCH_V0_POLICY.preferredPlane, 'LOCAL');
  assert.equal(NEURAL_SEARCH_V0_POLICY.mayEnterGlobalBrain, false);
  assert.equal(NEURAL_SEARCH_V0_POLICY.liveCloudSyncClaimed, false);
  assert.equal(NEURAL_SEARCH_V0_POLICY.policyGateInFront, true);
  assert.equal(NEURAL_SEARCH_V0_POLICY.policyGateBypassAllowed, false);
  assert.equal(NEURAL_SEARCH_V0_POLICY.requireSealedFailClosed, true);
  assert.equal(NEURAL_SEARCH_V0_POLICY.multiHopStopOnGateDenied, true);
  assert.equal(NEURAL_SEARCH_V0_POLICY.scopeBleedDenied, true);
  assert.equal(NEURAL_SEARCH_V0_POLICY.cloudAutoPullForbidden, true);
  assert.equal(NEURAL_SEARCH_V0_POLICY.motifQuantumAdvantageForbidden, true);
  assert.equal(NEURAL_SEARCH_V0_POLICY.neuralSearchV0Wire, 'WIRED');
  assert.equal(neuralSearchV0WireStatus(), 'WIRED');
  assert.equal(neuralSearchAllowsL4(), false);
  assert.equal(neuralSearchAllowsProductionMutation(), false);
  assert.equal(neuralSearchIsReadOnly(), true);
  assert.equal(neuralSearchCloudAutoPullForbidden(), true);
  assert.equal(neuralSearchScopeBleedDenied(), true);
  assert.equal(neuralSearchRequireSealedFailClosed(), true);
  assert.equal(neuralSearchMultiHopStopOnGateDenied(), true);
  assert.equal(neuralSearchMotifQuantumAdvantageForbidden(), true);

  const honesty = dumpNeuralSearchHonesty();
  assert.equal(honesty.inventedShaForbidden, true);
  assert.equal(honesty.requireSealedFailClosed, true);
  assert.equal(honesty.multiHopStopOnGateDenied, true);
  assert.equal(honesty.scopeBleedDenied, true);
  assert.equal(honesty.cloudAutoPullForbidden, true);
  assert.equal(honesty.motifQuantumAdvantageForbidden, true);
  assert.deepEqual(honesty.inventedShaForbidden, DEFAULT_HONESTY_BLOCK.inventedShaForbidden);

  resetNeuralSearchSession();
  assert.ok(BUILTIN_POCKET_BRAIN_CELLS.some((c) => c.cellId === 'ADC-12D-15'));
  assert.ok(
    BUILTIN_POCKET_BRAIN_CELLS.every(
      (c) => c.vector.status === 'WAITING_POCKET_BRAIN_INGEST' || c.cellId.startsWith('ADC-OTHER'),
    ),
  );
  assert.ok(BUILTIN_POCKET_BRAIN_CELLS.some((c) => c.tipSha === null && c.sealed === false));
  assert.ok(BUILTIN_POCKET_BRAIN_CELLS.some((c) => c.scopeId === 'other-tenant'));

  // 1) requireSealed=true excludes null / unsealed tipSha — fail-closed
  {
    const q = buildNeuralSearchQuery({
      text: 'stub',
      scopeId: 'xiv-local',
      filters: { requireSealed: true },
      hopBudget: 1,
      gate: { allowed: true, reason: null, bypassAllowed: false },
    });
    const r = searchNeuralV0(q);
    assert.ok(r.hits.every((h) => h.tipSha != null && h.sealed === true));
    assert.ok(!r.hits.some((h) => h.cellId === 'ADC-UNSEALED-STUB'));
    assert.ok(r.waiting.some((w) => w.code === 'WAITING_SEAL'));
    assert.equal(r.honesty.requireSealedFailClosed, true);
    assert.ok(r.hits.every((h) => h.scopeId === 'xiv-local'));
  }

  // Without requireSealed, unsealed may appear
  {
    const q = buildNeuralSearchQuery({
      text: 'Unsealed',
      scopeId: 'xiv-local',
      hopBudget: 1,
      gate: { allowed: true, reason: null, bypassAllowed: false },
    });
    const r = searchNeuralV0(q);
    assert.ok(r.hits.some((h) => h.cellId === 'ADC-UNSEALED-STUB' && h.tipSha === null));
  }

  // 2) Multi-hop GATE_DENIED (incl GLOBAL_BRAIN) → stop; HopTrace records denied hop
  {
    const q = buildNeuralSearchQuery({
      text: 'Blue Brain',
      scopeId: 'xiv-local',
      hopBudget: 3,
      hopSurfaces: ['POCKET_BRAIN', 'BLUE_BRAIN', 'GLOBAL_BRAIN'],
      gate: { allowed: true, reason: null, bypassAllowed: false },
    });
    const r = searchNeuralV0(q);
    assert.ok(r.hopTrace.length >= 1);
    const denyHop = r.hopTrace.find((h) => h.gateOutcome === 'GATE_DENIED');
    assert.ok(denyHop);
    assert.equal(denyHop!.surface, 'GLOBAL_BRAIN');
    const denyIdx = r.hopTrace.findIndex((h) => h.gateOutcome === 'GATE_DENIED');
    assert.equal(r.hopTrace.slice(denyIdx + 1).length, 0, 'no hops after GATE_DENIED');
    assert.equal(r.gateOutcome, 'GATE_DENIED');
    assert.ok(r.status === 'GATE_DENIED' || r.status === 'PARTIAL');
  }

  // Gate deny on hop 0 → GATE_DENIED, hits empty
  {
    const q = buildNeuralSearchQuery({
      text: 'ADC',
      scopeId: 'xiv-local',
      hopBudget: 2,
      hopSurfaces: ['POCKET_BRAIN', 'BLUE_BRAIN'],
      gate: { allowed: false, reason: 'policy_deny', bypassAllowed: false },
    });
    const r = searchNeuralV0(q);
    assert.equal(r.status, 'GATE_DENIED');
    assert.equal(r.gateOutcome, 'GATE_DENIED');
    assert.equal(r.hits.length, 0);
    assert.equal(r.hopTrace.length, 1);
    assert.equal(r.hopTrace[0].gateOutcome, 'GATE_DENIED');
  }

  // 3) scopeId mismatch → SCOPE_DENIED / bleed deny
  {
    const q = buildNeuralSearchQuery({
      text: 'Foreign',
      scopeId: 'xiv-local',
      hopBudget: 1,
      gate: { allowed: true, reason: null, bypassAllowed: false },
    });
    const r = searchNeuralV0(q);
    assert.ok(!r.hits.some((h) => h.scopeId !== 'xiv-local'));
    assert.ok(!r.hits.some((h) => h.cellId === 'ADC-OTHER-SCOPE'));
    assert.ok(r.status === 'SCOPE_DENIED' || r.waiting.some((w) => w.code === 'WAITING_SCOPE'));
  }

  // Direct other-scope query with matching scope still only returns that scope
  {
    const q = buildNeuralSearchQuery({
      text: 'Foreign',
      scopeId: 'other-tenant',
      hopBudget: 1,
      gate: { allowed: true, reason: null, bypassAllowed: false },
    });
    const r = searchNeuralV0(q);
    assert.ok(r.hits.every((h) => h.scopeId === 'other-tenant'));
    assert.ok(!r.hits.some((h) => h.scopeId === 'xiv-local'));
  }

  // 4) MIXED / CLOUD_SANDBOX + cloudPullApproved=false → no auto-pull + WAITING_CLOUD_PULL
  for (const plane of ['MIXED', 'CLOUD_SANDBOX'] as const) {
    const q = buildNeuralSearchQuery({
      text: 'Blue',
      scopeId: 'xiv-local',
      plane,
      cloudPullApproved: false,
      hopBudget: 1,
      gate: { allowed: true, reason: null, bypassAllowed: false },
    });
    const r = searchNeuralV0(q);
    assert.equal(r.cloudPullUsed, false);
    assert.ok(r.waiting.some((w) => w.code === 'WAITING_CLOUD_PULL'));
    assert.equal(r.honesty.cloudAutoPullForbidden, true);
  }

  // 5) Motif tags force motifDisclosure; banned quantum-advantage expansions
  {
    const motif: MotifTag = {
      kind: 'QUANTUM_METAPHOR',
      labels: [...MOTIF_REQUIRED_LABELS],
      text: 'quantum metaphor for hop entanglement (hypothesis only)',
      forbiddenExpansions: [...MOTIF_FORBIDDEN_EXPANSIONS],
    };
    const cell: AtomicDataCell = {
      ...BUILTIN_POCKET_BRAIN_CELLS.find((c) => c.cellId === 'ADC-12D-15')!,
      motifTags: [motif],
    };
    setNeuralSearchCorpusForTests([
      cell,
      ...BUILTIN_POCKET_BRAIN_CELLS.filter((c) => c.cellId !== 'ADC-12D-15'),
    ]);
    const q = buildNeuralSearchQuery({
      text: 'Blue Brain',
      scopeId: 'xiv-local',
      motifMode: 'METAPHOR_ONLY',
      hopBudget: 1,
      gate: { allowed: true, reason: null, bypassAllowed: false },
    });
    const r = searchNeuralV0(q);
    assert.ok(r.motifDisclosure);
    assert.match(r.motifDisclosure!, /METAPHOR_ONLY|RESEARCH_HYPOTHESIS|SIMULATION/);
    assert.doesNotMatch(r.motifDisclosure!, /quantum advantage/i);
    assert.ok(MOTIF_FORBIDDEN_EXPANSIONS.includes('quantum advantage'));
    assert.ok(MOTIF_REQUIRED_LABELS.includes('RESEARCH_HYPOTHESIS'));
    assert.ok(MOTIF_REQUIRED_LABELS.includes('SIMULATION'));
    assert.ok(MOTIF_REQUIRED_LABELS.includes('METAPHOR_ONLY'));
    resetNeuralSearchSession();
  }

  // 6) tipSha never invented; aspirational ≠ measured
  {
    const q = buildNeuralSearchQuery({
      text: 'mini-city',
      scopeId: 'xiv-local',
      hopBudget: 1,
      gate: { allowed: true, reason: null, bypassAllowed: false },
    });
    const r = searchNeuralV0(q);
    const city = r.hits.find((h) => h.cellId === 'ADC-12D-14');
    assert.ok(city);
    assert.equal(city!.scaleKind, 'aspirational');
    assert.ok(city!.labels.includes('ASPIRATIONAL'));
    assert.ok(!city!.labels.includes('MEASURED') || city!.scaleKind !== 'aspirational');
    // unsealed tipSha stays null
    const uq = buildNeuralSearchQuery({
      text: 'Unsealed',
      scopeId: 'xiv-local',
      hopBudget: 1,
      gate: { allowed: true, reason: null, bypassAllowed: false },
    });
    const ur = searchNeuralV0(uq);
    const unsealed = ur.hits.find((h) => h.cellId === 'ADC-UNSEALED-STUB');
    assert.ok(unsealed);
    assert.equal(unsealed!.tipSha, null);
  }

  // Happy path LOCAL hit
  {
    const q = buildNeuralSearchQuery({
      text: 'ADC offline',
      scopeId: 'xiv-local',
      plane: 'LOCAL',
      hopBudget: 1,
      gate: { allowed: true, reason: null, bypassAllowed: false },
    });
    const r = searchNeuralV0(q);
    assert.ok(r.hits.length >= 1);
    assert.equal(r.schemaVersion, '0.1');
    assert.equal(r.plane, 'LOCAL');
    assert.equal(r.cloudPullUsed, false);
    assert.ok(r.waiting.some((w) => w.code === 'WAITING_POCKET_BRAIN_INGEST'));
    assert.ok(r.waiting.some((w) => w.code === 'WAITING_SCORER'));
    assert.ok(r.hits.every((h) => h.score === null));
    const explained = explainHit(r.hits[0]);
    assert.equal(explained.cell.cellId, r.hits[0].cellId);
  }

  // Banned APIs throw
  assert.throws(() => claimQuantumAdvantageViaSearch(), /banned:claimQuantumAdvantageViaSearch/);
  assert.throws(() => verifyQpuViaNeuralSearch(), /banned:verifyQpuViaNeuralSearch/);
  assert.throws(() => bypassPolicyGateViaNeuralSearch(), /banned:bypassPolicyGateViaNeuralSearch/);
  assert.throws(() => promoteSearchHitToGlobalBrain(), /banned:promoteSearchHitToGlobalBrain/);
  assert.throws(() => labelAspirationalAdcScaleAsMeasured(), /banned:labelAspirationalAdcScaleAsMeasured/);
  assert.throws(() => inventTipShaForHit(), /banned:inventTipShaForHit/);
  assert.throws(() => continueHopsAfterGateDenied(), /banned:continueHopsAfterGateDenied/);
  assert.throws(() => mergeCrossScopeHits(), /banned:mergeCrossScopeHits/);
  assert.throws(() => autoPullCloudCorpusViaSearch(), /banned:autoPullCloudCorpusViaSearch/);
  assert.throws(() => softIncludeUnsealedWhenRequired(), /banned:softIncludeUnsealedWhenRequired/);

  console.log('neural-search-v0.test.ts: PASS');
}

main();
