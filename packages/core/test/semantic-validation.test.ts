/**
 * Proves recursive canonical-expression validation across registered capability
 * parameters, roles, structure, arity-related shape, paths, and cycle safety.
 *
 * @packageDocumentation
 */

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

/**
 * Synthetic parameter shape used to exercise canonical-validation boundaries.
 */
interface BooleanParameters {
    /** Boolean value accepted by the synthetic contract. */
    readonly value: boolean;
}

/**
 * Creates a synthetic boolean-valued capability for a selected structural role.
 *
 * @param id Canonical synthetic semantic identity.
 * @param role Structural role used to test role-aware validation.
 * @returns Immutable boolean semantic capability contract.
 */
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

/**
 * Builds a fresh synthetic registry containing one capability for each
 * condition/action/logic role.
 *
 * @returns Registry plus the three typed contracts used by validation cases.
 */
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

/**
 * Exercises validation of unknown values before they are trusted as canonical
 * semantic expressions.
 */
describe("validateCanonicalExpression", () => {
    /**
     * Proves a registered, correctly-role-placed rule/conjunction/action tree is
     * accepted and returned as the original canonical expression.
     */
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

    /**
     * Proves registered capability parameter contracts run before target
     * realization and preserve the structural path to nested failures.
     */
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

    /**
     * Proves unknown semantic identities are reported as registration failures,
     * not conflated with parameter-shape failures.
     */
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

    /**
     * Proves an otherwise-valid registered specimen cannot occupy a canonical
     * expression role that conflicts with its contract metadata.
     */
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

    /**
     * Proves malformed AND structure is rejected as shape evidence without
     * incorrectly converting that case into some unrelated semantic decision.
     */
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

    /**
     * Proves recursive validation terminates safely and reports active-branch
     * cycles instead of recursing indefinitely.
     */
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
