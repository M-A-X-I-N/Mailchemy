import type { CanonicalExpression } from "./expression.js";
import type { UnsupportedRealization } from "./realization.js";

export interface EncodedNative<TNative> {
    readonly kind: "encoded";
    readonly native: TNative;
}

export type EncodeResult<TNative> =
    EncodedNative<TNative> | UnsupportedRealization;

export interface DecodedNative {
    readonly kind: "decoded";
    readonly expression: CanonicalExpression;
}

export interface OpaqueNative<TNative> {
    readonly kind: "opaque";
    readonly native: TNative;
    readonly message: string;
}

export type NativeDecodeReasonCode =
    "invalid-native" | "semantic-unsupported" | "exactness-unproven";

export interface NativeDecodeReason {
    readonly code: NativeDecodeReasonCode;
    readonly message: string;
}

export interface UnsupportedNativeDecode {
    readonly kind: "unsupported-native";
    readonly reason: NativeDecodeReason;
}

export type DecodeResult<TNative> =
    DecodedNative | OpaqueNative<TNative> | UnsupportedNativeDecode;

export interface SemanticCodec<TNative> {
    readonly id: string;
    readonly encode: (expression: CanonicalExpression) => EncodeResult<TNative>;
    readonly decode: (native: TNative) => DecodeResult<TNative>;
}

export interface SemanticCodecDefinition<TNative> {
    readonly id: string;
    readonly encode: (expression: CanonicalExpression) => EncodeResult<TNative>;
    readonly decode: (native: TNative) => DecodeResult<TNative>;
}

export class InvalidCodecDefinitionError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = "InvalidCodecDefinitionError";
    }
}

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

export function encodedNative<TNative>(
    native: TNative,
): EncodedNative<TNative> {
    return Object.freeze({
        kind: "encoded",
        native,
    });
}

export function decodedNative(expression: CanonicalExpression): DecodedNative {
    return Object.freeze({
        kind: "decoded",
        expression,
    });
}

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

export function nativeDecodeReason(
    code: NativeDecodeReasonCode,
    message: string,
): NativeDecodeReason {
    return Object.freeze({
        code,
        message: requireMessage(message, "Native-decode message"),
    });
}

export function unsupportedNativeDecode(
    reason: NativeDecodeReason,
): UnsupportedNativeDecode {
    return Object.freeze({
        kind: "unsupported-native",
        reason,
    });
}

function requireMessage(message: string, label: string): string {
    const normalized = message.trim();

    if (normalized.length === 0)
        throw new Error(`${label} must not be empty.`);

    return normalized;
}
