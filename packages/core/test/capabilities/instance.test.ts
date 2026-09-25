/**
 * Proves capability-instance construction, parameter canonicalization,
 * validation failure, registry-owned equality, and unknown-contract behavior.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    InvalidCapabilityParametersError,
    areCapabilityInstancesEqual,
    createCapabilityInstance,
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
 * Creates a synthetic boolean condition contract for instance tests.
 *
 * @param id Canonical synthetic semantic identity.
 * @returns Contract that validates/canonicalizes one boolean property.
 */
function makeBooleanContract(id: string) {
    return defineSemanticCapability<BooleanParameters>({
        id: parseCapabilityId(id),
        role: "condition",
        description: "Synthetic boolean instance contract.",
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
 * canonical capability instances.
 */
describe("CapabilityInstance", () => {
    /**
     * Proves instance construction retains the contract's canonicalized frozen
     * value rather than a later-mutated caller object.
     */
    it("stores a validated canonical parameter value", () => {
        const contract = makeBooleanContract("test.condition.boolean@1");
        const input = { value: true };
        const instance = createCapabilityInstance(contract, input);

        input.value = false;

        expect(Object.isFrozen(instance)).toBe(true);
        expect(instance.capabilityId).toBe(contract.id);
        expect(instance.parameters).toEqual({ value: true });
        expect(Object.isFrozen(instance.parameters)).toBe(true);
    });

    /**
     * Proves invalid parameters cannot enter canonical instances by bypassing
     * contract validation.
     */
    it("rejects parameters that violate the semantic contract", () => {
        const contract = makeBooleanContract("test.condition.boolean@1");

        expect(() =>
            createCapabilityInstance(contract, {
                value: "not-boolean",
            } as never),
        ).toThrow(InvalidCapabilityParametersError);
    });

    /**
     * Proves instance equality delegates parameter meaning to the registered
     * contract after requiring exact capability identity.
     */
    it("delegates semantic parameter equality to the registered contract", () => {
        const contract = makeBooleanContract("test.condition.boolean@1");
        const otherContract = makeBooleanContract("test.condition.other@1");
        const registry = new CapabilityRegistry();
        registry.register(contract);
        registry.register(otherContract);

        const trueA = createCapabilityInstance(contract, { value: true });
        const trueB = createCapabilityInstance(contract, { value: true });
        const falseValue = createCapabilityInstance(contract, { value: false });
        const other = createCapabilityInstance(otherContract, { value: true });

        expect(areCapabilityInstancesEqual(registry, trueA, trueB)).toBe(true);
        expect(areCapabilityInstancesEqual(registry, trueA, falseValue)).toBe(
            false,
        );
        expect(areCapabilityInstancesEqual(registry, trueA, other)).toBe(false);
    });

    /**
     * Proves equality fails closed when no registry contract exists to define
     * parameter semantics.
     */
    it("does not invent equality semantics for an unregistered capability", () => {
        const contract = makeBooleanContract("test.condition.boolean@1");
        const instance = createCapabilityInstance(contract, { value: true });

        expect(
            areCapabilityInstancesEqual(
                new CapabilityRegistry(),
                instance,
                instance,
            ),
        ).toBe(false);
    });
});
