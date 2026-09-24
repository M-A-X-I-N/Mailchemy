import type { CanonicalExpression } from "./expression.js";
import type {
  DirectRealization,
  UnsupportedRealization,
} from "./realization.js";

export type DirectRealizationResult =
  | DirectRealization
  | UnsupportedRealization;

export interface DirectRealizationTarget {
  readonly id: string;
  readonly checkDirectRealization: (
    expression: CanonicalExpression,
  ) => DirectRealizationResult;
}

export interface DirectRealizationTargetDefinition {
  readonly id: string;
  readonly checkDirectRealization: (
    expression: CanonicalExpression,
  ) => DirectRealizationResult;
}

export class InvalidRealizationTargetError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidRealizationTargetError";
  }
}

export function defineDirectRealizationTarget(
  definition: DirectRealizationTargetDefinition,
): DirectRealizationTarget {
  const id = definition.id.trim();

  if (id.length === 0) {
    throw new InvalidRealizationTargetError("Target ID must not be empty.");
  }

  return Object.freeze({
    id,
    checkDirectRealization: definition.checkDirectRealization,
  });
}
