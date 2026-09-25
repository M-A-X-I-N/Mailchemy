/**
 * Proves the capability-contract runner's validation, boundary-coverage, and
 * optional semantic-oracle behavior using synthetic capability evidence.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    createCapabilitySpecimen,
    createConditionExpression,
    defineSemanticCapability,
    invalid,
    parseCapabilityId,
    valid,
    validationIssue,
} from "@mailchemy/core";
import {
    defineCanonicalFixture,
    runCapabilityContractTests,
} from "@mailchemy/conformance";

/**
 * Synthetic boolean condition used to exercise harness behavior independently
 * of any real Mailchemy semantic capability or provider.
 */
const booleanCapability = defineSemanticCapability<{
    /** Synthetic truth value carried by this test capability. */
    readonly value: boolean;
}>({
    id: parseCapabilityId("test.condition.boolean@1"),
    role: "condition",
    description: "Synthetic condition for contract-runner tests.",
    validateParameters: (value) => {
        if (
            typeof value === "object" &&
            value !== null &&
            "value" in value &&
            typeof value.value === "boolean"
        )
            return valid(Object.freeze({ value: value.value }));

        return invalid(
            validationIssue(
                "test.boolean.invalid",
                "Expected an object containing a boolean value.",
            ),
        );
    },
    areParametersEqual: (left, right) => left.value === right.value,
});

/**
 * Creates a fresh registry containing only the synthetic boolean contract.
 *
 * @returns Registry used by each independent runner test.
 */
function setupRegistry() {
    const registry = new CapabilityRegistry();
    registry.register(booleanCapability);
    return registry;
}

/**
 * Valid synthetic fixture providing the positive side of contract coverage and
 * truth-oracle metadata.
 */
const validTrue = defineCanonicalFixture({
    id: "boolean.true",
    capabilities: [booleanCapability.id],
    expression: createConditionExpression(
        createCapabilitySpecimen(booleanCapability, { value: true }),
    ),
    expectedValidation: "valid",
    oracle: Object.freeze({ expectedTruth: true }),
});

/**
 * Invalid synthetic fixture providing the negative parameter boundary required
 * for complete capability coverage.
 */
const invalidParameter = defineCanonicalFixture({
    id: "boolean.invalid-parameter",
    capabilities: [booleanCapability.id],
    expression: {
        kind: "condition",
        specimen: {
            kind: "capability",
            capabilityId: booleanCapability.id,
            parameters: { value: "wrong" },
        },
    },
    expectedValidation: "invalid",
});

/**
 * Exercises contract-run aggregation and coverage semantics without asserting
 * anything about concrete adapters.
 */
describe("runCapabilityContractTests", () => {
    /**
     * Proves a registered capability passes coverage only when fixtures establish
     * both valid and invalid canonical boundaries.
     */
    it("passes a capability whose fixtures establish valid and invalid boundaries", () => {
        const result = runCapabilityContractTests(setupRegistry(), [
            validTrue,
            invalidParameter,
        ]);

        expect(result.passed).toBe(true);
        expect(result.coverage).toEqual([
            {
                capabilityId: booleanCapability.id,
                validFixtureCount: 1,
                invalidFixtureCount: 1,
                passed: true,
            },
        ]);
        expect(result.fixtureResults.map((fixture) => fixture.passed)).toEqual([
            true,
            true,
        ]);
    });

    /**
     * Proves missing negative evidence fails coverage even when all supplied
     * fixtures themselves validate as expected.
     */
    it("fails coverage when a registered capability lacks one side of its boundary", () => {
        const result = runCapabilityContractTests(setupRegistry(), [validTrue]);

        expect(result.passed).toBe(false);
        expect(result.coverage[0]).toEqual({
            capabilityId: booleanCapability.id,
            validFixtureCount: 1,
            invalidFixtureCount: 0,
            passed: false,
        });
    });

    /**
     * Proves semantic oracles run only after successful expected-valid canonical
     * validation, so deliberately invalid fixtures are boundary evidence only.
     */
    it("runs optional pure semantic oracles only for valid fixtures", () => {
        let oracleCalls = 0;
        const result = runCapabilityContractTests(
            setupRegistry(),
            [validTrue, invalidParameter],
            {
                oracles: new Map([
                    [
                        booleanCapability.id,
                        (fixture, expression) => {
                            oracleCalls += 1;
                            const expected = fixture.oracle?.expectedTruth;
                            const actual =
                                expression.kind === "condition"
                                    ? (
                                          expression.specimen.parameters as {
                                              /** Synthetic truth value consumed by the oracle. */
                                              readonly value: boolean;
                                          }
                                    ).value
                                    : undefined;

                            return {
                                passed: expected === actual,
                                message: "Synthetic truth oracle.",
                            };
                        },
                    ],
                ]),
            },
        );

        expect(oracleCalls).toBe(1);
        expect(result.fixtureResults[0]?.oracleResults).toEqual([
            {
                capabilityId: booleanCapability.id,
                passed: true,
                message: "Synthetic truth oracle.",
            },
        ]);
        expect(result.passed).toBe(true);
    });

    /**
     * Proves fixture expectation mismatches fail the run instead of being masked
     * by coverage accounting.
     */
    it("fails a fixture when its canonical validation disagrees with expectation", () => {
        const incorrectlyExpectedValid = defineCanonicalFixture({
            id: "boolean.bad-expectation",
            capabilities: [booleanCapability.id],
            expression: invalidParameter.expression,
            expectedValidation: "valid",
        });

        const result = runCapabilityContractTests(setupRegistry(), [
            incorrectlyExpectedValid,
            invalidParameter,
        ]);

        expect(result.fixtureResults[0]).toEqual({
            fixtureId: "boolean.bad-expectation",
            expectedValidation: "valid",
            actualValidation: "invalid",
            validationPassed: false,
            oracleResults: [],
            passed: false,
        });
        expect(result.passed).toBe(false);
    });
});
