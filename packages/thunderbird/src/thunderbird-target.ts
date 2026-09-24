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

export interface ThunderbirdDirectRealizationTarget {
    readonly id: "thunderbird.msg-filter-rules.direct@1";
    readonly checkDirectRealization: (
        expression: CanonicalExpression,
    ) => DirectRealizationResult;
}

export const thunderbirdDirectRealizationTarget: ThunderbirdDirectRealizationTarget =
    Object.freeze({
        id: "thunderbird.msg-filter-rules.direct@1",
        checkDirectRealization: checkThunderbirdDirectRealization,
    });

function checkThunderbirdDirectRealization(
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
                "Thunderbird Subject Contains is case-insensitive, but its charset conversion and normalization behavior is not proven exactly equivalent to core.condition.subject.contains@1.",
            ),
        );
    }

    if (capabilityId === hasAttachmentCapability.id) {
        return unsupportedRealization(
            unsupportedReason(
                "exactness-unproven",
                "Thunderbird attachment status is a client/message-database predicate and is not proven equivalent to the explicit MIME Content-Disposition contract of core.condition.has-attachment@1.",
            ),
        );
    }

    return unsupportedRealization(
        unsupportedReason(
            "capability-absent",
            "The initial Thunderbird target has no direct realization for this semantic capability.",
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
                "The initial Thunderbird target only recognizes core.logic.and@1 as conjunction structure.",
            ),
        );
    }

    for (const operand of expression.operands) {
        const operandResult = checkThunderbirdDirectRealization(operand);

        if (operandResult.kind === "unsupported") {
            return operandResult;
        }
    }

    return directRealization();
}

function checkRule(
    expression: Extract<CanonicalExpression, { readonly kind: "rule" }>,
): DirectRealizationResult {
    const conditionResult = checkThunderbirdDirectRealization(
        expression.condition,
    );

    if (conditionResult.kind === "unsupported") {
        return conditionResult;
    }

    if (expression.actions.length !== 1) {
        return unsupportedRealization(
            unsupportedReason(
                "structure-unsupported",
                "The initial Thunderbird rule slice only proves exact structure for one action per rule.",
            ),
        );
    }

    const action = expression.actions[0];

    if (action === undefined) {
        return unsupportedRealization(
            unsupportedReason(
                "structure-unsupported",
                "The initial Thunderbird rule slice requires exactly one action.",
            ),
        );
    }

    return checkThunderbirdDirectRealization(action);
}
