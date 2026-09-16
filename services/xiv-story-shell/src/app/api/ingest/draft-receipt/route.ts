// 12D-286 — the LOCAL draft-receipt endpoint of the story shell. The
// browser sends the raw draft receipt submission (tenantId, storyId,
// documentId, draftSha256, draftText, model); this handler runs the REAL
// 12D-285 pure receipt door in the LOCAL server process — the digest is
// re-derived from the submitted text, the credential-shaped-content gate
// re-applies, the 12D-280 draft budget holds — and returns ONLY a frozen
// view model that NEVER echoes the draft text. A refused submission's
// content (draft text, claimed digest, story/document ids) never crosses
// to the browser. The queue cross-check door stays runtime-side: this
// shell holds no queue and decides nothing. No persistence, no write
// path, no remote calls: remoteCalls 0, modelCalls 0.

import { buildReadingDraftReceiptViewModel } from "../../../../../../ai/runtime/offline-team/xiv-reading-draft-receipt-view-model";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-286-v1",
      reason: `draft receipt submission text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Reading draft receipt refused — HUMAN DECISION REQUIRED",
        bodyText: "The submission was not parseable JSON. Nothing was rendered from it.",
        operatorNote: "Refused. Deliver { tenantId, storyId, documentId, draftSha256, draftText, model } exactly, in that key order.",
      },
    });
  }
  return Response.json(buildReadingDraftReceiptViewModel(parsed));
}