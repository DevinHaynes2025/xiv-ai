// 12D-301 — the LOCAL assistant-turn endpoint of the story shell: the
// interactive surface of the XIV AI OS LOCAL assistant (the CEO's
// "mini grok bot" seed). The browser sends { tenantId, turnId,
// userMessage } as JSON; this handler prepares the turn through the
// REAL 12D-300 contract in the LOCAL server process and runs it against
// the INJECTED loopback caller (the 12D-289 authorized loopback surface
// — the pinned local model, temperature 0). The reply is secret-screened
// BOTH ways by the 12D-300 contract, and ONLY the frozen view model
// renders — a refused turn never produces a draft, and a secret-shaped
// message never reaches ANY model. Draft-only: the packet stops before
// the operator decision; nothing is persisted, remoteCalls 0 (loopback
// is not remote), modelCalls 1 per drafted turn (counted).

import {
  prepareAssistantTurn, runAssistantTurn,
} from "../../../../../../ai/runtime/offline-team/xiv-assistant-turn";
import { buildAssistantTurnViewModel } from "../../../../../../ai/runtime/offline-team/xiv-assistant-turn-view-model";
import { buildLoopbackCaller } from "../../../../../../ai/runtime/offline-team/xiv-reading-loopback-caller";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-301-v1",
      reason: `assistant turn input is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Assistant turn refused — HUMAN DECISION REQUIRED",
        bodyText: "The input could not be parsed as JSON; no model was called.",
        operatorNote: "Send { tenantId, turnId, userMessage } exactly.",
      },
    });
  }
  const prepared = prepareAssistantTurn(parsed);
  if (prepared.status !== "PREPARED") return Response.json(buildAssistantTurnViewModel(prepared));
  const packet = await runAssistantTurn(prepared, buildLoopbackCaller());
  return Response.json(buildAssistantTurnViewModel(packet));
}