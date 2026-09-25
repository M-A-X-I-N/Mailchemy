/**
 * Proves the canonical logical-AND fixture family, conjunction truth oracle,
 * operand-order preservation, and invalid-arity boundary.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    createAndExpression,
    createCapabilityInstance,
    createConditionExpression,
    evaluateLogicalAnd,
    logicalAndCapability,
    subjectContainsCapability,
} from "@mailchemy/core";
import {
    logicalAndFixtures,
    runCapabilityContractConformance,
    subjectContainsFixtures,
} from "@mailchemy/conformance";

/**
 * Exercises canonical conjunction semantics and structure, not any target's
 * composition support.
 */
describe("core.logic.and@1", () => {
    /**
     * Proves valid/invalid conjunction fixtures agree with canonical validation
     * and the pure truth oracle while meeting boundary-coverage requirements.
     */
    it("satisfies its canonical contract fixture suite", () => {
        const registry = new CapabilityRegistry();
        registry.register(logicalAndCapability);
        registry.register(subjectContainsCapability);

        const result = runCapabilityContractConformance(
            registry,
            [...logicalAndFixtures, ...subjectContainsFixtures],
            {
                oracles: new Map([
                    [
                        logicalAndCapability.id,
                        (fixture) => {
                            const operandResults =
                                fixture.oracle?.operandResults;
                            const expectedMatch = fixture.oracle?.expectedMatch;

                            if (
                                !Array.isArray(operandResults) ||
                                !operandResults.every(
                                    (value) => typeof value === "boolean",
                                ) ||
                                typeof expectedMatch !== "boolean"
                            ) {
                                return {
                                    passed: false,
                                    message:
                                        "AND fixture oracle metadata is malformed.",
                                };
                            }

                            return {
                                passed:
                                    evaluateLogicalAnd(operandResults) ===
                                    expectedMatch,
                                message: "Evaluated logic.and@1 truth oracle.",
                            };
                        },
                    ],
                ]),
            },
        );

        expect(result.passed).toBe(true);

        const andCoverage = result.coverage.find(
            (entry) => entry.capabilityId === logicalAndCapability.id,
        );

        expect(andCoverage).toEqual({
            capabilityId: logicalAndCapability.id,
            validFixtureCount: 3,
            invalidFixtureCount: 3,
            passed: true,
        });
    });

    /**
     * Proves canonical conjunction construction preserves supplied operand order.
     */
    it("preserves canonical operand order instead of sorting", () => {
        const first = createConditionExpression(
            createCapabilityInstance(subjectContainsCapability, {
                needle: "z",
            }),
        );
        const second = createConditionExpression(
            createCapabilityInstance(subjectContainsCapability, {
                needle: "a",
            }),
        );

        const expression = createAndExpression(
            createCapabilityInstance(logicalAndCapability, null),
            [first, second],
        );

        expect(expression.operands).toEqual([first, second]);
    });

    /**
     * Proves the pure conjunction evaluator rejects operand counts outside the
     * version-1 minimum-arity semantic domain.
     */
    it("refuses to evaluate the invalid zero/single operand domain", () => {
        expect(() => evaluateLogicalAnd([])).toThrow(
            "logic.and@1 requires at least two operands.",
        );
        expect(() => evaluateLogicalAnd([true])).toThrow(
            "logic.and@1 requires at least two operands.",
        );
    });
});
