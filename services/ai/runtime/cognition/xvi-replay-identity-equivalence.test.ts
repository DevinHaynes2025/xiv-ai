import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";

import {
  deriveProposalDigest,
} from "../offline-team/agent-decision-safety-workflow";

import {
  SCALING_EXECUTION_POLICY,
} from "../offline-team/scaling-execution-bridge";

import {
  FAILOVER_EXECUTION_POLICY,
} from "../offline-team/failover-execution-bridge";

import {
  deriveXviDurableAdoptionReplayKey,
  type XviDurableAdoptionReplayClaim,
} from "./xvi-durable-adoption-replay-ledger";

const sha256 = (value: string): string =>
  createHash("sha256")
    .update(value, "utf8")
    .digest("hex");

type Scope = "SCALING" | "FAILOVER";

type Fixture = Readonly<{
  scope: Scope;
  tenantId: string;
  universeId: string;
  workflowId: string;
  actionId: string;
  minimumAction: string;
  sourceRevision: string;
  adoptedAtMs: number;

  cellAdoption: Readonly<{
    planDigestSha256: string;
    epoch: string;
    cellCount: number;
    shardCount: number;
    totals: Readonly<{
      projectedRows: number;
      tenantCount: number;
    }>;
    adoptedBy: string;
    adoptedAtMs: number;
    operatorReceiptSha256: string;
  }>;

  binding: Readonly<{
    kind: "EVENT_PLANE_CELL_BINDING";
    planEpoch: string;
    cellPlanDigestSha256: string;
    cellCount: number;
    shardCount: number;
    streamCount: number;
    replicatedStreamCount: number;
  }>;
}>;

function fixture(
  scope: Scope = "SCALING",
): Fixture {
  return Object.freeze({
    scope,
    tenantId: "tenant.alpha",
    universeId: "universe.alpha-main",
    workflowId: "workflow-25",
    actionId:
      scope === "SCALING"
        ? "scaling.exec.0123456789abcdef.2"
        : "failover.exec.0123456789abcdef.300",
    minimumAction:
      "perform the bounded minimum action only",
    sourceRevision:
      "d".repeat(40),
    adoptedAtMs:
      1_000_000_000,

    cellAdoption: Object.freeze({
      planDigestSha256:
        "a".repeat(64),
      epoch:
        "epoch-25",
      cellCount:
        4,
      shardCount:
        16,
      totals: Object.freeze({
        projectedRows:
          250_000,
        tenantCount:
          12,
      }),
      adoptedBy:
        "operator-25",
      adoptedAtMs:
        999_999_000,
      operatorReceiptSha256:
        "b".repeat(64),
    }),

    binding: Object.freeze({
      kind:
        "EVENT_PLANE_CELL_BINDING",
      planEpoch:
        "epoch-25",
      cellPlanDigestSha256:
        "a".repeat(64),
      cellCount:
        4,
      shardCount:
        16,
      streamCount:
        8,
      replicatedStreamCount:
        4,
    }),
  });
}

/*
 * Independent oracle matching the exact field-explicit digest
 * contract in InstructionAdoptionGate. This intentionally does
 * not call Gate 24's private helper functions.
 */
function upstreamCellAdoptionDigest(
  input: Fixture["cellAdoption"],
): string {
  return sha256(
    JSON.stringify({
      planDigestSha256:
        input.planDigestSha256,
      epoch:
        input.epoch,
      cellCount:
        input.cellCount,
      shardCount:
        input.shardCount,
      totals:
        input.totals,
      adoptedBy:
        input.adoptedBy,
      adoptedAtMs:
        input.adoptedAtMs,
      operatorReceiptSha256:
        input.operatorReceiptSha256,
    }),
  );
}

function upstreamBindingDigest(
  input: Fixture["binding"],
): string {
  return sha256(
    JSON.stringify({
      kind:
        input.kind,
      planEpoch:
        input.planEpoch,
      cellPlanDigestSha256:
        input.cellPlanDigestSha256,
      cellCount:
        input.cellCount,
      shardCount:
        input.shardCount,
      streamCount:
        input.streamCount,
      replicatedStreamCount:
        input.replicatedStreamCount,
    }),
  );
}

function upstreamInstructionDigest(
  input: Fixture,
): string {
  const policy =
    input.scope === "SCALING"
      ? SCALING_EXECUTION_POLICY
      : FAILOVER_EXECUTION_POLICY;

  return deriveProposalDigest({
    workflowId:
      input.workflowId,
    actionId:
      input.actionId,
    description:
      input.minimumAction,
    toolId:
      policy.executionToolId,
    riskClass:
      policy.requiredRiskClass,
  });
}

