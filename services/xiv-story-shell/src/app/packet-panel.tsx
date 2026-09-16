// The fail-closed packet panel shared by the 12D-255 example surface and the
// 12D-259 ingest surface. It renders ONLY a 12D-254 view model: VERIFIED
// packets render their decision surface for display; REFUSED packets render
// a refusal carrying zero packet content plus the verifier's diagnostics.
// Pure presentational — no state, no 'use client' directive needed (it is
// bundled into whichever module graph imports it). No approve control
// anywhere by construction: decisions happen in the custody stack (12D-247).

import type { StoryShellViewModel } from "../../../ai/runtime/offline-team/xiv-story-shell-view-model";

export default function PacketPanel(props: {
  readonly label: string;
  readonly vm: StoryShellViewModel;
}) {
  const { label, vm } = props;
  if (vm.kind === "REFUSED") {
    return (
      <section className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-5">
        <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">
          {label} · REFUSED
        </p>
        <h2 className="mt-2 text-lg font-semibold text-amber-800 dark:text-amber-200">
          {vm.display.headline}
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
          {vm.display.bodyText}
        </p>
        <p className="mt-3 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
          {vm.display.operatorNote}
        </p>
        <p className="mt-2 font-mono text-xs break-all text-neutral-500 dark:text-neutral-500">
          reason: {vm.reason}
        </p>
      </section>
    );
  }
  return (
    <section className="rounded-lg border border-neutral-300 bg-neutral-100 p-5 dark:border-neutral-700 dark:bg-neutral-900">
      <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
        {label} · VERIFIED
      </p>
      <h2 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {vm.display.headline}
      </h2>
      <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        {vm.display.bodyText}
      </p>
      <dl className="mt-4 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-400">
        <div>
          storyId: <span className="break-all">{vm.display.storyId}</span>
        </div>
        <div>
          packetId: <span className="break-all">{vm.packet.packetId}</span>
        </div>
        <div>decision: {vm.display.decisionKind}</div>
        <div>humanDecision: {vm.display.humanDecision}</div>
      </dl>
      <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">
        Deciding over: {vm.display.decidingOver}
      </p>
      <p className="mt-3 font-mono text-xs break-words text-neutral-600 dark:text-neutral-400">
        {vm.display.operatorNote}
      </p>
    </section>
  );
}