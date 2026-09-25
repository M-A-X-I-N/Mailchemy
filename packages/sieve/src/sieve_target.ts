/**
 * Classifies direct exact realizability for the initial Sieve dialect target.
 *
 * @remarks
 * This target describes the dialect-level semantic surface implemented/proven
 * by Mailchemy. It does not assert that a particular ManageSieve endpoint
 * advertises every extension required by a Direct result; endpoint refinement
 * is applied separately.
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
 * Stable direct-realization target contract for the initial Sieve dialect slice.
 */
export interface SieveDirectRealizationTarget {
    /** Stable implementation-level identity of the dialect target. */
    readonly id: "sieve.direct@1";
    /**
     * Classifies one concrete canonical expression at the Sieve dialect layer.
     *
     * @param expression Canonical expression or structure to inspect.
     * @returns Direct or structured Unsupported evidence.
     */
    readonly checkDirectRealization: (
        expression: CanonicalExpression,
    ) => DirectRealizationResult;
}

/**
 * Initial Sieve dialect realization target.
 *
 * @remarks
 * Mark-read is Direct at this layer because RFC 5232-style `imap4flags`
 * mutation provides the needed semantic operation. Subject containment remains
 * `exactness-unproven`; attachment presence is currently
 * `capability-absent` for this direct slice.
 */
export const sieveDirectRealizationTarget: SieveDirectRealizationTarget =
    Object.freeze({
        id: "sieve.direct@1",
        checkDirectRealization: checkSieveDirectRealization,
    });

/**
 * Dispatches dialect-level realization checks by canonical expression shape.
 *
 * @param expression Canonical expression or structure to classify.
 * @returns Direct or Unsupported realization evidence.
 */
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

/**
 * Classifies one canonical condition/action leaf against the initial Sieve
 * semantic mapping.
 *
 * @param expression Condition or action leaf to classify.
 * @returns Direct for proven exact mark-read, otherwise reason-specific
 * Unsupported evidence.
 */
function checkLeaf(
    expression: Extract<
        CanonicalExpression,
        {
            /** Leaf expression discriminator accepted by this classifier. */
            readonly kind: "condition" | "action";
        }
    >,
): DirectRealizationResult {
    /** Semantic identity whose direct Sieve realization is being classified. */
    const capabilityId = expression.specimen.capabilityId;

    if (capabilityId === markReadCapability.id)
        return directRealization();

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

/**
 * Classifies canonical conjunction structure after requiring the registered
 * conjunction operator and checking every operand recursively.
 *
 * @param expression Canonical AND expression.
 * @returns Direct only when operator and every operand are Direct; otherwise the
 * first encountered Unsupported evidence.
 */
function checkAnd(
    expression: Extract<CanonicalExpression, {
        /** Conjunction discriminator accepted by this structural classifier. */
        readonly kind: "and";
    }>,
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

        if (operandResult.kind === "unsupported")
            return operandResult;

    }

    return directRealization();
}

/**
 * Classifies the initial rule-shaped Sieve structure.
 *
 * @remarks
 * This first slice proves exact structure only for one condition plus exactly
 * one action. It does not generalize Sieve's broader script/control-flow model.
 *
 * @param expression Canonical rule structure.
 * @returns Direct when condition and sole action are Direct; otherwise
 * reason-specific Unsupported evidence.
 */
function checkRule(
    expression: Extract<CanonicalExpression, {
        /** Rule discriminator accepted by this structural classifier. */
        readonly kind: "rule";
    }>,
): DirectRealizationResult {
    /** Dialect-level realization evidence for the rule condition. */
    const conditionResult = checkSieveDirectRealization(expression.condition);

    if (conditionResult.kind === "unsupported")
        return conditionResult;

    if (expression.actions.length !== 1) {
        return unsupportedRealization(
            unsupportedReason(
                "structure-unsupported",
                "The initial Sieve rule slice only proves exact structure for one action per rule.",
            ),
        );
    }

    /** Sole action required by the initial exact rule-structure slice. */
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
