import { describe, expect, it } from "vitest";

import {
  CapabilityRegistry,
  createCapabilitySpecimen,
  createConditionExpression,
  defineSemanticCapability,
  invalid,
  parseCapabilityId,
  valid,
  validationIssue,
} from "@mailchemy/core";
import {
  defineCanonicalFixture,
  runCapabilityContractTests,
} from "@mailchemy/conformance";

const booleanCapability = defineSemanticCapability<{
  readonly value: boolean;
}>({
  id: parseCapabilityId("test.condition.boolean@1"),
  role: "condition",
  description: "Synthetic condition for contract-runner tests.",
  validateParameters: (value) => {
    if (
      typeof value === "object" &&
      value !== null &&
      "value" in value &&
      typeof value.value === "boolean"
    ) {
      return valid(Object.freeze({ value: value.value }));
    }

    return invalid(
      validationIssue(
        "test.boolean.invalid",
        "Expected an object containing a boolean value.",
      ),
    );
  },
  areParametersEqual: (left, right) => left.value === right.value,
});

function setupRegistry() {
  const registry = new CapabilityRegistry();
  registry.register(booleanCapability);
  return registry;
}

const validTrue = defineCanonicalFixture({
  id: "boolean.true",
  capabilities: [booleanCapability.id],
  expression: createConditionExpression(
    createCapabilitySpecimen(booleanCapability, { value: true }),
  ),
  expectedValidation: "valid",
  oracle: Object.freeze({ expectedTruth: true }),
});

const invalidParameter = defineCanonicalFixture({
  id: "boolean.invalid-parameter",
  capabilities: [booleanCapability.id],
  expression: {
    kind: "condition",
    specimen: {
      kind: "capability",
      capabilityId: booleanCapability.id,
      parameters: { value: "wrong" },
    },
  },
  expectedValidation: "invalid",
});

describe("runCapabilityContractTests", () => {
  it("passes a capability whose fixtures establish valid and invalid boundaries", () => {
    const result = runCapabilityContractTests(setupRegistry(), [
      validTrue,
      invalidParameter,
    ]);

    expect(result.passed).toBe(true);
    expect(result.coverage).toEqual([
      {
        capabilityId: booleanCapability.id,
        validFixtureCount: 1,
        invalidFixtureCount: 1,
        passed: true,
      },
    ]);
    expect(result.fixtureResults.map((fixture) => fixture.passed)).toEqual([
      true,
      true,
    ]);
  });

  it("fails coverage when a registered capability lacks one side of its boundary", () => {
    const result = runCapabilityContractTests(setupRegistry(), [validTrue]);

    expect(result.passed).toBe(false);
    expect(result.coverage[0]).toEqual({
      capabilityId: booleanCapability.id,
      validFixtureCount: 1,
      invalidFixtureCount: 0,
      passed: false,
    });
  });

  it("runs optional pure semantic oracles only for valid fixtures", () => {
    let oracleCalls = 0;
    const result = runCapabilityContractTests(
      setupRegistry(),
      [validTrue, invalidParameter],
      {
        oracles: new Map([
          [
            booleanCapability.id,
            (fixture, expression) => {
              oracleCalls += 1;
              const expected = fixture.oracle?.expectedTruth;
              const actual =
                expression.kind === "condition"
                  ? (
                      expression.specimen.parameters as {
                        readonly value: boolean;
                      }
                    ).value
                  : undefined;

              return {
                passed: expected === actual,
                message: "Synthetic truth oracle.",
              };
            },
          ],
        ]),
      },
    );

    expect(oracleCalls).toBe(1);
    expect(result.fixtureResults[0]?.oracleResults).toEqual([
      {
        capabilityId: booleanCapability.id,
        passed: true,
        message: "Synthetic truth oracle.",
      },
    ]);
    expect(result.passed).toBe(true);
  });

  it("fails a fixture when its canonical validation disagrees with expectation", () => {
    const incorrectlyExpectedValid = defineCanonicalFixture({
      id: "boolean.bad-expectation",
      capabilities: [booleanCapability.id],
      expression: invalidParameter.expression,
      expectedValidation: "valid",
    });

    const result = runCapabilityContractTests(setupRegistry(), [
      incorrectlyExpectedValid,
      invalidParameter,
    ]);

    expect(result.fixtureResults[0]).toEqual({
      fixtureId: "boolean.bad-expectation",
      expectedValidation: "valid",
      actualValidation: "invalid",
      validationPassed: false,
      oracleResults: [],
      passed: false,
    });
    expect(result.passed).toBe(false);
  });
});
