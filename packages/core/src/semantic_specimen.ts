/**
 * Defines validated concrete semantic-capability specimens and registry-owned
 * semantic equality for their parameter values.
 *
 * @packageDocumentation
 */

import type { CapabilityId } from "./capability_id.js";
import type { SemanticCapabilityContract } from "./capability_contract.js";
import type { CapabilityRegistry } from "./capability_registry.js";
import type { ValidationIssue } from "./validation.js";

/**
 * Concrete invocation of one semantic capability with canonicalized parameters.
 *
 * @typeParam TParameters Canonical parameter value stored by this specimen.
 */
export interface CapabilitySpecimen<TParameters = unknown> {
    /** Discriminator identifying a leaf semantic-capability specimen. */
    readonly kind: "capability";

    /** Exact versioned semantic contract governing the parameters. */
    readonly capabilityId: CapabilityId;

    /** Canonical parameter value accepted by that semantic contract. */
    readonly parameters: TParameters;
}

/**
 * Reports that parameters supplied for specimen construction violate the
 * selected semantic contract.
 */
export class InvalidCapabilityParametersError extends Error {
    /** Semantic capability whose parameter contract rejected the value. */
    public readonly capabilityId: CapabilityId;

    /** Frozen structured validation issues returned by the contract. */
    public readonly issues: readonly ValidationIssue[];

    /**
     * Creates a specimen-construction error from contract validation failures.
     *
     * @param capabilityId Semantic identity whose parameters were invalid.
     * @param issues Structured validation evidence produced by the contract.
     */
    public constructor(
        capabilityId: CapabilityId,
        issues: readonly ValidationIssue[],
    ) {
        super(`Parameters for capability "${capabilityId}" are invalid.`);
        this.name = "InvalidCapabilityParametersError";
        this.capabilityId = capabilityId;
        this.issues = Object.freeze([...issues]);
    }
}

/**
 * Validates parameters under a typed semantic contract and snapshots the
 * resulting canonical value into an immutable specimen.
 *
 * @typeParam TParameters Canonical parameter shape owned by the contract.
 * @param contract Semantic contract that validates and interprets the value.
 * @param parameters Candidate parameters for this concrete specimen.
 * @returns Frozen specimen containing the contract's canonicalized parameters.
 * @throws InvalidCapabilityParametersError When contract validation fails.
 */
export function createCapabilitySpecimen<TParameters>(
    contract: SemanticCapabilityContract<TParameters>,
    parameters: TParameters,
): CapabilitySpecimen<TParameters> {
    const validation = contract.validateParameters(parameters);

    if (!validation.ok) {
        throw new InvalidCapabilityParametersError(
            contract.id,
            validation.issues,
        );
    }

    return Object.freeze({
        kind: "capability",
        capabilityId: contract.id,
        parameters: validation.value,
    });
}

/**
 * Compares two specimens using the registered semantic contract for their
 * shared capability identity.
 *
 * @remarks
 * Different capability identities are never equal. If the identity has no
 * registered contract, this function returns false rather than inventing
 * parameter-equality semantics.
 *
 * @param registry Registry that owns the equality contract.
 * @param left First capability specimen.
 * @param right Second capability specimen.
 * @returns Whether both specimens have the same identity and semantically
 * equal parameters under the registered contract.
 */
export function areCapabilitySpecimensEqual(
    registry: CapabilityRegistry,
    left: CapabilitySpecimen,
    right: CapabilitySpecimen,
): boolean {
    if (left.capabilityId !== right.capabilityId)
        return false;

    const contract = registry.get(left.capabilityId);

    if (contract === undefined)
        return false;

    return contract.areParametersEqual(left.parameters, right.parameters);
}
