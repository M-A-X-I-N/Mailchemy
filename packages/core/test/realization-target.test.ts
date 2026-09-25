/**
 * Proves direct-realization targets inspect concrete canonical instances and
 * structures rather than treating capability IDs as unconditional support bits.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    createCapabilitySpecimen,
    createConditionExpression,
    createRuleExpression,
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

/**
 * Synthetic boolean condition used to demonstrate instance-level refinement.
 */
const booleanCondition = defineSemanticCapability<{ readonly value: boolean }>({
    id: parseCapabilityId("test.condition.boolean@1"),
    role: "condition",
    description: "Synthetic condition for direct-realization tests.",
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
 * Exercises the direct-target contract using synthetic support predicates, not
 * evidence about any real provider or dialect.
 */
describe("DirectRealizationTarget", () => {
    /**
     * Proves a target can accept one concrete parameter instance while rejecting
     * another instance of the same semantic capability as refinement-rejected.
     */
    it("can inspect concrete leaf parameters", () => {
        const target = defineDirectRealizationTarget({
            id: "synthetic.direct-target",
            checkDirectRealization: (expression) => {
                if (
                    expression.kind === "condition" &&
                    expression.specimen.capabilityId === booleanCondition.id &&
                    (
                        expression.specimen.parameters as {
                            readonly value: boolean;
                        }
                    ).value
                )
                    return directRealization();

                return unsupportedRealization(
                    unsupportedReason(
                        "refinement-rejected",
                        "Synthetic target only accepts the true specimen.",
                    ),
                );
            },
        });

        const accepted = createConditionExpression(
            createCapabilitySpecimen(booleanCondition, { value: true }),
        );
        const rejected = createConditionExpression(
            createCapabilitySpecimen(booleanCondition, { value: false }),
        );

        expect(target.checkDirectRealization(accepted).kind).toBe("direct");
        expect(target.checkDirectRealization(rejected)).toEqual({
            kind: "unsupported",
            reason: {
                code: "refinement-rejected",
                message: "Synthetic target only accepts the true specimen.",
            },
        });
    });

    /**
     * Proves target support checks receive complete canonical structures and may
     * reject composition even when a leaf expression is Direct.
     */
    it("receives composed semantic structures rather than capability IDs", () => {
        const target = defineDirectRealizationTarget({
            id: "synthetic.structure-aware",
            checkDirectRealization: (expression) =>
                expression.kind === "rule"
                    ? unsupportedRealization(
                        unsupportedReason(
                            "structure-unsupported",
                            "Synthetic target rejects rule structures.",
                        ),
                    )
                    : directRealization(),
        });

        const condition = createConditionExpression(
            createCapabilitySpecimen(booleanCondition, { value: true }),
        );
        const rule = createRuleExpression(condition, []);

        expect(target.checkDirectRealization(condition).kind).toBe("direct");
        expect(target.checkDirectRealization(rule)).toEqual({
            kind: "unsupported",
            reason: {
                code: "structure-unsupported",
                message: "Synthetic target rejects rule structures.",
            },
        });
    });

    /**
     * Proves realization-target definitions require a stable inspectable
     * identity rather than accepting blank metadata.
     */
    it("requires a stable non-empty target identifier", () => {
        expect(() =>
            defineDirectRealizationTarget({
                id: "  ",
                checkDirectRealization: () => directRealization(),
            }),
        ).toThrow("Target ID must not be empty.");
    });
});
