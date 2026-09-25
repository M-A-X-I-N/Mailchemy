/**
 * Defines target-local direct-realization checks over concrete canonical
 * expressions and structures.
 *
 * @remarks
 * A direct target answers only whether it can realize the supplied canonical
 * expression as-is. Exact rewrite planning and endpoint-specific narrowing are
 * separate layers.
 *
 * @packageDocumentation
 */

import type { CanonicalExpression } from "../canonical/expression.js";
import type {
    DirectRealization,
    UnsupportedRealization,
} from "./result.js";

/**
 * Outcome permitted from a target's direct-realization check.
 *
 * @remarks
 * Derived is intentionally absent because a direct target does not perform
 * rewrite search.
 */
export type DirectRealizationResult =
    DirectRealization | UnsupportedRealization;

/**
 * Immutable target contract that classifies concrete canonical expressions for
 * direct exact realizability.
 */
export interface DirectRealizationTarget {
    /** Stable implementation-level identity of this target contract. */
    readonly id: string;

    /**
     * Classifies a concrete canonical expression without rewriting it.
     *
     * @param expression Canonical expression or structure to inspect.
     * @returns Direct when exact native realization is available as-is, or an
     * Unsupported diagnostic otherwise.
     */
    readonly checkDirectRealization: (
        expression: CanonicalExpression,
    ) => DirectRealizationResult;
}

/**
 * Authoring shape used to define a direct-realization target.
 */
export interface DirectRealizationTargetDefinition {
    /** Stable non-empty implementation-level target identity. */
    readonly id: string;

    /**
     * Concrete, target-authoritative direct-support predicate.
     *
     * @param expression Canonical expression or structure to inspect.
     * @returns Direct or a structured Unsupported result.
     */
    readonly checkDirectRealization: (
        expression: CanonicalExpression,
    ) => DirectRealizationResult;
}

/**
 * Reports invalid metadata supplied while defining a realization target.
 */
export class InvalidRealizationTargetError extends Error {
    /**
     * Creates a target-definition diagnostic.
     *
     * @param message Human-readable definition failure.
     */
    public constructor(message: string) {
        super(message);
        this.name = "InvalidRealizationTargetError";
    }
}

/**
 * Validates target metadata and freezes one direct-realization contract.
 *
 * @param definition Direct-target definition to snapshot.
 * @returns Immutable target preserving the supplied support predicate.
 * @throws InvalidRealizationTargetError When the target ID is blank.
 */
export function defineDirectRealizationTarget(
    definition: DirectRealizationTargetDefinition,
): DirectRealizationTarget {
    const id = definition.id.trim();

    if (id.length === 0)
        throw new InvalidRealizationTargetError("Target ID must not be empty.");

    return Object.freeze({
        id,
        checkDirectRealization: definition.checkDirectRealization,
    });
}
