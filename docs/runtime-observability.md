# Runtime Observability

Developer-only trace of:

request → policy → agent → handoff → tool → gateway → result → evaluation

Correlation IDs are required. Secrets, tokens, API keys, and signed-URL query parameters are stripped.

Failure modes are explicit: source/agent unavailable, handoff denied, budget exceeded, loop detected, timeout, stale evidence, tenant unavailable, schema collision, scanner unavailable, stream infrastructure unavailable.

Graceful degradation returns a labeled partial result. It does not fabricate the missing specialist output.
