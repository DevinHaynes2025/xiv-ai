import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  rmSync,
} from "node:fs";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  XviDurableAdoptionCoordinator,
} from "./xvi-durable-adoption-coordinator";

function withCoordinator(
  fn: (
    path: string,
  ) => void,
): void {
  const dir =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate23-",
      ),
    );

  const path =
    join(
      dir,
      "adoption-coordinator.sqlite",
    );

  try {
    fn(path);
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

const replayKey =
  "a".repeat(64);

test(
  "available lineage may be atomically reserved",
  () => {
    withCoordinator(
      (path) => {
        XviDurableAdoptionCoordinator
          .initialize(path);

        const coordinator =
          new XviDurableAdoptionCoordinator(
            path,
          );

        try {
          const before =
            coordinator.assess(
              replayKey,
            );

          assert.equal(
            before.state,
            "AVAILABLE",
          );

          assert.equal(
            before.recoveryRequired,
            false,
          );

          const reservation =
            coordinator.reserve(
              replayKey,
              1_000,
            );

          assert.equal(
            reservation.state,
            "RESERVED",
          );

          assert.match(
            reservation.reservationId,
            /^[0-9a-f-]{36}$/,
          );

          assert.equal(
            reservation.executesNothing,
            true,
          );

          assert.equal(
            reservation.productionAuthority,
            false,
          );

          const after =
            coordinator.assess(
              replayKey,
            );

          assert.equal(
            after.state,
            "RESERVED",
          );

          assert.equal(
            after.recoveryRequired,
            true,
          );

          assert.equal(
            after.automaticRetryAllowed,
            false,
          );
        } finally {
          coordinator.close();
        }
      },
    );
  },
);

test(
  "reserved lineage survives restart and requires reviewed recovery",
  () => {
    withCoordinator(
      (path) => {
        XviDurableAdoptionCoordinator
          .initialize(path);

        const first =
          new XviDurableAdoptionCoordinator(
            path,
          );

        try {
          first.reserve(
            replayKey,
            1_000,
          );
        } finally {
          first.close();
        }

        const reopened =
          new XviDurableAdoptionCoordinator(
            path,
          );

        try {
          const assessment =
            reopened.assess(
              replayKey,
            );

          assert.equal(
            assessment.state,
            "RESERVED",
          );

          assert.equal(
            assessment.recoveryRequired,
            true,
          );

          assert.equal(
            assessment.automaticRetryAllowed,
            false,
          );

          assert.throws(
            () =>
              reopened.reserve(
                replayKey,
                2_000,
              ),
            /already reserved; recovery required/,
          );
        } finally {
          reopened.close();
        }
      },
    );
  },
);

test(
  "reserved lineage may commit exactly once",
  () => {
    withCoordinator(
      (path) => {
        XviDurableAdoptionCoordinator
          .initialize(path);

        const coordinator =
          new XviDurableAdoptionCoordinator(
            path,
          );

        try {
          const reservation =
            coordinator.reserve(
              replayKey,
              1_000,
            );

          const committed =
            coordinator.commit({
              replayKey,
              reservationId:
                reservation.reservationId,
              adoptionRecordCanonicalJson:
                JSON.stringify({
                  kind:
                    "INSTRUCTION_ADOPTION_RECORD",
                  instructionId:
                    "workflow:action",
                  executionStarted:
                    false,
                  productionMutationAllowed:
                    false,
                }),
              nowMs:
                2_000,
            });

          assert.equal(
            committed.state,
            "COMMITTED",
          );

          assert.match(
            committed.adoptionRecordDigest,
            /^[0-9a-f]{64}$/,
          );

          assert.equal(
            committed.executesNothing,
            true,
          );

          assert.equal(
            committed.productionAuthority,
            false,
          );

          const assessment =
            coordinator.assess(
              replayKey,
            );

          assert.equal(
            assessment.state,
            "COMMITTED",
          );

          assert.equal(
            assessment.recoveryRequired,
            false,
          );

          assert.throws(
            () =>
              coordinator.reserve(
                replayKey,
                3_000,
              ),
            /already committed; replay refused/,
          );
        } finally {
          coordinator.close();
        }
      },
    );
  },
);

test(
  "wrong reservation identity cannot commit",
  () => {
    withCoordinator(
      (path) => {
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

          assert.throws(
            () =>
              coordinator.commit({
                replayKey,
                reservationId:
                  "00000000-0000-4000-8000-000000000000",
                adoptionRecordCanonicalJson:
                  '{"kind":"INSTRUCTION_ADOPTION_RECORD"}',
                nowMs:
                  2_000,
              }),
            /reservation identity mismatch/,
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
  "reserved lineage may abort but is never automatically retried",
  () => {
    withCoordinator(
      (path) => {
        XviDurableAdoptionCoordinator
          .initialize(path);

        const coordinator =
          new XviDurableAdoptionCoordinator(
            path,
          );

        try {
          const reservation =
            coordinator.reserve(
              replayKey,
              1_000,
            );

          coordinator.abort({
            replayKey,
            reservationId:
              reservation.reservationId,
            nowMs:
              2_000,
          });

          const assessment =
            coordinator.assess(
              replayKey,
            );

          assert.equal(
            assessment.state,
            "ABORTED",
          );

          assert.equal(
            assessment.recoveryRequired,
            true,
          );

          assert.equal(
            assessment.automaticRetryAllowed,
            false,
          );

          assert.throws(
            () =>
              coordinator.reserve(
                replayKey,
                3_000,
              ),
            /explicit reviewed recovery required/,
          );
        } finally {
          coordinator.close();
        }
      },
    );
  },
);

test(
  "two coordinator instances cannot both reserve the same lineage",
  () => {
    withCoordinator(
      (path) => {
        XviDurableAdoptionCoordinator
          .initialize(path);

        const first =
          new XviDurableAdoptionCoordinator(
            path,
          );

        const second =
          new XviDurableAdoptionCoordinator(
            path,
          );

        try {
          first.reserve(
            replayKey,
            1_000,
          );

          assert.throws(
            () =>
              second.reserve(
                replayKey,
                1_001,
              ),
            /already reserved; recovery required/,
          );
        } finally {
          first.close();
          second.close();
        }
      },
    );
  },
);

test(
  "commit and abort timestamps cannot predate reservation",
  () => {
    withCoordinator(
      (path) => {
        XviDurableAdoptionCoordinator
          .initialize(path);

        const coordinator =
          new XviDurableAdoptionCoordinator(
            path,
          );

        try {
          const reservation =
            coordinator.reserve(
              replayKey,
              2_000,
            );

          assert.throws(
            () =>
              coordinator.commit({
                replayKey,
                reservationId:
                  reservation.reservationId,
                adoptionRecordCanonicalJson:
                  '{"kind":"INSTRUCTION_ADOPTION_RECORD"}',
                nowMs:
                  1_999,
              }),
            /commit predates reservation/,
          );

          assert.throws(
            () =>
              coordinator.abort({
                replayKey,
                reservationId:
                  reservation.reservationId,
                nowMs:
                  1_999,
              }),
            /abort predates reservation/,
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
