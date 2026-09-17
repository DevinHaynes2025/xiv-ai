// 12D-303 — the LOCAL assistant-conversation endpoint of the story
// shell: the multi-turn surface of the XIV AI OS LOCAL assistant. The
// browser sends { tenantId, conversationId, userMessage, priorTurns } —
// the DISCLOSED prior context the caller (the browser) holds — and this
// handler runs the REAL 12D-302 conversation contract against the
// INJECTED 12D-289 loopback caller in the LOCAL server process. Every
// prior pair is re-screened by the contract BEFORE any model call (a
// secret-shaped string anywhere in the history refuses); the composed
// prompt refuses over the derived ceiling; the reply is secret-screened
// post-call; ONLY the frozen view model renders. Draft-only: nothing is
// persisted, remoteCalls 0 (loopback is not remote), modelCalls 1 per
// drafted turn (counted).

import {
  prepareAssistantConversationTurn, runAssistantConversationTurn,
} from "../../../../../../ai/runtime/offline-team/xiv-assistant-conversation";
import { buildAssistantConversationViewModel } from "../../../../../../ai/runtime/offline-team/xiv-assistant-conversation-view-model";
import { buildLoopbackCaller } from "../../../../../../ai/runtime/offline-team/xiv-reading-loopback-caller";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-303-v1",
      reason: `conversation turn input is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Assistant conversation turn refused — HUMAN DECISION REQUIRED",
        bodyText: "The input could not be parsed as JSON; no model was called.",
        operatorNote: "Send { tenantId, conversationId, userMessage, priorTurns } exactly.",
      },
    });
  }
  const prepared = prepareAssistantConversationTurn(parsed);
  if (prepared.status !== "PREPARED") return Response.json(buildAssistantConversationViewModel(prepared));
  const packet = await runAssistantConversationTurn(prepared, buildLoopbackCaller());
  return Response.json(buildAssistantConversationViewModel(packet));
}