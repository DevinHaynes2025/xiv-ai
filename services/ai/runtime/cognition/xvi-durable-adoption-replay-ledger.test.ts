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
  deriveXviDurableAdoptionReplayKey,
  XviDurableAdoptionReplayLedger,
  type XviDurableAdoptionReplayClaim,
} from "./xvi-durable-adoption-replay-ledger";

function claim(
  overrides:
    Partial<XviDurableAdoptionReplayClaim> = {},
): XviDurableAdoptionReplayClaim {
  return Object.freeze({
    scope: "SCALING",
    tenantId: "tenant.alpha",
    universeId: "universe.alpha-main",

    instructionDigest:
      "a".repeat(64),

    cellAdoptionDigest:
      "b".repeat(64),

    bindingDigest:
      "c".repeat(64),

    workflowId:
      "workflow-22",

    actionId:
      "scaling.exec.0123456789abcdef.2",

    sourceRevision:
      "d".repeat(40),

    adoptedAtMs:
      1_000_000_000,

    ...overrides,
  });
}

function withTempLedger(
  fn: (
    path: string,
  ) => void,
): void {
  const dir =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate22-",
      ),
    );

  const path =
    join(
      dir,
      "adoption-replay.sqlite",
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

test(
  "first durable lineage claim succeeds and grants no execution authority",
  () => {
    withTempLedger(
      (path) => {
        XviDurableAdoptionReplayLedger
          .initialize(path);

        const ledger =
          new XviDurableAdoptionReplayLedger(
            path,
          );

        try {
          const receipt =
            ledger.claim(
              claim(),
            );

          assert.equal(
            receipt.version,
            "xvi-durable-adoption-replay-v1",
          );

          assert.match(
            receipt.replayKey,
            /^[0-9a-f]{64}$/,
          );

          assert.equal(
            receipt.replayRejected,
            false,
          );

          assert.equal(
            receipt.networkCallPerformed,
            false,
          );

          assert.equal(
            receipt.productionAuthority,
            false,
          );

          assert.equal(
            receipt.executesNothing,
            true,
          );

          assert.equal(
            receipt.remoteCalls,
            0,
          );

          assert.equal(
            ledger.size,
            1,
          );
        } finally {
          ledger.close();
        }
      },
    );
  },
);

test(
  "same lineage cannot be claimed twice in one ledger instance",
  () => {
    withTempLedger(
      (path) => {
        XviDurableAdoptionReplayLedger
          .initialize(path);

        const ledger =
          new XviDurableAdoptionReplayLedger(
            path,
          );

        try {
          ledger.claim(
            claim(),
          );

          assert.throws(
            () =>
              ledger.claim(
                claim(),
              ),
            /instruction lineage already durably claimed/,
          );

          assert.equal(
            ledger.size,
            1,
          );
        } finally {
          ledger.close();
        }
      },
    );
  },
);

test(
  "durable replay claim survives close and reopen",
  () => {
    withTempLedger(
      (path) => {
        XviDurableAdoptionReplayLedger
          .initialize(path);

        const first =
          new XviDurableAdoptionReplayLedger(
            path,
          );

        const replayKey =
          deriveXviDurableAdoptionReplayKey(
            claim(),
          );

        try {
          first.claim(
            claim(),
          );

          assert.equal(
            first.hasReplayKey(
              replayKey,
            ),
            true,
          );
        } finally {
          first.close();
        }

        const reopened =
          new XviDurableAdoptionReplayLedger(
            path,
          );

        try {
          assert.equal(
            reopened.hasReplayKey(
              replayKey,
            ),
            true,
          );

          assert.equal(
            reopened.size,
            1,
          );

          assert.throws(
            () =>
              reopened.claim(
                claim(),
              ),
            /instruction lineage already durably claimed/,
          );
        } finally {
          reopened.close();
        }
      },
    );
  },
);

test(
  "separate ledger instances cannot both claim the same lineage",
  () => {
    withTempLedger(
      (path) => {
        XviDurableAdoptionReplayLedger
          .initialize(path);

        const first =
          new XviDurableAdoptionReplayLedger(
            path,
          );

        const second =
          new XviDurableAdoptionReplayLedger(
            path,
          );

        try {
          first.claim(
            claim(),
          );

          assert.throws(
            () =>
              second.claim(
                claim(),
              ),
            /instruction lineage already durably claimed/,
          );

          assert.equal(
            second.size,
            1,
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
  "different lineage identity receives a different durable replay key",
  () => {
    const first =
      deriveXviDurableAdoptionReplayKey(
        claim(),
      );

    const second =
      deriveXviDurableAdoptionReplayKey(
        claim({
          bindingDigest:
            "e".repeat(64),
        }),
      );

    assert.notEqual(
      first,
      second,
    );
  },
);

test(
  "malformed lineage evidence fails closed before storage",
  () => {
    withTempLedger(
      (path) => {
        XviDurableAdoptionReplayLedger
          .initialize(path);

        const ledger =
          new XviDurableAdoptionReplayLedger(
            path,
          );

        try {
          assert.throws(
            () =>
              ledger.claim(
                claim({
                  instructionDigest:
                    "not-a-digest",
                }),
              ),
            /instruction digest invalid/,
          );

          assert.equal(
            ledger.size,
            0,
          );
        } finally {
          ledger.close();
        }
      },
    );
  },
);

test(
  "initialization refuses to overwrite an existing replay ledger path",
  () => {
    withTempLedger(
      (path) => {
        XviDurableAdoptionReplayLedger
          .initialize(path);

        assert.throws(
          () =>
            XviDurableAdoptionReplayLedger
              .initialize(path),
        );
      },
    );
  },
);
