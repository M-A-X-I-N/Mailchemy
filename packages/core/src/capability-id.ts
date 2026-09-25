/**
 * Defines canonical capability identifiers, their validation rules, and
 * lossless decomposition into namespace/name segments plus semantic version.
 *
 * @packageDocumentation
 */

/**
 * Matches one canonical dot-separated capability-ID segment.
 *
 * Segments use lowercase kebab-case, begin with a letter, and may contain
 * lowercase letters or digits after that first character.
 */
const CAPABILITY_SEGMENT_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * Compile-time brand that prevents arbitrary strings from being mistaken for
 * validated capability identities.
 */
declare const capabilityIdBrand: unique symbol;

/**
 * Canonical, versioned identity of one semantic capability contract.
 *
 * @remarks
 * The version is part of semantic identity. Provider limitations and adapter
 * implementation versions do not change this value.
 */
export type CapabilityId = string & {
    /** Nominal brand applied only after canonical capability-ID validation. */
    readonly [capabilityIdBrand]: "CapabilityId";
};

/**
 * Lossless structured view of a validated capability identifier.
 */
export interface CapabilityIdParts {
    /**
     * Namespace/name path. At least two segments are required so an identity
     * always contains both a namespace and a capability name.
     */
    readonly segments: readonly [string, string, ...string[]];

    /** Positive safe integer version of the semantic contract. */
    readonly version: number;
}

/**
 * Reports that a string or structured identifier violates the canonical
 * capability-ID grammar.
 */
export class InvalidCapabilityIdError extends Error {
    /**
     * Creates a diagnostic that retains both the rejected source text and the
     * specific canonicalization failure.
     *
     * @param value Source identifier text that failed validation.
     * @param reason Human-readable reason the identifier is invalid.
     */
    public constructor(value: string, reason: string) {
        super(`Invalid capability ID "${value}": ${reason}`);
        this.name = "InvalidCapabilityIdError";
    }
}

/**
 * Validates namespace/name segments and narrows them to the required non-empty
 * tuple shape.
 *
 * @param segments Candidate dot-separated capability-ID segments.
 * @param source Original identifier text used in error diagnostics.
 * @throws InvalidCapabilityIdError When fewer than two segments are present or
 * any segment violates the lowercase kebab-case grammar.
 */
function validateSegments(
    segments: readonly string[],
    source: string,
): asserts segments is readonly [string, string, ...string[]] {
    if (segments.length < 2) {
        throw new InvalidCapabilityIdError(
            source,
            "expected at least a namespace and capability name",
        );
    }

    for (const segment of segments) {
        if (!CAPABILITY_SEGMENT_PATTERN.test(segment)) {
            throw new InvalidCapabilityIdError(
                source,
                `segment "${segment}" must be lowercase kebab-case starting with a letter`,
            );
        }
    }
}

/**
 * Validates the semantic-version component of a capability identity.
 *
 * @param version Candidate numeric semantic version.
 * @param source Original identifier text used in error diagnostics.
 * @throws InvalidCapabilityIdError When the version is not a positive safe
 * integer.
 */
function validateVersion(version: number, source: string): void {
    if (!Number.isSafeInteger(version) || version < 1) {
        throw new InvalidCapabilityIdError(
            source,
            "version must be a positive safe integer",
        );
    }
}

/**
 * Constructs a canonical capability identity from already-structured parts.
 *
 * @param segments Namespace/name path to join with dots.
 * @param version Positive semantic-contract version.
 * @returns The validated canonical capability identifier.
 * @throws InvalidCapabilityIdError When the supplied segments or version are
 * outside the canonical grammar.
 */
export function createCapabilityId(
    segments: readonly [string, string, ...string[]],
    version: number,
): CapabilityId {
    const source = `${segments.join(".")}@${String(version)}`;

    validateSegments(segments, source);
    validateVersion(version, source);

    return source as CapabilityId;
}

/**
 * Parses and validates canonical capability-ID text.
 *
 * @remarks
 * Parsing rejects alternative textual forms such as zero-padded versions so a
 * semantic identity has exactly one stable string representation.
 *
 * @param value Candidate canonical identifier text.
 * @returns The branded identifier when the entire string is canonical.
 * @throws InvalidCapabilityIdError When the identifier grammar, segment
 * grammar, or version encoding is invalid.
 */
export function parseCapabilityId(value: string): CapabilityId {
    const separatorIndex = value.lastIndexOf("@");

    if (
        separatorIndex <= 0 ||
        separatorIndex !== value.indexOf("@") ||
        separatorIndex === value.length - 1
    ) {
        throw new InvalidCapabilityIdError(
            value,
            "expected exactly one @version suffix",
        );
    }

    const segments = value.slice(0, separatorIndex).split(".");
    const versionText = value.slice(separatorIndex + 1);

    validateSegments(segments, value);

    if (!/^[1-9][0-9]*$/.test(versionText)) {
        throw new InvalidCapabilityIdError(
            value,
            "version must be a canonical positive integer",
        );
    }

    const version = Number(versionText);
    validateVersion(version, value);

    return createCapabilityId(segments, version);
}

/**
 * Decomposes a canonical capability identity into immutable structured parts.
 *
 * @param id Validated canonical capability identifier.
 * @returns Frozen namespace/name segments and semantic version.
 * @throws InvalidCapabilityIdError If a forged branded string does not satisfy
 * the runtime capability-ID invariants.
 */
export function capabilityIdParts(id: CapabilityId): CapabilityIdParts {
    const separatorIndex = id.lastIndexOf("@");
    const segments = id.slice(0, separatorIndex).split(".");
    const version = Number(id.slice(separatorIndex + 1));

    validateSegments(segments, id);
    validateVersion(version, id);

    return Object.freeze({
        segments: Object.freeze([...segments]) as readonly [
            string,
            string,
            ...string[],
        ],
        version,
    });
}

/**
 * Produces the stable registry/map key for a canonical capability identity.
 *
 * @param id Canonical semantic capability identity.
 * @returns The canonical string representation itself.
 */
export function capabilityIdKey(id: CapabilityId): string {
    return id;
}
