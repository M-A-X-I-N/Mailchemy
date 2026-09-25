/**
 * Defines endpoint capability profiles and a refinement layer that may narrow,
 * but never broaden, a dialect/target's direct-realization domain.
 *
 * @remarks
 * Endpoint profiles represent concrete store/transport availability or runtime
 * constraints. They do not redefine codec semantics or core capability meaning.
 *
 * @packageDocumentation
 */

import type { CanonicalExpression } from "../canonical/expression.js";
import type {
    DirectRealizationResult,
    DirectRealizationTarget,
} from "./direct_target.js";

/**
 * Immutable capability/constraint data associated with one concrete endpoint
 * profile.
 *
 * @typeParam TData Endpoint-specific profile data shape.
 */
export interface EndpointCapabilityProfile<TData> {
    /** Stable non-empty identity of the endpoint profile snapshot. */
    readonly id: string;

    /** Endpoint-specific capability data interpreted by refinement logic. */
    readonly data: TData;
}

/**
 * Authoring shape for one endpoint capability profile.
 *
 * @typeParam TData Endpoint-specific profile data shape.
 */
export interface EndpointCapabilityProfileDefinition<TData> {
    /** Stable non-empty endpoint profile identity. */
    readonly id: string;

    /** Endpoint-specific capability data to retain. */
    readonly data: TData;
}

/**
 * Endpoint-specific predicate applied only after a base target reports Direct.
 *
 * @typeParam TData Endpoint profile data shape.
 * @param expression Canonical expression already accepted by the base target.
 * @param profile Concrete endpoint capability profile.
 * @returns Direct when the endpoint permits the base realization, otherwise a
 * structured Unsupported result.
 */
export type EndpointProfileRefinement<TData> = (
    expression: CanonicalExpression,
    profile: EndpointCapabilityProfile<TData>,
) => DirectRealizationResult;

/**
 * Direct-realization target coupled to a concrete endpoint profile.
 *
 * @typeParam TData Endpoint profile data shape.
 */
export interface EndpointRefinedRealizationTarget<
    TData,
> extends DirectRealizationTarget {
    /** Dialect/general target whose support domain forms the upper bound. */
    readonly baseTarget: DirectRealizationTarget;

    /** Concrete endpoint profile used to narrow the base target. */
    readonly profile: EndpointCapabilityProfile<TData>;
}

/**
 * Authoring shape for an endpoint-refined realization target.
 *
 * @typeParam TData Endpoint profile data shape.
 */
export interface EndpointRefinedRealizationTargetDefinition<TData> {
    /** Stable non-empty identity of the combined target/profile view. */
    readonly id: string;

    /** Base target that must report Direct before endpoint refinement runs. */
    readonly baseTarget: DirectRealizationTarget;

    /** Concrete endpoint capability profile to apply. */
    readonly profile: EndpointCapabilityProfile<TData>;

    /** Endpoint-specific narrowing predicate. */
    readonly refineDirectRealization: EndpointProfileRefinement<TData>;
}

/**
 * Reports invalid endpoint-profile or refined-target metadata.
 */
export class InvalidEndpointProfileError extends Error {
    /**
     * Creates an endpoint-profile definition diagnostic.
     *
     * @param message Human-readable definition failure.
     */
    public constructor(message: string) {
        super(message);
        this.name = "InvalidEndpointProfileError";
    }
}

/**
 * Validates profile metadata and freezes one endpoint capability profile.
 *
 * @typeParam TData Endpoint profile data shape.
 * @param definition Endpoint profile definition to snapshot.
 * @returns Immutable endpoint capability profile.
 * @throws InvalidEndpointProfileError When the profile ID is blank.
 */
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

/**
 * Couples a base realization target to an endpoint profile without permitting
 * the endpoint layer to broaden support the base target already refused.
 *
 * @typeParam TData Endpoint profile data shape.
 * @param definition Refined-target definition.
 * @returns Immutable endpoint-refined direct-realization target.
 * @throws InvalidEndpointProfileError When the refined target ID is blank.
 */
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
            /**
             * Base dialect/target evidence forms the upper support bound; an
             * endpoint profile is consulted only for expressions already Direct.
             */
            const baseResult =
                definition.baseTarget.checkDirectRealization(expression);

            if (baseResult.kind === "unsupported")
                return baseResult;

            return definition.refineDirectRealization(
                expression,
                definition.profile,
            );
        },
    });
}
