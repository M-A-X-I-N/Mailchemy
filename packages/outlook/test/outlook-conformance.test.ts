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
    outlookDirectRealizationTarget,
    outlookInboxRuleCodec,
} from "../src/index.js";
import { nativeOutlookFixtures } from "./fixtures/native-outlook.js";

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
    if (left.kind !== "action" || right.kind !== "action") {
        return false;
    }

    return areCapabilitySpecimensEqual(registry, left.specimen, right.specimen);
}

describe("Outlook conformance", () => {
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
                createCapabilitySpecimen(markReadCapability, null),
            ),
        });
    });
});
