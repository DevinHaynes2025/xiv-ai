import {
  createHash,
} from "node:crypto";

import type {
  XviCodingResumeIntegrityReceipt,
} from "./xvi-coding-resume-integrity";

export interface XviCodingResumeConsumptionReceipt {
  readonly version:
    "xvi-coding-resume-consumption-v1";

  readonly missionId: string;
  readonly integrityDigest: string;
  readonly replayNonce: string;

  readonly consumedAtMs: number;

  readonly consumptionDigest: string;

  readonly consumedExactlyOnce: true;

  readonly remoteWriteAuthority: false;
  readonly deploymentAuthority: false;
  readonly credentialAuthority: false;
  readonly productionAuthority: false;
}

export const XVI_CODING_RESUME_REPLAY_POLICY =
  Object.freeze({
    consumeExactlyOnce: true,

    remoteWriteAuthority: false,
    deploymentAuthority: false,
    credentialAuthority: false,
    productionAuthority: false,
  });

const SHA256 =
  /^[a-f0-9]{64}$/;

const NONCE =
  /^[A-Za-z0-9][A-Za-z0-9_.:@/-]{15,127}$/;

const refuse = (): never => {
  throw new Error(
    "XVI_CODING_RESUME_REPLAY_REFUSED",
  );
};

function verifyIntegrityReceipt(
  receipt:
    Readonly<XviCodingResumeIntegrityReceipt>,
): void {
  if (
    receipt.version !==
      "xvi-coding-resume-integrity-v1" ||

    receipt.resumeIntegrityVerified !==
      true ||

    receipt.localMutationEligible !==
      true ||

    receipt.remoteWriteAuthority !==
      false ||

    receipt.deploymentAuthority !==
      false ||

    receipt.credentialAuthority !==
      false ||

    receipt.productionAuthority !==
      false ||

    !SHA256.test(
      receipt.integrityDigest,
    ) ||

    !NONCE.test(
      receipt.replayNonce,
    )
  ) {
    refuse();
  }
}

export class XviCodingResumeReplayLedger {
  readonly #consumed =
    new Map<
      string,
      Readonly<XviCodingResumeConsumptionReceipt>
    >();

  consume(input: {
    readonly integrity:
      Readonly<XviCodingResumeIntegrityReceipt>;

    readonly consumedAtMs: number;
  }): Readonly<XviCodingResumeConsumptionReceipt> {
    if (
      input === null ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      Object.getPrototypeOf(input) !==
        Object.prototype
    ) {
      refuse();
    }

    const descriptors =
      Object.getOwnPropertyDescriptors(
        input,
      );

    const keys =
      Reflect.ownKeys(input);

    if (
      keys.length !== 2 ||
      !keys.includes("integrity") ||
      !keys.includes("consumedAtMs")
    ) {
      refuse();
    }

    for (
      const key of [
        "integrity",
        "consumedAtMs",
      ]
    ) {
      const descriptor =
        descriptors[key];

      if (
        !descriptor ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        refuse();
      }
    }

    const integrity =
      descriptors.integrity.value as
        Readonly<XviCodingResumeIntegrityReceipt>;

    verifyIntegrityReceipt(
      integrity,
    );

    const consumedAtMs =
      descriptors.consumedAtMs.value;

    if (
      !Number.isSafeInteger(
        consumedAtMs,
      ) ||
      consumedAtMs <
        integrity.observedAtMs
    ) {
      refuse();
    }

    const replayKey =
      [
        integrity.missionId,
        integrity.replayNonce,
      ].join(":");

    if (
      this.#consumed.has(
        replayKey,
      )
    ) {
      refuse();
    }

    const canonical =
      JSON.stringify([
        "xvi-coding-resume-consumption-v1",

        integrity.missionId,
        integrity.integrityDigest,
        integrity.replayNonce,

        consumedAtMs,
      ]);

    const consumptionDigest =
      createHash("sha256")
        .update(canonical)
        .digest("hex");

    const receipt =
      Object.freeze({
        version:
          "xvi-coding-resume-consumption-v1" as const,

        missionId:
          integrity.missionId,

        integrityDigest:
          integrity.integrityDigest,

        replayNonce:
          integrity.replayNonce,

        consumedAtMs,

        consumptionDigest,

        consumedExactlyOnce:
          true as const,

        remoteWriteAuthority:
          false as const,

        deploymentAuthority:
          false as const,

        credentialAuthority:
          false as const,

        productionAuthority:
          false as const,
      });

    this.#consumed.set(
      replayKey,
      receipt,
    );

    return receipt;
  }

  hasConsumed(
    missionId: string,
    replayNonce: string,
  ): boolean {
    return this.#consumed.has(
      `${missionId}:${replayNonce}`,
    );
  }

  get size(): number {
    return this.#consumed.size;
  }
}
