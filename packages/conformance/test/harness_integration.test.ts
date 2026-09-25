/**
 * Exercises the conformance harness end-to-end using deliberately synthetic
 * capabilities, targets, endpoint profiles, structures, and codecs.
 *
 * @remarks
 * Every target/codec/profile in this module is fake harness evidence. Nothing
 * here is evidence about a real mail provider or native rule system.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    createAndExpression,
    createCapabilityInstance,
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
    runCapabilityContractConformance,
    runCodecRoundTrips,
    runTargetRealizationConformance,
    type CanonicalEquivalence,
} from "@mailchemy/conformance";

/** Synthetic boolean condition used throughout harness integration tests. */
const booleanCondition = defineSemanticCapability<{
    /** Synthetic truth value used throughout harness integration tests. */
    readonly value: boolean;
}>({
    id: parseCapabilityId("test.condition.boolean@1"),
    role: "condition",
    description: "Synthetic boolean capability for harness integration tests.",
    validateParameters: (value) => {
        if (
            typeof value === "object" &&
            value !== null &&
            "value" in value &&
            typeof value.value === "boolean"
        )
            return valid(Object.freeze({ value: value.value }));

        return invalid(
            validationIssue(
                "test.boolean.invalid",
                "Expected an object containing a boolean value.",
            ),
        );
    },
    areParametersEqual: (left, right) => left.value === right.value,
});

/** Synthetic conjunction capability used for structural-support self-tests. */
const andCapability = defineSemanticCapability<null>({
    id: parseCapabilityId("test.logic.and@1"),
    role: "logic",
    description: "Synthetic AND capability for harness integration tests.",
    validateParameters: (value) =>
        value === null
            ? valid(null)
            : invalid(
                validationIssue(
                    "test.null.invalid",
                    "Expected a null parameter.",
                ),
            ),
    areParametersEqual: () => true,
});

/**
 * Builds one synthetic canonical boolean condition.
 *
 * @param value Boolean semantic value.
 * @returns Canonical condition expression.
 */
function condition(value: boolean) {
    return createConditionExpression(
        createCapabilityInstance(booleanCondition, { value }),
    );
}

/**
 * Creates the synthetic semantic registry required by a self-test.
 *
 * @param includeAnd Whether to include the conjunction contract.
 * @returns Fresh registry containing the requested synthetic vocabulary.
 */
function registry(includeAnd = false) {
    const result = new CapabilityRegistry();
    result.register(booleanCondition);

    if (includeAnd)
        result.register(andCapability);

    return result;
}

/** Valid true-valued synthetic fixture with truth-oracle metadata. */
const trueFixture = defineCanonicalFixture({
    id: "boolean.true",
    capabilities: [booleanCondition.id],
    expression: condition(true),
    expectedValidation: "valid",
    oracle: Object.freeze({ expectedTruth: true }),
});

/** Valid false-valued synthetic fixture with truth-oracle metadata. */
const falseFixture = defineCanonicalFixture({
    id: "boolean.false",
    capabilities: [booleanCondition.id],
    expression: condition(false),
    expectedValidation: "valid",
    oracle: Object.freeze({ expectedTruth: false }),
});

/** Invalid synthetic parameter fixture providing negative-boundary evidence. */
const invalidFixture = defineCanonicalFixture({
    id: "boolean.invalid",
    capabilities: [booleanCondition.id],
    expression: {
        kind: "condition",
        instance: {
            kind: "capability",
            capabilityId: booleanCondition.id,
            parameters: { value: "not-boolean" },
        },
    },
    expectedValidation: "invalid",
});

/** Valid synthetic conjunction fixture used for structural support evidence. */
const combinedFixture = defineCanonicalFixture({
    id: "boolean.and",
    capabilities: [booleanCondition.id, andCapability.id],
    expression: createAndExpression(
        createCapabilityInstance(andCapability, null),
        [condition(true), condition(false)],
    ),
    expectedValidation: "valid",
});

/**
 * Compares synthetic boolean canonical meaning for codec round trips.
 *
 * @param left First canonical expression.
 * @param right Second canonical expression.
 * @returns Whether both encode the same synthetic boolean value.
 */
const booleanEquivalence: CanonicalEquivalence = (left, right) => {
    if (left.kind !== "condition" || right.kind !== "condition")
        return false;

    if (left.instance.capabilityId !== right.instance.capabilityId)
        return false;

    const leftValue = left.instance.parameters as {
        /** Left synthetic truth value compared for semantic equality. */
        readonly value: boolean;
    };
    const rightValue = right.instance.parameters as {
        /** Right synthetic truth value compared for semantic equality. */
        readonly value: boolean;
    };

    return leftValue.value === rightValue.value;
};

/**
 * Exercises the major harness layers together while keeping all evidence
 * synthetic and provider-independent.
 */
describe("conformance harness integration", () => {
    /**
     * Proves canonical validation, boundary evidence, and pure semantic oracles
     * compose correctly in capability-contract conformance.
     */
    it("executes provider-independent validity and oracle contract fixtures", () => {
        const result = runCapabilityContractConformance(
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
                                          expression.instance.parameters as {
                                              /** Synthetic truth value consumed by the contract oracle. */
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

    /**
     * Proves distinct realization evidence classes survive target execution and
     * matrix aggregation without being collapsed.
     */
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
                              expression.instance.parameters as {
                                  /** Synthetic truth value inspected by the refinement target. */
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
            runTargetRealizationConformance(
                semanticRegistry,
                refinementTarget,
                [
                    { fixture: trueFixture, expected: { kind: "direct" } },
                    {
                        fixture: falseFixture,
                        expected: {
                            kind: "unsupported",
                            reasonCode: "refinement-rejected",
                        },
                    },
                ],
            ),
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

    /**
     * Proves endpoint refinement can narrow synthetic base Direct support and
     * reports endpoint-profile-missing distinctly.
     */
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

    /**
     * Proves the harness respects explicit structural rejection even when leaf
     * classifications are Direct.
     */
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

    /**
     * Proves end-to-end codec conformance compares semantic meaning rather than
     * normalized native representation bytes.
     */
    it("round trips synthetic native data by semantic equivalence rather than byte identity", () => {
        const codec = defineSemanticCodec<string>({
            id: "fake.boolean-codec",
            encode: (expression) => {
                const parameters =
                    expression.kind === "condition"
                        ? (expression.instance.parameters as {
                              /** Synthetic truth value encoded by the fake codec. */
                              readonly value: boolean;
                          })
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
