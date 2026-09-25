/**
 * Exercises cross-adapter semantic portability by routing every tested path
 * through canonical Mailchemy semantics rather than pair-specific converters.
 *
 * @remarks
 * A passing path proves semantic preservation only for fixtures that both
 * participating realization targets already classify Direct. This layer does
 * not upgrade Unsupported mappings, infer new adapter equivalence, or define
 * provider behavior.
 *
 * The initial shared Direct subset is mark-read only.
 *
 * @packageDocumentation
 */

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

/**
 * Type-erased pairing of one adapter codec with its corresponding direct target
 * for heterogeneous cross-codec traversal.
 */
interface CrossCodecVariant {
    /** Stable codec identity reported in path evidence. */
    readonly codecId: string;
    /**
     * Stable realization-target identity associated with the codec.
     *
     * @remarks
     * Retained to keep codec/target pairing explicit even though current result
     * records identify paths by codec IDs.
     */
    readonly targetId: string;
    /**
     * Queries the paired target's existing Direct classification.
     *
     * @param expression Canonical expression considered for this variant.
     * @returns Whether the paired target currently reports Direct.
     */
    readonly isDirect: (expression: CanonicalExpression) => boolean;
    /**
     * Type-erased canonical-to-native codec operation.
     *
     * @param expression Canonical expression to encode.
     * @returns Underlying adapter codec result.
     */
    readonly encode: (expression: CanonicalExpression) => EncodeResult<unknown>;
    /**
     * Type-erased native-to-canonical codec operation.
     *
     * @param native Native value produced for this variant.
     * @returns Underlying adapter codec result.
     */
    readonly decode: (native: unknown) => DecodeResult<unknown>;
}

/**
 * Evidence for one ordered source-codec → canonical → target-codec path.
 */
export interface CrossCodecRoundTripResult {
    /** Stable canonical fixture identity exercised by the path. */
    readonly fixtureId: string;
    /** Codec supplying the first native boundary. */
    readonly sourceCodecId: string;
    /** Codec supplying the second native boundary. */
    readonly targetCodecId: string;
    /** Whether canonical meaning survived both native boundaries. */
    readonly passed: boolean;
    /** Human-readable boundary failure when the path does not pass. */
    readonly message?: string;
}

/**
 * Aggregate evidence for all currently eligible ordered cross-codec paths.
 */
export interface CrossCodecRoundTripRun {
    /** Frozen per-path results in deterministic traversal order. */
    readonly results: readonly CrossCodecRoundTripResult[];

    /** Whether every eligible cross-codec path preserved canonical meaning. */
    readonly passed: boolean;
}

/** Core registry used to validate and compare canonical semantics on every path. */
const registry = createCoreCapabilityRegistry();

/**
 * Initial adapter codec/target pairs participating in canonical-routed paths.
 *
 * @remarks
 * Purelymail is absent here because it refines Sieve endpoint availability but
 * does not define a distinct native codec representation.
 */
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

/**
 * Executes every ordered distinct codec pair for the shared fixture subset that
 * both associated targets classify Direct.
 *
 * @remarks
 * Pair eligibility is derived from existing target classifications. The path
 * always returns to validated canonical IR between codecs; there are no
 * source→target native converters.
 *
 * @returns Frozen aggregate cross-codec semantic-preservation evidence.
 */
export function runInitialCrossCodecRoundTrips(): CrossCodecRoundTripRun {
    /** Validated mark-read fixtures comprising the initial shared Direct subset. */
    const fixtures = collectValidMarkReadFixtures();
    /** Ordered path evidence accumulated across fixture/source/target traversal. */
    const results: CrossCodecRoundTripResult[] = [];

    for (const fixture of fixtures) {
        for (const source of VARIANTS) {
            for (const target of VARIANTS) {
                if (source.codecId === target.codecId)
                    continue;

                if (
                    !source.isDirect(fixture.expression) ||
                    !target.isDirect(fixture.expression)
                )
                    continue;

                results.push(runPath(fixture, source, target));
            }
        }
    }

    return Object.freeze({
        results: Object.freeze(results),
        passed: results.every((result) => result.passed),
    });
}

/**
 * Executes one source encode/decode canonical boundary followed by one target
 * encode/decode canonical boundary.
 *
 * @param fixture Canonically valid fixture whose semantics both targets report
 * Direct.
 * @param source Source codec/target pair.
 * @param target Destination codec/target pair.
 * @returns Pass evidence or a boundary-specific failure.
 */
