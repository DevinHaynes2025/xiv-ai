// 12D-312 — the LOCAL memory-cited-turn endpoint of the story shell:
// the single-turn surface where the assistant SEES the reviewed memory
// AND cites the exact reviewed storyIds it relied on. The browser sends
// { tenantId, turnId, userMessage, memoryPacket } — the pasted REAL
// 12D-305 memory packet — and this handler runs the REAL 12D-310
// contract against the INJECTED 12D-289 loopback caller in the LOCAL
// server process. The memory packet is re-verified through the REAL
// 12D-306 gate, the user message is secret-screened BEFORE any model
// call, the composed prompt refuses over the derived ceiling, and the
// reply is secret-screened post-call; a cited storyId outside the
// verified carried set refuses POST-CALL (fabricated provenance never
// passes) and zero citations renders honestly as UNGROUNDED. ONLY the
// frozen view model renders. Draft-only: nothing is persisted,
// remoteCalls 0 (loopback is not remote), modelCalls 1 per drafted turn
// (counted).

import {
  prepareAssistantMemoryCitedTurn, runAssistantMemoryCitedTurn,
} from "../../../../../../ai/runtime/offline-team/xiv-assistant-memory-cited-turn";
import { buildAssistantMemoryCitedTurnViewModel } from "../../../../../../ai/runtime/offline-team/xiv-assistant-memory-cited-turn-view-model";
import { buildLoopbackCaller } from "../../../../../../ai/runtime/offline-team/xiv-reading-loopback-caller";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-310-v1",
      reason: `memory cited turn input is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Assistant memory cited turn refused — HUMAN DECISION REQUIRED",
        bodyText: "The input could not be parsed as JSON; no model was called.",
        operatorNote: "Send { tenantId, turnId, userMessage, memoryPacket } exactly.",
      },
    });
  }
  const prepared = prepareAssistantMemoryCitedTurn(parsed);
  if (prepared.status !== "PREPARED") return Response.json(buildAssistantMemoryCitedTurnViewModel(prepared));
  const packet = await runAssistantMemoryCitedTurn(prepared, buildLoopbackCaller());
  return Response.json(buildAssistantMemoryCitedTurnViewModel(packet));
}