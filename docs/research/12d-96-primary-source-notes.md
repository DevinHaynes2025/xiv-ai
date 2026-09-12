# Research packet: original summaries of primary sources

Reviewed during this build at 2026-09-12T01:29:54.180Z. These are original reference summaries, not raw page copies or training data. Source claims and XIV design decisions are separate. Rights for broader reuse and freshness must be reviewed; no automatic memory or weight promotion occurred.

## Ollama hardware backends
https://docs.ollama.com/gpu

Source-derived summary: Ollama documents separate ROCm support lists and an additional Vulkan backend. Hardware detection, backend availability and successful model offload are different observations.

XIV implementation decision: Keep the successful CPU pilot unchanged; any 780M experiment needs fresh before-and-after evidence.

## Ollama request and memory management
https://docs.ollama.com/faq

Source-derived summary: Concurrent model loading depends on available memory. Parallel requests increase context-memory requirements. An overloaded server can reject queued requests.

XIV implementation decision: Use one model request at a time initially. One role profile does not require its own loaded model.

## Ollama generation API
https://docs.ollama.com/api/generate

Source-derived summary: The generation API supports explicit model selection, nonstreamed output and generation options. Responses include completion and timing information.

XIV implementation decision: Use bounded generation and record real responses before reporting execution.

## Ollama local versus cloud
https://docs.ollama.com/cloud

Source-derived summary: Ollama supports cloud-hosted models as well as models executed locally. A locally running client is not sufficient evidence of local model execution.

XIV implementation decision: Keep cloud model identity separate from the CLI and deny private-data fallback.

## Claude Code role configuration
https://code.claude.com/docs/en/sub-agents

Source-derived summary: Custom subagents have role instructions, model selection and tool configuration. Definitions are reusable configurations; invoking one is a separate event.

XIV implementation decision: Prepare concise role profiles; do not auto-install or launch one hundred sessions.

## OWASP prompt injection defense
https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html

Source-derived summary: Untrusted documents can influence model behavior and tool use. OWASP recommends separating instructions from data, validating tool calls, restricting privileges and applying layered defenses.

XIV implementation decision: Quarantine research material and never execute retrieved instructions or model-generated commands.

## OWASP retrieval security
https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html

Source-derived summary: RAG systems need security controls across ingestion, storage, retrieval and output, including provenance and access boundaries.

XIV implementation decision: Research summaries remain nonpromoted references until rights, relevance, privacy and poisoning checks are reviewed.

## Node SQLite API
https://nodejs.org/api/sqlite.html

Source-derived summary: DatabaseSync exposes synchronous SQLite access. The module was introduced in Node 22.5; its maturity differs across Node release lines.

XIV implementation decision: Use this prototype in an isolated local worker process, not on a production HTTP hot path. Node 22 testing emits an experimental warning.
