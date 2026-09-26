import assert from "node:assert/strict";
import test from "node:test";
import {
  mkdtempSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  XviDurableAdoptionCoordinator,
} from "./xvi-durable-adoption-coordinator";

import {
  applyXviReceiptBoundRecovery,
  createXviRecoveryEvidenceReceipt,
  verifyXviRecoveryEvidenceReceipt,
} from "./xvi-recovery-evidence-integrity";

function withReserved(
  fn: (
    coordinator:
      XviDurableAdoptionCoordinator,
    replayKey: string,
  ) => void,
): void {
  const dir =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate27-",
      ),
    );

  const path =
    join(
      dir,
      "gate27.sqlite",
    );

  const replayKey =
    "7".repeat(64);

  XviDurableAdoptionCoordinator
    .initialize(path);

  const coordinator =
    new XviDurableAdoptionCoordinator(
      path,
    );

  try {
    coordinator.reserve(
      replayKey,
      1_000,
    );

    fn(
      coordinator,
      replayKey,
    );
  } finally {
    coordinator.close();

    rmSync(
      dir,
      {
        recursive: true,
        force: true,
      },
    );
  }
}

test(
  "completed evidence receipt binds canonical record digest",
  () => {
    withReserved(
      (
        coordinator,
        replayKey,
      ) => {
        const evidence = {
          conclusion:
            "ADOPTION_COMPLETED" as const,
          adoptionRecordCanonicalJson:
            "canonical-record-v1",
        };

        const receipt =
          createXviRecoveryEvidenceReceipt({
            coordinator,
            replayKey,
            evidence,
            evidenceAtMs:
              1_500,
          });

        assert.match(
          receipt.adoptionRecordDigest!,
          /^[0-9a-f]{64}$/,
        );

        assert.match(
          receipt.receiptDigest,
          /^[0-9a-f]{64}$/,
        );

        verifyXviRecoveryEvidenceReceipt({
          coordinator,
          receipt,
          evidence,
        });
      },
    );
  },
);

test(
  "changed completed evidence is refused",
  () => {
    withReserved(
      (
        coordinator,
        replayKey,
      ) => {
        const original = {
          conclusion:
            "ADOPTION_COMPLETED" as const,
          adoptionRecordCanonicalJson:
            "canonical-record-v1",
        };

        const receipt =
          createXviRecoveryEvidenceReceipt({
            coordinator,
            replayKey,
            evidence:
              original,
            evidenceAtMs:
              1_500,
          });

        assert.throws(
          () =>
            verifyXviRecoveryEvidenceReceipt({
              coordinator,
              receipt,
              evidence: {
                conclusion:
                  "ADOPTION_COMPLETED",
                adoptionRecordCanonicalJson:
                  "canonical-record-v2",
              },
            }),
          /digest changed/,
        );
      },
    );
  },
);

test(
  "changed evidence conclusion is refused",
  () => {
    withReserved(
      (
        coordinator,
        replayKey,
      ) => {
        const receipt =
          createXviRecoveryEvidenceReceipt({
            coordinator,
            replayKey,
            evidence: {
              conclusion:
                "AMBIGUOUS",
            },
            evidenceAtMs:
              1_500,
          });

        assert.throws(
          () =>
            verifyXviRecoveryEvidenceReceipt({
              coordinator,
              receipt,
              evidence: {
                conclusion:
                  "ADOPTION_NOT_COMPLETED",
              },
            }),
          /conclusion changed/,
        );
      },
    );
  },
);

test(
  "receipt-bound completed recovery commits only after review",
  () => {
    withReserved(
      (
        coordinator,
        replayKey,
      ) => {
        const evidence = {
          conclusion:
            "ADOPTION_COMPLETED" as const,
          adoptionRecordCanonicalJson:
            "canonical-record-v1",
        };

        const receipt =
          createXviRecoveryEvidenceReceipt({
            coordinator,
            replayKey,
            evidence,
            evidenceAtMs:
              1_500,
          });

        const rejected =
          applyXviReceiptBoundRecovery({
            coordinator,
            receipt,
            evidence,
            reviewedDecision:
              "REJECT",
            nowMs:
              2_000,
          });

        assert.equal(
          rejected.outcome,
          "REMAIN_RESERVED",
        );

        const approved =
          applyXviReceiptBoundRecovery({
            coordinator,
            receipt,
            evidence,
            reviewedDecision:
              "APPROVE",
            nowMs:
              2_100,
          });

        assert.equal(
          approved.outcome,
          "COMMITTED",
        );

        assert.equal(
          coordinator
            .assess(replayKey)
            .state,
          "COMMITTED",
        );
      },
    );
  },
);

test(
  "receipt-bound not-completed recovery aborts only after review",
  () => {
    withReserved(
      (
        coordinator,
        replayKey,
      ) => {
        const evidence = {
          conclusion:
            "ADOPTION_NOT_COMPLETED" as const,
        };

        const receipt =
          createXviRecoveryEvidenceReceipt({
            coordinator,
            replayKey,
            evidence,
            evidenceAtMs:
              1_500,
          });

        const result =
          applyXviReceiptBoundRecovery({
            coordinator,
            receipt,
            evidence,
            reviewedDecision:
              "APPROVE",
            nowMs:
              2_000,
          });

        assert.equal(
          result.outcome,
          "ABORTED",
        );

        assert.equal(
          coordinator
            .assess(replayKey)
            .state,
          "ABORTED",
        );
      },
    );
  },
);

test(
  "ambiguous receipt can never mutate reserved lineage",
  () => {
    withReserved(
      (
        coordinator,
        replayKey,
      ) => {
        const evidence = {
          conclusion:
            "AMBIGUOUS" as const,
        };

        const receipt =
          createXviRecoveryEvidenceReceipt({
            coordinator,
            replayKey,
            evidence,
            evidenceAtMs:
              1_500,
          });

        const result =
          applyXviReceiptBoundRecovery({
            coordinator,
            receipt,
            evidence,
            reviewedDecision:
              "APPROVE",
            nowMs:
              2_000,
          });

        assert.equal(
          result.outcome,
          "REMAIN_RESERVED",
        );

        assert.equal(
          coordinator
            .assess(replayKey)
            .state,
          "RESERVED",
        );
      },
    );
  },
);

test(
  "receipt cannot be replayed after lineage resolution",
  () => {
    withReserved(
      (
        coordinator,
        replayKey,
      ) => {
        const evidence = {
          conclusion:
            "ADOPTION_NOT_COMPLETED" as const,
        };

        const receipt =
          createXviRecoveryEvidenceReceipt({
            coordinator,
            replayKey,
            evidence,
            evidenceAtMs:
              1_500,
          });

        applyXviReceiptBoundRecovery({
          coordinator,
          receipt,
          evidence,
          reviewedDecision:
            "APPROVE",
          nowMs:
            2_000,
        });

        assert.throws(
          () =>
            applyXviReceiptBoundRecovery({
              coordinator,
              receipt,
              evidence,
              reviewedDecision:
                "APPROVE",
              nowMs:
                2_100,
            }),
          /no longer targets a RESERVED lineage/,
        );
      },
    );
  },
);
