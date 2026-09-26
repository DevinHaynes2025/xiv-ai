import {
  createHash,
} from "node:crypto";

import type {
  XviCodingResponseInspection,
} from "./xvi-coding-response-inspector";

import {
  verifyXviCodingResponseInspection,
} from "./xvi-coding-response-inspector";

export interface XviCodingFileProposal {
  readonly path: string;
  readonly expectedContentDigest: string;
  readonly replacementContent: string;
}

export interface XviCodingPatchProposal {
  readonly version:
    "xvi-coding-patch-proposal-v1";

  readonly workId: string;
  readonly missionId: string;

  readonly sourceInspectionDigest: string;

  readonly files:
    readonly Readonly<XviCodingFileProposal>[];

  readonly proposalDigest: string;

  readonly filesystemMutationPerformed: false;
  readonly shellExecutionPerformed: false;
  readonly testsExecuted: false;

  readonly automaticPushAllowed: false;
  readonly automaticMergeAllowed: false;
  readonly automaticDeployAllowed: false;

  readonly humanApprovalRequired: true;
}

const SHA256 =
  /^[a-f0-9]{64}$/;

const PATH =
  /^[A-Za-z0-9._/-]+$/;

const refuse = (
  reason: string,
): never => {
  throw new Error(
    `XVI_CODING_PATCH_PROPOSAL_REFUSED: ${reason}`,
  );
};

function validatePath(
  path: unknown,
): string {
  if (
    typeof path !== "string" ||
    path.length < 1 ||
    path.length > 512 ||
    path !== path.trim() ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("..") ||
    !PATH.test(path)
  ) {
    refuse(
      "invalid proposed path",
    );
  }

  return path;
}

export function createXviCodingPatchProposal(input: {
  readonly inspection:
    Readonly<XviCodingResponseInspection>;

  readonly permittedPaths:
    readonly string[];

  readonly files:
    readonly {
      readonly path: string;
      readonly expectedContentDigest: string;
      readonly replacementContent: string;
    }[];
}): Readonly<XviCodingPatchProposal> {
  const inspection =
    input.inspection;

  if (
    !verifyXviCodingResponseInspection(
      inspection,
    )
  ) {
    refuse(
      "inspection cryptographic verification failed",
    );
  }

  if (
    inspection.version !==
      "xvi-coding-response-inspection-v1" ||

    inspection.disposition !==
      "PROPOSAL_ACCEPTED" ||

    !SHA256.test(
      inspection.inspectionDigest,
    ) ||

    inspection.executableAuthorityGranted !== false ||
    inspection.filesystemAuthorityGranted !== false ||
    inspection.shellAuthorityGranted !== false ||
    inspection.credentialAuthorityGranted !== false ||
    inspection.pushAuthorityGranted !== false ||
    inspection.deploymentAuthorityGranted !== false
  ) {
    refuse(
      "inspection not eligible for patch proposal",
    );
  }

  if (
    !Array.isArray(
      input.permittedPaths,
    ) ||
    input.permittedPaths.length < 1 ||
    input.permittedPaths.length > 128
  ) {
    refuse(
      "invalid permitted paths",
    );
  }

  const permitted =
    new Set(
      input.permittedPaths.map(
        validatePath,
      ),
    );

  if (
    permitted.size !==
      input.permittedPaths.length
  ) {
    refuse(
      "duplicate permitted path",
    );
  }

  if (
    !Array.isArray(input.files) ||
    input.files.length < 1 ||
    input.files.length > 16
  ) {
    refuse(
      "invalid proposal file count",
    );
  }

  let totalBytes =
    0;

  const seen =
    new Set<string>();

  const files =
    input.files.map(
      file => {
        const path =
          validatePath(
            file.path,
          );

        if (
          !permitted.has(path)
        ) {
          refuse(
            "proposal path outside mission",
          );
        }

        if (
          seen.has(path)
        ) {
          refuse(
            "duplicate proposal path",
          );
        }

        seen.add(path);

        if (
          !SHA256.test(
            file.expectedContentDigest,
          )
        ) {
          refuse(
            "invalid expected content digest",
          );
        }

        if (
          typeof file.replacementContent !==
            "string" ||
          file.replacementContent.includes(
            "\u0000",
          )
        ) {
          refuse(
            "invalid replacement content",
          );
        }

        const bytes =
          Buffer.byteLength(
            file.replacementContent,
            "utf8",
          );

        if (
          bytes > 256 * 1024
        ) {
          refuse(
            "individual replacement too large",
          );
        }

        totalBytes +=
          bytes;

        if (
          totalBytes >
            512 * 1024
        ) {
          refuse(
            "proposal exceeds total byte budget",
          );
        }

        return Object.freeze({
          path,

          expectedContentDigest:
            file.expectedContentDigest,

          replacementContent:
            file.replacementContent,
        });
      },
    );

  const frozenFiles =
    Object.freeze([
      ...files,
    ]);

  const canonical =
    JSON.stringify([
      "xvi-coding-patch-proposal-v1",

      inspection.workId,
      inspection.missionId,

      inspection.inspectionDigest,

      frozenFiles,
    ]);

  const proposalDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return Object.freeze({
    version:
      "xvi-coding-patch-proposal-v1" as const,

    workId:
      inspection.workId,

    missionId:
      inspection.missionId,

    sourceInspectionDigest:
      inspection.inspectionDigest,

    files:
      frozenFiles,

    proposalDigest,

    filesystemMutationPerformed:
      false as const,

    shellExecutionPerformed:
      false as const,

    testsExecuted:
      false as const,

    automaticPushAllowed:
      false as const,

    automaticMergeAllowed:
      false as const,

    automaticDeployAllowed:
      false as const,

    humanApprovalRequired:
      true as const,
  });
}
