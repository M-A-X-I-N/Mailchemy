/**
 * Proves semantic capability definition and registry invariants using synthetic
 * boolean contracts rather than provider-specific semantics.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    DuplicateCapabilityIdError,
    InvalidCapabilityContractError,
    defineSemanticCapability,
    invalid,
    parseCapabilityId,
    valid,
    validationIssue,
} from "@mailchemy/core";

/**
 * Synthetic canonical parameter shape used to exercise typed contract erasure.
 */
interface BooleanParameters {
    /** Boolean value whose equality semantics are intentionally trivial. */
    readonly value: boolean;
}

/**
 * Validates the synthetic boolean parameter shape used by registry tests.
 *
 * @param value Unknown candidate parameters.
 * @returns Frozen typed parameters for a boolean object or a structured
 * synthetic validation failure.
 */
function booleanParameters(value: unknown) {
    if (
        typeof value === "object" &&
        value !== null &&
        "value" in value &&
        typeof value.value === "boolean"
    )
        return valid<BooleanParameters>(Object.freeze({ value: value.value }));

    return invalid(
        validationIssue(
            "test.boolean.invalid",
            "Expected an object containing a boolean value.",
        ),
    );
}

/**
 * Builds a synthetic condition contract with caller-selected identity.
 *
 * @param id Canonical test capability ID.
 * @param references Synthetic references whose snapshot behavior may be tested.
 * @returns Immutable boolean semantic capability contract.
 */
function makeContract(id: string, references: readonly string[] = []) {
    return defineSemanticCapability<BooleanParameters>({
        id: parseCapabilityId(id),
        role: "condition",
        description: "Synthetic boolean condition used by registry tests.",
        references,
        validateParameters: booleanParameters,
        areParametersEqual: (left, right) => left.value === right.value,
    });
}

/**
 * Exercises registry immutability, erasure, uniqueness, ordering, and required
 * capability metadata independently of real Mailchemy capability semantics.
 */
describe("CapabilityRegistry", () => {
    /**
     * Proves definition/registration snapshot caller-owned metadata and preserve
     * validation plus semantic equality after type erasure.
     */
    it("registers immutable contracts and validates their parameters", () => {
        const sourceReferences = ["synthetic:test"];
        const contract = makeContract(
            "test.condition.boolean@1",
            sourceReferences,
        );
        sourceReferences.push("mutated-after-definition");

        const registry = new CapabilityRegistry();
        const registered = registry.register(contract);

        expect(Object.isFrozen(contract)).toBe(true);
        expect(Object.isFrozen(contract.references)).toBe(true);
        expect(Object.isFrozen(registered)).toBe(true);
        expect(contract.references).toEqual(["synthetic:test"]);

        expect(registered.validateParameters({ value: true })).toEqual({
            ok: true,
            value: { value: true },
        });
        expect(
            registered.areParametersEqual({ value: true }, { value: true }),
        ).toBe(true);
        expect(
            registered.areParametersEqual({ value: true }, { value: false }),
        ).toBe(false);
        expect(
            registered.areParametersEqual({ value: true }, { nope: true }),
        ).toBe(false);
    });

    /**
     * Proves a registered semantic identity cannot be silently replaced by a
     * new definition with different meaning.
     */
    it("rejects duplicate semantic identities instead of redefining them", () => {
        const registry = new CapabilityRegistry();
        const first = makeContract("test.condition.boolean@1");
        const replacement = defineSemanticCapability<BooleanParameters>({
            ...first,
            description: "Attempted replacement semantics.",
        });

        registry.register(first);

        expect(() => registry.register(replacement)).toThrow(
            DuplicateCapabilityIdError,
        );
        expect(registry.get(first.id)?.description).toBe(first.description);
    });

    /**
     * Proves enumeration is canonical-ID ordered instead of depending on
     * registration order.
     */
    it("enumerates contracts deterministically by canonical ID", () => {
        const registry = new CapabilityRegistry();

        registry.register(makeContract("zeta.condition.boolean@1"));
        registry.register(makeContract("alpha.condition.boolean@2"));
        registry.register(makeContract("alpha.condition.boolean@1"));

        expect(registry.list().map((contract) => contract.id)).toEqual([
            "alpha.condition.boolean@1",
            "alpha.condition.boolean@2",
            "zeta.condition.boolean@1",
        ]);
    });

    /**
     * Proves semantic contracts reject blank human-facing metadata rather than
     * admitting effectively undocumented registrations.
     */
    it("requires non-empty contract metadata", () => {
        expect(() =>
            defineSemanticCapability<BooleanParameters>({
                id: parseCapabilityId("test.condition.blank@1"),
                role: "condition",
                description: " ",
                validateParameters: booleanParameters,
                areParametersEqual: (left, right) => left.value === right.value,
            }),
        ).toThrow(InvalidCapabilityContractError);
    });
});
