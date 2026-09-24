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

export type LeafSemanticExpression =
    ConditionCapabilityExpression | ActionCapabilityExpression;

export type StructuralSemanticExpression = AndExpression | RuleExpression;

export interface StructuredDirectRealizationTarget extends DirectRealizationTarget {
    readonly checkLeafDirectRealization: (
        expression: LeafSemanticExpression,
    ) => DirectRealizationResult;
    readonly checkStructureDirectRealization: (
        expression: StructuralSemanticExpression,
    ) => DirectRealizationResult;
}

export interface StructuredDirectRealizationTargetDefinition {
    readonly id: string;
    readonly checkLeafDirectRealization: (
        expression: LeafSemanticExpression,
    ) => DirectRealizationResult;
    readonly checkStructureDirectRealization: (
        expression: StructuralSemanticExpression,
    ) => DirectRealizationResult;
}

export function defineStructuredDirectRealizationTarget(
    definition: StructuredDirectRealizationTargetDefinition,
): StructuredDirectRealizationTarget {
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
