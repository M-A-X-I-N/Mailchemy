import type { UnsupportedReasonCode } from "@mailchemy/core";

import type {
    TargetRealizationCaseResult,
    TargetRealizationRun,
} from "./target-runner.js";

export type ConformanceMatrixCell =
    | {
          readonly kind: "direct";
          readonly expectationMatched: boolean;
      }
    | {
          readonly kind: "unsupported";
          readonly reasonCode: UnsupportedReasonCode;
          readonly message: string;
          readonly expectationMatched: boolean;
      }
    | {
          readonly kind: "error";
          readonly message: string;
          readonly expectationMatched: false;
      }
    | {
          readonly kind: "not-tested";
      };

export interface ConformanceMatrixRow {
    readonly fixtureId: string;
    readonly cells: Readonly<Record<string, ConformanceMatrixCell>>;
}

export interface ConformanceMatrix {
    readonly targetIds: readonly string[];
    readonly rows: readonly ConformanceMatrixRow[];
    readonly passed: boolean;
}

export function buildConformanceMatrix(
    runs: readonly TargetRealizationRun[],
): ConformanceMatrix {
    const targetIds = [...new Set(runs.map((run) => run.targetId))].sort(
        (left, right) => left.localeCompare(right),
    );
    const fixtureIds = [
        ...new Set(
            runs.flatMap((run) =>
                run.results.map((result) => result.fixtureId),
            ),
        ),
    ].sort((left, right) => left.localeCompare(right));

    const runsByTarget = new Map(runs.map((run) => [run.targetId, run]));

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

export function renderConformanceMatrixMarkdown(
    matrix: ConformanceMatrix,
): string {
    const header = [
        "Fixture",
        ...matrix.targetIds.map((targetId) => escapeCell(targetId)),
    ];
    const separator = header.map(() => "---");
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

function escapeCell(value: string): string {
    return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

const NOT_TESTED_CELL: ConformanceMatrixCell = Object.freeze({
    kind: "not-tested",
});
