# CEO addendum — bind meetings to the approved master-plan revision

For Devin Xavier Haynes, CEO and Cofounder.

During this session, newer 12D-92 work appeared on both remotes. A create-branch commit attempt was rejected because that branch already existed; it changed no files. The newer implementation was inspected and preserved rather than overwritten by a competing local draft.

Reviewed bases: GitLab `3ab5dc628098a9272bd11e38808c94522368ff20`; GitHub `fe3c9ffa2d41a66fc34e20dddf4e6d45540477e6`. Those versions implement scoped expiring receipts, endpoint validation, finite score checks and a bounded Ollama meeting contribution with external reviewers pending.

## Additional finding and repair

The existing low-level meeting helper checked only whether a supplied master-plan digest had 64 hexadecimal characters. That allowed the CLI to accept any document as the master-plan revision. A new approved-revision wrapper now checks the actual founder-uploaded document SHA-256 before the first network call. The public CLI calls that wrapper. The low-level probe and helper remain available for tests and internal use; other future callers must adopt this boundary. This is not a claim of whole-platform enforcement.

Pinned revision: `d66a7b95495a60c5d32f8582b5cf47f15ea6881182815f3689fe657afd6cdc9c`, computed from the uploaded `XIV_AI_Master_Plan_Editable_Investor_Edition (1)(5).docx`. Any edited/re-saved revision requires a reviewed pin update. Do not remove the gate to work around a mismatch. Matching the document hash does not prove all agents obey its contents; the report explicitly labels approval as DOCUMENT_REVISION_ONLY.

Five added tests cover a wrong but well-formed digest, malformed input, a successful approved synthetic meeting, uppercase normalization, and offline behavior. They use mocks, not live model calls. CI keeps scoped TypeScript validation and all 12D-85 through 12D-92 checks, with the additional tests blocking. Whole-service type debt remains a separate release concern and was not hidden or weakened here.

## Team communication status

The uploaded Claude Code review supplied actionable defects, which the newer 12D-92 implementation addresses. That session identified its backend as `glm-5.3-flash:cloud`; do not label it as an Anthropic Claude model. The uploaded transcript reports historical local Qwen inference success, not a fresh heartbeat from this assistant. No direct Grok response has been verified.

The public meeting command makes at most three local requests, returns one local contribution and leaves Claude Code/Grok reviews PENDING. It does not automatically transmit packets, start recurring meetings, execute model-generated commands, modify weights or promote learning. Independent reviews, dissent, human decisions and measured outcomes remain required under the source plan's Master Pages 27, 30, 52, 117 and 118.

## Handoff

Use a separate worktree on `fix/12d-92-approved-master-plan-meetings`. Read `docs/ai-agents/12d-92-verified-heartbeat-handoff.md` and this addendum. Run the scoped typecheck and tests, then invoke `npm run brain:meeting -- --tenant xiv-dev-pilot --master-plan <actual-local-path-to-the-pinned-document>`. Capture the JSON packet. Share only reviewed ordinary material with external reviewers, recording actual provider/model identity. Leave pending reviews pending; do not invent attendance or approval. Never bypass permission or safety-classifier failures to execute a command.

No merge, deployment, cloud change or existing feature-branch overwrite is part of this addendum. Next queue: authenticate review receipt ingestion, fix the remaining full-service type/policy gaps, and prove offline user journeys before capacity claims.
