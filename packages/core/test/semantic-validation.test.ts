import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    createActionExpression,
    createAndExpression,
    createCapabilitySpecimen,
    createConditionExpression,
    createRuleExpression,
    defineSemanticCapability,
    invalid,
    parseCapabilityId,
    valid,
    validateCanonicalExpression,
    validationIssue,
} from "@mailchemy/core";

interface BooleanParameters {
    readonly value: boolean;
}

function booleanContract(id: string, role: "condition" | "action" | "logic") {
    return defineSemanticCapability<BooleanParameters>({
        id: parseCapabilityId(id),
        role,
        description: "Synthetic boolean validation contract.",
        validateParameters: (value) => {
            if (
                typeof value === "object" &&
                value !== null &&
                "value" in value &&
                typeof value.value === "boolean"
            ) {
                return valid<BooleanParameters>(
                    Object.freeze({
                        value: value.value,
                    }),
                );
            }

            return invalid(
                validationIssue(
                    "test.boolean.invalid",
                    "Expected an object containing a boolean value.",
                ),
            );
        },
        areParametersEqual: (left, right) => left.value === right.value,
    });
}

function setupRegistry() {
    const condition = booleanContract("test.condition.boolean@1", "condition");
    const action = booleanContract("test.action.boolean@1", "action");
    const logic = booleanContract("test.logic.and@1", "logic");
    const registry = new CapabilityRegistry();

    registry.register(condition);
    registry.register(action);
    registry.register(logic);

    return { registry, condition, action, logic };
}

describe("validateCanonicalExpression", () => {
    it("accepts a well-formed registered rule structure", () => {
        const { registry, condition, action, logic } = setupRegistry();
        const left = createConditionExpression(
            createCapabilitySpecimen(condition, { value: true }),
        );
        const right = createConditionExpression(
            createCapabilitySpecimen(condition, { value: false }),
        );
        const combined = createAndExpression(
            createCapabilitySpecimen(logic, { value: true }),
            [left, right],
        );
        const expression = createRuleExpression(combined, [
            createActionExpression(
                createCapabilitySpecimen(action, { value: true }),
            ),
        ]);

        expect(validateCanonicalExpression(registry, expression)).toEqual({
            ok: true,
            value: expression,
        });
    });

    it("rejects invalid capability parameters before target realization", () => {
        const { registry, condition } = setupRegistry();
        const malformed = {
            kind: "condition",
            specimen: {
                kind: "capability",
                capabilityId: condition.id,
                parameters: { value: "not-boolean" },
            },
        };

        const result = validateCanonicalExpression(registry, malformed);

        expect(result.ok).toBe(false);

        if (!result.ok) {
            expect(result.issues).toContainEqual(
                expect.objectContaining({
                    code: "test.boolean.invalid",
                    path: ["specimen", "parameters"],
                }),
            );
        }
    });

    it("distinguishes an unregistered capability from malformed parameters", () => {
        const { registry } = setupRegistry();
        const unknown = {
            kind: "condition",
            specimen: {
                kind: "capability",
                capabilityId: "test.condition.unknown@1",
                parameters: { value: true },
            },
        };

        const result = validateCanonicalExpression(registry, unknown);

        expect(result.ok).toBe(false);

        if (!result.ok) {
            expect(result.issues.map((issue) => issue.code)).toContain(
                "capability.unregistered",
            );
        }
    });

    it("rejects capability-role mismatches", () => {
        const { registry, action } = setupRegistry();
        const wrongRole = {
            kind: "condition",
            specimen: {
                kind: "capability",
                capabilityId: action.id,
                parameters: { value: true },
            },
        };

        const result = validateCanonicalExpression(registry, wrongRole);

        expect(result.ok).toBe(false);

        if (!result.ok) {
            expect(result.issues.map((issue) => issue.code)).toContain(
                "capability.role-mismatch",
            );
        }
    });

    it("rejects malformed structural fields without choosing AND cardinality semantics", () => {
        const { registry, logic } = setupRegistry();
        const malformed = {
            kind: "and",
            operator: {
                kind: "capability",
                capabilityId: logic.id,
                parameters: { value: true },
            },
            operands: "not-an-array",
        };

        const result = validateCanonicalExpression(registry, malformed);

        expect(result.ok).toBe(false);

        if (!result.ok) {
            expect(result.issues).toContainEqual(
                expect.objectContaining({
                    code: "semantic.invalid-shape",
                    path: ["operands"],
                }),
            );
        }
    });

    it("detects cycles in semantic structures", () => {
        const { registry, logic } = setupRegistry();
        const cyclic: {
            kind: "and";
            operator: {
                kind: "capability";
                capabilityId: string;
                parameters: { value: boolean };
            };
            operands: unknown[];
        } = {
            kind: "and",
            operator: {
                kind: "capability",
                capabilityId: logic.id,
                parameters: { value: true },
            },
            operands: [],
        };

        cyclic.operands.push(cyclic);

        const result = validateCanonicalExpression(registry, cyclic);

        expect(result.ok).toBe(false);

        if (!result.ok) {
            expect(result.issues.map((issue) => issue.code)).toContain(
                "semantic.cycle",
            );
        }
    });
});
