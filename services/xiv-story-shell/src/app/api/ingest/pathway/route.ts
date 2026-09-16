// 12D-270 — the LOCAL pathway-decision endpoint of the story shell. The
// browser sends the raw pathway decision submission text (12D-2xx bridge
// packet + 12D-269 recorded decision custody plan); this handler
// re-verifies the WHOLE submission — including the candidate-bytes
// cross-binding and the fresh eligibility gate — through the 12D-269
// contracts in the LOCAL server process and returns ONLY a frozen view
// model. A refused submission's content (packet, plan, receipt, pathway
// identity) never crosses to the browser. No persistence, no remote calls,
// no approve control: remoteCalls 0, modelCalls 0.

import { buildPathwayApprovalViewModel } from "../../../../../../ai/runtime/offline-team/xiv-pathway-approval-view";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-270-v1",
      reason: `pathway decision submission text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Pathway decision refused — HUMAN DECISION REQUIRED",
        bodyText: "The submission was not parseable JSON. Nothing was rendered from it.",
        operatorNote: "Refused. Deliver a fully consistent pathway decision submission.",
      },
    });
  }
  return Response.json(buildPathwayApprovalViewModel(parsed));
}