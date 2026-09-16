// 12D-273 — the LOCAL queue-census endpoint of the story shell. The
// browser sends the raw queue census submission text (the queue's own
// frozen policy object + its own summary() output); this handler
// re-verifies the WHOLE submission — the policy deep-equal gate, the
// exact summary shape, and the cross-consistency gates — in the LOCAL
// server process and returns ONLY a frozen view model with MEASURED
// counts. A refused submission's content never crosses to the browser.
// No persistence, no queue access, no remote calls: remoteCalls 0,
// modelCalls 0.

import { buildQueueCensusViewModel } from "../../../../../../ai/runtime/offline-team/xiv-queue-census-view";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-273-v1",
      reason: `queue census submission text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Queue census refused — HUMAN DECISION REQUIRED",
        bodyText: "The submission was not parseable JSON. Nothing was rendered from it.",
        operatorNote: "Refused. Deliver the queue's own frozen policy object and its own summary() output, unchanged.",
      },
    });
  }
  return Response.json(buildQueueCensusViewModel(parsed));
}