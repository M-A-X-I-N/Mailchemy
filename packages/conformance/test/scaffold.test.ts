import { describe, expect, it } from "vitest";

import { parseCapabilityId } from "@mailchemy/core";
import { mailchemyConformanceScaffold } from "../src/index.js";

describe("workspace scaffold", () => {
    it("links the core workspace into conformance tests", () => {
        expect(parseCapabilityId("test.condition.boolean@1")).toBe(
            "test.condition.boolean@1",
        );
        expect(mailchemyConformanceScaffold).toBe("mailchemy-conformance");
    });
});
