/**
 * Proves the canonical Subject-containment fixture family against the pure
 * semantic evaluator and parameter canonicalization behavior.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    evaluateSubjectContains,
    subjectContainsCapability,
} from "@mailchemy/core";
import {
    runCapabilityContractTests,
    subjectContainsFixtures,
} from "@mailchemy/conformance";

/**
 * Exercises canonical Subject semantics only; similarly named native predicates
 * are not assumed exact by this suite.
 */
describe("core.condition.subject.contains@1", () => {
    /**
     * Proves valid/invalid Subject fixtures agree with canonical validation and
     * the logical-Subject evaluation oracle while satisfying boundary coverage.
     */
    it("satisfies its canonical contract fixture suite", () => {
        const result = runCapabilityContractTests(
            (() => {
                const registry = new CapabilityRegistry();
                registry.register(subjectContainsCapability);
                return registry;
            })(),
            subjectContainsFixtures,
            {
                oracles: new Map([
                    [
                        subjectContainsCapability.id,
                        (fixture) => {
                            const subjectFields = fixture.oracle?.subjectFields;
                            const expectedMatch = fixture.oracle?.expectedMatch;

                            const expression = fixture.expression;

                            if (
                                !Array.isArray(subjectFields) ||
                                !subjectFields.every(
                                    (value) => typeof value === "string",
                                ) ||
                                typeof expectedMatch !== "boolean" ||
                                typeof expression !== "object" ||
                                expression === null ||
                                !("kind" in expression) ||
                                expression.kind !== "condition" ||
                                !("specimen" in expression) ||
                                typeof expression.specimen !== "object" ||
                                expression.specimen === null ||
                                !("parameters" in expression.specimen)
                            ) {
                                return {
                                    passed: false,
                                    message:
                                        "Subject fixture oracle metadata is malformed.",
                                };
                            }

                            const actual = evaluateSubjectContains(
                                subjectFields,
                                expression.specimen.parameters as {
                                    /** Canonical Subject substring consumed by the semantic oracle. */
                                    readonly needle: string;
                                },
                            );

                            return {
                                passed: actual === expectedMatch,
                                message:
                                    "Evaluated subject.contains@1 semantic oracle.",
                            };
                        },
                    ],
                ]),
            },
        );

        expect(result.passed).toBe(true);
        expect(result.coverage).toEqual([
            {
                capabilityId: subjectContainsCapability.id,
                validFixtureCount: 6,
                invalidFixtureCount: 3,
                passed: true,
            },
        ]);
    });

    /**
     * Proves decomposed Unicode fixture input is canonicalized to NFC before the
     * semantic specimen is retained.
     */
    it("canonicalizes the needle to NFC at specimen creation time", () => {
        const decomposed = subjectContainsCapability.validateParameters({
            needle: "Cafe\u0301",
        });

        expect(decomposed).toEqual({
            ok: true,
            value: { needle: "Café" },
        });
    });
});
