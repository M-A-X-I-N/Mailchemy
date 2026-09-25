/**
 * Defines semantic capability-contract shapes and the construction/erasure
 * boundaries used by the heterogeneous capability registry.
 *
 * @packageDocumentation
 */

import type { CapabilityId } from "./capability-id.js";
import type { ValidationResult } from "./validation.js";

/**
 * Structural role that determines where a semantic capability may appear in
 * canonical expressions.
 */
export type CapabilityRole = "condition" | "action" | "logic";

/**
 * Authoring shape used to define one typed semantic capability contract.
 *
 * @typeParam TParameters Canonical parameter shape owned by this capability
 * version.
 */
export interface SemanticCapabilityDefinition<TParameters> {
    /** Stable, versioned identity of the semantic contract being defined. */
    readonly id: CapabilityId;

    /** Canonical expression role permitted for specimens of this capability. */
    readonly role: CapabilityRole;

    /** Human-readable summary of the capability's canonical meaning. */
    readonly description: string;

    /** Durable documentation or evidence references relevant to the contract. */
    readonly references?: readonly string[];

    /**
     * Validates and canonicalizes unknown runtime parameters.
     *
     * @param value Candidate parameter value.
     * @returns Typed canonical parameters or structured validation issues.
     */
    readonly validateParameters: (
        value: unknown,
    ) => ValidationResult<TParameters>;

    /**
     * Compares two already-valid parameter values for semantic equality.
     *
     * @param left First validated parameter value.
     * @param right Second validated parameter value.
     * @returns Whether both parameter values denote the same semantics.
     */
    readonly areParametersEqual: (
        left: TParameters,
        right: TParameters,
    ) => boolean;
}

/**
 * Immutable runtime contract for one versioned semantic capability.
 *
 * @typeParam TParameters Canonical parameter shape whose interpretation is
 * fixed by the capability version identified by {@link id}.
 */
export interface SemanticCapabilityContract<TParameters> {
    /** Stable, versioned identity of the semantic meaning. */
    readonly id: CapabilityId;

    /** Structural role permitted for specimens of this capability. */
    readonly role: CapabilityRole;

    /** Human-readable summary of the canonical semantic contract. */
    readonly description: string;

    /** Frozen durable references supporting or defining the semantics. */
    readonly references: readonly string[];

    /**
     * Validates and canonicalizes unknown runtime parameters.
     *
     * @param value Candidate parameter value.
     * @returns Typed canonical parameters or structured validation issues.
     */
    readonly validateParameters: (
        value: unknown,
    ) => ValidationResult<TParameters>;

    /**
     * Compares two valid canonical parameter values for semantic equality.
     *
     * @param left First validated parameter value.
     * @param right Second validated parameter value.
     * @returns Whether both values denote equal parameters under this contract.
     */
    readonly areParametersEqual: (
        left: TParameters,
        right: TParameters,
    ) => boolean;
}

/**
 * Type-erased capability contract stored in a heterogeneous registry.
 *
 * @remarks
 * Parameter validation remains authoritative after erasure. Equality therefore
 * accepts unknown values but returns false unless both values validate under
 * the original typed contract.
 */
export interface RegisteredCapabilityContract {
    /** Stable, versioned identity of the registered semantic contract. */
    readonly id: CapabilityId;

    /** Canonical expression role of the registered capability. */
    readonly role: CapabilityRole;

    /** Human-readable summary of the canonical meaning. */
    readonly description: string;

    /** Frozen durable references copied from the typed contract. */
    readonly references: readonly string[];

    /**
     * Validates unknown values against the original typed parameter contract.
     *
     * @param value Candidate parameter value.
     * @returns Canonicalized value or structured validation issues.
     */
    readonly validateParameters: (value: unknown) => ValidationResult<unknown>;

    /**
     * Compares unknown parameter values without bypassing validation.
     *
     * @param left First candidate parameter value.
     * @param right Second candidate parameter value.
     * @returns Whether both validate and are semantically equal.
     */
    readonly areParametersEqual: (left: unknown, right: unknown) => boolean;
}

/**
 * Reports invalid metadata supplied while defining a semantic capability.
 */
export class InvalidCapabilityContractError extends Error {
    /**
     * Creates a semantic-capability definition error.
     *
     * @param message Human-readable contract-definition failure.
     */
    public constructor(message: string) {
        super(message);
        this.name = "InvalidCapabilityContractError";
    }
}

/**
 * Validates metadata and freezes one typed semantic capability contract.
 *
 * @typeParam TParameters Canonical parameter shape owned by the capability.
 * @param definition Mutable caller-owned definition to snapshot.
 * @returns An immutable semantic capability contract.
 * @throws InvalidCapabilityContractError When the description is blank or a
 * reference entry is empty.
 */
export function defineSemanticCapability<TParameters>(
    definition: SemanticCapabilityDefinition<TParameters>,
): SemanticCapabilityContract<TParameters> {
    if (definition.description.trim().length === 0) {
        throw new InvalidCapabilityContractError(
            "Capability description must not be empty.",
        );
    }

    const references = [...(definition.references ?? [])];

    if (references.some((reference) => reference.trim().length === 0)) {
        throw new InvalidCapabilityContractError(
            "Capability references must not contain empty entries.",
        );
    }

    return Object.freeze({
        id: definition.id,
        role: definition.role,
        description: definition.description,
        references: Object.freeze(references),
        validateParameters: definition.validateParameters,
        areParametersEqual: definition.areParametersEqual,
    });
}

/**
 * Erases a typed capability contract for heterogeneous registry storage while
 * preserving parameter validation before semantic equality is attempted.
 *
 * @typeParam TParameters Canonical parameter shape of the typed contract.
 * @param contract Typed semantic contract to expose through an erased boundary.
 * @returns Frozen registry-safe view whose equality accepts unknown values only
 * after validating both with the original contract.
 */
export function eraseCapabilityContract<TParameters>(
    contract: SemanticCapabilityContract<TParameters>,
): RegisteredCapabilityContract {
    return Object.freeze({
        id: contract.id,
        role: contract.role,
        description: contract.description,
        references: contract.references,
        validateParameters: (value: unknown) =>
            contract.validateParameters(value),
        areParametersEqual: (left: unknown, right: unknown) => {
            const leftResult = contract.validateParameters(left);
            const rightResult = contract.validateParameters(right);

            if (!leftResult.ok || !rightResult.ok)
                return false;

            return contract.areParametersEqual(
                leftResult.value,
                rightResult.value,
            );
        },
    });
}
