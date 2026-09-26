import type {
  XviBrainWorkPacket,
  XviCognitiveWorkspace,
} from "./xvi-cognitive-workspace";

export type XviScheduleWave = Readonly<{
  wave: number;
  packets: readonly XviBrainWorkPacket[];
}>;

export type XviCognitiveSchedule = Readonly<{
  missionId: string;
  waves: readonly XviScheduleWave[];
  packetCount: number;
  executionPermitted: false;
  authority: "NONE";
}>;

function sortPackets(
  packets: readonly XviBrainWorkPacket[],
): XviBrainWorkPacket[] {
  return [...packets].sort(
    (a, b) =>
      a.packetId.localeCompare(b.packetId),
  );
}

export function scheduleXviCognitiveWorkspace(
  workspace: XviCognitiveWorkspace,
): XviCognitiveSchedule {
  const remaining = new Map(
    workspace.packets.map(
      (packet) => [packet.packetId, packet],
    ),
  );

  const completed = new Set<string>();
  const waves: XviScheduleWave[] = [];

  while (remaining.size > 0) {
    const ready = sortPackets(
      [...remaining.values()].filter(
        (packet) =>
          packet.dependsOn.every(
            (dependency) =>
              completed.has(dependency),
          ),
      ),
    );

    if (ready.length === 0) {
      throw new Error(
        "cognitive workspace contains a dependency cycle",
      );
    }

    const verification = ready.filter(
      (packet) =>
        packet.brain === "VERIFICATION",
    );

    const ordinary = ready.filter(
      (packet) =>
        packet.brain !== "VERIFICATION",
    );

    // Verification cannot execute while any ordinary
    // packet remains unfinished.
    const selected =
      ordinary.length > 0
        ? ordinary
        : verification;

    if (selected.length === 0) {
      throw new Error(
        "scheduler could not select a safe wave",
      );
    }

    const wave = waves.length + 1;

    waves.push(
      Object.freeze({
        wave,
        packets: Object.freeze([
          ...selected,
        ]),
      }),
    );

    for (const packet of selected) {
      remaining.delete(packet.packetId);
      completed.add(packet.packetId);
    }
  }

  const finalWave = waves.at(-1);

  if (
    !finalWave ||
    finalWave.packets.length !== 1 ||
    finalWave.packets[0]?.brain !==
      "VERIFICATION"
  ) {
    throw new Error(
      "final cognitive wave must contain only VERIFICATION",
    );
  }

  return Object.freeze({
    missionId: workspace.missionId,
    waves: Object.freeze(waves),
    packetCount: workspace.packets.length,
    executionPermitted: false,
    authority: "NONE",
  });
}
