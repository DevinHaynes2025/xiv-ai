# XIV 12D-03 ? Governed Offline + Cloud Builder (Ingest)

**Ticket:** 12D-03 (CEO builder control-plane ingest)  
**Ingested onto:** `grok/12d-04-database-city`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d` only  
**L4 production:** false  
**Production dimensional fabric:** false

## Dual-SHA honesty

| Remote | Branch tip claimed | SHA | Notes |
|--------|--------------------|-----|-------|
| GitHub `origin` | `xiv-12d-dimensional-fabric` | `74e8fe587b806b43477598fc5c39e36b78bc50e0` | Ingested via merge |
| GitLab `gitlab` | `xiv-12d-dimensional-fabric` | `7c34493b40c8552451bc51ab9e7deb45fcc11766` | Content-mirrored builder; **different commit objects** (distinct ancestry OK) |

Do **not** force-push GitLab. Do **not** rewrite `xiv-v2`. Dual tips may diverge as commit objects while mirroring builder contracts.

## What was ingested (from GitHub tip `74e8fe5`)

| Path | Role |
|------|------|
| `services/ai/runtime/builder/types.ts` | Providers `OLLAMA\|GROK\|CHATGPT\|GEMINI\|LOCAL_RULES`; targets `LOCAL\|CLOUD_SANDBOX\|PRODUCTION`; DB engines `POSTGRES\|SQLITE\|VECTOR\|GRAPH\|OBJECT_STORE` |
| `services/ai/runtime/builder/policy.ts` | `BUILDER_GUARDRAILS` ? all `autonomousProduction*` / secrets / deploy flags **false** |
| `services/ai/runtime/builder/orchestrator.ts` | `planDatabase` / `selectBuilder` / DEFAULT_BUILDERS (Ollama local preferred) |
| `services/ai/runtime/builder/builder.test.ts` | Contract tests |
| `services/ai/runtime/dimensional/atomic-memory.ts` | CEO atomic fact/shard/path fabric (exported as `AtomicFactShard` to avoid clash with `memory-shards.MemoryShard`) |
| `docs/architecture/xiv-12d-03-governed-offline-cloud-builder.md` | Architecture note |

## Merge method

1. Base branch tip: `grok/12d-03-benchmark-runner` @ `29594dc3`
2. Created `grok/12d-04-database-city`
3. Merged `74e8fe5` (no force); conflict only in `dimensional/index.ts`
4. Resolution: keep 12D-02/03 exports **and** selective atomic-memory exports
5. Common merge-base with GitHub tip was `f9d92d56` (divergent: ours had 12D-02/03; theirs had atomic-memory + builder)

## Guardrails (must remain false)

- `autonomousProductionDDL`
- `autonomousProductionDML`
- `autonomousDestructiveMigration`
- `autonomousSecretCreation`
- `autonomousDeployment`
- `PRODUCTION_DIMENSIONAL_FABRIC_ENABLED`
- L4 production

## Related

- Architecture: `docs/architecture/xiv-12d-03-governed-offline-cloud-builder.md`
- Follow-on: `docs/operations/XIV_12D04_DATABASE_CITY.md`
