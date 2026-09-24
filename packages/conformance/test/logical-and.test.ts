import { describe, expect, it } from "vitest";

import {
  CapabilityRegistry,
  createAndExpression,
  createCapabilitySpecimen,
  createConditionExpression,
  evaluateLogicalAnd,
  logicalAndCapability,
  subjectContainsCapability,
} from "@mailchemy/core";
import {
  logicalAndFixtures,
  runCapabilityContractTests,
  subjectContainsFixtures,
} from "@mailchemy/conformance";

describe("core.logic.and@1", () => {
  it("satisfies its canonical contract fixture suite", () => {
    const registry = new CapabilityRegistry();
    registry.register(logicalAndCapability);
    registry.register(subjectContainsCapability);

    const result = runCapabilityContractTests(
      registry,
      [...logicalAndFixtures, ...subjectContainsFixtures],
      {
        oracles: new Map([
          [
            logicalAndCapability.id,
            (fixture) => {
              const operandResults = fixture.oracle?.operandResults;
              const expectedMatch = fixture.oracle?.expectedMatch;

              if (
                !Array.isArray(operandResults) ||
                !operandResults.every((value) => typeof value === "boolean") ||
                typeof expectedMatch !== "boolean"
              ) {
                return {
                  passed: false,
                  message: "AND fixture oracle metadata is malformed.",
                };
              }

              return {
                passed: evaluateLogicalAnd(operandResults) === expectedMatch,
                message: "Evaluated logic.and@1 truth oracle.",
              };
            },
          ],
        ]),
      },
    );

    expect(result.passed).toBe(true);

    const andCoverage = result.coverage.find(
      (entry) => entry.capabilityId === logicalAndCapability.id,
    );

    expect(andCoverage).toEqual({
      capabilityId: logicalAndCapability.id,
      validFixtureCount: 3,
      invalidFixtureCount: 3,
      passed: true,
    });
  });

  it("preserves canonical operand order instead of sorting", () => {
    const first = createConditionExpression(
      createCapabilitySpecimen(subjectContainsCapability, { needle: "z" }),
    );
    const second = createConditionExpression(
      createCapabilitySpecimen(subjectContainsCapability, { needle: "a" }),
    );

    const expression = createAndExpression(
      createCapabilitySpecimen(logicalAndCapability, null),
      [first, second],
    );

    expect(expression.operands).toEqual([first, second]);
  });

  it("refuses to evaluate the invalid zero/single operand domain", () => {
    expect(() => evaluateLogicalAnd([])).toThrow(
      "logic.and@1 requires at least two operands.",
    );
    expect(() => evaluateLogicalAnd([true])).toThrow(
      "logic.and@1 requires at least two operands.",
    );
  });
});
