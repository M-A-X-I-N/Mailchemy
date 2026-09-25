/**
 * Defines offline semantic codec boundaries for encoding canonical expressions
 * to native representations and decoding native representations back toward IR.
 *
 * @remarks
 * Codec support is representation-level and direction-specific. It is distinct
 * from endpoint availability and from target realization planning.
 *
 * @packageDocumentation
 */

import type { CanonicalExpression } from "./expression.js";
import type { UnsupportedRealization } from "./realization.js";

/**
 * Successful canonical-to-native encode result.
 *
 * @typeParam TNative Native representation produced by the codec.
 */
export interface EncodedNative<TNative> {
    /** Discriminator for successful native encoding. */
    readonly kind: "encoded";

    /** Native representation produced from the canonical expression. */
    readonly native: TNative;
}

/**
 * Result of attempting to encode canonical semantics into one native dialect.
 *
 * @typeParam TNative Native representation type owned by the codec.
 */
export type EncodeResult<TNative> =
    EncodedNative<TNative> | UnsupportedRealization;

/**
 * Successful native-to-canonical decode result.
 */
export interface DecodedNative {
    /** Discriminator for successful semantic decoding. */
    readonly kind: "decoded";

    /** Canonical expression whose semantics were decoded from native input. */
    readonly expression: CanonicalExpression;
}

/**
 * Native material preserved without claiming a canonical semantic
 * interpretation.
 *
 * @typeParam TNative Native representation retained opaquely.
 */
export interface OpaqueNative<TNative> {
    /** Discriminator for opaque preservation rather than semantic decoding. */
    readonly kind: "opaque";

    /** Original native material retained for preservation/diagnostics. */
    readonly native: TNative;

    /** Human-readable explanation of why the material remains opaque. */
    readonly message: string;
}

/**
 * Stable machine-readable reason a native construct could not be decoded into
 * canonical semantics or retained through the codec's supported path.
 */
export type NativeDecodeReasonCode =
    "invalid-native" | "semantic-unsupported" | "exactness-unproven";

/**
 * Structured diagnostic for native decode refusal.
 */
export interface NativeDecodeReason {
    /** Machine-readable native-decode refusal category. */
    readonly code: NativeDecodeReasonCode;

    /** Human-readable explanation specific to the native input. */
    readonly message: string;
}

/**
 * Reports that native input cannot be represented by this decode operation.
 */
export interface UnsupportedNativeDecode {
    /** Discriminator for refused native decoding. */
    readonly kind: "unsupported-native";

    /** Structured evidence explaining the refusal. */
    readonly reason: NativeDecodeReason;
}

/**
 * Result of decoding one native value.
 *
 * @typeParam TNative Native representation type owned by the codec.
 *
 * @remarks
 * Opaque preservation is intentionally distinct from successful semantic
 * decoding and from outright decode refusal.
 */
export type DecodeResult<TNative> =
    DecodedNative | OpaqueNative<TNative> | UnsupportedNativeDecode;

/**
 * Bidirectional offline semantic mapping for one native rule representation.
 *
 * @typeParam TNative Native representation accepted/produced by the codec.
 */
export interface SemanticCodec<TNative> {
    /** Stable non-empty implementation-level codec identity. */
    readonly id: string;

    /**
     * Attempts exact canonical-to-native representation mapping.
     *
     * @param expression Canonical expression to encode.
     * @returns Encoded native representation or structured Unsupported
     * realization evidence.
     */
    readonly encode: (expression: CanonicalExpression) => EncodeResult<TNative>;

    /**
     * Attempts native-to-canonical semantic decoding.
     *
     * @param native Native representation to inspect.
     * @returns Decoded semantics, opaque preservation, or structured refusal.
     */
    readonly decode: (native: TNative) => DecodeResult<TNative>;
}

/**
 * Authoring shape for a semantic codec.
 *
 * @typeParam TNative Native representation type owned by the codec.
 */
export interface SemanticCodecDefinition<TNative> {
    /** Stable non-empty implementation-level codec identity. */
    readonly id: string;

