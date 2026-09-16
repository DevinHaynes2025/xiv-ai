// 12D-274 — the LOCAL document-ingest endpoint of the story shell. The
// browser sends the raw document submission (tenantId, documentId, title,
// bodyText); this handler runs the fail-closed ingest contract in the
// LOCAL server process and returns ONLY the frozen result: the document
// digest, the measured chunk count, and the bounded ORDINARY reading
// stories the REAL queue will admit. A refused submission (oversized
// document, credential-shaped content, malformed shape) returns an honest
// REFUSED with zero document content. No persistence, no queue access, no
// remote calls: remoteCalls 0, modelCalls 0. Admission into the queue
// happens elsewhere, through the REAL queue contract; review stays human;
// the ledger is ledgered-never-activated.

import { prepareDocumentStories } from "../../../../../../ai/runtime/offline-team/xiv-document-ingest";

export async function POST(request: Request) {
  const raw = await request.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-274-v1",
      reason: `document submission text is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      display: {
        headline: "Document ingest refused — HUMAN DECISION REQUIRED",
        bodyText: "The submission was not parseable JSON. Nothing was prepared from it.",
        operatorNote: "Refused. Deliver { tenantId, documentId, title, bodyText } exactly, in that key order.",
      },
    });
  }
  try {
    const result = prepareDocumentStories(parsed);
    // Project to story REFERENCES only — the panel never receives the
    // objectives back (they quote the document text; the browser already
    // has it, but the render is by reference, never a re-dump).
    const storyRefs = result.stories.map((s) => ({
      id: s.id,
      objectiveLength: s.objective.length,
    }));
    return Response.json({
      kind: "PREPARED",
      policyVersion: result.policyVersion,
      documentId: result.documentId,
      tenantId: result.tenantId,
      documentDigestSha256: result.documentDigestSha256,
      chunkCount: result.chunkCount,
      stories: storyRefs,
    });
  } catch (err) {
    return Response.json({
      kind: "REFUSED",
      policyVersion: "12d-274-v1",
      reason: err instanceof Error ? err.message : String(err),
      display: {
        headline: "Document ingest refused — HUMAN DECISION REQUIRED",
        bodyText: "The document submission failed the ingest contract and was NOT prepared. Nothing was produced from it — no stories, no digest. The document is never truncated; chunk it deliberately.",
        operatorNote: "Refused. Fix the stated anomaly and resubmit, or chunk the document deliberately first.",
      },
    });
  }
}