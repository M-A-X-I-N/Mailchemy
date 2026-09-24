import type { CanonicalExpression } from "./expression.js";
import type {
  DirectRealizationResult,
  DirectRealizationTarget,
} from "./realization-target.js";

export interface EndpointCapabilityProfile<TData> {
  readonly id: string;
  readonly data: TData;
}

export interface EndpointCapabilityProfileDefinition<TData> {
  readonly id: string;
  readonly data: TData;
}

export type EndpointProfileRefinement<TData> = (
  expression: CanonicalExpression,
  profile: EndpointCapabilityProfile<TData>,
) => DirectRealizationResult;

export interface EndpointRefinedRealizationTarget<TData>
  extends DirectRealizationTarget {
  readonly baseTarget: DirectRealizationTarget;
  readonly profile: EndpointCapabilityProfile<TData>;
}

export interface EndpointRefinedRealizationTargetDefinition<TData> {
  readonly id: string;
  readonly baseTarget: DirectRealizationTarget;
  readonly profile: EndpointCapabilityProfile<TData>;
  readonly refineDirectRealization: EndpointProfileRefinement<TData>;
}

export class InvalidEndpointProfileError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidEndpointProfileError";
  }
}

export function defineEndpointCapabilityProfile<TData>(
  definition: EndpointCapabilityProfileDefinition<TData>,
): EndpointCapabilityProfile<TData> {
  const id = definition.id.trim();

  if (id.length === 0) {
    throw new InvalidEndpointProfileError(
      "Endpoint capability profile ID must not be empty.",
    );
  }

  return Object.freeze({
    id,
    data: definition.data,
  });
}

export function refineTargetWithEndpointProfile<TData>(
  definition: EndpointRefinedRealizationTargetDefinition<TData>,
): EndpointRefinedRealizationTarget<TData> {
  const id = definition.id.trim();

  if (id.length === 0) {
    throw new InvalidEndpointProfileError(
      "Endpoint-refined target ID must not be empty.",
    );
  }

  return Object.freeze({
    id,
    baseTarget: definition.baseTarget,
    profile: definition.profile,
    checkDirectRealization: (expression: CanonicalExpression) => {
      const baseResult =
        definition.baseTarget.checkDirectRealization(expression);

      if (baseResult.kind === "unsupported") {
        return baseResult;
      }

      return definition.refineDirectRealization(
        expression,
        definition.profile,
      );
    },
  });
}
