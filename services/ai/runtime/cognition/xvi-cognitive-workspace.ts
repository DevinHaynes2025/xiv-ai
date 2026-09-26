import type { XviBrainId } from "./xvi-cognitive-brain-registry";
import {
  getXviModelForBrain,
  type XviModelFamily,
} from "./xvi-model-fabric";

export type XviBrainWorkPacket = Readonly<{
  packetId: string;
  missionId: string;
  brain: XviBrainId;
  modelFamily: XviModelFamily;

  dependsOn: readonly string[];

  evidenceRefs: readonly string[];
  assumptionRefs: readonly string[];
  contradictionRefs: readonly string[];

  authority: "NONE";
}>;

export type XviCognitiveWorkspace = Readonly<{
  missionId: string;

  packets: readonly XviBrainWorkPacket[];

  securityRequired: boolean;
  verificationRequired: true;

  executionPermitted: false;
  authority: "NONE";
}>;

function requireNonEmpty(
  value: string,
  field: string,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} must be non-empty`);
  }

  return normalized;
}

function uniqueNonEmpty(
  values: readonly string[],
): readonly string[] {
  return Object.freeze(
    [
      ...new Set(
        values
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ],
  );
}

export function createXviBrainWorkPacket(input: {
  packetId: string;
  missionId: string;
  brain: XviBrainId;
  dependsOn?: readonly string[];
  evidenceRefs?: readonly string[];
  assumptionRefs?: readonly string[];
  contradictionRefs?: readonly string[];
}): XviBrainWorkPacket {
  const model = getXviModelForBrain(input.brain);

  return Object.freeze({
    packetId: requireNonEmpty(
      input.packetId,
      "packetId",
    ),

    missionId: requireNonEmpty(
      input.missionId,
      "missionId",
    ),

    brain: input.brain,
    modelFamily: model.modelFamily,

    dependsOn: uniqueNonEmpty(
      input.dependsOn ?? [],
    ),

    evidenceRefs: uniqueNonEmpty(
      input.evidenceRefs ?? [],
    ),

    assumptionRefs: uniqueNonEmpty(
      input.assumptionRefs ?? [],
    ),

    contradictionRefs: uniqueNonEmpty(
      input.contradictionRefs ?? [],
    ),

    authority: "NONE",
  });
}

function assertUniquePacketIds(
  packets: readonly XviBrainWorkPacket[],
): void {
  const ids = packets.map(
    (packet) => packet.packetId,
  );

  if (new Set(ids).size !== ids.length) {
    throw new Error(
      "workspace packet IDs must be unique",
    );
  }
}

function assertMissionBinding(
  missionId: string,
  packets: readonly XviBrainWorkPacket[],
): void {
  for (const packet of packets) {
    if (packet.missionId !== missionId) {
      throw new Error(
        `packet ${packet.packetId} belongs to another mission`,
      );
    }
  }
}

function assertDependenciesExist(
  packets: readonly XviBrainWorkPacket[],
): void {
  const packetIds = new Set(
    packets.map(
      (packet) => packet.packetId,
    ),
  );

  for (const packet of packets) {
    for (const dependency of packet.dependsOn) {
      if (!packetIds.has(dependency)) {
        throw new Error(
          `unknown packet dependency: ${dependency}`,
        );
      }

      if (dependency === packet.packetId) {
        throw new Error(
          `packet cannot depend on itself: ${packet.packetId}`,
        );
      }
    }
  }
}

function assertVerificationLast(
  packets: readonly XviBrainWorkPacket[],
): void {
  const verificationIndexes = packets
    .map((packet, index) => ({
      packet,
      index,
    }))
    .filter(
      ({ packet }) =>
        packet.brain === "VERIFICATION",
    );

  if (verificationIndexes.length === 0) {
    throw new Error(
      "workspace requires a VERIFICATION packet",
    );
  }

  const finalIndex = packets.length - 1;

  if (
    verificationIndexes.some(
      ({ index }) => index !== finalIndex,
    )
  ) {
    throw new Error(
      "VERIFICATION packet must be final",
    );
  }
}

export function createXviCognitiveWorkspace(input: {
  missionId: string;
  packets: readonly XviBrainWorkPacket[];
  securityRequired?: boolean;
}): XviCognitiveWorkspace {
  const missionId = requireNonEmpty(
    input.missionId,
    "missionId",
  );

  if (input.packets.length === 0) {
    throw new Error(
      "workspace requires at least one packet",
    );
  }

  assertUniquePacketIds(input.packets);

  assertMissionBinding(
    missionId,
    input.packets,
  );

  assertDependenciesExist(
    input.packets,
  );

  assertVerificationLast(
    input.packets,
  );

  if (
    input.securityRequired === true &&
    !input.packets.some(
      (packet) =>
        packet.brain === "SECURITY",
    )
  ) {
    throw new Error(
      "security-required workspace needs a SECURITY packet",
    );
  }

  return Object.freeze({
    missionId,

    packets: Object.freeze([
      ...input.packets,
    ]),

    securityRequired:
      input.securityRequired ?? false,

    verificationRequired: true,

    executionPermitted: false,

    authority: "NONE",
  });
}
