import {
    directRealization,
    hasAttachmentCapability,
    logicalAndCapability,
    markReadCapability,
    subjectContainsCapability,
    unsupportedRealization,
    unsupportedReason,
    type CanonicalExpression,
    type DirectRealizationResult,
} from "@mailchemy/core";

export interface SieveDirectRealizationTarget {
    readonly id: "sieve.direct@1";
    readonly checkDirectRealization: (
        expression: CanonicalExpression,
    ) => DirectRealizationResult;
}

export const sieveDirectRealizationTarget: SieveDirectRealizationTarget =
    Object.freeze({
        id: "sieve.direct@1",
        checkDirectRealization: checkSieveDirectRealization,
    });

function checkSieveDirectRealization(
    expression: CanonicalExpression,
): DirectRealizationResult {
    switch (expression.kind) {
        case "condition":
        case "action":
            return checkLeaf(expression);
        case "and":
            return checkAnd(expression);
        case "rule":
            return checkRule(expression);
    }
}

function checkLeaf(
    expression: Extract<
        CanonicalExpression,
        { readonly kind: "condition" | "action" }
    >,
): DirectRealizationResult {
    const capabilityId = expression.specimen.capabilityId;

    if (capabilityId === markReadCapability.id) {
        return directRealization();
    }

    if (capabilityId === subjectContainsCapability.id) {
        return unsupportedRealization(
            unsupportedReason(
                "exactness-unproven",
                "Sieve header :contains does not prove the NFC plus Unicode-lowercase comparison required by core.condition.subject.contains@1.",
            ),
        );
    }

    if (capabilityId === hasAttachmentCapability.id) {
        return unsupportedRealization(
            unsupportedReason(
                "capability-absent",
                "No exact direct Sieve realization is registered for core.condition.has-attachment@1.",
            ),
        );
    }

    return unsupportedRealization(
        unsupportedReason(
            "capability-absent",
            "The initial Sieve target has no direct realization for this semantic capability.",
        ),
    );
}

function checkAnd(
    expression: Extract<CanonicalExpression, { readonly kind: "and" }>,
): DirectRealizationResult {
    if (expression.operator.capabilityId !== logicalAndCapability.id) {
        return unsupportedRealization(
            unsupportedReason(
                "structure-unsupported",
                "The initial Sieve target only recognizes core.logic.and@1 as conjunction structure.",
            ),
        );
    }

    for (const operand of expression.operands) {
        const operandResult = checkSieveDirectRealization(operand);

        if (operandResult.kind === "unsupported") {
            return operandResult;
        }
    }

    return directRealization();
}

function checkRule(
    expression: Extract<CanonicalExpression, { readonly kind: "rule" }>,
): DirectRealizationResult {
    const conditionResult = checkSieveDirectRealization(expression.condition);

    if (conditionResult.kind === "unsupported") {
        return conditionResult;
    }

    if (expression.actions.length !== 1) {
        return unsupportedRealization(
            unsupportedReason(
                "structure-unsupported",
                "The initial Sieve rule slice only proves exact structure for one action per rule.",
            ),
        );
    }

    const action = expression.actions[0];

    if (action === undefined) {
        return unsupportedRealization(
            unsupportedReason(
                "structure-unsupported",
                "The initial Sieve rule slice requires exactly one action.",
            ),
        );
    }

    return checkSieveDirectRealization(action);
}
