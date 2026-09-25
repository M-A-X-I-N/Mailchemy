/**
 * Defines small immutable validation-result primitives shared by semantic
 * contracts and structural validation.
 *
 * @packageDocumentation
 */

/**
 * One component of a structural path into a value being validated.
 */
export type ValidationPathSegment = string | number;

/**
 * Structured validation diagnostic with a stable machine-readable code and
 * location relative to the validated root.
 */
export interface ValidationIssue {
    /** Stable category used by tests/callers to classify the failure. */
    readonly code: string;

    /** Human-readable explanation of the validation failure. */
    readonly message: string;

    /** Immutable property/index path from the validated root to the issue. */
    readonly path: readonly ValidationPathSegment[];
}

/**
 * Success-or-failure result used when invalid input is expected data rather
 * than an exceptional implementation condition.
 *
 * @typeParam T Canonical value produced after successful validation.
 */
export type ValidationResult<T> =
    | {
          /** Discriminator for successful validation. */
          readonly ok: true;

          /** Canonical validated value. */
          readonly value: T;
      }
    | {
          /** Discriminator for failed validation. */
          readonly ok: false;

          /** One or more immutable diagnostics explaining invalidity. */
          readonly issues: readonly ValidationIssue[];
      };

/**
 * Constructs an immutable structured validation diagnostic.
 *
 * @param code Stable machine-readable issue category.
 * @param message Human-readable explanation.
 * @param path Structural location of the issue, relative to the validated root.
 * @returns Frozen validation issue with a snapshotted path.
 */
export function validationIssue(
    code: string,
    message: string,
    path: readonly ValidationPathSegment[] = [],
): ValidationIssue {
    return Object.freeze({
        code,
        message,
        path: Object.freeze([...path]),
    });
}

/**
 * Constructs a successful immutable validation result.
 *
 * @typeParam T Canonical validated value type.
 * @param value Canonical value accepted by validation.
 * @returns Frozen success result carrying the value.
 */
export function valid<T>(value: T): ValidationResult<T> {
    return Object.freeze({
        ok: true,
        value,
    });
}

/**
 * Constructs an immutable failed validation result.
 *
 * @param issues One or more diagnostics explaining invalidity.
 * @returns Frozen failure result with a snapshotted issue list.
 * @throws Error When called without any issue, because an unexplained invalid
 * result would violate the validation-result invariant.
 */
export function invalid(...issues: ValidationIssue[]): ValidationResult<never> {
    if (issues.length === 0)
        throw new Error("An invalid validation result must contain an issue.");

    return Object.freeze({
        ok: false,
        issues: Object.freeze([...issues]),
    });
}
