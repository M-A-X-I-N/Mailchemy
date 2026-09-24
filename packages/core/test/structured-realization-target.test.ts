import { describe, expect, it } from "vitest";

import {
    createAndExpression,
    createCapabilitySpecimen,
    createConditionExpression,
    defineSemanticCapability,
    defineStructuredDirectRealizationTarget,
    directRealization,
    invalid,
    parseCapabilityId,
    unsupportedRealization,
    unsupportedReason,
    valid,
    validationIssue,
} from "@mailchemy/core";

const booleanCondition = defineSemanticCapability<{ readonly value: boolean }>({
    id: parseCapabilityId("test.condition.boolean@1"),
    role: "condition",
    description: "Synthetic leaf for structure-realizability tests.",
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

const andCapability = defineSemanticCapability<null>({
    id: parseCapabilityId("test.logic.and@1"),
    role: "logic",
    description: "Synthetic AND operator.",
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

function booleanLeaf(value: boolean) {
    return createConditionExpression(
        createCapabilitySpecimen(booleanCondition, { value }),
    );
}

describe("StructuredDirectRealizationTarget", () => {
    it("can report every leaf Direct while rejecting their composition", () => {
        const target = defineStructuredDirectRealizationTarget({
            id: "synthetic.structure-hating-target",
            checkLeafDirectRealization: () => directRealization(),
            checkStructureDirectRealization: () =>
                unsupportedRealization(
                    unsupportedReason(
                        "structure-unsupported",
                        "Synthetic target does not support composed structures.",
                    ),
                ),
        });

        const left = booleanLeaf(true);
        const right = booleanLeaf(false);
        const combined = createAndExpression(
            createCapabilitySpecimen(andCapability, null),
            [left, right],
        );

        expect(target.checkDirectRealization(left)).toEqual({ kind: "direct" });
        expect(target.checkDirectRealization(right)).toEqual({
            kind: "direct",
        });
        expect(target.checkDirectRealization(combined)).toEqual({
            kind: "unsupported",
            reason: {
                code: "structure-unsupported",
                message:
                    "Synthetic target does not support composed structures.",
            },
        });
    });

    it("dispatches a structure to the structure hook without assuming leaf closure", () => {
        let leafChecks = 0;
        let structureChecks = 0;
        const target = defineStructuredDirectRealizationTarget({
            id: "synthetic.explicit-structure-hook",
            checkLeafDirectRealization: () => {
                leafChecks += 1;
                return directRealization();
            },
            checkStructureDirectRealization: () => {
                structureChecks += 1;
                return unsupportedRealization(
                    unsupportedReason(
                        "structure-unsupported",
                        "Composition requires an explicit target contract.",
                    ),
                );
            },
        });

        const combined = createAndExpression(
            createCapabilitySpecimen(andCapability, null),
            [booleanLeaf(true), booleanLeaf(false)],
        );

        expect(target.checkDirectRealization(combined).kind).toBe(
            "unsupported",
        );
        expect(structureChecks).toBe(1);
        expect(leafChecks).toBe(0);
    });

    it("still allows target-specific structures to be declared Direct explicitly", () => {
        const target = defineStructuredDirectRealizationTarget({
            id: "synthetic.structure-friendly-target",
            checkLeafDirectRealization: () => directRealization(),
            checkStructureDirectRealization: (expression) =>
                expression.kind === "and"
                    ? directRealization()
                    : unsupportedRealization(
                        unsupportedReason(
                            "structure-unsupported",
                            "Synthetic target only supports AND structures.",
                        ),
                    ),
        });

        const combined = createAndExpression(
            createCapabilitySpecimen(andCapability, null),
            [booleanLeaf(true), booleanLeaf(false)],
        );

        expect(target.checkDirectRealization(combined)).toEqual({
            kind: "direct",
        });
    });
});
