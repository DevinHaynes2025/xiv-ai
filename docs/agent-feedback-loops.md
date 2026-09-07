# Agent Feedback Loops

Product learning loop. Agents do not retrain themselves.

## Status

| Piece | Maturity |
| --- | --- |
| Observation → lesson types | IMPLEMENTED |
| In-memory OutcomeRecord | PROTOTYPE |
| Persistent outcome table | PLANNED |
| Automatic model/code mutation | FORBIDDEN |

## Loop

Observe → Analyze → Recommend → Human decision → Execute if authorized → Measure → Compare → Record lesson → improve future recommendation context.

`recordLesson()` sets `retrainsModel: false` and `mutatesAgentCode: false`.
