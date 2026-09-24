import { describe, expect, it } from "vitest";

import {
  CapabilityRegistry,
  createAndExpression,
  createCapabilitySpecimen,
  createConditionExpression,
  decodedNative,
  defineDirectRealizationTarget,
  defineEndpointCapabilityProfile,
  defineSemanticCapability,
  defineSemanticCodec,
  defineStructuredDirectRealizationTarget,
  directRealization,
  encodedNative,
  invalid,
  parseCapabilityId,
  refineTargetWithEndpointProfile,
  unsupportedRealization,
  unsupportedReason,
  valid,
  validationIssue,
} from "@mailchemy/core";
import {
  buildConformanceMatrix,
  defineCanonicalFixture,
  renderConformanceMatrixMarkdown,
  runCapabilityContractTests,
  runCodecRoundTrips,
  runTargetRealizationConformance,
  type CanonicalEquivalence,
} from "@mailchemy/conformance";

const booleanCondition = defineSemanticCapability<{
  readonly value: boolean;
}>({
  id: parseCapabilityId("test.condition.boolean@1"),
  role: "condition",
  description: "Synthetic boolean capability for R0 harness self-tests.",
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

const andCapability = defineSemanticCapability<null>({
  id: parseCapabilityId("test.logic.and@1"),
  role: "logic",
  description: "Synthetic AND capability for R0 harness self-tests.",
  validateParameters: (value) =>
    value === null
      ? valid(null)
      : invalid(
          validationIssue("test.null.invalid", "Expected a null parameter."),
        ),
  areParametersEqual: () => true,
});

function condition(value: boolean) {
  return createConditionExpression(
    createCapabilitySpecimen(booleanCondition, { value }),
  );
}

function registry(includeAnd = false) {
  const result = new CapabilityRegistry();
  result.register(booleanCondition);

  if (includeAnd) {
    result.register(andCapability);
  }

  return result;
}

const trueFixture = defineCanonicalFixture({
  id: "boolean.true",
  capabilities: [booleanCondition.id],
  expression: condition(true),
  expectedValidation: "valid",
  oracle: Object.freeze({ expectedTruth: true }),
});

const falseFixture = defineCanonicalFixture({
  id: "boolean.false",
  capabilities: [booleanCondition.id],
  expression: condition(false),
  expectedValidation: "valid",
  oracle: Object.freeze({ expectedTruth: false }),
});

const invalidFixture = defineCanonicalFixture({
  id: "boolean.invalid",
  capabilities: [booleanCondition.id],
  expression: {
    kind: "condition",
    specimen: {
      kind: "capability",
      capabilityId: booleanCondition.id,
      parameters: { value: "not-boolean" },
    },
  },
  expectedValidation: "invalid",
});

const combinedFixture = defineCanonicalFixture({
  id: "boolean.and",
  capabilities: [booleanCondition.id, andCapability.id],
  expression: createAndExpression(
    createCapabilitySpecimen(andCapability, null),
    [condition(true), condition(false)],
  ),
  expectedValidation: "valid",
});

const booleanEquivalence: CanonicalEquivalence = (left, right) => {
  if (left.kind !== "condition" || right.kind !== "condition") {
    return false;
  }

  if (left.specimen.capabilityId !== right.specimen.capabilityId) {
    return false;
  }

  const leftValue = left.specimen.parameters as { readonly value: boolean };
  const rightValue = right.specimen.parameters as { readonly value: boolean };

  return leftValue.value === rightValue.value;
};

describe("R0 conformance harness self-tests", () => {
  it("executes provider-independent validity and oracle contract fixtures", () => {
    const result = runCapabilityContractTests(
      registry(),
      [trueFixture, invalidFixture],
      {
        oracles: new Map([
          [
            booleanCondition.id,
            (fixture, expression) => {
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

    expect(result.passed).toBe(true);
  });

  it("handles Direct, known absence, refinement failure, and exactness-unproven as distinct executable outcomes", () => {
    const directTarget = defineDirectRealizationTarget({
      id: "fake.direct",
      checkDirectRealization: () => directRealization(),
    });
    const absentTarget = defineDirectRealizationTarget({
      id: "fake.absent",
      checkDirectRealization: () =>
        unsupportedRealization(
          unsupportedReason(
            "capability-absent",
            "Fake target does not expose the capability.",
          ),
        ),
    });
    const refinementTarget = defineDirectRealizationTarget({
      id: "fake.refinement",
      checkDirectRealization: (expression) => {
        const value =
          expression.kind === "condition"
            ? (
                expression.specimen.parameters as {
                  readonly value: boolean;
                }
              ).value
            : false;

        return value
          ? directRealization()
          : unsupportedRealization(
              unsupportedReason(
                "refinement-rejected",
                "Fake target rejects the false instance.",
              ),
            );
      },
    });
    const unprovenTarget = defineDirectRealizationTarget({
      id: "fake.unproven",
      checkDirectRealization: () =>
        unsupportedRealization(
          unsupportedReason(
            "exactness-unproven",
            "Fake target might support this, but exactness is unproven.",
          ),
        ),
    });

    const semanticRegistry = registry();

    const runs = [
      runTargetRealizationConformance(semanticRegistry, directTarget, [
        { fixture: trueFixture, expected: { kind: "direct" } },
      ]),
      runTargetRealizationConformance(semanticRegistry, absentTarget, [
        {
          fixture: trueFixture,
          expected: {
            kind: "unsupported",
            reasonCode: "capability-absent",
          },
        },
      ]),
      runTargetRealizationConformance(semanticRegistry, refinementTarget, [
        { fixture: trueFixture, expected: { kind: "direct" } },
        {
          fixture: falseFixture,
          expected: {
            kind: "unsupported",
            reasonCode: "refinement-rejected",
          },
        },
      ]),
      runTargetRealizationConformance(semanticRegistry, unprovenTarget, [
        {
          fixture: trueFixture,
          expected: {
            kind: "unsupported",
            reasonCode: "exactness-unproven",
          },
        },
      ]),
    ];

    expect(runs.every((run) => run.passed)).toBe(true);

    const matrix = buildConformanceMatrix(runs);

    expect(matrix.passed).toBe(true);
    expect(renderConformanceMatrixMarkdown(matrix)).toContain(
      "Unsupported (exactness-unproven)",
    );
    expect(renderConformanceMatrixMarkdown(matrix)).toContain(
      "Unsupported (capability-absent)",
    );
  });

  it("applies endpoint-profile rejection after base Direct support", () => {
    const baseTarget = defineDirectRealizationTarget({
      id: "fake.dialect",
      checkDirectRealization: () => directRealization(),
    });
    const profile = defineEndpointCapabilityProfile({
      id: "fake.endpoint.without-required-feature",
      data: Object.freeze({ requiredFeature: false }),
    });
    const refined = refineTargetWithEndpointProfile({
      id: "fake.dialect@endpoint",
      baseTarget,
      profile,
      refineDirectRealization: (_expression, endpoint) =>
        endpoint.data.requiredFeature
          ? directRealization()
          : unsupportedRealization(
              unsupportedReason(
                "endpoint-profile-missing",
                "Fake endpoint lacks the required runtime feature.",
              ),
            ),
    });

    const result = runTargetRealizationConformance(registry(), refined, [
      {
        fixture: trueFixture,
        expected: {
          kind: "unsupported",
          reasonCode: "endpoint-profile-missing",
        },
      },
    ]);

    expect(result.passed).toBe(true);
    expect(result.results[0]?.actual).toEqual({
      kind: "unsupported",
      reason: {
        code: "endpoint-profile-missing",
        message: "Fake endpoint lacks the required runtime feature.",
      },
    });
  });

  it("proves Direct leaves do not imply Direct structure", () => {
    const structureHatingTarget = defineStructuredDirectRealizationTarget({
      id: "fake.structure-hating",
      checkLeafDirectRealization: () => directRealization(),
      checkStructureDirectRealization: () =>
        unsupportedRealization(
          unsupportedReason(
            "structure-unsupported",
            "Fake target cannot compose otherwise supported leaves.",
          ),
        ),
    });
    const semanticRegistry = registry(true);

    const leafRun = runTargetRealizationConformance(
      semanticRegistry,
      structureHatingTarget,
      [{ fixture: trueFixture, expected: { kind: "direct" } }],
    );
    const structureRun = runTargetRealizationConformance(
      semanticRegistry,
      structureHatingTarget,
      [
        {
          fixture: combinedFixture,
          expected: {
            kind: "unsupported",
            reasonCode: "structure-unsupported",
          },
        },
      ],
    );

    expect(leafRun.passed).toBe(true);
    expect(structureRun.passed).toBe(true);
  });

  it("round trips synthetic native data by semantic equivalence rather than byte identity", () => {
    const codec = defineSemanticCodec<string>({
      id: "fake.boolean-codec",
      encode: (expression) => {
        const parameters =
          expression.kind === "condition"
            ? (expression.specimen.parameters as { readonly value: boolean })
            : { value: false };

        return encodedNative(
          parameters.value ? " value = TRUE \n" : " value = FALSE \n",
        );
      },
      decode: (native) =>
        decodedNative(condition(native.toUpperCase().includes("TRUE"))),
    });

    const result = runCodecRoundTrips(
      registry(),
      codec,
      [{ fixture: trueFixture }],
      booleanEquivalence,
    );

    expect(result.passed).toBe(true);
  });
});
