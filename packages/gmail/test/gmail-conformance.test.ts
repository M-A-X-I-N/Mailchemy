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
    gmailDirectRealizationTarget,
    gmailFilterCodec,
} from "../src/index.js";
import { nativeGmailFixtures } from "./fixtures/native-gmail.js";

const registry = createCoreCapabilityRegistry();

const initialFixtures: readonly CanonicalFixture[] = Object.freeze([
    ...subjectContainsFixtures,
    ...hasAttachmentFixtures,
    ...markReadFixtures,
    ...logicalAndFixtures,
    ...initialRuleFixtures,
]);

function isCanonicallyValidFixture(
    fixture: CanonicalFixture,
): fixture is CanonicalFixture<CanonicalExpression> {
    return fixture.expectedValidation === "valid";
}

function areEquivalent(
    left: CanonicalExpression,
    right: CanonicalExpression,
): boolean {
    if (left.kind !== "action" || right.kind !== "action")
        return false;

    return areCapabilitySpecimensEqual(registry, left.specimen, right.specimen);
}

describe("Gmail conformance", () => {
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
                createCapabilitySpecimen(markReadCapability, null),
            ),
        });
    });
});
