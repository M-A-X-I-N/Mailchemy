import type { CapabilitySpecimen } from "./semantic-specimen.js";

export interface ConditionCapabilityExpression {
    readonly kind: "condition";
    readonly specimen: CapabilitySpecimen;
}

export interface ActionCapabilityExpression {
    readonly kind: "action";
    readonly specimen: CapabilitySpecimen;
}

export interface AndExpression {
    readonly kind: "and";
    readonly operator: CapabilitySpecimen;
    readonly operands: readonly ConditionExpression[];
}

export type ConditionExpression = ConditionCapabilityExpression | AndExpression;

export type ActionExpression = ActionCapabilityExpression;

export interface RuleExpression {
    readonly kind: "rule";
    readonly condition: ConditionExpression;
    readonly actions: readonly ActionExpression[];
}

export type CanonicalExpression =
    ConditionExpression | ActionExpression | RuleExpression;

export function createConditionExpression(
    specimen: CapabilitySpecimen,
): ConditionCapabilityExpression {
    return Object.freeze({
        kind: "condition",
        specimen,
    });
}

export function createActionExpression(
    specimen: CapabilitySpecimen,
): ActionCapabilityExpression {
    return Object.freeze({
        kind: "action",
        specimen,
    });
}

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
