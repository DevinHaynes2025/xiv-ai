# Agent Circuit Breakers

Deterministic suspension of new work when thresholds are exceeded.

**Status:** IMPLEMENTED (in-memory model) · PLANNED (production enforcement)

## States

`closed` · `warning` · `open` · `half_open`

`open` means the agent cannot accept new work. Re-enable requires a policy-defined process.

## Signals

Repeated policy violations, timeouts, invalid provenance, tool failures, loop detection, unexpected costs, tenant mismatch, security denial, malformed outputs.

Health dimensions stay `not_measured` until evidence exists. Numbers are not invented.
