import { describe, expect, it } from "vitest";

import {
  createActionExpression,
  createAndExpression,
  createCapabilitySpecimen,
  createConditionExpression,
  createRuleExpression,
  hasAttachmentCapability,
  logicalAndCapability,
  markReadCapability,
  subjectContainsCapability,
} from "@mailchemy/core";

import { sieveDirectRealizationTarget } from "../src/index.js";

function subjectContains(needle: string) {
  return createConditionExpression(
    createCapabilitySpecimen(subjectContainsCapability, { needle }),
  );
}

function hasAttachment() {
  return createConditionExpression(
    createCapabilitySpecimen(hasAttachmentCapability, null),
  );
}

function markRead() {
  return createActionExpression(
    createCapabilitySpecimen(markReadCapability, null),
  );
}

describe("Sieve direct realization", () => {
  it("marks the canonical mark-read leaf Direct at the Sieve dialect layer", () => {
    expect(
      sieveDirectRealizationTarget.checkDirectRealization(markRead()),
    ).toEqual({
      kind: "direct",
    });
  });

  it("keeps canonical Subject containment exactness unproven", () => {
    expect(
      sieveDirectRealizationTarget.checkDirectRealization(
        subjectContains("invoice"),
      ),
    ).toMatchObject({
      kind: "unsupported",
      reason: {
        code: "exactness-unproven",
      },
    });
  });

  it("reports the narrow attachment predicate as absent from direct Sieve realizations", () => {
    expect(
      sieveDirectRealizationTarget.checkDirectRealization(hasAttachment()),
    ).toMatchObject({
      kind: "unsupported",
      reason: {
        code: "capability-absent",
      },
    });
  });

  it("propagates an unsupported AND operand instead of inferring support from structure alone", () => {
    const expression = createAndExpression(
      createCapabilitySpecimen(logicalAndCapability, null),
      [subjectContains("invoice"), hasAttachment()],
    );

    expect(
      sieveDirectRealizationTarget.checkDirectRealization(expression),
    ).toMatchObject({
      kind: "unsupported",
      reason: {
        code: "exactness-unproven",
      },
    });
  });

  it("propagates leaf exactness through rule structure", () => {
    const expression = createRuleExpression(subjectContains("invoice"), [
      markRead(),
    ]);

    expect(
      sieveDirectRealizationTarget.checkDirectRealization(expression),
    ).toMatchObject({
      kind: "unsupported",
      reason: {
        code: "exactness-unproven",
      },
    });
  });
});
