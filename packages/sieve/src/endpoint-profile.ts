import {
  defineEndpointCapabilityProfile,
  directRealization,
  markReadCapability,
  refineTargetWithEndpointProfile,
  unsupportedRealization,
  unsupportedReason,
  type CanonicalExpression,
  type EndpointCapabilityProfile,
  type EndpointRefinedRealizationTarget,
} from "@mailchemy/core";

import { sieveDirectRealizationTarget } from "./sieve-target.js";

export interface SieveEndpointProfileData {
  readonly extensions: readonly string[];
}

export type SieveEndpointProfile =
  EndpointCapabilityProfile<SieveEndpointProfileData>;

export type SieveEndpointRealizationTarget =
  EndpointRefinedRealizationTarget<SieveEndpointProfileData>;

export class InvalidSieveEndpointProfileError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidSieveEndpointProfileError";
  }
}

export function defineSieveEndpointProfile(
  id: string,
  extensions: Iterable<string>,
): SieveEndpointProfile {
  const normalizedExtensions = normalizeExtensions(extensions);

  return defineEndpointCapabilityProfile({
    id,
    data: Object.freeze({
      extensions: Object.freeze(normalizedExtensions),
    }),
  });
}

export function createSieveEndpointRealizationTarget(
  profile: SieveEndpointProfile,
): SieveEndpointRealizationTarget {
  return refineTargetWithEndpointProfile({
    id: `sieve.endpoint:${profile.id}`,
    baseTarget: sieveDirectRealizationTarget,
    profile,
    refineDirectRealization: (expression, endpointProfile) => {
      const requiredExtensions = collectRequiredExtensions(expression);
      const available = new Set(endpointProfile.data.extensions);
      const missing = requiredExtensions.filter(
        (extension) => !available.has(extension),
      );

      if (missing.length > 0) {
        return unsupportedRealization(
          unsupportedReason(
            "endpoint-profile-missing",
            `Sieve endpoint profile "${endpointProfile.id}" is missing required extension(s): ${missing.join(", ")}.`,
          ),
        );
      }

      return directRealization();
    },
  });
}

function normalizeExtensions(extensions: Iterable<string>): string[] {
  const normalized = new Set<string>();

  for (const extension of extensions) {
    const value = extension.trim().toLowerCase();

    if (value.length === 0) {
      throw new InvalidSieveEndpointProfileError(
        "Sieve endpoint extension names must not be empty.",
      );
    }

    normalized.add(value);
  }

  return [...normalized].sort();
}

function collectRequiredExtensions(
  expression: CanonicalExpression,
): readonly string[] {
  switch (expression.kind) {
    case "condition":
      return [];
    case "action":
      return expression.specimen.capabilityId === markReadCapability.id
        ? ["imap4flags"]
        : [];
    case "and":
      return uniqueSorted(
        expression.operands.flatMap((operand) =>
          collectRequiredExtensions(operand),
        ),
      );
    case "rule":
      return uniqueSorted([
        ...collectRequiredExtensions(expression.condition),
        ...expression.actions.flatMap((action) =>
          collectRequiredExtensions(action),
        ),
      ]);
  }
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort();
}
