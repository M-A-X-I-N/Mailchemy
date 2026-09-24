import {
    areCapabilitySpecimensEqual,
    createCoreCapabilityRegistry,
    validateCanonicalExpression,
    type CanonicalExpression,
    type DecodeResult,
    type EncodeResult,
} from "@mailchemy/core";
import {
    markReadFixtures,
    type CanonicalFixture,
} from "@mailchemy/conformance";
import {
    gmailDirectRealizationTarget,
    gmailFilterCodec,
    type GmailFilterNative,
} from "@mailchemy/gmail";
import {
    outlookDirectRealizationTarget,
    outlookInboxRuleCodec,
    type OutlookMessageRuleNative,
} from "@mailchemy/outlook";
import {
    sieveCodec,
    sieveDirectRealizationTarget,
    type SieveNative,
} from "@mailchemy/sieve";
import {
    thunderbirdDirectRealizationTarget,
    thunderbirdFilterCodec,
    type ThunderbirdFilterNative,
} from "@mailchemy/thunderbird";

interface CrossCodecVariant {
    readonly codecId: string;
    readonly targetId: string;
    readonly isDirect: (expression: CanonicalExpression) => boolean;
    readonly encode: (expression: CanonicalExpression) => EncodeResult<unknown>;
    readonly decode: (native: unknown) => DecodeResult<unknown>;
}

export interface CrossCodecRoundTripResult {
    readonly fixtureId: string;
    readonly sourceCodecId: string;
    readonly targetCodecId: string;
    readonly passed: boolean;
    readonly message?: string;
}

export interface CrossCodecRoundTripRun {
    readonly results: readonly CrossCodecRoundTripResult[];
    readonly passed: boolean;
}

const registry = createCoreCapabilityRegistry();

const VARIANTS: readonly CrossCodecVariant[] = Object.freeze([
    codecVariant(
        sieveCodec.id,
        sieveDirectRealizationTarget.id,
        sieveDirectRealizationTarget.checkDirectRealization,
        sieveCodec.encode,
        (native) => sieveCodec.decode(native as SieveNative),
    ),
    codecVariant(
        gmailFilterCodec.id,
        gmailDirectRealizationTarget.id,
        gmailDirectRealizationTarget.checkDirectRealization,
        gmailFilterCodec.encode,
        (native) => gmailFilterCodec.decode(native as GmailFilterNative),
    ),
    codecVariant(
        outlookInboxRuleCodec.id,
        outlookDirectRealizationTarget.id,
        outlookDirectRealizationTarget.checkDirectRealization,
        outlookInboxRuleCodec.encode,
        (native) =>
            outlookInboxRuleCodec.decode(native as OutlookMessageRuleNative),
    ),
    codecVariant(
        thunderbirdFilterCodec.id,
        thunderbirdDirectRealizationTarget.id,
        thunderbirdDirectRealizationTarget.checkDirectRealization,
        thunderbirdFilterCodec.encode,
        (native) =>
            thunderbirdFilterCodec.decode(native as ThunderbirdFilterNative),
    ),
]);

export function runInitialCrossCodecRoundTrips(): CrossCodecRoundTripRun {
    const fixtures = collectValidMarkReadFixtures();
    const results: CrossCodecRoundTripResult[] = [];

    for (const fixture of fixtures) {
        for (const source of VARIANTS) {
            for (const target of VARIANTS) {
                if (source.codecId === target.codecId) {
                    continue;
                }

                if (
                    !source.isDirect(fixture.expression) ||
                    !target.isDirect(fixture.expression)
                ) {
                    continue;
                }

                results.push(runPath(fixture, source, target));
            }
        }
    }

    return Object.freeze({
        results: Object.freeze(results),
        passed: results.every((result) => result.passed),
    });
}

function runPath(
    fixture: CanonicalFixture<CanonicalExpression>,
    source: CrossCodecVariant,
    target: CrossCodecVariant,
): CrossCodecRoundTripResult {
    const sourceEncoded = source.encode(fixture.expression);

    if (sourceEncoded.kind !== "encoded") {
        return failure(
            fixture.id,
            source.codecId,
            target.codecId,
            "Source codec refused a fixture its realization target marked Direct.",
        );
    }

    const sourceDecoded = source.decode(sourceEncoded.native);
    const sourceCanonical = decodedExpression(sourceDecoded);

    if (
        sourceCanonical === undefined ||
        !areEquivalent(fixture.expression, sourceCanonical)
    ) {
        return failure(
            fixture.id,
            source.codecId,
            target.codecId,
            "Meaning changed or became unavailable at the source-codec canonical boundary.",
        );
    }

    const targetEncoded = target.encode(sourceCanonical);

    if (targetEncoded.kind !== "encoded") {
        return failure(
            fixture.id,
            source.codecId,
            target.codecId,
            "Target codec refused canonical semantics its realization target marked Direct.",
        );
    }

    const targetDecoded = target.decode(targetEncoded.native);
    const targetCanonical = decodedExpression(targetDecoded);

    if (
        targetCanonical === undefined ||
        !areEquivalent(sourceCanonical, targetCanonical)
    ) {
        return failure(
            fixture.id,
            source.codecId,
            target.codecId,
            "Meaning changed or became unavailable at the target-codec canonical boundary.",
        );
    }

    return Object.freeze({
        fixtureId: fixture.id,
        sourceCodecId: source.codecId,
        targetCodecId: target.codecId,
        passed: true,
    });
}

function decodedExpression(
    result: DecodeResult<unknown>,
): CanonicalExpression | undefined {
    if (result.kind !== "decoded") {
        return undefined;
    }

    const validation = validateCanonicalExpression(registry, result.expression);
    return validation.ok ? validation.value : undefined;
}

function areEquivalent(
    left: CanonicalExpression,
    right: CanonicalExpression,
): boolean {
    if (left.kind !== "action" || right.kind !== "action") {
        return false;
    }

    return areCapabilitySpecimensEqual(registry, left.specimen, right.specimen);
}

function codecVariant<TNative>(
    codecId: string,
    targetId: string,
    checkDirectRealization: (
        expression: CanonicalExpression,
    ) => { readonly kind: "direct" } | { readonly kind: "unsupported" },
    encode: (expression: CanonicalExpression) => EncodeResult<TNative>,
    decode: (native: unknown) => DecodeResult<TNative>,
): CrossCodecVariant {
    return Object.freeze({
        codecId,
        targetId,
        isDirect: (expression: CanonicalExpression) =>
            checkDirectRealization(expression).kind === "direct",
        encode: (expression: CanonicalExpression) => encode(expression),
        decode,
    });
}

function collectValidMarkReadFixtures(): readonly CanonicalFixture<CanonicalExpression>[] {
    const fixtures: CanonicalFixture<CanonicalExpression>[] = [];

    for (const fixture of markReadFixtures) {
        if (fixture.expectedValidation !== "valid") {
            continue;
        }

        const validation = validateCanonicalExpression(
            registry,
            fixture.expression,
        );

        if (!validation.ok) {
            continue;
        }

        fixtures.push(
            Object.freeze({
                ...fixture,
                expression: validation.value,
            }),
        );
    }

    return Object.freeze(fixtures);
}

function failure(
    fixtureId: string,
    sourceCodecId: string,
    targetCodecId: string,
    message: string,
): CrossCodecRoundTripResult {
    return Object.freeze({
        fixtureId,
        sourceCodecId,
        targetCodecId,
        passed: false,
        message,
    });
}
