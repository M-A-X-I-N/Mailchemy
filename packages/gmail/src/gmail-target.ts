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

export interface GmailDirectRealizationTarget {
    readonly id: "gmail.filter.direct@1";
    readonly checkDirectRealization: (
        expression: CanonicalExpression,
    ) => DirectRealizationResult;
}

export const gmailDirectRealizationTarget: GmailDirectRealizationTarget =
    Object.freeze({
        id: "gmail.filter.direct@1",
        checkDirectRealization: checkGmailDirectRealization,
    });

function checkGmailDirectRealization(
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

    if (capabilityId === markReadCapability.id)
        return directRealization();

    if (capabilityId === subjectContainsCapability.id) {
        return unsupportedRealization(
            unsupportedReason(
                "exactness-unproven",
                "Gmail subject criteria use provider-defined phrase normalization that does not prove the NFC plus Unicode-lowercase contract of core.condition.subject.contains@1.",
            ),
        );
    }

    if (capabilityId === hasAttachmentCapability.id) {
        return unsupportedRealization(
            unsupportedReason(
                "exactness-unproven",
                "Gmail hasAttachment does not document the MIME-level attachment definition required by core.condition.has-attachment@1.",
            ),
        );
    }

    return unsupportedRealization(
        unsupportedReason(
            "capability-absent",
            "The initial Gmail Filter target has no direct realization for this semantic capability.",
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
                "The initial Gmail target only recognizes core.logic.and@1 as conjunction structure.",
            ),
        );
    }

    for (const operand of expression.operands) {
        const operandResult = checkGmailDirectRealization(operand);

        if (operandResult.kind === "unsupported")
            return operandResult;

    }

    return directRealization();
}

function checkRule(
    expression: Extract<CanonicalExpression, { readonly kind: "rule" }>,
): DirectRealizationResult {
    const conditionResult = checkGmailDirectRealization(expression.condition);

    if (conditionResult.kind === "unsupported")
        return conditionResult;

    if (expression.actions.length !== 1) {
        return unsupportedRealization(
            unsupportedReason(
                "structure-unsupported",
                "The initial Gmail rule slice only proves exact structure for one action per filter.",
            ),
        );
    }

    const action = expression.actions[0];

    if (action === undefined) {
        return unsupportedRealization(
            unsupportedReason(
                "structure-unsupported",
                "The initial Gmail rule slice requires exactly one action.",
            ),
        );
    }

    return checkGmailDirectRealization(action);
}
