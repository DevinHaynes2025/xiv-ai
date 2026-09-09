# XIV Guardian — Trusted Validation Runner

Guardian is a **developer validation** surface. It is on-demand, not continuous monitoring. It diagnoses and validates. It does not self-modify production systems.

## Pipeline

```
Check Registry
    ↓
Trusted Runner (check ID only)
    ↓
Static executable + args + cwd
    ↓
Timeout + bounded capture
    ↓
Exit code
    ↓
Deterministic parser
    ↓
Health result
    ↓
Audit / mobile UI
```

## Invariants

- `runGuardianCheck('mobile-typescript')` is the only public execution shape.
- There is no `exec(command)` API for users, LLMs, agent reasoning, or API payloads.
- Unknown check IDs are denied. Raw command strings are rejected as unknown IDs.
- LLM wording never decides pass/fail. Exit code + parser decide status.
- Human approval does not override policy. Guardian does not execute production writes.

## Check Registry

Registered IDs:

| ID | Suite | Execution |
| --- | --- | --- |
| `mobile-typescript` | Mobile | Trusted host (`npx tsc --noEmit`) |
| `mobile-lint` | Mobile | Trusted host (`npm run lint`) |
| `expo-doctor` | Mobile | Trusted host (`npx expo-doctor`) |
| `ai-typescript` | AI service | Trusted host (`npx tsc --noEmit`) |
| `runtime-tests` | AI service | Trusted host (`npm run test:runtime`) |
| `repository-status` | Repository | Trusted host (`git status --short`) |
| `repository-diff-check` | Repository | Trusted host (`git diff --check`) |
| `ai-service-health` | Service | Injected `/health` probe only |
| `configuration-health` | Config | In-process name presence (no values) |
| `runtime-health` | Runtime | In-process registry load |

Each definition includes `id`, `name`, `description`, `category`, `severity`, `executionType`, static command metadata, `workingDirectory`, `timeoutMs`, `safeToRun`, `enabled`, and `outputParser`.

## Trusted runner

`runGuardianCheck(id)` accepts a registered ID only.

- On device / agent runtime: in-process and injected checks may run. Host-process checks return `unavailable_on_device` / `unknown`.
- On a trusted host: `npm run guardian:validate` from `services/ai` attaches `createHostExecutor()` and runs the suite.

The agent gateway tool `development_health_checker` **does not** invoke the host runner. Agents cannot pass a command string through.

## Host execution security

If Node `child_process` is used (`guardian/host.ts`):

- `spawn` with `shell: false` (Windows `.cmd` shims are not used; `npx`/`npm` run as `node` + the static npm CLI scripts)
- executable, args, and cwd come only from the static registry
- timeout kills the child
- stdout/stderr are capped (8 KB at capture, 800 chars after sanitize)
- secret-like lines are stripped
- child env is a PATH/OS allowlist — no Gemini, Supabase, or API keys
- results never include environment variable values

`createHostExecutor` is **not** exported from the public `@xiv/ai` index.

## Diagnosis

Parsers are deterministic:

| Parser | Failure meaning |
| --- | --- |
| typescript | Compile/type health failure |
| lint | Code quality warning |
| expo-doctor | Dependency/configuration health issue |
| runtime-tests | Governed runtime regression |
| git-diff | Whitespace/conflict hygiene issue |
| git-status | Working-tree hygiene notice |
| health | Service availability warning |

Timeout → `unknown`. Non-zero exit → `warning` or `critical` from check severity. Exit `0` → `healthy`, even if logs claim otherwise.

## Health report

`overallStatus`: `healthy` | `warning` | `critical` | `unknown`

Each check result: `id`, `name`, `status`, `message`, `durationMs`, `timestamp`, `safeToRun`, `executionMode`, optional `outputSummary` / `recommendedAction` / `diagnosis`.

The report is labeled developer validation, on-demand, not continuous monitoring. Mobile shows summaries, not raw shell logs.

## What remains disabled

- Arbitrary shell execution
- LLM-generated commands
- Continuous monitoring
- Autonomous production fixes
- L4 bounded autonomy
- Secret scanning / secret display
