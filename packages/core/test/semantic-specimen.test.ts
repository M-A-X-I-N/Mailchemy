/**
 * Proves capability-specimen construction, parameter canonicalization,
 * validation failure, registry-owned equality, and unknown-contract behavior.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    InvalidCapabilityParametersError,
    areCapabilitySpecimensEqual,
    createCapabilitySpecimen,
    defineSemanticCapability,
    invalid,
    parseCapabilityId,
    valid,
    validationIssue,
} from "@mailchemy/core";

/**
 * Synthetic parameter shape whose canonicalization/equality are easy to inspect.
 */
interface BooleanParameters {
    /** Boolean semantic value used by the synthetic contract. */
    readonly value: boolean;
}

/**
 * Creates a synthetic boolean condition contract for specimen tests.
 *
 * @param id Canonical synthetic semantic identity.
 * @returns Contract that validates/canonicalizes one boolean property.
 */
function makeBooleanContract(id: string) {
    return defineSemanticCapability<BooleanParameters>({
        id: parseCapabilityId(id),
        role: "condition",
        description: "Synthetic boolean specimen contract.",
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
 * Exercises the boundary between typed semantic contracts and concrete
 * canonical capability specimens.
 */
describe("CapabilitySpecimen", () => {
    /**
     * Proves specimen construction retains the contract's canonicalized frozen
     * value rather than a later-mutated caller object.
     */
    it("stores a validated canonical parameter value", () => {
        const contract = makeBooleanContract("test.condition.boolean@1");
        const input = { value: true };
        const specimen = createCapabilitySpecimen(contract, input);

        input.value = false;

        expect(Object.isFrozen(specimen)).toBe(true);
        expect(specimen.capabilityId).toBe(contract.id);
        expect(specimen.parameters).toEqual({ value: true });
        expect(Object.isFrozen(specimen.parameters)).toBe(true);
    });

    /**
     * Proves invalid parameters cannot enter canonical specimens by bypassing
     * contract validation.
     */
    it("rejects parameters that violate the semantic contract", () => {
        const contract = makeBooleanContract("test.condition.boolean@1");

        expect(() =>
            createCapabilitySpecimen(contract, {
                value: "not-boolean",
            } as never),
        ).toThrow(InvalidCapabilityParametersError);
    });

    /**
     * Proves specimen equality delegates parameter meaning to the registered
     * contract after requiring exact capability identity.
     */
    it("delegates semantic parameter equality to the registered contract", () => {
        const contract = makeBooleanContract("test.condition.boolean@1");
        const otherContract = makeBooleanContract("test.condition.other@1");
        const registry = new CapabilityRegistry();
        registry.register(contract);
        registry.register(otherContract);

        const trueA = createCapabilitySpecimen(contract, { value: true });
        const trueB = createCapabilitySpecimen(contract, { value: true });
        const falseValue = createCapabilitySpecimen(contract, { value: false });
        const other = createCapabilitySpecimen(otherContract, { value: true });

        expect(areCapabilitySpecimensEqual(registry, trueA, trueB)).toBe(true);
        expect(areCapabilitySpecimensEqual(registry, trueA, falseValue)).toBe(
            false,
        );
        expect(areCapabilitySpecimensEqual(registry, trueA, other)).toBe(false);
    });

    /**
     * Proves equality fails closed when no registry contract exists to define
     * parameter semantics.
     */
    it("does not invent equality semantics for an unregistered capability", () => {
        const contract = makeBooleanContract("test.condition.boolean@1");
        const specimen = createCapabilitySpecimen(contract, { value: true });

        expect(
            areCapabilitySpecimensEqual(
                new CapabilityRegistry(),
                specimen,
                specimen,
            ),
        ).toBe(false);
    });
});
