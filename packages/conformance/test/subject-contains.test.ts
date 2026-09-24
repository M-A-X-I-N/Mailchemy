import { describe, expect, it } from "vitest";

import {
  createCoreCapabilityRegistry,
  evaluateSubjectContains,
  subjectContainsCapability,
} from "@mailchemy/core";
import {
  runCapabilityContractTests,
  subjectContainsFixtures,
} from "@mailchemy/conformance";

describe("core.condition.subject.contains@1", () => {
  it("satisfies its canonical contract fixture suite", () => {
    const result = runCapabilityContractTests(
      createCoreCapabilityRegistry(),
      subjectContainsFixtures,
      {
        oracles: new Map([
          [
            subjectContainsCapability.id,
            (fixture) => {
              const subjectFields = fixture.oracle?.subjectFields;
              const expectedMatch = fixture.oracle?.expectedMatch;

              if (
                !Array.isArray(subjectFields) ||
                !subjectFields.every((value) => typeof value === "string") ||
                typeof expectedMatch !== "boolean" ||
                fixture.expression.kind !== "condition"
              ) {
                return {
                  passed: false,
                  message: "Subject fixture oracle metadata is malformed.",
                };
              }

              const actual = evaluateSubjectContains(
                subjectFields,
                fixture.expression.specimen.parameters as {
                  readonly needle: string;
                },
              );

              return {
                passed: actual === expectedMatch,
                message: "Evaluated subject.contains@1 semantic oracle.",
              };
            },
          ],
        ]),
      },
    );

    expect(result.passed).toBe(true);
    expect(result.coverage).toEqual([
      {
        capabilityId: subjectContainsCapability.id,
        validFixtureCount: 6,
        invalidFixtureCount: 3,
        passed: true,
      },
    ]);
  });

  it("canonicalizes the needle to NFC at specimen creation time", () => {
    const decomposed = subjectContainsCapability.validateParameters({
      needle: "Cafe\u0301",
    });

    expect(decomposed).toEqual({
      ok: true,
      value: { needle: "Café" },
    });
  });
});