function runPath(
    fixture: CanonicalFixture<CanonicalExpression>,
    source: CrossCodecVariant,
    target: CrossCodecVariant,
): CrossCodecRoundTripResult {
    /** Native representation emitted by the source codec. */
    const sourceEncoded = source.encode(fixture.expression);

    if (sourceEncoded.kind !== "encoded") {
        return failure(
            fixture.id,
            source.codecId,
            target.codecId,
            "Source codec refused a fixture its realization target marked Direct.",
        );
    }

    /** Source codec's decode of its own emitted native value. */
    const sourceDecoded = source.decode(sourceEncoded.native);
    /** Revalidated canonical semantics recovered from the source native boundary. */
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

    /** Native representation emitted by the destination codec. */
    const targetEncoded = target.encode(sourceCanonical);

    if (targetEncoded.kind !== "encoded") {
        return failure(
            fixture.id,
            source.codecId,
            target.codecId,
            "Target codec refused canonical semantics its realization target marked Direct.",
        );
    }

    /** Destination codec's decode of its own emitted native value. */
    const targetDecoded = target.decode(targetEncoded.native);
    /** Revalidated canonical semantics recovered from the target native boundary. */
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

/**
 * Accepts only genuinely decoded native results whose canonical expression also
 * passes current core semantic validation.
 *
 * @param result Type-erased native decode result from one adapter codec.
 * @returns Validated canonical expression, or undefined for opaque/refused/
 * invalid decoded semantics.
 */
function decodedExpression(
    result: DecodeResult<unknown>,
): CanonicalExpression | undefined {
    if (result.kind !== "decoded")
        return undefined;

    /** Canonical validation proof for semantics returned by the adapter codec. */
    const validation = validateCanonicalExpression(registry, result.expression);
    return validation.ok ? validation.value : undefined;
}

/**
 * Compares canonical meaning for the deliberately narrow initial cross-codec
 * subset.
 *
 * @remarks
 * The current shared Direct corpus contains action leaves only, so semantic
 * equivalence delegates to capability-specimen equality. This is not a generic
 * canonical-expression equivalence algorithm.
 *
 * @param left First validated canonical expression.
 * @param right Second validated canonical expression.
 * @returns Whether both represent the same action specimen.
 */
function areEquivalent(
    left: CanonicalExpression,
    right: CanonicalExpression,
): boolean {
    if (left.kind !== "action" || right.kind !== "action")
        return false;

    return areCapabilitySpecimensEqual(registry, left.specimen, right.specimen);
}

/**
 * Erases one typed adapter codec/native representation into a heterogeneous
 * cross-codec variant while retaining its paired target's Direct predicate.
 *
 * @typeParam TNative Native representation owned by the adapter codec.
 * @param codecId Stable codec identity.
 * @param targetId Stable identity of the paired realization target.
 * @param checkDirectRealization Paired target classifier used only for path
 * eligibility.
 * @param encode Typed canonical-to-native codec operation.
 * @param decode Type-erased wrapper around the typed native-to-canonical codec
 * operation.
 * @returns Frozen heterogeneous codec/target variant.
 */
function codecVariant<TNative>(
    codecId: string,
    targetId: string,
    checkDirectRealization: (
        expression: CanonicalExpression,
    ) =>
        | {
              /** Paired target classified the expression Direct. */
              readonly kind: "direct";
          }
        | {
              /** Paired target classified the expression Unsupported. */
              readonly kind: "unsupported";
          },
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

/**
 * Revalidates and freezes the valid shared mark-read fixtures used by the
 * initial cross-codec corpus.
 *
 * @returns Canonically validated mark-read fixtures in source fixture order.
 */
function collectValidMarkReadFixtures(): readonly CanonicalFixture<CanonicalExpression>[] {
    /** Validated fixture snapshots accumulated in source fixture order. */
    const fixtures: CanonicalFixture<CanonicalExpression>[] = [];

    for (const fixture of markReadFixtures) {
        if (fixture.expectedValidation !== "valid")
            continue;

        const validation = validateCanonicalExpression(
            registry,
            fixture.expression,
        );

        if (!validation.ok)
            continue;

        fixtures.push(
            Object.freeze({
                ...fixture,
                expression: validation.value,
            }),
        );
    }

    return Object.freeze(fixtures);
}

/**
 * Constructs one immutable failed cross-codec path result.
 *
 * @param fixtureId Stable canonical fixture identity.
 * @param sourceCodecId Source codec identity.
 * @param targetCodecId Destination codec identity.
 * @param message Human-readable boundary failure.
 * @returns Frozen failed path evidence.
 */
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
