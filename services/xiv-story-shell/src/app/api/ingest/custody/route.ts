// 12D-267 — the LOCAL custody-decision endpoint of the story shell. The
// browser sends the raw custody decision submission text (verified packet +
// 12D-247 decision custody plan); this handler re-verifies the WHOLE
// submission — including the cross-binding gate — through the 12D-242/247
// contracts in the LOCAL server process and returns ONLY a frozen view
// model. A refused submission's content (packet, plan, receipt) never
// crosses to the browser. No persistence, no remote calls, no approve
// control: remoteCalls 0, modelCalls 0.

import { buildCustodyDecisionViewModel } from "../../../../../../ai/runtime/offline-team/xiv-custody-decision-view";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-267-v1",
      reason: `custody decision submission text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Custody decision refused — HUMAN DECISION REQUIRED",
        bodyText: "The submission was not parseable JSON. Nothing was rendered from it.",
        operatorNote: "Refused. Deliver a fully consistent custody decision submission.",
      },
    });
  }
  return Response.json(buildCustodyDecisionViewModel(parsed));
}