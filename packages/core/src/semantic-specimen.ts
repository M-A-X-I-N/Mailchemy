import type { CapabilityId } from "./capability-id.js";
import type { SemanticCapabilityContract } from "./capability-contract.js";
import type { CapabilityRegistry } from "./capability-registry.js";
import type { ValidationIssue } from "./validation.js";

export interface CapabilitySpecimen<TParameters = unknown> {
    readonly kind: "capability";
    readonly capabilityId: CapabilityId;
    readonly parameters: TParameters;
}

export class InvalidCapabilityParametersError extends Error {
    public readonly capabilityId: CapabilityId;
    public readonly issues: readonly ValidationIssue[];

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

export function areCapabilitySpecimensEqual(
    registry: CapabilityRegistry,
    left: CapabilitySpecimen,
    right: CapabilitySpecimen,
): boolean {
    if (left.capabilityId !== right.capabilityId) {
        return false;
    }

    const contract = registry.get(left.capabilityId);

    if (contract === undefined) {
        return false;
    }

    return contract.areParametersEqual(left.parameters, right.parameters);
}
