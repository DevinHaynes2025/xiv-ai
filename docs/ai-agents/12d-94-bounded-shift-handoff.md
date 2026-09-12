# 12D-94 — Agent census and bounded review shifts

Owner: Devin Xavier Haynes, CEO & Cofounder. Private development branch: `chatgpt/12d-94-agent-census-bounded-shifts`.

## Scope

This reuses the actual 12D-92 heartbeat runner, the approved-document wrapper from the separate 12D-92 follow-up, and the clean 12D-93 type surface. It adds a finite local discussion/review shift, not a production OS install or autonomous code writer. It does not merge the sibling branches, replace the Homebase-v01 supervisor, reconcile every historical registry, or change any existing machine scheduler. The older brain:meeting command is unchanged on this branch; the NEW background-shift CLI calls the pinned wrapper.

The core agent census reads `listXivAgents()` and `DEFAULT_OFFLINE_TEAM` directly. Baseline: 21 named core definitions (15 prototype, 5 registered, 1 future, 0 available), 4 configured default offline seats. The council's 8 role types and alignment plane's 12 role types overlap; they are not an additional 20 running agents. A registry status is not process telemetry. `liveAgentCount` is null until a separately authenticated instance-telemetry source exists. Other agent factories and the separate Homebase lane are outside this census scope.

## Acceptance before background launch

The supplied Windows transcript reports the 12D-92 local regression suites passed but its later meeting invocation was blocked by a timed-out cloud-backed safety classifier. A blocked tool call is NOT permission to run the same action through a different tool, mode or credential. Stop retrying and keep the result BLOCKED until the normal safety/permission path works. Do not disable policy hooks, use bypassPermissions, forge receipts or mark the waiting meeting complete.

An operator must review this branch and its loaded Claude Code settings/hooks/context first. Never run it beside an active Homebase inference worker or another local meeting; this CLI's lock coordinates only other copies of this CLI. Host-wide coordination with Homebase remains a required follow-up. Local acceptance must verify native executable identity, argument support, cancellation and the selected provider/model without exposing credentials. No Windows or live-model test has been performed by the assistant for 12D-94.

From the isolated review worktree's `services/ai`, use already reviewed dependencies. If dependency installation is blocked by npm policy, stop for review; do not use another copy merely to evade the blocked lifecycle-script decision.

```powershell
npm run typecheck
node node_modules/tsx/dist/cli.mjs --test runtime/offline-team/bounded-background-shift.test.ts runtime/offline-team/agent-census.integration.test.ts runtime/offline-team/approved-master-plan-meeting.test.ts
node node_modules/tsx/dist/cli.mjs runtime/offline-team/background-shift.cli.ts --census
```

Census mode does not contact a model, create a lock, or write reports. The following launch is a POST-REVIEW acceptance step only, not a way around a blocked command. Substitute the actual approved local document path:

```powershell
node node_modules/tsx/dist/cli.mjs runtime/offline-team/background-shift.cli.ts --approve-local-meetings --tenant xiv-dev-pilot --master-plan "C:\path\to\XIV_AI_Master_Plan_Editable_Investor_Edition.docx" --rounds 1
```

Begin with one supervised round. Only after it passes, an operator may choose the default two-round shift (30 minutes between completed rounds) or at most four rounds, with 15–60 minute spacing. Keep the process alive in an approved local session; this commit does not install a service, scheduled task or autostart entry. Power-off/sleep stops or suspends local work; external review also needs connectivity and an available provider. There is no autonomous restart.

## Optional Claude Code review

External review is disabled by default. After the ordinary-data review policy is accepted, all of these launch options are required: `--approve-external-review --reviewer-policy-reviewed --reviewer-model <actual-model-id> --reviewer-provider <actual-provider-label>`. `--claude-bin <absolute-native-executable-path>` can identify a reviewed executable; Windows defaults to the standard per-user native location.

The CLI uses print/JSON mode with no model tools, empty strict MCP configuration, no Chrome integration, one turn, and a requested $0.25 per-call budget. Auto permission checks remain active; unanswered prompts are denied. Existing operator/managed configuration and policy hooks are not disabled. It does not use bare mode or bypass-permissions flags. Review the inherited settings/hooks and context for side effects and confidential data before opting in. The executable and OS user are trusted; CLI flags are not an OS security sandbox. Stop on unsupported flags, authentication errors, classifier outage or denial; never silently retry or fall back.

The requested model, CLI-reported model names and operator provider label are stored separately; they are NOT authenticated vendor attestations. A GLM response through Claude Code is not an Anthropic Claude response. The requested budget and estimated cost are not proof of upstream third-party billing enforcement. No Grok request is implemented; Grok stays PENDING.

## Communication and learning boundaries

At most three fixed nonsensitive requests go to local Qwen per round. If opted in, one local engineering memo goes to the text-only external reviewer. A successful peer critique can enter the NEXT local round as bounded, quoted UNTRUSTED discussion context. It is not executed as a command, stored as trusted memory, used to modify weights or counted as independent approval. No customer files, private master-plan bytes, confidential/TOP_SECRET data or arbitrary source tree is read into the generated memo. Existing host-loaded CLI context must still be reviewed separately.

A report sink error, blocked local model, reviewer failure, cancellation or round timeout ends the shift. Late output is discarded. When process/provider settlement is uncertain, the lock remains for operator review. Aborting a request does not prove the model server stopped; the worker cannot forcibly stop a blocked JS event loop. It never kills unrelated processes or steals a stale lock.

## Reports and stop

Reports are generated under `%USERPROFILE%\.xiv-ai-operator\<shift-id>\` when launched, outside the repository: census.json, start.json, round-N.json and summary.json. Existing files are not overwritten. Synthetic memo text is plaintext; this is NOT an encrypted personal-memory vault. Windows ACL hardening, authenticated receipt ingestion, retention enforcement and process-tree acceptance are not yet verified. Do not use private data.

Press Ctrl+C or create the printed shift directory's STOP file. Do not delete a retained lock until the operator has confirmed the owned work has stopped. The report names the CEO but does not send email or upload local files. ChatGPT's hourly reporting is a separate cloud-scheduled read-only task and cannot see these local files without an approved handoff.

## References

Claude Code CLI options and permission behavior: https://code.claude.com/docs/en/cli-reference
Programmatic use: https://code.claude.com/docs/en/headless
Ollama local/cloud authentication boundary: https://docs.ollama.com/api/authentication

Next queue: one authenticated local telemetry/report bridge and host-wide job lease shared with Homebase, followed by the unresolved CONFIDENTIAL routing inconsistency. Preserve the blocking full-service typecheck; do not trade safety for more agent labels.
