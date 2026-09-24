import { describe, expect, it } from "vitest";

import {
  createCoreCapabilityRegistry,
  hasAttachmentCapability,
  logicalAndCapability,
  markReadCapability,
  subjectContainsCapability,
  validateCanonicalExpression,
} from "@mailchemy/core";
import { initialRuleFixtures } from "@mailchemy/conformance";

describe("initial shared rule fixtures", () => {
  it("registers A/B/C plus stable definition-edge specimens", () => {
    expect(initialRuleFixtures.map((fixture) => fixture.id)).toEqual([
      "rule.a.subject-invoice-mark-read",
      "rule.b.has-attachment-mark-read",
      "rule.c.subject-invoice-and-attachment-mark-read",
      "rule.edge.subject-nfc-canonicalization",
      "rule.edge.subject-whitespace-needle",
      "rule.edge.and-reversed-operands",
    ]);
  });

  it("all validate against the accumulated core capability registry", () => {
    const registry = createCoreCapabilityRegistry();

    for (const fixture of initialRuleFixtures) {
      const result = validateCanonicalExpression(registry, fixture.expression);
      expect(result.ok, fixture.id).toBe(true);
    }
  });

  it("specimen C composes the four initial contracts in the planned shape", () => {
    const fixture = initialRuleFixtures.find(
      (candidate) =>
        candidate.id === "rule.c.subject-invoice-and-attachment-mark-read",
    );

    expect(fixture).toBeDefined();

    if (
      fixture === undefined ||
      typeof fixture.expression !== "object" ||
      fixture.expression === null
    ) {
      return;
    }

    const expression = fixture.expression;

    expect(expression.kind).toBe("rule");

    if (expression.kind !== "rule") {
      return;
    }

    expect(expression.condition.kind).toBe("and");

    if (expression.condition.kind !== "and") {
      return;
    }

    expect(expression.condition.operator.capabilityId).toBe(
      logicalAndCapability.id,
    );
    expect(
      expression.condition.operands.map((operand) =>
        operand.kind === "condition" ? operand.specimen.capabilityId : null,
      ),
    ).toEqual([subjectContainsCapability.id, hasAttachmentCapability.id]);
    expect(expression.actions).toHaveLength(1);
    expect(expression.actions[0]?.specimen.capabilityId).toBe(
      markReadCapability.id,
    );
  });

  it("retains reversed AND operand order as a distinct canonical structure", () => {
    const fixture = initialRuleFixtures.find(
      (candidate) => candidate.id === "rule.edge.and-reversed-operands",
    );

    expect(fixture).toBeDefined();

    if (
      fixture === undefined ||
      typeof fixture.expression !== "object" ||
      fixture.expression === null ||
      fixture.expression.kind !== "rule" ||
      fixture.expression.condition.kind !== "and"
    ) {
      return;
    }

    expect(
      fixture.expression.condition.operands.map((operand) =>
        operand.kind === "condition" ? operand.specimen.capabilityId : null,
      ),
    ).toEqual([hasAttachmentCapability.id, subjectContainsCapability.id]);
  });
});
