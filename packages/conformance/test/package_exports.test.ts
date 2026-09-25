/**
 * Proves the conformance package surface exposes real harness and fixture APIs
 * while remaining linked to the core workspace package.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import { parseCapabilityId } from "@mailchemy/core";
import {
    runCapabilityContractConformance,
    subjectContainsFixtures,
} from "@mailchemy/conformance";

/** Exercises package-level linkage through real conformance exports. */
describe("conformance package exports", () => {
    /**
     * Proves core imports and representative public conformance exports resolve
     * without relying on the obsolete workspace-scaffold sentinel.
     */
    it("links the package through real exported APIs", () => {
        expect(parseCapabilityId("test.condition.boolean@1")).toBe(
            "test.condition.boolean@1",
        );
        expect(typeof runCapabilityContractConformance).toBe("function");
        expect(subjectContainsFixtures.length).toBeGreaterThan(0);
    });
});
