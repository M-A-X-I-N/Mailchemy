/**
 * Defines exact-realization result categories and structured reasons for
 * refusing to claim an exact target realization.
 *
 * @remarks
 * These result types report realization evidence; they do not themselves
 * perform rewrite search, encode native representations, or describe endpoint
 * transport.
 *
 * @packageDocumentation
 */

/**
 * Stable machine-readable category explaining why no exact realization is
 * currently available.
 *
 * @remarks
 * The codes deliberately distinguish absence, refinement rejection, structural
 * limits, endpoint narrowing, unproven exactness, and known non-equivalence.
 */
export type UnsupportedReasonCode =
    | "capability-absent"
    | "refinement-rejected"
    | "structure-unsupported"
    | "endpoint-profile-missing"
    | "exactness-unproven"
    | "known-non-equivalent";

/**
 * Structured diagnostic attached to an Unsupported realization.
 */
export interface UnsupportedReason {
    /** Machine-readable refusal category. */
    readonly code: UnsupportedReasonCode;

    /** Human-readable explanation specific to the rejected realization. */
    readonly message: string;
}

/**
 * Reports that a concrete semantic expression/structure is exactly realizable
 * by the target without a semantic rewrite.
 */
export interface DirectRealization {
    /** Discriminator for direct target realization. */
    readonly kind: "direct";
}

/**
 * Reports that an exact semantic rewrite path reaches a realizable equivalent.
 *
 * @remarks
 * This type reserves the architectural Derived classification. Constructing
 * one does not imply that general rewrite search is implemented.
 */
export interface DerivedRealization {
    /** Discriminator for exact rewrite-derived realization. */
    readonly kind: "derived";

    /** Human-readable derivation explanation retained for diagnostics. */
    readonly explanation: string;
}

/**
 * Reports that no proven exact realization is currently available.
 */
export interface UnsupportedRealization {
    /** Discriminator for unsupported realization. */
    readonly kind: "unsupported";

    /** Structured evidence explaining why exact realization was refused. */
    readonly reason: UnsupportedReason;
}

/**
 * Complete exact-realization classification used by Mailchemy diagnostics and
 * planning surfaces.
 */
export type RealizationResult =
    DirectRealization | DerivedRealization | UnsupportedRealization;

/**
 * Returns the shared immutable Direct realization marker.
 *
 * @returns Singleton result denoting exact direct realization.
 */
export function directRealization(): DirectRealization {
    return DIRECT_REALIZATION;
}

/**
 * Constructs an immutable Derived realization diagnostic.
 *
 * @param explanation Non-empty explanation of the exact derivation path.
 * @returns Frozen Derived realization with normalized explanation text.
 * @throws Error When the explanation is empty or whitespace-only.
 */
export function derivedRealization(explanation: string): DerivedRealization {
    const normalized = explanation.trim();

    if (normalized.length === 0)
        throw new Error("Derived realization explanation must not be empty.");

    return Object.freeze({
        kind: "derived",
        explanation: normalized,
    });
}

/**
 * Constructs an immutable reason for refusing an exact realization claim.
 *
 * @param code Stable machine-readable refusal category.
 * @param message Non-empty human-readable diagnostic.
 * @returns Frozen Unsupported reason with normalized message text.
 * @throws Error When the message is empty or whitespace-only.
 */
export function unsupportedReason(
    code: UnsupportedReasonCode,
    message: string,
): UnsupportedReason {
    const normalized = message.trim();

    if (normalized.length === 0)
        throw new Error("Unsupported realization message must not be empty.");

    return Object.freeze({
        code,
        message: normalized,
    });
}

/**
 * Wraps a structured refusal reason as an immutable Unsupported realization.
 *
 * @param reason Structured exactness/support diagnostic.
 * @returns Frozen Unsupported realization.
 */
export function unsupportedRealization(
    reason: UnsupportedReason,
): UnsupportedRealization {
    return Object.freeze({
        kind: "unsupported",
        reason,
    });
}

/**
 * Shared immutable Direct marker because direct realization carries no
 * additional per-result payload.
 */
const DIRECT_REALIZATION: DirectRealization = Object.freeze({
    kind: "direct",
});
