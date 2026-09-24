import { describe, expect, it } from "vitest";

import {
    areCapabilitySpecimensEqual,
    createCoreCapabilityRegistry,
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

import { sieveCodec, sieveDirectRealizationTarget } from "../src/index.js";
import { nativeSieveFixtures } from "./fixtures/native-sieve.js";

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

describe("Sieve conformance", () => {
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
