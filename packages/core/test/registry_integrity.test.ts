/**
 * Exercises registry-level integrity rules across multiple synthetic semantic
 * versions, roles, fixtures, and canonical-expression validation.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    DuplicateCapabilityIdError,
    createCapabilityInstance,
    createConditionExpression,
    defineSemanticCapability,
    invalid,
    parseCapabilityId,
    valid,
    validateCanonicalExpression,
    validationIssue,
    type CapabilityRole,
    type SemanticCapabilityContract,
} from "@mailchemy/core";

/**
 * Minimal fixture input/expectation pair used to prove every synthetic
 * registered contract has validation boundary evidence.
 */
interface ContractFixture {
    /** Candidate parameter value supplied to the contract. */
    readonly input: unknown;

    /** Whether the contract is expected to accept the candidate. */
    readonly valid: boolean;
}

/**
 * Creates a synthetic string-valued contract for registry-integrity evidence.
 *
 * @param id Canonical synthetic capability identity.
 * @param role Canonical structural role assigned to the capability.
 * @returns Immutable string semantic contract.
 */
function stringContract(
    id: string,
    role: CapabilityRole,
): SemanticCapabilityContract<string> {
    return defineSemanticCapability<string>({
        id: parseCapabilityId(id),
        role,
        description: "Synthetic registry-integrity capability.",
        references: ["synthetic:registry-integrity"],
        validateParameters: (value) =>
            typeof value === "string"
                ? valid(value)
                : invalid(
                    validationIssue(
                        "test.string.invalid",
                        "Expected a string value.",
                    ),
                ),
        areParametersEqual: (left, right) => left === right,
    });
}

/**
 * Proves the registry preserves semantic-version separation, registration
 * integrity, deterministic enumeration, explicit fixture coverage, and role
 * metadata consumed by canonical validation.
 */
describe("registry integrity", () => {
    /** First semantic version of the synthetic condition capability. */
    const conditionV1 = stringContract("test.condition.value@1", "condition");

    /** Second semantic version retained as a distinct registry identity. */
    const conditionV2 = stringContract("test.condition.value@2", "condition");

    /** Synthetic action-role contract used to test role separation. */
    const action = stringContract("test.action.noop@1", "action");

    /** Deliberately non-canonical registration order used by ordering tests. */
    const contracts = [action, conditionV2, conditionV1] as const;

    /**
     * Validation boundary evidence keyed by every synthetic contract identity.
     */
    const fixtures = new Map<string, readonly ContractFixture[]>([
        [
            conditionV1.id,
            [
                { input: "alpha", valid: true },
                { input: 1, valid: false },
            ],
        ],
        [
            conditionV2.id,
            [
                { input: "beta", valid: true },
                { input: null, valid: false },
            ],
        ],
        [
            action.id,
            [
                { input: "noop", valid: true },
                { input: {}, valid: false },
            ],
        ],
    ]);

    /**
     * Creates the same synthetic registry state for each independent invariant.
     *
     * @returns Fresh registry populated in the deliberately unsorted order.
     */
    function buildRegistry() {
        const registry = new CapabilityRegistry();

        for (const contract of contracts)
            registry.register(contract);

        return registry;
    }

    /**
     * Proves changing a semantic version creates a distinct registry entry.
     */
    it("keeps semantic versions as distinct registry entries", () => {
        const registry = buildRegistry();

        expect(registry.size).toBe(3);
        expect(registry.has(conditionV1.id)).toBe(true);
        expect(registry.has(conditionV2.id)).toBe(true);
        expect(conditionV1.id).not.toBe(conditionV2.id);
    });

    /**
     * Proves accidental re-registration of an existing identity fails loudly.
     */
    it("rejects accidental duplicate registration", () => {
        const registry = buildRegistry();

        expect(() => registry.register(conditionV1)).toThrow(
            DuplicateCapabilityIdError,
        );
    });

    /**
     * Proves registry output ordering is independent of input order.
     */
    it("enumerates deterministically regardless of registration order", () => {
        const registry = buildRegistry();

        expect(registry.list().map((contract) => contract.id)).toEqual([
            "test.action.noop@1",
            "test.condition.value@1",
            "test.condition.value@2",
        ]);
    });

    /**
     * Proves every registered synthetic contract has explicit positive and
     * negative parameter evidence and that the evidence agrees with validators.
     */
    it("requires explicit contract fixtures for every registered capability", () => {
        const registry = buildRegistry();

        expect(
            [...fixtures.keys()].sort((left, right) =>
                left.localeCompare(right),
            ),
        ).toEqual(registry.list().map((contract) => contract.id));

        for (const contract of registry.list()) {
            const contractFixtures = fixtures.get(contract.id);

            expect(contractFixtures).toBeDefined();

            if (contractFixtures === undefined)
                continue;

            for (const fixture of contractFixtures) {
                expect(contract.validateParameters(fixture.input).ok).toBe(
                    fixture.valid,
                );
            }
        }
    });

    /**
     * Proves registry role metadata prevents an action capability instance from being
     * accepted merely because it is wrapped in condition-shaped syntax.
     */
    it("detects capability-instance/expression role mismatch through the registry contract", () => {
        const registry = buildRegistry();
        const actionInstance = createCapabilityInstance(action, "noop");
        const incorrectlyWrapped = createConditionExpression(actionInstance);

        const result = validateCanonicalExpression(
            registry,
            incorrectlyWrapped,
        );

        expect(result.ok).toBe(false);

        if (!result.ok) {
            expect(result.issues.map((issue) => issue.code)).toContain(
                "capability.role-mismatch",
            );
        }
    });
});
