import { describe, expect, it } from "vitest";

import { parseCapabilityId } from "@mailchemy/core";
import {
    InvalidCanonicalFixtureError,
    defineCanonicalFixture,
} from "@mailchemy/conformance";

describe("CanonicalFixture", () => {
    it("captures reusable code-native semantic evidence immutably", () => {
        const capability = parseCapabilityId("test.condition.boolean@1");
        const references = ["synthetic:fixture-source"];
        const oracle = { expected: true };

        const fixture = defineCanonicalFixture({
            id: "boolean.true",
            capabilities: [capability],
            expression: Object.freeze({ kind: "synthetic", value: true }),
            expectedValidation: "valid",
            oracle,
            notes: "Synthetic truth fixture.",
            references,
        });

        references.push("mutated");
        oracle.expected = false;

        expect(Object.isFrozen(fixture)).toBe(true);
        expect(Object.isFrozen(fixture.capabilities)).toBe(true);
        expect(Object.isFrozen(fixture.references)).toBe(true);
        expect(Object.isFrozen(fixture.oracle)).toBe(true);
        expect(fixture.references).toEqual(["synthetic:fixture-source"]);
        expect(fixture.oracle).toEqual({ expected: true });
    });

    it("allows one shared fixture to exercise multiple capability contracts", () => {
        const condition = parseCapabilityId("test.condition.boolean@1");
        const logic = parseCapabilityId("test.logic.and@1");

        const fixture = defineCanonicalFixture({
            id: "combined.boolean",
            capabilities: [condition, logic],
            expression: { kind: "synthetic-composition" },
            expectedValidation: "valid",
        });

        expect(fixture.capabilities).toEqual([condition, logic]);
    });

    it("supports deliberately invalid canonical fixtures", () => {
        const fixture = defineCanonicalFixture({
            id: "boolean.invalid-parameter",
            capabilities: [parseCapabilityId("test.condition.boolean@1")],
            expression: {
                kind: "condition",
                specimen: {
                    kind: "capability",
                    capabilityId: "test.condition.boolean@1",
                    parameters: { value: "not-boolean" },
                },
            },
            expectedValidation: "invalid",
        });

        expect(fixture.expectedValidation).toBe("invalid");
    });

    it("rejects ambiguous fixture metadata", () => {
        const capability = parseCapabilityId("test.condition.boolean@1");

        expect(() =>
            defineCanonicalFixture({
                id: " ",
                capabilities: [capability],
                expression: {},
                expectedValidation: "valid",
            }),
        ).toThrow(InvalidCanonicalFixtureError);

        expect(() =>
            defineCanonicalFixture({
                id: "duplicate-capability",
                capabilities: [capability, capability],
                expression: {},
                expectedValidation: "valid",
            }),
        ).toThrow("Fixture capability list must not contain duplicates.");
    });
});
