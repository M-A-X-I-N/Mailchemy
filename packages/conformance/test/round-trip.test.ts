/**
 * Proves codec round-trip conformance, failure staging, and semantic-equivalence
 * comparison with synthetic codecs/native values.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    createCapabilitySpecimen,
    createConditionExpression,
    decodedNative,
    defineSemanticCapability,
    defineSemanticCodec,
    encodedNative,
    invalid,
    opaqueNative,
    parseCapabilityId,
    unsupportedRealization,
    unsupportedReason,
    valid,
    validationIssue,
} from "@mailchemy/core";
import {
    defineCanonicalFixture,
    runCodecRoundTrips,
    type CanonicalEquivalence,
} from "@mailchemy/conformance";

/**
 * Synthetic boolean semantic contract used by round-trip harness tests.
 */
const booleanCapability = defineSemanticCapability<{
    /** Synthetic truth value carried by the round-trip test capability. */
    readonly value: boolean;
}>({
    id: parseCapabilityId("test.condition.boolean@1"),
    role: "condition",
    description: "Synthetic round-trip condition.",
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
 * Builds one canonical synthetic boolean expression.
 *
 * @param value Boolean semantic value.
 * @returns Canonical condition expression.
 */
function expression(value: boolean) {
    return createConditionExpression(
        createCapabilitySpecimen(booleanCapability, { value }),
    );
}

/**
 * Creates a fresh registry for synthetic round-trip validation.
 *
 * @returns Registry containing the boolean contract.
 */
function registry() {
    const result = new CapabilityRegistry();
    result.register(booleanCapability);
    return result;
}

/** Valid true-valued fixture expected to survive round trips. */
const fixture = defineCanonicalFixture({
    id: "boolean.true",
    capabilities: [booleanCapability.id],
    expression: expression(true),
    expectedValidation: "valid",
});

/**
 * Compares the synthetic boolean semantic meaning after round trip.
 *
 * @param left First canonically valid expression.
 * @param right Second canonically valid expression.
 * @returns Whether both are the same boolean condition value.
 */
const booleanEquivalence: CanonicalEquivalence = (left, right) => {
    if (left.kind !== "condition" || right.kind !== "condition")
        return false;

    if (left.specimen.capabilityId !== right.specimen.capabilityId)
        return false;

    const leftValue = left.specimen.parameters as {
        /** Left synthetic truth value compared after round trip. */
        readonly value: boolean;
    };
    const rightValue = right.specimen.parameters as {
        /** Right synthetic truth value compared after round trip. */
        readonly value: boolean;
    };

    return leftValue.value === rightValue.value;
};

/**
 * Exercises semantic preservation and stage-specific codec failure reporting.
 */
describe("runCodecRoundTrips", () => {
    /**
     * Proves native normalization is irrelevant when canonical meaning is
     * preserved by encode/decode.
     */
    it("passes on semantic equivalence without comparing native bytes", () => {
        const codec = defineSemanticCodec<string>({
            id: "synthetic.normalizing-codec",
            encode: (canonical) => {
                const parameters =
                    canonical.kind === "condition"
                        ? (canonical.specimen.parameters as {
                              /** Synthetic truth value encoded by the normalizing codec. */
                              readonly value: boolean;
                          })
                        : { value: false };

                return encodedNative(parameters.value ? "TRUE\n" : "FALSE\n");
            },
            decode: (native) =>
                decodedNative(
                    expression(native.trim().toUpperCase() === "TRUE"),
                ),
        });

        const result = runCodecRoundTrips(
            registry(),
            codec,
            [{ fixture }],
            booleanEquivalence,
        );

        expect(result.passed).toBe(true);
        expect(result.results).toEqual([
            {
                fixtureId: "boolean.true",
                passed: true,
            },
        ]);
    });

    /**
     * Proves encode refusal is reported at the encode-unsupported stage.
     */
    it("fails when encode refuses a specimen expected to round trip", () => {
        const codec = defineSemanticCodec<string>({
            id: "synthetic.rejecting-codec",
            encode: () =>
                unsupportedRealization(
                    unsupportedReason(
                        "capability-absent",
                        "Synthetic codec has no encoding.",
                    ),
                ),
            decode: (native) => opaqueNative(native, "Unused."),
        });

        const result = runCodecRoundTrips(
            registry(),
            codec,
            [{ fixture }],
            booleanEquivalence,
        );

        expect(result.results[0]?.failureKind).toBe("encode-unsupported");
        expect(result.passed).toBe(false);
    });

    /**
     * Proves opaque preservation is not treated as successful semantic decoding.
     */
    it("fails when a codec decodes its own output only opaquely", () => {
        const codec = defineSemanticCodec<string>({
            id: "synthetic.opaque-codec",
            encode: () => encodedNative("OPAQUE"),
            decode: (native) =>
                opaqueNative(native, "Preserved but uninterpreted."),
        });

        const result = runCodecRoundTrips(
            registry(),
            codec,
            [{ fixture }],
            booleanEquivalence,
        );

        expect(result.results[0]?.failureKind).toBe("decode-opaque");
    });

    /**
     * Proves successful encode/decode operations still fail when canonical
     * meaning changes.
     */
    it("detects semantic drift even when encode/decode both succeed", () => {
        const codec = defineSemanticCodec<string>({
            id: "synthetic.drifting-codec",
            encode: () => encodedNative("TRUE"),
            decode: () => decodedNative(expression(false)),
        });

        const result = runCodecRoundTrips(
            registry(),
            codec,
            [{ fixture }],
            booleanEquivalence,
        );

        expect(result.results[0]).toEqual({
            fixtureId: "boolean.true",
            passed: false,
            failureKind: "semantic-mismatch",
            message:
                "Canonical meaning changed across encode/decode round trip.",
        });
    });
});
