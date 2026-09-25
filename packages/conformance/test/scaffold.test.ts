/**
 * Proves the conformance workspace/package barrel remains linked to core and
 * exports its scaffold sentinel.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import { parseCapabilityId } from "@mailchemy/core";
import { mailchemyConformanceScaffold } from "../src/index.js";

/** Exercises minimal workspace/package linkage rather than semantic behavior. */
describe("workspace scaffold", () => {
    /** Proves core imports and the conformance barrel resolve in the workspace. */
    it("links the core workspace into conformance tests", () => {
        expect(parseCapabilityId("test.condition.boolean@1")).toBe(
            "test.condition.boolean@1",
        );
        expect(mailchemyConformanceScaffold).toBe("mailchemy-conformance");
    });
});
