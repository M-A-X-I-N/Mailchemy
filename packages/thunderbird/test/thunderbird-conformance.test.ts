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
import { nativeThunderbirdFixtures } from "./fixtures/native-thunderbird.js";

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

describe("Thunderbird conformance", () => {
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
