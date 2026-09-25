/**
 * Proves the offline semantic codec contract, including directional encode/decode
 * behavior, opaque preservation, decode refusal, and definition metadata.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    createCapabilitySpecimen,
    createConditionExpression,
    decodedNative,
    defineSemanticCapability,
    defineSemanticCodec,
    encodedNative,
    invalid,
    nativeDecodeReason,
    opaqueNative,
    parseCapabilityId,
    unsupportedNativeDecode,
    unsupportedRealization,
    unsupportedReason,
    valid,
    validationIssue,
} from "@mailchemy/core";

/**
 * Synthetic boolean condition used solely to exercise codec boundaries.
 */
const booleanCondition = defineSemanticCapability<{ readonly value: boolean }>({
    id: parseCapabilityId("test.condition.boolean@1"),
    role: "condition",
    description: "Synthetic condition for codec tests.",
    validateParameters: (value) => {
        if (
            typeof value === "object" &&
            value !== null &&
            "value" in value &&
            typeof value.value === "boolean"
        )
            return valid(Object.freeze({ value: value.value }));

        return invalid(
            validationIssue(
                "test.boolean.invalid",
                "Expected an object containing a boolean value.",
            ),
        );
    },
    areParametersEqual: (left, right) => left.value === right.value,
});

/**
 * Constructs a canonical synthetic boolean condition expression.
 *
 * @param value Boolean parameter represented by the synthetic capability.
 * @returns Canonical condition expression used as codec input/expected output.
 */
function booleanExpression(value: boolean) {
    return createConditionExpression(
        createCapabilitySpecimen(booleanCondition, { value }),
    );
}

/**
 * Exercises codec semantics using synthetic native strings rather than evidence
 * about any concrete provider or wire format.
 */
describe("SemanticCodec", () => {
    /**
     * Proves encode/decode are pure offline representation transforms and can
     * round-trip the supported synthetic semantic subset without endpoint data.
     */
    it("encodes and decodes entirely offline", () => {
        const codec = defineSemanticCodec<string>({
            id: "synthetic.boolean-codec",
            encode: (expression) => {
                if (
                    expression.kind === "condition" &&
                    expression.specimen.capabilityId === booleanCondition.id
                ) {
                    const parameters = expression.specimen.parameters as {
                        readonly value: boolean;
                    };

                    return encodedNative(`BOOL:${String(parameters.value)}`);
                }

                return unsupportedRealization(
                    unsupportedReason(
                        "capability-absent",
                        "Synthetic codec only understands the boolean condition.",
                    ),
                );
            },
            decode: (native) => {
                if (native === "BOOL:true")
                    return decodedNative(booleanExpression(true));

                if (native === "BOOL:false")
                    return decodedNative(booleanExpression(false));

                if (native.startsWith("EXT:")) {
                    return opaqueNative(
                        native,
                        "Synthetic extension is preserved without semantic interpretation.",
                    );
                }

                return unsupportedNativeDecode(
                    nativeDecodeReason(
                        "invalid-native",
                        "Synthetic native value is not recognized.",
                    ),
                );
            },
        });

        const encoded = codec.encode(booleanExpression(true));

        expect(encoded).toEqual({
            kind: "encoded",
            native: "BOOL:true",
        });

        expect(codec.decode("BOOL:false")).toEqual({
            kind: "decoded",
            expression: booleanExpression(false),
        });
    });

    /**
     * Proves ordinary canonical-to-native incompatibility is represented as an
     * Unsupported realization result rather than an exceptional control path.
     */
    it("reports ordinary encode incompatibility without throwing", () => {
        const codec = defineSemanticCodec<string>({
            id: "synthetic.rejecting-codec",
            encode: () =>
                unsupportedRealization(
                    unsupportedReason(
                        "known-non-equivalent",
                        "Synthetic codec intentionally rejects the expression.",
                    ),
                ),
            decode: (native) =>
                opaqueNative(
                    native,
                    "Synthetic native value is preserved opaquely.",
                ),
        });

        expect(codec.encode(booleanExpression(true))).toEqual({
            kind: "unsupported",
            reason: {
                code: "known-non-equivalent",
                message:
                    "Synthetic codec intentionally rejects the expression.",
            },
        });
    });

    /**
     * Proves preserving unknown native material is a distinct outcome from
     * refusing decode because the construct cannot be represented/preserved.
     */
    it("distinguishes opaque preservation from native decode refusal", () => {
        const codec = defineSemanticCodec<string>({
            id: "synthetic.decode-boundaries",
            encode: () => encodedNative("unused"),
            decode: (native) =>
                native.startsWith("OPAQUE:")
                    ? opaqueNative(native, "Preserved but not understood.")
                    : unsupportedNativeDecode(
                        nativeDecodeReason(
                            "semantic-unsupported",
                            "Native construct cannot be represented or preserved.",
                        ),
                    ),
        });

        expect(codec.decode("OPAQUE:vendor-extension")).toEqual({
            kind: "opaque",
            native: "OPAQUE:vendor-extension",
            message: "Preserved but not understood.",
        });
        expect(codec.decode("DROP:unknown")).toEqual({
            kind: "unsupported-native",
            reason: {
                code: "semantic-unsupported",
                message: "Native construct cannot be represented or preserved.",
            },
        });
    });

    /**
     * Proves codecs require stable non-empty implementation identities.
     */
    it("requires a stable non-empty codec identifier", () => {
        expect(() =>
            defineSemanticCodec<string>({
                id: " ",
                encode: () => encodedNative("unused"),
                decode: (native) => opaqueNative(native, "Preserved."),
            }),
        ).toThrow("Codec ID must not be empty.");
    });
});
