/**
 * 12D-10 — LOCAL Ollama writer loop + Pocket Brain ingest (xiv-data manifests only).
 * Twin gate: claim bans; LOCAL|CLOUD_SANDBOX; no fake VERIFIED GPU/NPU/QPU;
 * no production DDL/DML; Atomic Data Cells naming ALIGN; Checkpoint Ledger = 12D-11.
 */
import assert from 'node:assert/strict';
import {
  ATOMIC_DATA_CELL_GUARDRAILS,
  BUSINESS_BAR_METRICS,
  HIGH_AUTONOMY_TARGETS,
  OFFLINE_PREFER_LOCAL,
  OFFLINE_SNAPSHOT_GUARDRAILS,
  OLLAMA_DEFAULT_ENDPOINT,
  OLLAMA_WRITER_GUARDRAILS,
  POCKET_BRAIN_INGEST_GUARDRAILS,
  VALUATION_THEATER_ALLOWED,
  XIV_DATA_MANIFEST_GUARDRAILS,
  buildXivDataManifest,
  ingestXivDataManifestToPocketBrain,
  probeOllamaLocal,
  runLocalOllamaWriterLoop,
  verifyXivDataManifestContents,
} from './index';

assert.equal(VALUATION_THEATER_ALLOWED, false);
assert.equal(OFFLINE_PREFER_LOCAL, true);
assert.equal(OLLAMA_WRITER_GUARDRAILS.OFFLINE_PREFER_LOCAL, true);
assert.equal(OLLAMA_WRITER_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(OLLAMA_WRITER_GUARDRAILS.autonomousProductionDML, false);
assert.equal(OLLAMA_WRITER_GUARDRAILS.verifiedAcceleratorClaimAllowed, false);
assert.equal(OLLAMA_WRITER_GUARDRAILS.fakeVerifiedGpuNpuQpuAllowed, false);
assert.equal(OLLAMA_WRITER_GUARDRAILS.policyGateBypassAllowed, false);
assert.equal(OLLAMA_WRITER_GUARDRAILS.checkpointIsReadReviewOnly, true);
assert.equal(OLLAMA_WRITER_GUARDRAILS.nextTicket, '12D-11');
assert.deepEqual([...OLLAMA_WRITER_GUARDRAILS.highAutonomyTargets], ['LOCAL', 'CLOUD_SANDBOX']);
assert.deepEqual([...HIGH_AUTONOMY_TARGETS], ['LOCAL', 'CLOUD_SANDBOX']);
for (const m of ['adoption', 'reliability', 'security', 'unit_economics', 'customer_value']) {
  assert.ok(BUSINESS_BAR_METRICS.includes(m as (typeof BUSINESS_BAR_METRICS)[number]));
}
assert.equal(XIV_DATA_MANIFEST_GUARDRAILS.secretsAllowed, false);
assert.equal(XIV_DATA_MANIFEST_GUARDRAILS.founderApprovalRequired, true);
assert.equal(POCKET_BRAIN_INGEST_GUARDRAILS.ingestFromXivDataManifestsOnly, true);
assert.equal(POCKET_BRAIN_INGEST_GUARDRAILS.mayEnterGlobalBrain, false);
assert.equal(POCKET_BRAIN_INGEST_GUARDRAILS.checkpointLedgerTicket, '12D-11');
assert.equal(POCKET_BRAIN_INGEST_GUARDRAILS.checkpointLedgerIsSecondControlPlane, false);
assert.equal(ATOMIC_DATA_CELL_GUARDRAILS.atomDbClaimAllowed, false);
assert.equal(OFFLINE_SNAPSHOT_GUARDRAILS.liveCloudSyncFabricationAllowed, false);
assert.equal(OLLAMA_DEFAULT_ENDPOINT, 'http://127.0.0.1:11434');

// Manifest requires founder approval
assert.throws(
  () =>
    buildXivDataManifest({
      manifestId: 'm-no',
      tenantId: 'xiv',
      entries: [{ relativePath: 'corpus/a.txt', content: 'hello' }],
      provenance: { source: 'test', capturedAt: '2026-09-10T04:00:00.000Z', founderApproved: false },
    }),
  /founderApproved/,
);

const bodyA = 'xiv-data corpus note alpha';
const bodyB = 'xiv-data corpus note beta';
const manifest = buildXivDataManifest({
  manifestId: 'm-12d10',
  tenantId: 'xiv',
  entries: [
    { relativePath: 'corpus/alpha.txt', content: bodyA, contentType: 'text/plain' },
    { relativePath: 'corpus/beta.txt', content: bodyB, contentType: 'text/plain' },
  ],
  provenance: {
    source: 'xiv-data-local',
    capturedAt: '2026-09-10T04:00:00.000Z',
    founderApproved: true,
    operator: '12d10-test',
  },
});
assert.equal(manifest.rootLabel, 'xiv-data');
assert.equal(manifest.productionMutation, false);
assert.equal(manifest.secretsAllowed, false);
assert.ok(manifest.manifestChecksum.startsWith('dg1:'));

const contents = new Map<string, string>([
  ['corpus/alpha.txt', bodyA],
  ['corpus/beta.txt', bodyB],
]);
assert.equal(verifyXivDataManifestContents(manifest, contents).ok, true);
assert.equal(
  verifyXivDataManifestContents(manifest, new Map([['corpus/alpha.txt', 'tampered']])).ok,
  false,
);

async function main(): Promise<void> {
  // Probe: unreachable without fetch → LOCAL_RULES fallback when prefer local
  const unreachable = await probeOllamaLocal({});
  assert.equal(unreachable.reachable, false);
  assert.equal(unreachable.preferLocal, true);
  assert.equal(unreachable.liveCloudSyncClaimed, false);
  assert.equal(unreachable.accelerators.anyVerifiedClaim, false);
  assert.equal(unreachable.accelerators.gpu, 'UNVERIFIED');
  assert.equal(unreachable.accelerators.npu, 'UNVERIFIED');
  assert.equal(unreachable.accelerators.qpu, 'UNVERIFIED');
  assert.ok(['LOCAL_RULES', 'WAITING_PROVIDER'].includes(unreachable.selectedProvider));

  // Probe: reachable Ollama via injectable fetch
  const reachable = await probeOllamaLocal({
    fetchImpl: async () => ({ ok: true, status: 200 }),
  });
  assert.equal(reachable.reachable, true);
  assert.equal(reachable.selectedProvider, 'OLLAMA');
  assert.equal(reachable.accelerators.anyVerifiedClaim, false);

  const writer = await runLocalOllamaWriterLoop({
    runId: 'run-1',
    sourceText: bodyA + '\n' + bodyB,
    probe: reachable,
    generateImpl: async (prompt) => 'SUMMARY:' + prompt.slice(0, 40),
  });
  assert.equal(writer.provider, 'OLLAMA');
  assert.equal(writer.productionAutoApply, false);
  assert.equal(writer.autonomousProductionDDL, false);
  assert.equal(writer.autonomousProductionDML, false);
  assert.equal(writer.artifacts.length, 1);
  assert.equal(writer.probe.accelerators.anyVerifiedClaim, false);
  assert.doesNotMatch(JSON.stringify(writer), /"VERIFIED"/);

  const ingest = ingestXivDataManifestToPocketBrain({
    manifest,
    contents,
    writerArtifacts: writer.artifacts,
  });
  assert.equal(ingest.ok, true);
  assert.equal(ingest.records.length, 2);
  assert.equal(ingest.liveCloudSyncClaimed, false);
  assert.ok(ingest.records.every((r) => r.mayEnterGlobalBrain === false));
  assert.ok(ingest.records.every((r) => r.productionMutation === false));
  assert.ok(ingest.records.every((r) => r.atomicCell.layerKind === 'SIMULATION'));
  assert.ok(ingest.records.every((r) => r.writerArtifactId === 'writer:run-1'));

  // Secret path blocked
  const secretManifest = buildXivDataManifest({
    manifestId: 'm-secret',
    tenantId: 'xiv',
    entries: [{ relativePath: 'corpus/.env', content: 'KEY=nope' }],
    provenance: {
      source: 'test',
      capturedAt: '2026-09-10T04:00:00.000Z',
      founderApproved: true,
    },
  });
  const secretIngest = ingestXivDataManifestToPocketBrain({
    manifest: secretManifest,
    contents: new Map([['corpus/.env', 'KEY=nope']]),
  });
  assert.equal(secretIngest.ok, false);
  assert.ok(secretIngest.rejected.some((r) => r.includes('secret_path_blocked')));

  // Checksum failure rejects ingest
  const bad = ingestXivDataManifestToPocketBrain({
    manifest,
    contents: new Map([
      ['corpus/alpha.txt', 'wrong'],
      ['corpus/beta.txt', bodyB],
    ]),
  });
  assert.equal(bad.ok, false);
  assert.ok(bad.rejected.some((r) => r.startsWith('checksum_mismatch:')));

  console.log(
    'XIV 12D-10 Ollama local writer + Pocket Brain xiv-data ingest contracts hold (OFFLINE_PREFER_LOCAL, no fake VERIFIED accelerators, no prod DDL/DML).',
  );
}

await main();
