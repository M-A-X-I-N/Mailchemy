/**
 * Proves deterministic conformance-matrix aggregation and Markdown rendering
 * from executable synthetic target-run results.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    createCapabilitySpecimen,
    createConditionExpression,
    defineDirectRealizationTarget,
    defineSemanticCapability,
    directRealization,
    invalid,
    parseCapabilityId,
    unsupportedRealization,
    unsupportedReason,
    valid,
    validationIssue,
} from "@mailchemy/core";
import {
    buildConformanceMatrix,
    defineCanonicalFixture,
    renderConformanceMatrixMarkdown,
    runTargetRealizationConformance,
} from "@mailchemy/conformance";

/** Synthetic parameterless condition represented in matrix evidence. */
const capability = defineSemanticCapability<null>({
    id: parseCapabilityId("test.condition.present@1"),
    role: "condition",
    description: "Synthetic matrix capability.",
    validateParameters: (value) =>
        value === null
            ? valid(null)
            : invalid(
                validationIssue(
                    "test.null.invalid",
                    "Expected a null parameter.",
                ),
            ),
    areParametersEqual: () => true,
});

/** Registry containing the synthetic matrix capability. */
const registry = new CapabilityRegistry();
registry.register(capability);

/** Canonically valid fixture used as the matrix row. */
const fixture = defineCanonicalFixture({
    id: "present.basic",
    capabilities: [capability.id],
    expression: createConditionExpression(
        createCapabilitySpecimen(capability, null),
    ),
    expectedValidation: "valid",
});

/**
 * Exercises matrix construction/presentation without introducing new target
 * semantics beyond the source runs.
 */
describe("conformance matrix", () => {
    /**
     * Proves Direct and Unsupported executable results become deterministic
     * machine-readable cells.
     */
    it("generates machine-readable cells from executable target runs", () => {
        const directTarget = defineDirectRealizationTarget({
            id: "synthetic.direct",
            checkDirectRealization: () => directRealization(),
        });
        const unsupportedTarget = defineDirectRealizationTarget({
            id: "synthetic.unproven",
            checkDirectRealization: () =>
                unsupportedRealization(
                    unsupportedReason(
                        "exactness-unproven",
                        "Synthetic target is not proven exact.",
                    ),
                ),
        });

        const directRun = runTargetRealizationConformance(
            registry,
            directTarget,
            [{ fixture, expected: { kind: "direct" } }],
        );
        const unsupportedRun = runTargetRealizationConformance(
            registry,
            unsupportedTarget,
            [
                {
                    fixture,
                    expected: {
                        kind: "unsupported",
                        reasonCode: "exactness-unproven",
                    },
                },
            ],
        );

        const matrix = buildConformanceMatrix([unsupportedRun, directRun]);

        expect(matrix.targetIds).toEqual([
            "synthetic.direct",
            "synthetic.unproven",
        ]);
        expect(matrix.rows).toEqual([
            {
                fixtureId: "present.basic",
                cells: {
                    "synthetic.direct": {
                        kind: "direct",
                        expectationMatched: true,
                    },
                    "synthetic.unproven": {
                        kind: "unsupported",
                        reasonCode: "exactness-unproven",
                        message: "Synthetic target is not proven exact.",
                        expectationMatched: true,
                    },
                },
            },
        ]);
        expect(matrix.passed).toBe(true);
    });

    /**
     * Proves Markdown is a deterministic presentation of the matrix model.
     */
    it("renders the machine-readable model as a deterministic Markdown table", () => {
        const directTarget = defineDirectRealizationTarget({
            id: "target-a",
            checkDirectRealization: () => directRealization(),
        });
        const directRun = runTargetRealizationConformance(
            registry,
            directTarget,
            [{ fixture, expected: { kind: "direct" } }],
        );

        const markdown = renderConformanceMatrixMarkdown(
            buildConformanceMatrix([directRun]),
        );

        expect(markdown).toBe(
            [
                "| Fixture | target-a |",
                "| --- | --- |",
                "| present.basic | Direct |",
            ].join("\n"),
        );
    });

    /**
     * Proves expectation mismatches remain visible in both machine-readable and
     * Markdown output.
     */
    it("shows expectation mismatches instead of hiding them", () => {
        const target = defineDirectRealizationTarget({
            id: "synthetic.unexpected-direct",
            checkDirectRealization: () => directRealization(),
        });
        const run = runTargetRealizationConformance(registry, target, [
            {
                fixture,
                expected: {
                    kind: "unsupported",
                    reasonCode: "capability-absent",
                },
            },
        ]);

        const matrix = buildConformanceMatrix([run]);

        expect(matrix.passed).toBe(false);
        expect(matrix.rows[0]?.cells["synthetic.unexpected-direct"]).toEqual({
            kind: "direct",
            expectationMatched: false,
        });
        expect(renderConformanceMatrixMarkdown(matrix)).toContain("Direct ⚠");
    });
});
