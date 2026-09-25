/**
 * Proves exact-realization result construction, diagnostic preservation, and
 * the reserved Derived classification independently of any concrete adapter.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    derivedRealization,
    directRealization,
    unsupportedRealization,
    unsupportedReason,
    type RealizationResult,
} from "@mailchemy/core";

/**
 * Converts synthetic realization results into readable diagnostic text so each
 * discriminated-union branch is exercised by the tests.
 *
 * @param result Realization result to describe.
 * @returns Human-readable branch-specific description.
 */
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

/**
 * Exercises the invariant-bearing constructors for Direct, Derived, and
 * Unsupported realization results.
 */
describe("RealizationResult", () => {
    /**
     * Proves Direct carries no provider/native payload and is immutable.
     */
    it("represents direct realization without provider payload", () => {
        const result = directRealization();

        expect(result).toEqual({ kind: "direct" });
        expect(Object.isFrozen(result)).toBe(true);
        expect(describeResult(result)).toBe("Direct");
    });

    /**
     * Proves the architecture can represent an exact derived path before a
     * general rewrite-search implementation exists.
     */
    it("reserves a derived classification without implementing rewrite search", () => {
        const result = derivedRealization("Synthetic exact rewrite path.");

        expect(result).toEqual({
            kind: "derived",
            explanation: "Synthetic exact rewrite path.",
        });
        expect(describeResult(result)).toContain("Derived");
    });

    /**
     * Proves every Unsupported reason category survives construction as stable
     * machine-readable evidence rather than collapsing into one generic failure.
     */
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

    /**
     * Proves human-facing realization diagnostics cannot be empty, preserving
     * explainability for both Derived and Unsupported outcomes.
     */
    it("rejects empty human-readable diagnostics", () => {
        expect(() => unsupportedReason("capability-absent", "  ")).toThrow(
            "Unsupported realization message must not be empty.",
        );
        expect(() => derivedRealization("")).toThrow(
            "Derived realization explanation must not be empty.",
        );
    });
});
