import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    createCapabilitySpecimen,
    createConditionExpression,
    defineDirectRealizationTarget,
    defineSemanticCapability,
    directRealization,
    invalid,
    parseCapabilityId,
    unsupportedRealization,
    unsupportedReason,
    valid,
    validationIssue,
} from "@mailchemy/core";
import {
    defineCanonicalFixture,
    runTargetRealizationConformance,
} from "@mailchemy/conformance";

const booleanCapability = defineSemanticCapability<{
    readonly value: boolean;
}>({
    id: parseCapabilityId("test.condition.boolean@1"),
    role: "condition",
    description: "Synthetic target-runner condition.",
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

function registry() {
    const result = new CapabilityRegistry();
    result.register(booleanCapability);
    return result;
}

function fixture(id: string, value: boolean) {
    return defineCanonicalFixture({
        id,
        capabilities: [booleanCapability.id],
        expression: createConditionExpression(
            createCapabilitySpecimen(booleanCapability, { value }),
        ),
        expectedValidation: "valid",
    });
}

const trueFixture = fixture("boolean.true", true);
const falseFixture = fixture("boolean.false", false);

describe("runTargetRealizationConformance", () => {
    it("treats expected Direct and expected Unsupported as passing results", () => {
        const target = defineDirectRealizationTarget({
            id: "synthetic.true-only",
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
                            "Synthetic target accepts only true.",
                        ),
                    );
            },
        });

        const result = runTargetRealizationConformance(registry(), target, [
            {
                fixture: trueFixture,
                expected: { kind: "direct" },
            },
            {
                fixture: falseFixture,
                expected: {
                    kind: "unsupported",
                    reasonCode: "refinement-rejected",
                },
            },
        ]);

        expect(result.passed).toBe(true);
        expect(result.results.map((entry) => entry.passed)).toEqual([
            true,
            true,
        ]);
    });

    it("fails when the Unsupported reason is not the expected evidence class", () => {
        const target = defineDirectRealizationTarget({
            id: "synthetic.unproven",
            checkDirectRealization: () =>
                unsupportedRealization(
                    unsupportedReason(
                        "exactness-unproven",
                        "Synthetic exactness has not been established.",
                    ),
                ),
        });

        const result = runTargetRealizationConformance(registry(), target, [
            {
                fixture: trueFixture,
                expected: {
                    kind: "unsupported",
                    reasonCode: "capability-absent",
                },
            },
        ]);

        expect(result.passed).toBe(false);
        expect(result.results[0]?.actual).toEqual({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
                message: "Synthetic exactness has not been established.",
            },
        });
    });

    it("does not query a target with an invalid canonical fixture", () => {
        let calls = 0;
        const target = defineDirectRealizationTarget({
            id: "synthetic.must-not-run",
            checkDirectRealization: () => {
                calls += 1;
                return directRealization();
            },
        });
        const invalidFixture = defineCanonicalFixture({
            id: "boolean.invalid",
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

        const result = runTargetRealizationConformance(registry(), target, [
            {
                fixture: invalidFixture,
                expected: { kind: "direct" },
            },
        ]);

        expect(calls).toBe(0);
        expect(result.passed).toBe(false);
        expect(result.results[0]).toEqual({
            fixtureId: "boolean.invalid",
            expected: { kind: "direct" },
            canonicalValid: false,
            passed: false,
            message:
                "Target realization conformance requires a canonically valid fixture.",
        });
    });
});