function upstreamClaim(
  input: Fixture,
): XviDurableAdoptionReplayClaim {
  return Object.freeze({
    scope:
      input.scope,
    tenantId:
      input.tenantId,
    universeId:
      input.universeId,
    instructionDigest:
      upstreamInstructionDigest(
        input,
      ),
    cellAdoptionDigest:
      upstreamCellAdoptionDigest(
        input.cellAdoption,
      ),
    bindingDigest:
      upstreamBindingDigest(
        input.binding,
      ),
    workflowId:
      input.workflowId,
    actionId:
      input.actionId,
    sourceRevision:
      input.sourceRevision,
    adoptedAtMs:
      input.adoptedAtMs,
  });
}

test(
  "scaling replay identity binds the exact six upstream lineage components",
  () => {
    const input =
      fixture("SCALING");

    const claim =
      upstreamClaim(input);

    assert.equal(
      claim.scope,
      input.scope,
    );

    assert.equal(
      claim.tenantId,
      input.tenantId,
    );

    assert.equal(
      claim.universeId,
      input.universeId,
    );

    assert.equal(
      claim.instructionDigest,
      upstreamInstructionDigest(
        input,
      ),
    );

    assert.equal(
      claim.cellAdoptionDigest,
      upstreamCellAdoptionDigest(
        input.cellAdoption,
      ),
    );

    assert.equal(
      claim.bindingDigest,
      upstreamBindingDigest(
        input.binding,
      ),
    );

    assert.match(
      deriveXviDurableAdoptionReplayKey(
        claim,
      ),
      /^[0-9a-f]{64}$/,
    );
  },
);

test(
  "failover uses the failover execution policy in instruction identity",
  () => {
    const scaling =
      fixture("SCALING");

    const failover =
      fixture("FAILOVER");

    assert.notEqual(
      upstreamInstructionDigest(
        scaling,
      ),
      upstreamInstructionDigest(
        failover,
      ),
    );
  },
);

test(
  "changing any replay-key component changes durable identity",
  () => {
    const base =
      upstreamClaim(
        fixture(),
      );

    const baseKey =
      deriveXviDurableAdoptionReplayKey(
        base,
      );

    const variants:
      XviDurableAdoptionReplayClaim[] =
      [
        {
          ...base,
          scope:
            "FAILOVER",
        },
        {
          ...base,
          tenantId:
            "tenant.beta",
        },
        {
          ...base,
          universeId:
            "universe.beta-main",
        },
        {
          ...base,
          instructionDigest:
            "1".repeat(64),
        },
        {
          ...base,
          cellAdoptionDigest:
            "2".repeat(64),
        },
        {
          ...base,
          bindingDigest:
            "3".repeat(64),
        },
      ];

    for (
      const variant
      of variants
    ) {
      assert.notEqual(
        deriveXviDurableAdoptionReplayKey(
          variant,
        ),
        baseKey,
      );
    }
  },
);

test(
  "audit-only fields do not alter the six-part replay key",
  () => {
    const base =
      upstreamClaim(
        fixture(),
      );

    const baseKey =
      deriveXviDurableAdoptionReplayKey(
        base,
      );

    const auditVariant:
      XviDurableAdoptionReplayClaim =
      {
        ...base,
        workflowId:
          "workflow-25-audit-copy",
        actionId:
          "scaling.exec.audit-copy",
        sourceRevision:
          "e".repeat(40),
        adoptedAtMs:
          base.adoptedAtMs + 100,
      };

    assert.equal(
      deriveXviDurableAdoptionReplayKey(
        auditVariant,
      ),
      baseKey,
    );
  },
);

test(
  "cell adoption oracle is field sensitive",
  () => {
    const input =
      fixture();

    const first =
      upstreamCellAdoptionDigest(
        input.cellAdoption,
      );

    const second =
      upstreamCellAdoptionDigest({
        ...input.cellAdoption,
        adoptedBy:
          "operator-26",
      });

    assert.notEqual(
      first,
      second,
    );
  },
);

test(
  "binding oracle is field sensitive",
  () => {
    const input =
      fixture();

    const first =
      upstreamBindingDigest(
        input.binding,
      );

    const second =
      upstreamBindingDigest({
        ...input.binding,
        streamCount:
          input.binding.streamCount + 1,
      });

    assert.notEqual(
      first,
      second,
    );
  },
);
