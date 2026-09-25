/**
 * Proves target-realization conformance comparison and canonical-validation
 * gating using synthetic targets rather than provider evidence.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    createCapabilityInstance,
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

/**
 * Synthetic boolean condition used to exercise target-runner behavior.
 */
const booleanCapability = defineSemanticCapability<{
    /** Synthetic truth value carried by target-runner fixtures. */
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

/**
 * Creates a fresh registry containing the synthetic boolean contract.
 *
 * @returns Registry used by one target-runner case.
 */
function registry() {
    const result = new CapabilityRegistry();
    result.register(booleanCapability);
    return result;
}

/**
 * Builds one canonically valid synthetic boolean fixture.
 *
 * @param id Stable fixture identity.
 * @param value Boolean semantic value.
 * @returns Canonical fixture for realization classification.
 */
function fixture(id: string, value: boolean) {
    return defineCanonicalFixture({
        id,
        capabilities: [booleanCapability.id],
        expression: createConditionExpression(
            createCapabilityInstance(booleanCapability, { value }),
        ),
        expectedValidation: "valid",
    });
}

/** Valid synthetic true fixture used across runner cases. */
const trueFixture = fixture("boolean.true", true);
/** Valid synthetic false fixture used across runner cases. */
const falseFixture = fixture("boolean.false", false);

/**
 * Exercises exact expectation matching and validation gating in the target
 * conformance runner.
 */
describe("runTargetRealizationConformance", () => {
    /**
     * Proves Direct and reason-specific Unsupported results pass when they match
     * the explicitly declared synthetic expectation.
     */
    it("treats expected Direct and expected Unsupported as passing results", () => {
        const target = defineDirectRealizationTarget({
            id: "synthetic.true-only",
            checkDirectRealization: (expression) => {
                const value =
                    expression.kind === "condition"
                        ? (
                              expression.instance.parameters as {
                                  /** Synthetic truth value inspected by the target classifier. */
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

    /**
     * Proves Unsupported refusal categories are evidence-distinct and cannot be
     * substituted for one another.
     */
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

    /**
     * Proves canonical validity is a hard prerequisite for target execution.
     */
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
                instance: {
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
