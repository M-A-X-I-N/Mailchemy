import { describe, expect, it } from "vitest";

import { mailchemyCoreScaffold } from "@mailchemy/core";
import { mailchemyConformanceScaffold } from "../src/index.js";

describe("workspace scaffold", () => {
  it("links the core workspace into conformance tests", () => {
    expect(mailchemyCoreScaffold).toBe("mailchemy-core");
    expect(mailchemyConformanceScaffold).toBe("mailchemy-conformance");
  });
});
