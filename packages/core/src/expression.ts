/**
 * Defines the minimal canonical expression shapes used to compose validated
 * semantic capability specimens into conditions, actions, conjunctions, and
 * rule-shaped structures.
 *
 * @packageDocumentation
 */

import type { CapabilitySpecimen } from "./semantic_specimen.js";

/**
 * Canonical condition leaf backed by one condition-role capability specimen.
 */
export interface ConditionCapabilityExpression {
    /** Discriminator for a capability-backed condition leaf. */
    readonly kind: "condition";

    /** Concrete semantic specimen evaluated as a condition. */
    readonly specimen: CapabilitySpecimen;
}

/**
 * Canonical action leaf backed by one action-role capability specimen.
 */
export interface ActionCapabilityExpression {
    /** Discriminator for a capability-backed action leaf. */
    readonly kind: "action";

    /** Concrete semantic specimen applied as an action. */
    readonly specimen: CapabilitySpecimen;
}

/**
 * Canonical logical conjunction whose operand ordering is preserved.
 *
 * @remarks
 * Structural validation is responsible for proving that the operator is a
 * logic-role specimen and that at least two operands are present.
 */
export interface AndExpression {
    /** Discriminator for a canonical conjunction node. */
    readonly kind: "and";

    /** Concrete logic capability that defines conjunction semantics. */
    readonly operator: CapabilitySpecimen;

    /** Ordered condition operands participating in the conjunction. */
    readonly operands: readonly ConditionExpression[];
}

/**
 * Canonical condition expression supported by the initial semantic model.
 */
export type ConditionExpression = ConditionCapabilityExpression | AndExpression;

/**
 * Canonical action expression supported by the initial semantic model.
 */
export type ActionExpression = ActionCapabilityExpression;

/**
 * Canonical rule grouping one condition with an ordered action list.
 *
 * @remarks
 * The grouping preserves structure required by later realization/equivalence
 * logic. This type by itself does not define provider trigger or continuation
 * behavior.
 */
export interface RuleExpression {
    /** Discriminator for a canonical rule-shaped expression. */
    readonly kind: "rule";

    /** Canonical condition controlling whether the actions apply. */
    readonly condition: ConditionExpression;

    /** Ordered canonical action leaves grouped under this rule. */
    readonly actions: readonly ActionExpression[];
}

/**
 * Union of all canonical expression shapes in the current first-slice model.
 */
export type CanonicalExpression =
    ConditionExpression | ActionExpression | RuleExpression;

/**
 * Wraps a capability specimen as a frozen canonical condition leaf.
 *
 * @param specimen Concrete semantic specimen intended for condition use.
 * @returns Immutable condition-capability expression.
 */
export function createConditionExpression(
    specimen: CapabilitySpecimen,
): ConditionCapabilityExpression {
    return Object.freeze({
        kind: "condition",
        specimen,
    });
}

/**
 * Wraps a capability specimen as a frozen canonical action leaf.
 *
 * @param specimen Concrete semantic specimen intended for action use.
 * @returns Immutable action-capability expression.
 */
export function createActionExpression(
    specimen: CapabilitySpecimen,
): ActionCapabilityExpression {
    return Object.freeze({
        kind: "action",
        specimen,
    });
}

/**
 * Constructs a frozen canonical conjunction while snapshotting operand order.
 *
 * @param operator Logic capability specimen defining conjunction semantics.
 * @param operands Ordered condition operands to preserve.
 * @returns Immutable conjunction expression with a frozen operand snapshot.
 */
export function createAndExpression(
    operator: CapabilitySpecimen,
    operands: readonly ConditionExpression[],
): AndExpression {
    return Object.freeze({
        kind: "and",
        operator,
        operands: Object.freeze([...operands]),
    });
}

/**
 * Constructs a frozen canonical rule while snapshotting action grouping/order.
 *
 * @param condition Canonical condition for the rule.
 * @param actions Ordered action leaves belonging to the rule.
 * @returns Immutable rule expression with a frozen action-list snapshot.
 */
export function createRuleExpression(
    condition: ConditionExpression,
    actions: readonly ActionExpression[],
): RuleExpression {
    return Object.freeze({
        kind: "rule",
        condition,
        actions: Object.freeze([...actions]),
    });
}
