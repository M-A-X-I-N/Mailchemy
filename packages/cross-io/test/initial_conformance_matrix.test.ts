/**
 * Proves the initial cross-target matrix covers the planned fixture/target
 * surface, preserves evidence-class distinctions, and matches its frozen
 * regression baseline.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    buildInitialCrossIoConformanceMatrix,
    renderInitialCrossIoConformanceMatrixMarkdown,
} from "../src/index.js";

import { expectedInitialConformanceMatrixMarkdown } from "./fixtures/expected_initial_conformance_matrix.js";

/**
 * Exercises aggregation/reporting behavior without redefining any adapter's
 * underlying realization semantics.
 */
describe("initial cross-IO conformance matrix", () => {
    /**
     * Proves the matrix includes every initial target column and all 23
     * canonically valid shared fixtures.
     */
    it("covers all initial targets and canonically valid shared fixtures", () => {
        const matrix = buildInitialCrossIoConformanceMatrix();

        expect(matrix.targetIds).toEqual([
            "gmail.filter.direct@1",
            "outlook.graph.inbox-rule.direct@1",
            "sieve.direct@1",
            "sieve.endpoint:purelymail.managesieve.2026-09-24",
            "thunderbird.msg-filter-rules.direct@1",
        ]);
        expect(matrix.rows).toHaveLength(23);
        expect(matrix.passed).toBe(true);
    });

    /**
     * Proves aggregation preserves adapter evidence classes instead of collapsing
     * known absence and unproven exactness into one generic unsupported state.
     */
    it("keeps exactness-unproven distinct from known capability absence", () => {
        const matrix = buildInitialCrossIoConformanceMatrix();
        const attachment = matrix.rows.find(
            (row) => row.fixtureId === "has-attachment.explicit-attachment",
        );

        expect(attachment?.cells["sieve.direct@1"]).toMatchObject({
            kind: "unsupported",
            reasonCode: "capability-absent",
        });
        expect(attachment?.cells["gmail.filter.direct@1"]).toMatchObject({
            kind: "unsupported",
            reasonCode: "exactness-unproven",
        });
    });

    /**
     * Proves the matrix keeps the dated Purelymail endpoint-refined column
     * distinct from base Sieve while preserving the observed Direct mark-read
     * classification for that 2026-09-24 profile.
     */
    it("shows Purelymail retaining Sieve mark-read support under its dated imap4flags profile", () => {
        const matrix = buildInitialCrossIoConformanceMatrix();
        const markRead = matrix.rows.find(
            (row) => row.fixtureId === "mark-read.from-unread",
        );

        expect(markRead?.cells["sieve.direct@1"]).toMatchObject({
            kind: "direct",
        });
        expect(
            markRead?.cells["sieve.endpoint:purelymail.managesieve.2026-09-24"],
        ).toMatchObject({
            kind: "direct",
        });
    });

    /**
     * Proves Markdown rendering is deterministic and still matches the frozen
     * initial matrix baseline used to detect unintended classification drift.
     */
    it("renders deterministically from the machine-readable matrix", () => {
        const first = renderInitialCrossIoConformanceMatrixMarkdown();
        const second = renderInitialCrossIoConformanceMatrixMarkdown();

        expect(second).toBe(first);
        expect(first).toBe(expectedInitialConformanceMatrixMarkdown);
        expect(first).toContain(
            "| Fixture | gmail.filter.direct@1 | outlook.graph.inbox-rule.direct@1 | sieve.direct@1 | sieve.endpoint:purelymail.managesieve.2026-09-24 | thunderbird.msg-filter-rules.direct@1 |",
        );
        expect(first).toContain(
            "| has-attachment.explicit-attachment | Unsupported (exactness-unproven) | Unsupported (exactness-unproven) | Unsupported (capability-absent) | Unsupported (capability-absent) | Unsupported (exactness-unproven) |",
        );
        expect(first).toContain(
            "| mark-read.from-unread | Direct | Direct | Direct | Direct | Direct |",
        );
    });
});
