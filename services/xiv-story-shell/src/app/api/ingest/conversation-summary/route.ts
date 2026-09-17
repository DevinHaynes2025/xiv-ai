// 12D-320 — the LOCAL conversation-summary endpoint of the story shell:
// the operator's grounding MEASUREMENT surface. The browser sends
// { tenantId, conversationId, userMessage, priorTurns, memoryPacket } —
// the conversation's prior turns plus the pasted REAL 12D-305 memory
// packet — and this handler runs the REAL 12D-320 card in the LOCAL
// server process: the packet is re-verified through the REAL 12D-306
// gate, the turns pass the REAL 12D-302/308 history discipline, and
// every reply's [mem:<storyId>] citations are extracted through the
// REAL 12D-310 extractor and measured against the verified carried set.
// NO model is called (modelCalls 0) — a summary is MEASURED, never
// generated; fabricated citations are disclosed BY ID and zero
// citations render honestly as UNGROUNDED. ONLY the frozen view model
// renders. Nothing is persisted.

import {
  prepareConversationSummaryCard, buildConversationSummaryCardPacket,
} from "../../../../../../ai/runtime/offline-team/xiv-conversation-summary-card";
import { buildConversationSummaryCardViewModel } from "../../../../../../ai/runtime/offline-team/xiv-conversation-summary-card-view-model";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      status: "REFUSED",
      kind: "CONVERSATION_SUMMARY_CARD",
      policyVersion: "12d-320-v1",
      reason: `conversation summary card input is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      modelCalls: 0,
      remoteCalls: 0,
      activated: 0,
      learningPromoted: false,
      humanDecision: "REQUIRED",
    });
  }
  const prepared = prepareConversationSummaryCard(parsed);
  if (prepared.status !== "PREPARED") return Response.json(buildConversationSummaryCardViewModel(prepared));
  return Response.json(buildConversationSummaryCardViewModel(buildConversationSummaryCardPacket(prepared)));
}