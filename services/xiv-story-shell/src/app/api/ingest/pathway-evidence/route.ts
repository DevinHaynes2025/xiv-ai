// 12D-304 — the LOCAL bound-reading pathway-evidence endpoint of the
// story shell. The operator pastes the RAW 12D-279 evidence packet
// (produced runtime-side by prepareBoundReadingPathwayEvidence over a
// trusted queue — the 12D-286 lesson: queue doors are never
// shell-imported); this handler re-verifies the WHOLE packet through the
// REAL 12D-304 view model in the LOCAL server process — exact-key gate,
// honest flags, binding re-gate, and ELIGIBILITY RE-DERIVED with the
// real growth-engine evaluator — and returns ONLY the frozen view model.
// A refused packet's content (ids, digests, eligibility claims) never
// crosses to the browser. No persistence, no queue, no write path, no
// remote calls: remoteCalls 0, modelCalls 0.

import { buildBoundReadingEvidenceViewModel } from "../../../../../../ai/runtime/offline-team/xiv-bound-reading-evidence-view-model";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-304-v1",
      reason: `pathway evidence packet text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Bound-reading pathway evidence refused — HUMAN DECISION REQUIRED",
        bodyText: "The packet was not parseable JSON. Nothing was rendered from it.",
        operatorNote: "Refused. Deliver the exact packet the REAL 12D-279 door produced.",
      },
    });
  }
  return Response.json(buildBoundReadingEvidenceViewModel(parsed));
}