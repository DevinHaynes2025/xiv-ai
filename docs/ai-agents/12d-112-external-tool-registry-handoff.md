# 12D-112 — Governed External Build/AI Tool Integration Registry (handoff)

Status: BUILT LOCALLY on the 12D offline-team lineage. Covers the CEO-named external tools scope.

## What it is

`external-tool-registry.ts` records, per tool, the integration intent for the six tools the CEO named: EXPO (expo.dev, React Native SDK 57), LOVABLE (lovable.dev), AMD_TOOLCHAIN (ROCm/NPU targets), OPENAI_CHATGPT (the `chatgpt/*` implementer branches), GROK_XAI, and OLLAMA (already live locally at 127.0.0.1:11434). It follows the social-ingestion-registry stage model: every tool starts at `NOT_STARTED` and advances `AGREEMENT_PENDING -> INTEGRATION_RESEARCH -> SANDBOX_PILOT_APPROVED` only with an evidence receipt. `LIVE` is unreachable from this module by construction — `advanceStage(..., 'LIVE', ...)` throws, exactly like the platform LIVE guardrail in 12D-104.

## What it deliberately does not do

No OAuth, no tokens, no API keys, no endpoints contacted — including the local Ollama endpoint, whose well-known address is recorded as `localEndpointNote` INTENT ONLY and is never probed here. The registry stores only intent, required-agreement kinds, and governance posture per tool, so a future operator decision happens on an audited surface instead of by accident. `recordIntegrationEvidence` adds a bounded ref without advancing a stage: evidence never implies live integration.

## Honest flags

`liveIntegrationsEstablished: false`, `remoteCallsPerformed: 0`, `modelCalls: 0`, `realEntitiesCreated: 0`, `learningPromoted: false`, `humanDecision: 'REQUIRED'` on every snapshot and target. `EXTERNAL_TOOL_POLICY` and `EXTERNAL_TOOL_GUARDRAILS` are frozen. Fail-closed throughout: unknown tools throw, stage regression throws, oversized refs and the per-tool evidence ceiling throw.

## Verification

7/7 tests (`test:12d-112`): all six tools registered at NOT_STARTED with honest posture; advancement requires a receipt, regression forbidden, LIVE unreachable from every tool; unknown tools rejected; oversized refs and evidence ceiling enforced; frozen policy/guardrails; posture records agreements but never credentials; snapshot stays honest after maximum in-module advancement. `typecheck:12d-112` PASS. Wired into `.gitlab-ci.yml` in story-number order.

## Trust limits

The registry never integrates anything — it records intent and governance posture only. Establishing a live integration is an operator/human decision backed by a signed vendor agreement, implemented in a different, audited layer. `humanDecision: REQUIRED` throughout.