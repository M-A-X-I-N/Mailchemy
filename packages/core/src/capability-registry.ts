/**
 * Implements heterogeneous registration and deterministic lookup/enumeration of
 * immutable semantic capability contracts.
 *
 * @packageDocumentation
 */

import { capabilityIdKey, type CapabilityId } from "./capability-id.js";
import {
    eraseCapabilityContract,
    type RegisteredCapabilityContract,
    type SemanticCapabilityContract,
} from "./capability-contract.js";

/**
 * Reports an attempt to redefine an already-registered semantic identity.
 */
export class DuplicateCapabilityIdError extends Error {
    /**
     * Creates a duplicate-registration diagnostic for the conflicting identity.
     *
     * @param id Semantic capability identity already present in the registry.
     */
    public constructor(id: CapabilityId) {
        super(`Capability "${id}" is already registered.`);
        this.name = "DuplicateCapabilityIdError";
    }
}

/**
 * Stores type-erased semantic capability contracts by stable identity.
 *
 * @remarks
 * Registration is intentionally one-way: an existing semantic identity cannot
 * be replaced in place. Deterministic enumeration sorts by canonical ID rather
 * than exposing insertion order.
 */
export class CapabilityRegistry {
    /** Internal heterogeneous contract storage keyed by canonical identity. */
    readonly #contracts = new Map<string, RegisteredCapabilityContract>();

    /** Number of distinct semantic identities currently registered. */
    public get size(): number {
        return this.#contracts.size;
    }

    /**
     * Registers one typed capability after erasing only its static parameter
     * type, not its runtime validation/equality behavior.
     *
     * @typeParam TParameters Canonical parameter shape of the supplied contract.
     * @param contract Typed semantic contract to add.
     * @returns The immutable erased contract retained by the registry.
     * @throws DuplicateCapabilityIdError When the identity is already present.
     */
    public register<TParameters>(
        contract: SemanticCapabilityContract<TParameters>,
    ): RegisteredCapabilityContract {
        const key = capabilityIdKey(contract.id);

        if (this.#contracts.has(key))
            throw new DuplicateCapabilityIdError(contract.id);

        const registered = eraseCapabilityContract(contract);
        this.#contracts.set(key, registered);

        return registered;
    }

    /**
     * Tests whether a semantic identity is registered.
     *
     * @param id Canonical capability identity to query.
     * @returns Whether a contract exists for that exact versioned identity.
     */
    public has(id: CapabilityId): boolean {
        return this.#contracts.has(capabilityIdKey(id));
    }

    /**
     * Retrieves the erased contract for one exact semantic identity.
     *
     * @param id Canonical capability identity to query.
     * @returns Registered contract, or undefined when the identity is unknown.
     */
    public get(id: CapabilityId): RegisteredCapabilityContract | undefined {
        return this.#contracts.get(capabilityIdKey(id));
    }

    /**
     * Returns a stable immutable snapshot of all registered contracts.
     *
     * @returns Contracts sorted lexicographically by canonical capability ID.
     */
    public list(): readonly RegisteredCapabilityContract[] {
        return Object.freeze(
            [...this.#contracts.values()].sort((left, right) =>
                left.id.localeCompare(right.id),
            ),
        );
    }
}
