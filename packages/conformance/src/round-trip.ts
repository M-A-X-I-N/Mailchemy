import {
    validateCanonicalExpression,
    type CapabilityRegistry,
    type CanonicalExpression,
    type SemanticCodec,
} from "@mailchemy/core";

import type { CanonicalFixture } from "./fixture.js";

export type CanonicalEquivalence = (
    left: CanonicalExpression,
    right: CanonicalExpression,
) => boolean;

export interface CodecRoundTripCase {
    readonly fixture: CanonicalFixture;
}

export type CodecRoundTripFailureKind =
    | "invalid-input"
    | "encode-unsupported"
    | "decode-opaque"
    | "decode-unsupported"
    | "invalid-decoded-semantics"
    | "semantic-mismatch";

export interface CodecRoundTripCaseResult {
    readonly fixtureId: string;
    readonly passed: boolean;
    readonly failureKind?: CodecRoundTripFailureKind;
    readonly message?: string;
}

export interface CodecRoundTripRun {
    readonly codecId: string;
    readonly results: readonly CodecRoundTripCaseResult[];
    readonly passed: boolean;
}

export function runCodecRoundTrips<TNative>(
    registry: CapabilityRegistry,
    codec: SemanticCodec<TNative>,
    cases: readonly CodecRoundTripCase[],
    areEquivalent: CanonicalEquivalence,
): CodecRoundTripRun {
    const results = cases.map((testCase) =>
        runCase(registry, codec, testCase, areEquivalent),
    );

    return Object.freeze({
        codecId: codec.id,
        results: Object.freeze(results),
        passed: results.every((result) => result.passed),
    });
}

function runCase<TNative>(
    registry: CapabilityRegistry,
    codec: SemanticCodec<TNative>,
    testCase: CodecRoundTripCase,
    areEquivalent: CanonicalEquivalence,
): CodecRoundTripCaseResult {
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

    const encoded = codec.encode(inputValidation.value);

    if (encoded.kind === "unsupported") {
        return failure(
            testCase.fixture.id,
            "encode-unsupported",
            `Codec encode returned Unsupported [${encoded.reason.code}]: ${encoded.reason.message}`,
        );
    }

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
