import type { CapabilityId } from "./capability-id.js";
import type { ValidationResult } from "./validation.js";

export type CapabilityRole = "condition" | "action" | "logic";

export interface SemanticCapabilityDefinition<TParameters> {
  readonly id: CapabilityId;
  readonly role: CapabilityRole;
  readonly description: string;
  readonly references?: readonly string[];
  readonly validateParameters: (
    value: unknown,
  ) => ValidationResult<TParameters>;
  readonly areParametersEqual: (
    left: TParameters,
    right: TParameters,
  ) => boolean;
}

export interface SemanticCapabilityContract<TParameters> {
  readonly id: CapabilityId;
  readonly role: CapabilityRole;
  readonly description: string;
  readonly references: readonly string[];
  readonly validateParameters: (
    value: unknown,
  ) => ValidationResult<TParameters>;
  readonly areParametersEqual: (
    left: TParameters,
    right: TParameters,
  ) => boolean;
}

export interface RegisteredCapabilityContract {
  readonly id: CapabilityId;
  readonly role: CapabilityRole;
  readonly description: string;
  readonly references: readonly string[];
  readonly validateParameters: (
    value: unknown,
  ) => ValidationResult<unknown>;
  readonly areParametersEqual: (left: unknown, right: unknown) => boolean;
}

export class InvalidCapabilityContractError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidCapabilityContractError";
  }
}

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

export function eraseCapabilityContract<TParameters>(
  contract: SemanticCapabilityContract<TParameters>,
): RegisteredCapabilityContract {
  return Object.freeze({
    id: contract.id,
    role: contract.role,
    description: contract.description,
    references: contract.references,
    validateParameters: (value: unknown) => contract.validateParameters(value),
    areParametersEqual: (left: unknown, right: unknown) => {
      const leftResult = contract.validateParameters(left);
      const rightResult = contract.validateParameters(right);

      if (!leftResult.ok || !rightResult.ok) {
        return false;
      }

      return contract.areParametersEqual(leftResult.value, rightResult.value);
    },
  });
}
