/**
 * Runs canonical-to-native-to-canonical codec conformance using semantic
 * equivalence rather than native byte/text identity.
 *
 * @remarks
 * A passing round trip proves that the codec can encode and decode the tested
 * canonical fixture without changing canonical meaning under the supplied
 * equivalence relation. It is not endpoint or provider-behavior evidence.
 *
 * @packageDocumentation
 */

import {
    validateCanonicalExpression,
    type CapabilityRegistry,
    type CanonicalExpression,
    type SemanticCodec,
} from "@mailchemy/core";

import type { CanonicalFixture } from "./fixture.js";

/**
 * Caller-supplied semantic equivalence relation for canonical expressions.
 *
 * @param left First canonically valid expression.
 * @param right Second canonically valid expression.
 * @returns Whether both expressions denote equivalent canonical meaning for the
 * scope of this round-trip run.
 */
export type CanonicalEquivalence = (
    left: CanonicalExpression,
    right: CanonicalExpression,
) => boolean;

/**
 * One canonical fixture expected to survive a codec round trip semantically.
 */
export interface CodecRoundTripCase {
    /** Canonically valid fixture to encode and decode. */
    readonly fixture: CanonicalFixture;
}

/**
 * Stable machine-readable stage/category for round-trip failure.
 */
export type CodecRoundTripFailureKind =
    | "invalid-input"
    | "encode-unsupported"
    | "decode-opaque"
    | "decode-unsupported"
    | "invalid-decoded-semantics"
    | "semantic-mismatch";

/**
 * Result of one codec round-trip case.
 */
export interface CodecRoundTripCaseResult {
    /** Stable fixture identity. */
    readonly fixtureId: string;

    /** Whether canonical meaning survived the complete round trip. */
    readonly passed: boolean;

    /** Failure stage/category when the case does not pass. */
    readonly failureKind?: CodecRoundTripFailureKind;

    /** Optional human-readable failure diagnostic. */
    readonly message?: string;
}

/**
 * Aggregate round-trip result for one semantic codec.
 */
export interface CodecRoundTripRun {
    /** Stable codec identity copied from the executable codec contract. */
    readonly codecId: string;

    /** Frozen per-fixture results in supplied case order. */
    readonly results: readonly CodecRoundTripCaseResult[];

    /** Whether every round-trip case preserved canonical meaning. */
    readonly passed: boolean;
}

/**
 * Executes semantic round trips for one codec over supplied canonical fixtures.
 *
 * @typeParam TNative Native representation type owned by the codec.
 * @param registry Registry used to validate input and decoded canonical IR.
 * @param codec Executable semantic codec under test.
 * @param cases Canonical fixtures expected to round trip.
 * @param areEquivalent Semantic equivalence predicate applied after decoding.
 * @returns Frozen aggregate codec round-trip result.
 */
export function runCodecRoundTrips<TNative>(
    registry: CapabilityRegistry,
    codec: SemanticCodec<TNative>,
    cases: readonly CodecRoundTripCase[],
    areEquivalent: CanonicalEquivalence,
): CodecRoundTripRun {
    /** Per-case semantic preservation evidence in caller-supplied order. */
    const results = cases.map((testCase) =>
        runCase(registry, codec, testCase, areEquivalent),
    );

    return Object.freeze({
        codecId: codec.id,
        results: Object.freeze(results),
        passed: results.every((result) => result.passed),
    });
}

/**
 * Executes one complete encode/decode/validate/equivalence round trip.
 *
 * @typeParam TNative Native representation type owned by the codec.
 * @param registry Registry used for canonical validation.
 * @param codec Codec under test.
 * @param testCase Fixture expected to round trip.
 * @param areEquivalent Semantic equivalence predicate.
 * @returns Frozen pass result or stage-specific failure.
 */
function runCase<TNative>(
    registry: CapabilityRegistry,
    codec: SemanticCodec<TNative>,
    testCase: CodecRoundTripCase,
    areEquivalent: CanonicalEquivalence,
): CodecRoundTripCaseResult {
    /** Canonical validation gate for the input fixture. */
    const inputValidation = validateCanonicalExpression(
        registry,
        testCase.fixture.expression,
    );

    if (
        testCase.fixture.expectedValidation !== "valid" ||
        !inputValidation.ok
    ) {
        return failure(
            testCase.fixture.id,
            "invalid-input",
            "Codec round-trip conformance requires a canonically valid fixture.",
        );
    }

    /** Canonical-to-native result produced by the codec. */
    const encoded = codec.encode(inputValidation.value);

    if (encoded.kind === "unsupported") {
        return failure(
            testCase.fixture.id,
            "encode-unsupported",
            `Codec encode returned Unsupported [${encoded.reason.code}]: ${encoded.reason.message}`,
        );
    }

    /** Native-to-canonical decode result for the codec's own encoded output. */
    const decoded = codec.decode(encoded.native);

    if (decoded.kind === "opaque") {
        return failure(
            testCase.fixture.id,
            "decode-opaque",
            `Encoded native value decoded only as opaque preservation: ${decoded.message}`,
        );
    }

    if (decoded.kind === "unsupported-native") {
        return failure(
            testCase.fixture.id,
            "decode-unsupported",
            `Encoded native value could not be decoded [${decoded.reason.code}]: ${decoded.reason.message}`,
        );
    }

    /** Validation proof for the semantics reconstructed by the codec. */
    const decodedValidation = validateCanonicalExpression(
        registry,
        decoded.expression,
    );

    if (!decodedValidation.ok) {
        return failure(
            testCase.fixture.id,
            "invalid-decoded-semantics",
            "Codec decoded its own output into invalid canonical semantics.",
        );
    }

    if (!areEquivalent(inputValidation.value, decodedValidation.value)) {
        return failure(
            testCase.fixture.id,
            "semantic-mismatch",
            "Canonical meaning changed across encode/decode round trip.",
        );
    }

    return Object.freeze({
        fixtureId: testCase.fixture.id,
        passed: true,
    });
}

/**
 * Constructs one immutable failed round-trip case.
 *
 * @param fixtureId Stable fixture identity.
 * @param failureKind Machine-readable failure stage/category.
 * @param message Human-readable failure diagnostic.
 * @returns Frozen failed case result.
 */
function failure(
    fixtureId: string,
    failureKind: CodecRoundTripFailureKind,
    message: string,
): CodecRoundTripCaseResult {
    return Object.freeze({
        fixtureId,
        passed: false,
        failureKind,
        message,
    });
}
