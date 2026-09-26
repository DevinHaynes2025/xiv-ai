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
  applyReviewedXviDurableAdoptionRecovery,
  proposeXviDurableAdoptionRecovery,
} from "./xvi-durable-adoption-recovery";

function withDb(
  fn: (
    path: string,
    replayKey: string,
  ) => void,
): void {
  const dir =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate26-",
      ),
    );

  const path =
    join(
      dir,
      "recovery.sqlite",
    );

  const replayKey =
    "8".repeat(64);

  try {
    fn(
      path,
      replayKey,
    );
  } finally {
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
  "recovery descriptor exposes persisted reservation identity after restart",
  () => {
    withDb(
      (
        path,
        replayKey,
      ) => {
        XviDurableAdoptionCoordinator
          .initialize(path);

        const first =
          new XviDurableAdoptionCoordinator(
            path,
          );

        const reservation =
          first.reserve(
            replayKey,
            1_000,
          );

        first.close();

        const reopened =
          new XviDurableAdoptionCoordinator(
            path,
          );

        try {
          const descriptor =
            reopened.recoveryDescriptor(
              replayKey,
            );

          assert.equal(
            descriptor.state,
            "RESERVED",
          );

          assert.equal(
            descriptor.reservationId,
            reservation.reservationId,
          );

          assert.equal(
            descriptor.recoveryRequired,
            true,
          );

          assert.equal(
            descriptor.automaticRetryAllowed,
            false,
          );
        } finally {
          reopened.close();
        }
      },
    );
  },
);

test(
  "ambiguous evidence remains reserved",
  () => {
    withDb(
      (
        path,
        replayKey,
      ) => {
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

          const proposal =
            proposeXviDurableAdoptionRecovery({
              coordinator,
              replayKey,
              evidence: {
                conclusion:
                  "AMBIGUOUS",
              },
            });

          assert.equal(
            proposal.proposedResolution,
            "REMAIN_RESERVED",
          );

          const result =
            applyReviewedXviDurableAdoptionRecovery({
              coordinator,
              proposal,
              reviewedDecision:
                "APPROVE",
              evidence: {
                conclusion:
                  "AMBIGUOUS",
              },
              nowMs:
                2_000,
            });

          assert.equal(
            result.outcome,
            "REMAIN_RESERVED",
          );

          assert.equal(
            coordinator.assess(
              replayKey,
            ).state,
            "RESERVED",
          );
        } finally {
          coordinator.close();
        }
      },
    );
  },
);

test(
  "reviewed completed evidence commits recovered reservation",
  () => {
    withDb(
      (
        path,
        replayKey,
      ) => {
        XviDurableAdoptionCoordinator
          .initialize(path);

        const first =
          new XviDurableAdoptionCoordinator(
            path,
          );

        first.reserve(
          replayKey,
          1_000,
        );

        first.close();

        const coordinator =
          new XviDurableAdoptionCoordinator(
            path,
          );

        try {
          const evidence = {
            conclusion:
              "ADOPTION_COMPLETED" as const,
            adoptionRecordCanonicalJson:
              "canonical-recovery-record",
          };

          const proposal =
            proposeXviDurableAdoptionRecovery({
              coordinator,
              replayKey,
              evidence,
            });

          assert.equal(
            proposal.proposedResolution,
            "COMMIT",
          );

          const result =
            applyReviewedXviDurableAdoptionRecovery({
              coordinator,
              proposal,
              reviewedDecision:
                "APPROVE",
              evidence,
              nowMs:
                2_000,
            });

          assert.equal(
            result.outcome,
            "COMMITTED",
          );

          assert.equal(
            coordinator.assess(
              replayKey,
            ).state,
            "COMMITTED",
          );
        } finally {
          coordinator.close();
        }
      },
    );
  },
);

test(
  "reviewed not-completed evidence aborts recovered reservation",
  () => {
    withDb(
      (
        path,
        replayKey,
      ) => {
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

          const evidence = {
            conclusion:
              "ADOPTION_NOT_COMPLETED" as const,
          };

          const proposal =
            proposeXviDurableAdoptionRecovery({
              coordinator,
              replayKey,
              evidence,
            });

          assert.equal(
            proposal.proposedResolution,
            "ABORT",
          );

          const result =
            applyReviewedXviDurableAdoptionRecovery({
              coordinator,
              proposal,
              reviewedDecision:
                "APPROVE",
              evidence,
              nowMs:
                2_000,
            });

          assert.equal(
            result.outcome,
            "ABORTED",
          );

          assert.equal(
            coordinator.assess(
              replayKey,
            ).state,
            "ABORTED",
          );
        } finally {
          coordinator.close();
        }
      },
    );
  },
);

test(
  "rejected review changes nothing",
  () => {
    withDb(
      (
        path,
        replayKey,
      ) => {
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

          const evidence = {
            conclusion:
              "ADOPTION_NOT_COMPLETED" as const,
          };

          const proposal =
            proposeXviDurableAdoptionRecovery({
              coordinator,
              replayKey,
              evidence,
            });

          const result =
            applyReviewedXviDurableAdoptionRecovery({
              coordinator,
              proposal,
              reviewedDecision:
                "REJECT",
              evidence,
              nowMs:
                2_000,
            });

          assert.equal(
            result.outcome,
            "REMAIN_RESERVED",
          );

          assert.equal(
            coordinator.assess(
              replayKey,
            ).state,
            "RESERVED",
          );
        } finally {
          coordinator.close();
        }
      },
    );
  },
);

test(
  "non-reserved lineage cannot enter recovery",
  () => {
    withDb(
      (
        path,
        replayKey,
      ) => {
        XviDurableAdoptionCoordinator
          .initialize(path);

        const coordinator =
          new XviDurableAdoptionCoordinator(
            path,
          );

        try {
          assert.throws(
            () =>
              proposeXviDurableAdoptionRecovery({
                coordinator,
                replayKey,
                evidence: {
                  conclusion:
                    "AMBIGUOUS",
                },
              }),
            /requires a durable RESERVED lineage/,
          );
        } finally {
          coordinator.close();
        }
      },
    );
  },
);
