// 12D-268 — the LOCAL escrow-verdict endpoint of the story shell. The
// browser sends the raw escrow submission text ({escrowState}); this handler
// re-verifies it through the REAL 12D-266 validator in the LOCAL server
// process and returns ONLY a frozen view model. A refused submission's
// content (escrow id, payee, amount, phase) never crosses to the browser.
// No persistence, no remote calls, no approve control, no rail call of any
// kind: remoteCalls 0, modelCalls 0, railsIntegrated false.

import { buildEscrowVerdictViewModel } from "../../../../../../ai/runtime/offline-team/xiv-escrow-verdict-view";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-268-v1",
      reason: `escrow submission text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Escrow state refused — HUMAN DECISION REQUIRED",
        bodyText: "The submission was not parseable JSON. Nothing was rendered from it.",
        operatorNote: "Refused. Deliver a lawful escrow gate state.",
      },
    });
  }
  return Response.json(buildEscrowVerdictViewModel(parsed));
}