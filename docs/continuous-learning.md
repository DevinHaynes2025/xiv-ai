# Continuous Learning

Product learning from recorded outcomes. This is **not** model self-training.

**Status:** IMPLEMENTED (engine types) · FORBIDDEN (automatic model/code mutation)

## Flow

Problem detected → agent recommendation → human approves/rejects → action taken → outcome measured → expected vs actual compared → lesson recorded → future recommendation may reference the lesson.

## States

`unmeasured` · `measuring` · `successful` · `partially_successful` · `unsuccessful` · `inconclusive`

Successful outcomes are never fabricated. Missing measurement stays `not_measured`.

## Location

`services/ai/runtime/learning/`

`runContinuousLearningCycle()` always returns `mutatesModel: false` and `mutatesAgentCode: false`.
