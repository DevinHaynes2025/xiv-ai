// XIV OS Story Shell — the fail-closed front-end contract demo (12D-255).
//
// This page is a LOCAL prototype surface. It renders ONLY what the 12D-254
// view model returns: a packet is fully verified (12D-242 wire digest,
// exact keys, pinned guardrails) before a single byte of its content is
// shown, and a refused packet renders a refusal that carries ZERO packet
// content. There is NO approve control anywhere on this page — decisions
// happen in the custody stack (12D-247), never through the shell.
//
// The two panels below are clearly-labeled EXAMPLES built deterministically
// at render time (fixed timestamps, no randomness, no clock): one packet
// that verifies, and the same packet with one tampered field that refuses.
// No remote calls anywhere: remoteCalls 0, modelCalls 0.

import { buildStoryShellViewModel } from "../../../ai/runtime/offline-team/xiv-story-shell-view-model";
import {
  buildStoryShellPacket,
  type StoryShellPacket,
} from "../../../ai/runtime/offline-team/xiv-os-wire-contract";
import PacketPanel from "./packet-panel";
import IngestPanel from "./ingest-panel";
import VerdictPanel from "./verdict-panel";
import CustodyDecisionPanel from "./custody-panel";
import EscrowPanel from "./escrow-panel";
import PathwayApprovalPanel from "./pathway-panel";
import PathwayCensusPanel from "./census-panel";
import CustodyJournalCensusPanel from "./journal-census-panel";
import QueueCensusPanel from "./queue-census-panel";
import DocumentIngestPanel from "./document-ingest-panel";
import ProvenancePanel from "./provenance-panel";
import PathwayEvidencePanel from "./pathway-evidence-panel";
import AssistantMemoryPanel from "./assistant-memory-panel";
import RegisterCensusPanel from "./register-census-panel";
import DatasetMetadataPanel from "./dataset-metadata-panel";
import DatasetCsvPanel from "./dataset-csv-panel";
import DraftReceiptPanel from "./draft-receipt-panel";
import AssistantTurnPanel from "./assistant-turn-panel";
import AssistantConversationPanel from "./assistant-conversation-panel";
import AssistantMemoryConversationPanel from "./assistant-memory-conversation-panel";
import AssistantMemoryTurnPanel from "./assistant-memory-turn-panel";
import AssistantMemoryCitedTurnPanel from "./assistant-memory-cited-turn-panel";
import AssistantMemoryCitedConversationPanel from "./assistant-memory-cited-conversation-panel";
import CitationVerifyPanel from "./citation-verify-panel";
import ConversationSummaryPanel from "./conversation-summary-panel";
import SourceStalenessPanel from "./source-staleness-panel";
import StaleReingestPanel from "./stale-reingest-panel";

// Deterministic example fixtures — fixed generatedAtMs, no Date.now(), no
// randomness. These are PROTOTYPE examples, never real decisions.
const EXAMPLE_HEADLINE = "Example: avatar reports a completed local story";
const examplePacket: StoryShellPacket = buildStoryShellPacket({
  storyId: "12d-255-story-shell-example-packet",
  headline: EXAMPLE_HEADLINE,
  bodyText:
    "This is an EXAMPLE packet rendered to demonstrate the fail-closed shell. It is not a live decision surface and carries no operator authority.",
  generatedAtMs: 1_000_000,
  avatar: null,
  decidingOver:
    "whether the example story may proceed to operator review in the custody stack",
});

// The SAME packet with one field edited in flight — the digest re-derivation
// must refuse it, and the refusal must render NOTHING from the packet.
const tamperedPacket = {
  ...examplePacket,
  headline: "Tampered: headline edited in flight",
} as unknown as StoryShellPacket;

const verifiedVm = buildStoryShellViewModel(
  JSON.parse(JSON.stringify(examplePacket)),
);
const refusedVm = buildStoryShellViewModel(
  JSON.parse(JSON.stringify(tamperedPacket)),
);

export default function StoryShellPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <header>
        <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
          XIV AI OS · Story Shell
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Fail-closed packet surface
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
          Every packet on this page passed (or failed) full wire verification
          before rendering: digest re-derivation, exact keys, pinned
          guardrails. Ingest your own packet below, or study the deterministic
          examples. A tampered packet renders a refusal — never a partial
          render, and a refusal's content never leaves the verifying process.
          There is no approve control on this page by construction:
          decisions happen in the custody stack, never through the shell.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        <VerdictPanel />
        <CustodyDecisionPanel />
        <EscrowPanel />
        <PathwayApprovalPanel />
        <PathwayCensusPanel />
        <CustodyJournalCensusPanel />
        <QueueCensusPanel />
        <DocumentIngestPanel />
        <ProvenancePanel />
        <PathwayEvidencePanel />
        <AssistantMemoryPanel />
        <RegisterCensusPanel />
        <DatasetMetadataPanel />
        <DatasetCsvPanel />
        <DraftReceiptPanel />
        <AssistantTurnPanel />
        <AssistantConversationPanel />
        <AssistantMemoryConversationPanel />
        <AssistantMemoryTurnPanel />
        <AssistantMemoryCitedTurnPanel />
        <AssistantMemoryCitedConversationPanel />
        <CitationVerifyPanel />
        <ConversationSummaryPanel />
        <SourceStalenessPanel />
        <StaleReingestPanel />
        <IngestPanel />
        <PacketPanel label="Example A — intact packet" vm={verifiedVm} />
        <PacketPanel label="Example B — tampered packet" vm={refusedVm} />
      </div>

      <footer className="mt-10 border-t border-neutral-200 pt-4 font-mono text-xs leading-5 text-neutral-500 dark:border-neutral-800 dark:text-neutral-500">
        <p>
          honest flags · humanDecision: REQUIRED · remoteCalls: 0 ·
          modelCalls: 0 · learningPromoted: false · billionUsersProven: false
        </p>
        <p className="mt-1">
          local-plane prototype · no deployment · CI not claimed
          (ci_quota_exceeded) · examples are deterministic fixtures, not live
          data
        </p>
      </footer>
    </main>
  );
}