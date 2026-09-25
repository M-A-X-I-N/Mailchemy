/**
 * Connects shared canonical fixtures to the Outlook codec/target and
 * representative Graph Inbox Rule fixtures without widening semantics.
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
    outlookDirectRealizationTarget,
    outlookInboxRuleCodec,
} from "../src/index.js";
import { nativeOutlookFixtures } from "./fixtures/native_rules.js";

/** Core registry used for Outlook fixture validation/equivalence. */
const registry = createCoreCapabilityRegistry();

/**
 * Shared initial canonical fixture corpus considered for Outlook conformance.
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
 * Compares the action-only Direct Outlook round-trip subset by canonical
 * capability-instance equality.
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
 * Exercises the currently Direct Outlook semantic subset and representative
 * Graph native-decode boundaries.
 */
describe("Outlook conformance", () => {
    /**
     * Proves every shared initial fixture currently Direct for Outlook survives
     * codec encode/decode by canonical meaning.
     */
    it("round-trips every currently Direct initial fixture semantically", () => {
        const directFixtures = initialFixtures
            .filter(isCanonicallyValidFixture)
            .filter(
                (fixture) =>
                    outlookDirectRealizationTarget.checkDirectRealization(
                        fixture.expression,
                    ).kind === "direct",
            );

        expect(directFixtures.map((fixture) => fixture.id)).toEqual([
            "mark-read.from-unread",
            "mark-read.from-read",
        ]);

        const run = runCodecRoundTrips(
            registry,
            outlookInboxRuleCodec,
            directFixtures.map((fixture) => ({ fixture })),
            areEquivalent,
        );

        expect(run.passed).toBe(true);
        expect(run.results.every((result) => result.passed)).toBe(true);
    });

    /**
     * Proves representative native Graph rules preserve their
     * decoded/opaque/refused evidence categories and refusal codes.
     */
    it("decodes representative Graph rule fixtures without widening semantics", () => {
        for (const fixture of nativeOutlookFixtures) {
            const result = outlookInboxRuleCodec.decode(fixture.native);

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
     * Proves Graph's native `markAsRead` field and provider metadata disappear
     * at the canonical semantic boundary.
     */
    it("does not leak Graph markAsRead representation into canonical mark-read", () => {
        const decoded = outlookInboxRuleCodec.decode({
            id: "provider-rule-id",
            displayName: "Provider metadata is not semantic mark-read data",
            actions: {
                markAsRead: true,
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
