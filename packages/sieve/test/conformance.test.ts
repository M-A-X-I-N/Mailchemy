/**
 * Connects the shared canonical fixture corpus to the Sieve codec/target and
 * representative native Sieve fixtures without widening exactness claims.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    areCapabilityInstancesEqual,
    createCoreCapabilityRegistry,
    type CanonicalExpression,
} from "@mailchemy/core";
import {
    hasAttachmentFixtures,
    sharedRuleFixtures,
    logicalAndFixtures,
    markReadFixtures,
    runCodecRoundTrips,
    subjectContainsFixtures,
    type CanonicalFixture,
} from "@mailchemy/conformance";

import { sieveCodec, sieveDirectRealizationTarget } from "../src/index.js";
import { nativeSieveFixtures } from "./fixtures/native_scripts.js";

/** Core semantic registry used to validate/equate Sieve conformance fixtures. */
const registry = createCoreCapabilityRegistry();

/**
 * Shared initial canonical fixture corpus considered for Sieve conformance.
 */
const initialFixtures: readonly CanonicalFixture[] = Object.freeze([
    ...subjectContainsFixtures,
    ...hasAttachmentFixtures,
    ...markReadFixtures,
    ...logicalAndFixtures,
    ...sharedRuleFixtures,
]);

/**
 * Narrows shared fixtures to cases expected to be valid canonical expressions.
 *
 * @param fixture Shared canonical fixture.
 * @returns Whether the fixture is declared canonically valid.
 */
function isCanonicallyValidFixture(
    fixture: CanonicalFixture,
): fixture is CanonicalFixture<CanonicalExpression> {
    return fixture.expectedValidation === "valid";
}

/**
 * Compares the action-only Direct Sieve round-trip subset by canonical capability-instance
 * equality.
 *
 * @param left First canonically valid expression.
 * @param right Second canonically valid expression.
 * @returns Whether both are action expressions with semantically equal
 * capability instances.
 */
function areEquivalent(
    left: CanonicalExpression,
    right: CanonicalExpression,
): boolean {
    if (left.kind !== "action" || right.kind !== "action")
        return false;

    return areCapabilityInstancesEqual(registry, left.instance, right.instance);
}

/**
 * Exercises the currently Direct Sieve semantic subset plus representative
 * native decode boundaries.
 */
describe("Sieve conformance", () => {
    /**
     * Proves every shared initial fixture currently classified Direct by the
     * Sieve dialect target survives codec encode/decode by canonical semantics.
     */
    it("round-trips every currently Direct initial fixture semantically", () => {
        const directFixtures = initialFixtures
            .filter(isCanonicallyValidFixture)
            .filter(
                (fixture) =>
                    sieveDirectRealizationTarget.checkDirectRealization(
                        fixture.expression,
                    ).kind === "direct",
            );

        expect(directFixtures.map((fixture) => fixture.id)).toEqual([
            "mark-read.from-unread",
            "mark-read.from-read",
        ]);

        const run = runCodecRoundTrips(
            registry,
            sieveCodec,
            directFixtures.map((fixture) => ({ fixture })),
            areEquivalent,
        );

        expect(run.passed).toBe(true);
        expect(run.results.every((result) => result.passed)).toBe(true);
    });

    /**
     * Proves representative native inputs retain their decoded/opaque/refused
     * evidence categories and exactness reason codes.
     */
    it("decodes representative native Sieve fixtures without widening semantics", () => {
        for (const fixture of nativeSieveFixtures) {
            const result = sieveCodec.decode(fixture.source);

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
});
