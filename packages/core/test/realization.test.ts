import { describe, expect, it } from "vitest";

import {
    derivedRealization,
    directRealization,
    unsupportedRealization,
    unsupportedReason,
    type RealizationResult,
} from "@mailchemy/core";

function describeResult(result: RealizationResult): string {
    switch (result.kind) {
        case "direct":
            return "Direct";
        case "derived":
            return `Derived: ${result.explanation}`;
        case "unsupported":
            return `Unsupported [${result.reason.code}]: ${result.reason.message}`;
    }
}

describe("RealizationResult", () => {
    it("represents direct realization without provider payload", () => {
        const result = directRealization();

        expect(result).toEqual({ kind: "direct" });
        expect(Object.isFrozen(result)).toBe(true);
        expect(describeResult(result)).toBe("Direct");
    });

    it("reserves a derived classification without implementing rewrite search", () => {
        const result = derivedRealization("Synthetic exact rewrite path.");

        expect(result).toEqual({
            kind: "derived",
            explanation: "Synthetic exact rewrite path.",
        });
        expect(describeResult(result)).toContain("Derived");
    });

    it.each([
        "capability-absent",
        "refinement-rejected",
        "structure-unsupported",
        "endpoint-profile-missing",
        "exactness-unproven",
        "known-non-equivalent",
    ] as const)("preserves machine-readable Unsupported reason %s", (code) => {
        const result = unsupportedRealization(
            unsupportedReason(code, `Synthetic diagnostic for ${code}.`),
        );

        expect(result).toEqual({
            kind: "unsupported",
            reason: {
                code,
                message: `Synthetic diagnostic for ${code}.`,
            },
        });
        expect(describeResult(result)).toContain(code);
    });

    it("rejects empty human-readable diagnostics", () => {
        expect(() => unsupportedReason("capability-absent", "  ")).toThrow(
            "Unsupported realization message must not be empty.",
        );
        expect(() => derivedRealization("")).toThrow(
            "Derived realization explanation must not be empty.",
        );
    });
});
