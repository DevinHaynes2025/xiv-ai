# Continuous Intelligence

XIV's architectural loop for governed business intelligence.

**Status:** IMPLEMENTED (typed loop) · NOT CONFIGURED (production sensing)

## Loop

SENSE → UNDERSTAND → PREDICT → DECIDE → ACT → MEASURE → LEARN

Architecture designed for continuous intelligence is not the same as production monitoring.

## Typed records

`IntelligenceSignal`, `IntelligenceObservation`, `IntelligenceFinding`, `Recommendation`, `DecisionRecord`, `ExecutionRecord`, `OutcomeRecord`, `LessonRecord`, `FeedbackCycle`.

Every result retains source, timestamp, freshness, scope, classification, confidence, provenance, organization, Universe when available, and stance:

- observed
- inferred
- projected
- hypothesized
- recommended

Predictions are not facts. `predictionIsNotFact('projected')` remains true.

## Location

`services/ai/runtime/intelligence/`
