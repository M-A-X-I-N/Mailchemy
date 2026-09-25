/**
 * Classifies direct exact realizability for the initial Gmail Filter target.
 *
 * @remarks
 * The target models only proven semantic equivalence, not mere similarity to
 * Gmail criteria/action fields. Mark-read is Direct through removal of the
 * `UNREAD` system label; Subject and attachment criteria remain
 * `exactness-unproven`.
 *
 * @packageDocumentation
 */

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

/**
 * Stable direct-realization contract for the initial Gmail Filter slice.
 */
export interface GmailDirectRealizationTarget {
    /** Stable implementation-level identity of the Gmail target. */
    readonly id: "gmail.filter.direct@1";
    /**
     * Classifies one concrete canonical expression for direct Gmail realization.
     *
     * @param expression Canonical expression or structure to inspect.
     * @returns Direct or structured Unsupported evidence.
     */
    readonly checkDirectRealization: (
        expression: CanonicalExpression,
    ) => DirectRealizationResult;
}

/**
 * Initial Gmail Filter realization target.
 */
export const gmailDirectRealizationTarget: GmailDirectRealizationTarget =
    Object.freeze({
        id: "gmail.filter.direct@1",
        checkDirectRealization: checkGmailDirectRealization,
    });

/**
 * Dispatches Gmail realization checks by canonical expression shape.
 *
 * @param expression Canonical expression or structure to classify.
 * @returns Direct or Unsupported realization evidence.
 */
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

/**
 * Classifies one canonical condition/action leaf against the initial Gmail
 * semantic mapping.
 *
 * @param expression Condition or action leaf.
 * @returns Direct for proven mark-read, otherwise reason-specific Unsupported
 * evidence.
 */
function checkLeaf(
    expression: Extract<
        CanonicalExpression,
        {
            /** Leaf discriminator accepted by this classifier. */
            readonly kind: "condition" | "action";
        }
    >,
): DirectRealizationResult {
    /** Semantic identity whose Gmail realization is under consideration. */
    const capabilityId = expression.instance.capabilityId;

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

/**
 * Classifies canonical conjunction after validating the expected logic operator
 * and every operand recursively.
 *
 * @param expression Canonical AND expression.
 * @returns Direct only when all operands are Direct; otherwise the first
 * encountered Unsupported evidence.
 */
function checkAnd(
    expression: Extract<
        CanonicalExpression,
        {
            /** Conjunction discriminator accepted by this classifier. */
            readonly kind: "and";
        }
    >,
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

/**
 * Classifies the initial Gmail filter-shaped rule structure.
 *
 * @remarks
 * This slice proves exact structure only for one condition plus exactly one
 * action. It does not imply general equivalence for Gmail's multi-filter
 * execution model or mutation visibility.
 *
 * @param expression Canonical rule structure.
 * @returns Direct when condition and sole action are Direct; otherwise
 * reason-specific Unsupported evidence.
 */
function checkRule(
    expression: Extract<
        CanonicalExpression,
        {
            /** Rule discriminator accepted by this classifier. */
            readonly kind: "rule";
        }
    >,
): DirectRealizationResult {
    /** Realization evidence for the rule condition. */
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

    /** Sole action required by the initial exact rule-structure slice. */
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
