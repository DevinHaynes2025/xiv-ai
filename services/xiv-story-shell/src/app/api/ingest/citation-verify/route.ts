// 12D-314 — the LOCAL citation-verify endpoint of the story shell: the
// operator's EYE-VERIFICATION surface. The browser sends
// { draft, memoryPacket } — ANY draft text (e.g. a draft produced by the
// cited memory doors) plus the pasted REAL 12D-305 memory packet — and
// this handler runs the REAL 12D-314 card in the LOCAL server process:
// the packet is re-verified through the REAL 12D-306 gate, the draft's
// [mem:<storyId>] citations are extracted through the REAL 12D-310
// extractor and checked against the verified carried set. No model is
// called (modelCalls 0) — this is verification only; fabricated
// citations are disclosed BY ID and zero citations render honestly as
// UNGROUNDED. ONLY the frozen view model renders. Nothing is persisted.

import {
  prepareCitationVerifyCard, buildCitationVerifyCardPacket,
} from "../../../../../../ai/runtime/offline-team/xiv-citation-verify-card";
import { buildCitationVerifyCardViewModel } from "../../../../../../ai/runtime/offline-team/xiv-citation-verify-card-view-model";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      status: "REFUSED",
      kind: "CITATION_VERIFY_CARD",
      policyVersion: "12d-314-v1",
      reason: `citation verify card input is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      modelCalls: 0,
      remoteCalls: 0,
      activated: 0,
      learningPromoted: false,
      humanDecision: "REQUIRED",
    });
  }
  const prepared = prepareCitationVerifyCard(parsed);
  if (prepared.status !== "PREPARED") return Response.json(buildCitationVerifyCardViewModel(prepared));
  return Response.json(buildCitationVerifyCardViewModel(buildCitationVerifyCardPacket(prepared)));
}