/**
 * Classifies direct exact realizability for the initial Microsoft Graph Inbox
 * Rule target.
 *
 * @remarks
 * Mark-read is Direct through `markAsRead=true`. Graph Subject and attachment
 * predicates remain `exactness-unproven`; the presence of typed native fields
 * is not sufficient evidence of canonical equivalence. Broader ordered-rule,
 * exception, and stop-processing semantics are outside this initial
 * rule-structure slice.
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
 * Stable direct-realization contract for the initial Graph Inbox Rule slice.
 */
export interface OutlookDirectRealizationTarget {
    /** Stable implementation-level identity of the Outlook target. */
    readonly id: "outlook.graph.inbox-rule.direct@1";
    /**
     * Classifies one concrete canonical expression for direct Outlook/Graph
     * realization.
     *
     * @param expression Canonical expression or structure to inspect.
     * @returns Direct or structured Unsupported evidence.
     */
    readonly checkDirectRealization: (
        expression: CanonicalExpression,
    ) => DirectRealizationResult;
}

/**
 * Initial Microsoft Graph Inbox Rule realization target.
 */
export const outlookDirectRealizationTarget: OutlookDirectRealizationTarget =
    Object.freeze({
        id: "outlook.graph.inbox-rule.direct@1",
        checkDirectRealization: checkOutlookDirectRealization,
    });

/**
 * Dispatches Outlook realization checks by canonical expression shape.
 *
 * @param expression Canonical expression or structure to classify.
 * @returns Direct or Unsupported realization evidence.
 */
function checkOutlookDirectRealization(
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
 * Classifies one canonical condition/action leaf against the initial Graph
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
    /** Semantic identity whose Graph realization is under consideration. */
    const capabilityId = expression.specimen.capabilityId;

    if (capabilityId === markReadCapability.id)
        return directRealization();

    if (capabilityId === subjectContainsCapability.id) {
        return unsupportedRealization(
            unsupportedReason(
                "exactness-unproven",
                "Microsoft Graph does not document subjectContains comparison, Unicode normalization, and case behavior precisely enough to prove core.condition.subject.contains@1.",
            ),
        );
    }

    if (capabilityId === hasAttachmentCapability.id) {
        return unsupportedRealization(
            unsupportedReason(
                "exactness-unproven",
                "Microsoft Graph hasAttachments does not document the MIME-level explicit Content-Disposition attachment definition required by core.condition.has-attachment@1.",
            ),
        );
    }

    return unsupportedRealization(
        unsupportedReason(
            "capability-absent",
            "The initial Outlook Inbox Rule target has no direct realization for this semantic capability.",
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
                "The initial Outlook target only recognizes core.logic.and@1 as conjunction structure.",
            ),
        );
    }

    for (const operand of expression.operands) {
        const operandResult = checkOutlookDirectRealization(operand);

        if (operandResult.kind === "unsupported")
            return operandResult;

    }

    return directRealization();
}

/**
 * Classifies the initial single-rule Graph structure.
 *
 * @remarks
 * This slice proves exact structure only for one condition plus exactly one
 * action. It does not model sequence among rules, exceptions,
 * `stopProcessingRules`, or state visibility between ordered rules.
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
    const conditionResult = checkOutlookDirectRealization(expression.condition);

    if (conditionResult.kind === "unsupported")
        return conditionResult;

    if (expression.actions.length !== 1) {
        return unsupportedRealization(
            unsupportedReason(
                "structure-unsupported",
                "The initial Outlook rule slice only proves exact structure for one action per rule.",
            ),
        );
    }

    /** Sole action required by the initial exact rule-structure slice. */
    const action = expression.actions[0];

    if (action === undefined) {
        return unsupportedRealization(
            unsupportedReason(
                "structure-unsupported",
                "The initial Outlook rule slice requires exactly one action.",
            ),
        );
    }

    return checkOutlookDirectRealization(action);
}