    /**
     * Canonical-to-native mapping implementation.
     *
     * @param expression Canonical expression to encode.
     * @returns Encoded value or Unsupported realization.
     */
    readonly encode: (expression: CanonicalExpression) => EncodeResult<TNative>;

    /**
     * Native-to-canonical mapping implementation.
     *
     * @param native Native representation to inspect.
     * @returns Decoded, opaque, or unsupported-native result.
     */
    readonly decode: (native: TNative) => DecodeResult<TNative>;
}

/**
 * Reports invalid metadata supplied while defining a semantic codec.
 */
export class InvalidCodecDefinitionError extends Error {
    /**
     * Creates a codec-definition diagnostic.
     *
     * @param message Human-readable definition failure.
     */
    public constructor(message: string) {
        super(message);
        this.name = "InvalidCodecDefinitionError";
    }
}

/**
 * Validates codec metadata and freezes the bidirectional mapping surface.
 *
 * @typeParam TNative Native representation type owned by the codec.
 * @param definition Codec definition to snapshot.
 * @returns Immutable semantic codec.
 * @throws InvalidCodecDefinitionError When the codec ID is blank.
 */
export function defineSemanticCodec<TNative>(
    definition: SemanticCodecDefinition<TNative>,
): SemanticCodec<TNative> {
    const id = definition.id.trim();

    if (id.length === 0)
        throw new InvalidCodecDefinitionError("Codec ID must not be empty.");

    return Object.freeze({
        id,
        encode: definition.encode,
        decode: definition.decode,
    });
}

/**
 * Wraps a successfully encoded native representation.
 *
 * @typeParam TNative Native representation type.
 * @param native Native value produced by encoding.
 * @returns Frozen encoded-native result.
 */
export function encodedNative<TNative>(
    native: TNative,
): EncodedNative<TNative> {
    return Object.freeze({
        kind: "encoded",
        native,
    });
}

/**
 * Wraps a successfully decoded canonical semantic expression.
 *
 * @param expression Canonical expression decoded from native input.
 * @returns Frozen decoded-native result.
 */
export function decodedNative(expression: CanonicalExpression): DecodedNative {
    return Object.freeze({
        kind: "decoded",
        expression,
    });
}

/**
 * Preserves native material without claiming canonical semantic understanding.
 *
 * @typeParam TNative Native representation type.
 * @param native Native value to retain opaquely.
 * @param message Non-empty explanation of the preservation boundary.
 * @returns Frozen opaque-native result.
 * @throws Error When the diagnostic message is blank.
 */
export function opaqueNative<TNative>(
    native: TNative,
    message: string,
): OpaqueNative<TNative> {
    const normalized = requireMessage(message, "Opaque-native message");

    return Object.freeze({
        kind: "opaque",
        native,
        message: normalized,
    });
}

/**
 * Constructs a structured native-decode refusal reason.
 *
 * @param code Stable machine-readable refusal category.
 * @param message Non-empty human-readable diagnostic.
 * @returns Frozen native-decode reason.
 * @throws Error When the diagnostic message is blank.
 */
export function nativeDecodeReason(
    code: NativeDecodeReasonCode,
    message: string,
): NativeDecodeReason {
    return Object.freeze({
        code,
        message: requireMessage(message, "Native-decode message"),
    });
}

/**
 * Wraps a native-decode refusal reason.
 *
 * @param reason Structured diagnostic explaining decode refusal.
 * @returns Frozen unsupported-native result.
 */
export function unsupportedNativeDecode(
    reason: NativeDecodeReason,
): UnsupportedNativeDecode {
    return Object.freeze({
        kind: "unsupported-native",
        reason,
    });
}

/**
 * Normalizes a required human-readable diagnostic.
 *
 * @param message Candidate diagnostic text.
 * @param label Context label used if validation fails.
 * @returns Trimmed non-empty message.
 * @throws Error When the candidate is empty or whitespace-only.
 */
function requireMessage(message: string, label: string): string {
    const normalized = message.trim();

    if (normalized.length === 0)
        throw new Error(`${label} must not be empty.`);

    return normalized;
}
