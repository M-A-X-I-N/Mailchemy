/**
 * Splits target-local direct-realization checks into leaf and composition hooks
 * so structural support is evaluated independently from leaf support.
 *
 * @remarks
 * This prevents the invalid inference that a composition is Direct merely
 * because each contained capability leaf is Direct.
 *
 * @packageDocumentation
 */

import type {
    ActionCapabilityExpression,
    AndExpression,
    CanonicalExpression,
    ConditionCapabilityExpression,
    RuleExpression,
} from "./expression.js";
import {
    defineDirectRealizationTarget,
    type DirectRealizationResult,
    type DirectRealizationTarget,
} from "./realization-target.js";

/**
 * Canonical semantic leaf whose target support can be checked independently.
 */
export type LeafSemanticExpression =
    ConditionCapabilityExpression | ActionCapabilityExpression;

/**
 * Canonical composition whose execution/grouping semantics require an explicit
 * target structural-support decision.
 */
export type StructuralSemanticExpression = AndExpression | RuleExpression;

/**
 * Direct-realization target with separate leaf and structure predicates.
 */
export interface StructuredDirectRealizationTarget extends DirectRealizationTarget {
    /**
     * Classifies one canonical condition/action leaf for direct realization.
     *
     * @param expression Leaf expression to inspect.
     * @returns Direct or structured Unsupported evidence for the leaf.
     */
    readonly checkLeafDirectRealization: (
        expression: LeafSemanticExpression,
    ) => DirectRealizationResult;

    /**
     * Classifies one canonical conjunction/rule composition for direct
     * realization as a whole.
     *
     * @param expression Structural expression to inspect.
     * @returns Direct or structured Unsupported evidence for the composition.
     */
    readonly checkStructureDirectRealization: (
        expression: StructuralSemanticExpression,
    ) => DirectRealizationResult;
}

/**
 * Authoring shape for a structured direct-realization target.
 */
export interface StructuredDirectRealizationTargetDefinition {
    /** Stable non-empty implementation-level target identity. */
    readonly id: string;

    /**
     * Target-authoritative direct-support predicate for leaves.
     *
     * @param expression Leaf semantic expression to inspect.
     * @returns Direct or Unsupported result.
     */
    readonly checkLeafDirectRealization: (
        expression: LeafSemanticExpression,
    ) => DirectRealizationResult;

    /**
     * Target-authoritative direct-support predicate for compositions.
     *
     * @param expression Structural semantic expression to inspect.
     * @returns Direct or Unsupported result.
     */
    readonly checkStructureDirectRealization: (
        expression: StructuralSemanticExpression,
    ) => DirectRealizationResult;
}

/**
 * Defines a structured target and dispatches the generic direct-support API to
 * the appropriate leaf or structure hook.
 *
 * @param definition Structured target definition.
 * @returns Immutable target exposing both specialized hooks and the common
 * direct-realization interface.
 * @throws InvalidRealizationTargetError When the delegated target ID is blank.
 */
export function defineStructuredDirectRealizationTarget(
    definition: StructuredDirectRealizationTargetDefinition,
): StructuredDirectRealizationTarget {
    /**
     * Kind-directed adapter from the common target interface to the explicit
     * leaf/structure predicates.
     */
    const checkDirectRealization = (
        expression: CanonicalExpression,
    ): DirectRealizationResult => {
        switch (expression.kind) {
            case "condition":
            case "action":
                return definition.checkLeafDirectRealization(expression);
            case "and":
            case "rule":
                return definition.checkStructureDirectRealization(expression);
        }
    };

    /** Validated common target surface reused by the structured target. */
    const target = defineDirectRealizationTarget({
        id: definition.id,
        checkDirectRealization,
    });

    return Object.freeze({
        ...target,
        checkLeafDirectRealization: definition.checkLeafDirectRealization,
        checkStructureDirectRealization:
            definition.checkStructureDirectRealization,
    });
}
