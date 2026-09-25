/**
 * Classifies direct exact realizability for the initial Thunderbird message-
 * filter target.
 *
 * @remarks
 * Mark-read is Direct at the leaf-semantic layer without assigning a trigger
 * context. Subject and attachment predicates remain `exactness-unproven`.
 * Stored-filter trigger context, action reordering, rule ordering, and
 * terminality are broader execution-structure semantics outside this initial
 * direct leaf/one-rule slice.
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
 * Stable direct-realization contract for the initial Thunderbird slice.
 */
export interface ThunderbirdDirectRealizationTarget {
    /** Stable implementation-level identity of the Thunderbird target. */
    readonly id: "thunderbird.msg-filter-rules.direct@1";
    /**
     * Classifies one concrete canonical expression for direct Thunderbird
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
 * Initial Thunderbird message-filter realization target.
 */
export const thunderbirdDirectRealizationTarget: ThunderbirdDirectRealizationTarget =
    Object.freeze({
        id: "thunderbird.msg-filter-rules.direct@1",
        checkDirectRealization: checkThunderbirdDirectRealization,
    });

/**
 * Dispatches Thunderbird realization checks by canonical expression shape.
 *
 * @param expression Canonical expression or structure to classify.
 * @returns Direct or Unsupported realization evidence.
 */
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

/**
 * Classifies one canonical condition/action leaf against the initial
 * Thunderbird semantic mapping.
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
    /** Semantic identity whose Thunderbird realization is under consideration. */
    const capabilityId = expression.specimen.capabilityId;

    if (capabilityId === markReadCapability.id)
        return directRealization();

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
                "The initial Thunderbird target only recognizes core.logic.and@1 as conjunction structure.",
            ),
        );
    }

    for (const operand of expression.operands) {
        const operandResult = checkThunderbirdDirectRealization(operand);

        if (operandResult.kind === "unsupported")
            return operandResult;

    }

    return directRealization();
}

/**
 * Classifies the initial single-filter canonical rule structure.
 *
 * @remarks
 * This slice proves only one condition plus exactly one action. It does not
 * model Thunderbird trigger context, action sorting, cross-filter ordering,
 * StopExecution, or move/delete terminality.
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
    const conditionResult = checkThunderbirdDirectRealization(
        expression.condition,
    );

    if (conditionResult.kind === "unsupported")
        return conditionResult;

    if (expression.actions.length !== 1) {
        return unsupportedRealization(
            unsupportedReason(
                "structure-unsupported",
                "The initial Thunderbird rule slice only proves exact structure for one action per rule.",
            ),
        );
    }

    /** Sole action required by the initial exact rule-structure slice. */
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
