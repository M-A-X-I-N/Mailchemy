/**
 * Connects shared canonical fixtures to the Thunderbird codec/target and
 * representative native text fixtures without widening semantics.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    areCapabilitySpecimensEqual,
    createActionExpression,
    createCapabilitySpecimen,
    createCoreCapabilityRegistry,
    markReadCapability,
    type CanonicalExpression,
} from "@mailchemy/core";
import {
    hasAttachmentFixtures,
    initialRuleFixtures,
    logicalAndFixtures,
    markReadFixtures,
    runCodecRoundTrips,
    subjectContainsFixtures,
    type CanonicalFixture,
} from "@mailchemy/conformance";

import {
    thunderbirdDirectRealizationTarget,
    thunderbirdFilterCodec,
} from "../src/index.js";
import { nativeThunderbirdFixtures } from "./fixtures/native_thunderbird.js";

/** Core registry used for Thunderbird fixture validation/equivalence. */
const registry = createCoreCapabilityRegistry();

/**
 * Shared initial canonical fixture corpus considered for Thunderbird
 * conformance.
 */
const initialFixtures: readonly CanonicalFixture[] = Object.freeze([
    ...subjectContainsFixtures,
    ...hasAttachmentFixtures,
    ...markReadFixtures,
    ...logicalAndFixtures,
    ...initialRuleFixtures,
]);

/**
 * Narrows shared fixtures to cases declared canonically valid.
 *
 * @param fixture Shared canonical fixture.
 * @returns Whether the fixture is expected to validate canonically.
 */
function isCanonicallyValidFixture(
    fixture: CanonicalFixture,
): fixture is CanonicalFixture<CanonicalExpression> {
    return fixture.expectedValidation === "valid";
}

/**
 * Compares the action-only Direct Thunderbird round-trip subset by canonical
 * specimen equality.
 *
 * @param left First canonical expression.
 * @param right Second canonical expression.
 * @returns Whether both are semantically equal action specimens.
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
 * Exercises the currently Direct Thunderbird semantic subset and representative
 * native text decode boundaries.
 */
describe("Thunderbird conformance", () => {
    /**
     * Proves every shared initial fixture currently Direct for Thunderbird
     * survives codec encode/decode by canonical meaning.
     */
    it("round-trips every currently Direct initial fixture semantically", () => {
        const directFixtures = initialFixtures
            .filter(isCanonicallyValidFixture)
            .filter(
                (fixture) =>
                    thunderbirdDirectRealizationTarget.checkDirectRealization(
                        fixture.expression,
                    ).kind === "direct",
            );

        expect(directFixtures.map((fixture) => fixture.id)).toEqual([
            "mark-read.from-unread",
            "mark-read.from-read",
        ]);

        const run = runCodecRoundTrips(
            registry,
            thunderbirdFilterCodec,
            directFixtures.map((fixture) => ({ fixture })),
            areEquivalent,
        );

        expect(run.passed).toBe(true);
        expect(run.results.every((result) => result.passed)).toBe(true);
    });

    /**
     * Proves representative native filter text preserves its
     * decoded/opaque/refused evidence category and refusal codes.
     */
    it("parses representative native Thunderbird text without widening semantics", () => {
        for (const fixture of nativeThunderbirdFixtures) {
            const result = thunderbirdFilterCodec.decode(fixture.source);

            expect(result.kind, fixture.id).toBe(fixture.expectedKind);

            if (
                fixture.expectedKind === "unsupported-native" &&
                fixture.expectedReasonCode !== undefined
            ) {
                expect(result).toMatchObject({
                    kind: "unsupported-native",
                    reason: {
                        code: fixture.expectedReasonCode,
                    },
                });
            }
        }
    });

    /**
     * Proves the native `Mark read` spelling disappears at the canonical
     * semantic boundary.
     */
    it("does not leak the Thunderbird action spelling into canonical mark-read", () => {
        const decoded = thunderbirdFilterCodec.decode('action="Mark read"');

        expect(decoded).toEqual({
            kind: "decoded",
            expression: createActionExpression(
                createCapabilitySpecimen(markReadCapability, null),
            ),
        });
    });
});
