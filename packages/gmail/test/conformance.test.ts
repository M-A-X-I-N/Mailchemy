/**
 * Connects shared canonical fixtures to the Gmail codec/target and representative
 * native Filter fixtures without widening provider semantics.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    areCapabilityInstancesEqual,
    createActionExpression,
    createCapabilityInstance,
    createCoreCapabilityRegistry,
    markReadCapability,
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

import {
    gmailDirectRealizationTarget,
    gmailFilterCodec,
} from "../src/index.js";
import { nativeGmailFixtures } from "./fixtures/native_filters.js";

/** Core semantic registry used for Gmail fixture validation/equivalence. */
const registry = createCoreCapabilityRegistry();

/**
 * Shared initial canonical fixture corpus considered for Gmail conformance.
 */
const initialFixtures: readonly CanonicalFixture[] = Object.freeze([
    ...subjectContainsFixtures,
    ...hasAttachmentFixtures,
    ...markReadFixtures,
    ...logicalAndFixtures,
    ...sharedRuleFixtures,
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
 * Compares the action-only Direct Gmail round-trip subset by canonical capability-instance
 * equality.
 *
 * @param left First canonical expression.
 * @param right Second canonical expression.
 * @returns Whether both are semantically equal action capability instances.
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
 * Exercises the currently Direct Gmail semantic subset and representative
 * native decode boundaries.
 */
describe("Gmail conformance", () => {
    /**
     * Proves every shared initial fixture currently Direct for Gmail survives
     * codec encode/decode by canonical meaning.
     */
    it("round-trips every currently Direct initial fixture semantically", () => {
        const directFixtures = initialFixtures
            .filter(isCanonicallyValidFixture)
            .filter(
                (fixture) =>
                    gmailDirectRealizationTarget.checkDirectRealization(
                        fixture.expression,
                    ).kind === "direct",
            );

        expect(directFixtures.map((fixture) => fixture.id)).toEqual([
            "mark-read.from-unread",
            "mark-read.from-read",
        ]);

        const run = runCodecRoundTrips(
            registry,
            gmailFilterCodec,
            directFixtures.map((fixture) => ({ fixture })),
            areEquivalent,
        );

        expect(run.passed).toBe(true);
        expect(run.results.every((result) => result.passed)).toBe(true);
    });

    /**
     * Proves representative native Gmail inputs preserve their
     * decoded/opaque/refused evidence categories and refusal codes.
     */
    it("decodes representative native Gmail fixtures without widening semantics", () => {
        for (const fixture of nativeGmailFixtures) {
            const result = gmailFilterCodec.decode(fixture.native);

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
     * Proves provider-native `UNREAD` label mechanics disappear at the canonical
     * semantic boundary and decode only to mark-read.
     */
    it("does not leak the Gmail UNREAD label representation into canonical mark-read", () => {
        const decoded = gmailFilterCodec.decode({
            id: "provider-object-id",
            action: {
                removeLabelIds: ["UNREAD"],
            },
        });

        expect(decoded).toEqual({
            kind: "decoded",
            expression: createActionExpression(
                createCapabilityInstance(markReadCapability, null),
            ),
        });
    });
});
