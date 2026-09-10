# XIV 12D-10 — LOCAL Ollama writer loop + Pocket Brain ingest

**Ticket:** 12D-10 (renumbered — was Offline Builder “Ollama/Pocket” lane; Agent Identity Checkpoint Ledger deferred to **12D-11**)  
**Branch:** `grok/12d-10-guardrail-self-seal` (from `grok/12d-10-ollama-pocket-brain-ingest` @ `b0b05b69`)  
**Worktree:** `C:\Users\Devin\xiv-ai-12d` only  
**Base:** `grok/12d-09-offline-snapshot-cache` @ `957115b0`  
**State:** research / feature branch  
**L4 / production auto:** false

## Scope

1. **LOCAL Ollama writer loop** with `OFFLINE_PREFER_LOCAL` when `http://127.0.0.1:11434` is up
2. **Pocket Brain ingest** from **checksummed `xiv-data` manifests ONLY**
3. No fake **VERIFIED** GPU/NPU/QPU claims (accelerators stay `UNVERIFIED` / `UNAVAILABLE`)
4. No autonomous **PRODUCTION DDL/DML**
5. Atomic Data Cells + Twin gates stand (from 12D-09)
6. Checkpoint Ledger → **12D-11** (append-only identity+audit; not a second control plane)

## Guardrails

Self-sealed on both `OLLAMA_WRITER_GUARDRAILS` and `POCKET_BRAIN_INGEST_GUARDRAILS` (not inherited-only):

| Flag | Value |
|------|-------|
| OFFLINE_PREFER_LOCAL | true (writer) |
| L4_PRODUCTION_ENABLED | false |
| PRODUCTION_DIMENSIONAL_FABRIC_ENABLED | false |
| bioCloningAllowed | false |
| destructiveDbAutoApply | false |
| productionAutoApply | false |
| productionAutoMerge | false |
| productionAutoDeploy | false |
| liveCloudSyncFabricationAllowed | false (lane-local) |
| autonomousProductionDDL | false |
| autonomousProductionDML | false |
| verifiedAcceleratorClaimAllowed | false |
| fakeVerifiedGpuNpuQpuAllowed | false |
| acceleratorGpu / Npu / Qpu | UNVERIFIED only (type bans VERIFIED) |
| ingestFromXivDataManifestsOnly | true (ingest) |
| mayEnterGlobalBrain | false |
| secretsAllowed | false |
| highAutonomyTargets | LOCAL \| CLOUD_SANDBOX only |
| policyGateBypassAllowed | false |
| checkpointIsReadReviewOnly | true |
| checkpointLedgerIsSecondControlPlane | false |

## API sketch

```ts
import {
  buildXivDataManifest,
  probeOllamaLocal,
  runLocalOllamaWriterLoop,
  ingestXivDataManifestToPocketBrain,
} from './runtime/dimensional';

const manifest = buildXivDataManifest({
  manifestId: 'm1',
  tenantId: 'xiv',
  entries: [{ relativePath: 'corpus/a.txt', content: '...' }],
  provenance: { source: 'xiv-data', capturedAt: new Date().toISOString(), founderApproved: true },
});

const probe = await probeOllamaLocal({ fetchImpl: globalThis.fetch });
const writer = await runLocalOllamaWriterLoop({
  runId: 'r1',
  sourceText: '...',
  probe,
});
const result = ingestXivDataManifestToPocketBrain({
  manifest,
  contents: new Map([['corpus/a.txt', '...']]),
  writerArtifacts: writer.artifacts,
});
```

## Deliverables

| Module | Role |
|--------|------|
| `dimensional/xiv-data-manifest.ts` | Checksummed xiv-data manifest contracts |
| `dimensional/ollama-local-writer.ts` | OFFLINE_PREFER_LOCAL probe + writer loop |
| `dimensional/pocket-brain-ingest.ts` | Manifest-only Pocket Brain ingest |
| `dimensional/12d10.test.ts` | Contract + Twin gate tests |
| `docs/operations/XIV_12D10_OLLAMA_POCKET_BRAIN_INGEST.md` | This doc |

## Next safe task

**12D-11 — Agent Identity + Checkpoint Ledger** (append-only; read/review checkpoint; never Policy Gate bypass; never second production control plane).

## Tests

```bash
cd services/ai
npx tsx runtime/dimensional/12d10.test.ts
npx tsx runtime/dimensional/12d09.test.ts
npx tsx runtime/dimensional/12d08.test.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab.
