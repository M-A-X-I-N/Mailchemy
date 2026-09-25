/**
 * Proves the shared A/B/C canonical rule fixtures and stable definition/ordering
 * edge cases retain their planned semantic structure.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    createCoreCapabilityRegistry,
    hasAttachmentCapability,
    logicalAndCapability,
    markReadCapability,
    subjectContainsCapability,
    validateCanonicalExpression,
} from "@mailchemy/core";
import { sharedRuleFixtures } from "@mailchemy/conformance";

/**
 * Exercises shared canonical rule structure independently of target realization.
 */
describe("initial shared rule fixtures", () => {
    /**
     * Proves the shared fixture inventory remains stable and includes the planned
     * A/B/C cases plus explicit definition/structure edges.
     */
    it("registers A/B/C plus stable definition-edge fixtures", () => {
        expect(sharedRuleFixtures.map((fixture) => fixture.id)).toEqual([
            "rule.a.subject-invoice-mark-read",
            "rule.b.has-attachment-mark-read",
            "rule.c.subject-invoice-and-attachment-mark-read",
            "rule.edge.subject-nfc-canonicalization",
            "rule.edge.subject-whitespace-needle",
            "rule.edge.and-reversed-operands",
        ]);
    });

    /**
     * Proves every shared rule-shaped fixture is canonically valid under the full
     * currently implemented core capability registry.
     */
    it("all validate against the accumulated core capability registry", () => {
        const registry = createCoreCapabilityRegistry();

        for (const fixture of sharedRuleFixtures) {
            const result = validateCanonicalExpression(
                registry,
                fixture.expression,
            );
            expect(result.ok, fixture.id).toBe(true);
        }
    });

    /**
     * Proves fixture C preserves the intended AND composition and action grouping
     * across all four initial semantic contracts.
     */
    it("fixture C composes the four initial contracts in the planned shape", () => {
        const fixture = sharedRuleFixtures.find(
            (candidate) =>
                candidate.id ===
                "rule.c.subject-invoice-and-attachment-mark-read",
        );

        expect(fixture).toBeDefined();

        if (
            fixture === undefined ||
            typeof fixture.expression !== "object" ||
            fixture.expression === null
        )
            return;

        const expression = fixture.expression;

        expect(expression.kind).toBe("rule");

        if (expression.kind !== "rule")
            return;

        expect(expression.condition.kind).toBe("and");

        if (expression.condition.kind !== "and")
            return;

        expect(expression.condition.operator.capabilityId).toBe(
            logicalAndCapability.id,
        );
        expect(
            expression.condition.operands.map((operand) =>
                operand.kind === "condition"
                    ? operand.instance.capabilityId
                    : null,
            ),
        ).toEqual([subjectContainsCapability.id, hasAttachmentCapability.id]);
        expect(expression.actions).toHaveLength(1);
        expect(expression.actions[0]?.instance.capabilityId).toBe(
            markReadCapability.id,
        );
    });

    /**
     * Proves conjunction operand order is retained as canonical structure instead
     * of being normalized/sorted by the fixture layer.
     */
    it("retains reversed AND operand order as a distinct canonical structure", () => {
        const fixture = sharedRuleFixtures.find(
            (candidate) => candidate.id === "rule.edge.and-reversed-operands",
        );

        expect(fixture).toBeDefined();

        if (
            fixture === undefined ||
            typeof fixture.expression !== "object" ||
            fixture.expression === null ||
            fixture.expression.kind !== "rule" ||
            fixture.expression.condition.kind !== "and"
        )
            return;

        expect(
            fixture.expression.condition.operands.map((operand) =>
                operand.kind === "condition"
                    ? operand.instance.capabilityId
                    : null,
            ),
        ).toEqual([hasAttachmentCapability.id, subjectContainsCapability.id]);
    });
});
