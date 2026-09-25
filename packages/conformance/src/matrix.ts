/**
 * Aggregates executable target-realization runs into a deterministic
 * machine-readable matrix and a derived Markdown presentation.
 *
 * @remarks
 * Matrix cells report the results already produced by target conformance runs.
 * The matrix does not independently infer or strengthen target/provider support.
 *
 * @packageDocumentation
 */

import type { UnsupportedReasonCode } from "@mailchemy/core";

import type {
    TargetRealizationCaseResult,
    TargetRealizationRun,
} from "./target-runner.js";

/**
 * One target/fixture matrix cell derived from executable conformance evidence.
 */
export type ConformanceMatrixCell =
    | {
          /** Actual target result was Direct. */
          readonly kind: "direct";

          /** Whether Direct matched the case's declared expectation. */
          readonly expectationMatched: boolean;
      }
    | {
          /** Actual target result was Unsupported. */
          readonly kind: "unsupported";

          /** Refusal category returned by the target. */
          readonly reasonCode: UnsupportedReasonCode;

          /** Human-readable refusal diagnostic returned by the target. */
          readonly message: string;

          /** Whether kind/reason matched the case's declared expectation. */
          readonly expectationMatched: boolean;
      }
    | {
          /** No usable target result was produced for the case. */
          readonly kind: "error";

          /** Human-readable harness/validation diagnostic. */
          readonly message: string;

          /** Error cells can never satisfy an expectation. */
          readonly expectationMatched: false;
      }
    | {
          /** This target run did not contain the fixture. */
          readonly kind: "not-tested";
      };

/**
 * One fixture row across every target represented in the matrix.
 */
export interface ConformanceMatrixRow {
    /** Stable fixture identity. */
    readonly fixtureId: string;

    /** Frozen target-ID-to-cell mapping. */
    readonly cells: Readonly<Record<string, ConformanceMatrixCell>>;
}

/**
 * Deterministic aggregate view of multiple target-realization runs.
 */
export interface ConformanceMatrix {
    /** Sorted unique target identities represented by the matrix. */
    readonly targetIds: readonly string[];

    /** Sorted fixture rows with one cell per target. */
    readonly rows: readonly ConformanceMatrixRow[];

    /** Whether every source target run passed its expectations. */
    readonly passed: boolean;
}

/**
 * Builds a deterministic machine-readable matrix from executable target runs.
 *
 * @param runs Target realization conformance runs to aggregate.
 * @returns Frozen matrix with sorted target IDs and fixture rows.
 */
export function buildConformanceMatrix(
    runs: readonly TargetRealizationRun[],
): ConformanceMatrix {
    /** Sorted unique target identities used as matrix columns. */
    const targetIds = [...new Set(runs.map((run) => run.targetId))].sort(
        (left, right) => left.localeCompare(right),
    );

    /** Sorted unique fixture identities used as matrix rows. */
    const fixtureIds = [
        ...new Set(
            runs.flatMap((run) =>
                run.results.map((result) => result.fixtureId),
            ),
        ),
    ].sort((left, right) => left.localeCompare(right));

    /** Lookup preserving the latest supplied run for each unique target ID. */
    const runsByTarget = new Map(runs.map((run) => [run.targetId, run]));

    /** Deterministic fixture rows constructed across all target columns. */
    const rows = fixtureIds.map((fixtureId) => {
        const cells: Record<string, ConformanceMatrixCell> = {};

        for (const targetId of targetIds) {
            const run = runsByTarget.get(targetId);
            const result = run?.results.find(
                (entry) => entry.fixtureId === fixtureId,
            );
            cells[targetId] =
                result === undefined ? NOT_TESTED_CELL : cellFromResult(result);
        }

        return Object.freeze({
            fixtureId,
            cells: Object.freeze(cells),
        });
    });

    return Object.freeze({
        targetIds: Object.freeze(targetIds),
        rows: Object.freeze(rows),
        passed: runs.every((run) => run.passed),
    });
}

/**
 * Renders a matrix as deterministic Markdown without changing cell semantics.
 *
 * @param matrix Machine-readable conformance matrix.
 * @returns Pipe-delimited Markdown table preserving matrix order.
 */
export function renderConformanceMatrixMarkdown(
    matrix: ConformanceMatrix,
): string {
    /** Escaped Markdown header row. */
    const header = [
        "Fixture",
        ...matrix.targetIds.map((targetId) => escapeCell(targetId)),
    ];

    /** Markdown separator row matching the header width. */
    const separator = header.map(() => "---");

    /** Escaped data rows rendered from machine-readable matrix cells. */
    const rows = matrix.rows.map((row) => [
        escapeCell(row.fixtureId),
        ...matrix.targetIds.map((targetId) =>
            renderCell(row.cells[targetId] ?? NOT_TESTED_CELL),
        ),
    ]);

    return [header, separator, ...rows]
        .map((row) => `| ${row.join(" | ")} |`)
        .join("\n");
}

/**
 * Converts one target-case result into its matrix cell without altering the
 * underlying exactness/refusal evidence.
 *
 * @param result Executed target conformance case result.
 * @returns Matrix cell preserving actual classification and expectation match.
 */
function cellFromResult(
    result: TargetRealizationCaseResult,
): ConformanceMatrixCell {
    if (result.actual?.kind === "direct") {
        return Object.freeze({
            kind: "direct",
            expectationMatched: result.passed,
        });
    }

    if (result.actual?.kind === "unsupported") {
        return Object.freeze({
            kind: "unsupported",
            reasonCode: result.actual.reason.code,
            message: result.actual.reason.message,
            expectationMatched: result.passed,
        });
    }

    return Object.freeze({
        kind: "error",
        message:
            result.message ?? "Target conformance case produced no result.",
        expectationMatched: false,
    });
}

/**
 * Renders one machine-readable matrix cell for Markdown presentation.
 *
 * @param cell Matrix cell to render.
 * @returns Human-readable cell text with mismatch markers where applicable.
 */
function renderCell(cell: ConformanceMatrixCell): string {
    switch (cell.kind) {
        case "direct":
            return cell.expectationMatched ? "Direct" : "Direct ⚠";
        case "unsupported":
            return `${cell.expectationMatched ? "" : "⚠ "}Unsupported (${escapeCell(cell.reasonCode)})`;
        case "error":
            return `Error: ${escapeCell(cell.message)}`;
        case "not-tested":
            return "Not tested";
    }
}

/**
 * Escapes text that would otherwise corrupt a Markdown table cell.
 *
 * @param value Raw cell text.
 * @returns Text with pipes escaped and newlines flattened to spaces.
 */
function escapeCell(value: string): string {
    return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

/**
 * Shared immutable marker used when a target run contains no result for a
 * fixture represented elsewhere in the matrix.
 */
const NOT_TESTED_CELL: ConformanceMatrixCell = Object.freeze({
    kind: "not-tested",
});
