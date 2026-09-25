/**
 * Defines runtime/datable Sieve endpoint capability profiles and refines the
 * general Sieve dialect target by advertised extension availability.
 *
 * @remarks
 * Profiles may only narrow the dialect-level Direct domain. They do not redefine
 * Sieve semantics, codec parsing, or canonical capability meaning.
 *
 * @packageDocumentation
 */

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

/**
 * Normalized optional-extension data advertised/known for one Sieve endpoint.
 */
export interface SieveEndpointProfileData {
    /** Sorted, deduplicated, lowercased extension names. */
    readonly extensions: readonly string[];
}

/**
 * Generic endpoint capability profile carrying normalized Sieve extensions.
 */
export type SieveEndpointProfile =
    EndpointCapabilityProfile<SieveEndpointProfileData>;

/**
 * Sieve dialect target narrowed by one concrete endpoint capability profile.
 */
export type SieveEndpointRealizationTarget =
    EndpointRefinedRealizationTarget<SieveEndpointProfileData>;

/**
 * Reports malformed Sieve endpoint profile data before it can affect
 * realization planning.
 */
export class InvalidSieveEndpointProfileError extends Error {
    /**
     * Creates an endpoint-profile validation diagnostic.
     *
     * @param message Human-readable profile-definition failure.
     */
    public constructor(message: string) {
        super(message);
        this.name = "InvalidSieveEndpointProfileError";
    }
}

/**
 * Normalizes one endpoint's advertised Sieve extension set into a stable profile.
 *
 * @param id Stable endpoint-profile identity, typically including provenance/date
 * when the data is a snapshot.
 * @param extensions Extension names observed or otherwise supplied for the
 * endpoint.
 * @returns Immutable normalized Sieve endpoint profile.
 * @throws InvalidSieveEndpointProfileError When any extension name is blank.
 * @throws InvalidEndpointProfileError When the delegated profile ID is blank.
 */
export function defineSieveEndpointProfile(
    id: string,
    extensions: Iterable<string>,
): SieveEndpointProfile {
    /** Deterministically normalized extension set retained by the profile. */
    const normalizedExtensions = normalizeExtensions(extensions);

    return defineEndpointCapabilityProfile({
        id,
        data: Object.freeze({
            extensions: Object.freeze(normalizedExtensions),
        }),
    });
}

/**
 * Creates a target that narrows dialect-level Direct realizations according to
 * one supplied endpoint extension profile.
 *
 * @remarks
 * The core refinement wrapper first executes `sieveDirectRealizationTarget`.
 * Consequently, this layer can reject a Direct result because an extension is
 * unavailable, but it can never promote a dialect-level Unsupported result.
 *
 * @param profile Concrete endpoint extension profile.
 * @returns Endpoint-refined Sieve realization target.
 */
export function createSieveEndpointRealizationTarget(
    profile: SieveEndpointProfile,
): SieveEndpointRealizationTarget {
    return refineTargetWithEndpointProfile({
        id: `sieve.endpoint:${profile.id}`,
        baseTarget: sieveDirectRealizationTarget,
        profile,
        refineDirectRealization: (expression, endpointProfile) => {
            /** Extensions required by this already-Direct dialect realization. */
            const requiredExtensions = collectRequiredExtensions(expression);
            /** Normalized extension membership exposed by the endpoint profile. */
            const available = new Set(endpointProfile.data.extensions);
            /** Required extensions absent from the concrete endpoint profile. */
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

/**
 * Canonicalizes an endpoint extension iterable for deterministic comparison.
 *
 * @param extensions Raw extension names.
 * @returns Sorted unique lowercased names with surrounding whitespace removed.
 * @throws InvalidSieveEndpointProfileError When an entry normalizes to empty.
 */
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

/**
 * Collects Sieve extensions required by the current exact realization of a
 * canonical expression.
 *
 * @remarks
 * This is intentionally implementation-local to the initial exact slice:
 * mark-read requires `imap4flags`; current Direct conditions require no
 * optional extension here. It is not a complete map of all possible Sieve
 * semantics.
 *
 * @param expression Canonical expression already eligible for dialect-level
 * realization.
 * @returns Sorted unique required extension names.
 */
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

/**
 * Deduplicates and sorts extension names for deterministic recursive aggregation.
 *
 * @param values Extension names collected from child expressions.
 * @returns Sorted unique extension names.
 */
function uniqueSorted(values: readonly string[]): readonly string[] {
    return [...new Set(values)].sort();
}
