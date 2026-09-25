/**
 * Defines the shared A/B/C canonical rule-shaped fixtures plus stable definition
 * and structural edge cases used across later target/codec conformance work.
 *
 * @remarks
 * These fixtures establish canonical structure and capability composition. They
 * are not themselves claims that any target realizes A, B, C, or the edge cases
 * directly.
 *
 * @packageDocumentation
 */

import {
    createActionExpression,
    createAndExpression,
    createCapabilitySpecimen,
    createConditionExpression,
    createRuleExpression,
    hasAttachmentCapability,
    logicalAndCapability,
    markReadCapability,
    subjectContainsCapability,
} from "@mailchemy/core";

import { defineCanonicalFixture } from "../fixture.js";

/**
 * Builds a canonical Subject-containment condition for rule-shaped fixtures.
 *
 * @param needle Subject substring represented by the semantic specimen.
 * @returns Canonical condition expression.
 */
function subjectContains(needle: string) {
    return createConditionExpression(
        createCapabilitySpecimen(subjectContainsCapability, { needle }),
    );
}

/**
 * Builds the parameterless canonical has-attachment condition.
 *
 * @returns Canonical attachment-presence condition expression.
 */
function hasAttachment() {
    return createConditionExpression(
        createCapabilitySpecimen(hasAttachmentCapability, null),
    );
}

/**
 * Builds the parameterless canonical mark-read action.
 *
 * @returns Canonical mark-read action expression.
 */
function markRead() {
    return createActionExpression(
        createCapabilitySpecimen(markReadCapability, null),
    );
}

/**
 * Shared valid canonical rule fixtures A/B/C plus definition/structure edges
 * that preserve normalization and operand-order expectations.
 */
export const initialRuleFixtures = Object.freeze([
    defineCanonicalFixture({
        id: "rule.a.subject-invoice-mark-read",
        capabilities: [subjectContainsCapability.id, markReadCapability.id],
        expression: createRuleExpression(subjectContains("invoice"), [
            markRead(),
        ]),
        expectedValidation: "valid",
        notes: 'A: IF subject contains "invoice" THEN mark read.',
        references: [
            "planning/CAPABILITY_REGISTRY_HARNESS.md#45-initial-rule-shaped-specimens",
        ],
    }),
    defineCanonicalFixture({
        id: "rule.b.has-attachment-mark-read",
        capabilities: [hasAttachmentCapability.id, markReadCapability.id],
        expression: createRuleExpression(hasAttachment(), [markRead()]),
        expectedValidation: "valid",
        notes: "B: IF has attachment THEN mark read.",
        references: [
            "planning/CAPABILITY_REGISTRY_HARNESS.md#45-initial-rule-shaped-specimens",
        ],
    }),
    defineCanonicalFixture({
        id: "rule.c.subject-invoice-and-attachment-mark-read",
        capabilities: [
            subjectContainsCapability.id,
            hasAttachmentCapability.id,
            logicalAndCapability.id,
            markReadCapability.id,
        ],
        expression: createRuleExpression(
            createAndExpression(
                createCapabilitySpecimen(logicalAndCapability, null),
                [subjectContains("invoice"), hasAttachment()],
            ),
            [markRead()],
        ),
        expectedValidation: "valid",
        notes: 'C: IF subject contains "invoice" AND has attachment THEN mark read.',
        references: [
            "planning/CAPABILITY_REGISTRY_HARNESS.md#45-initial-rule-shaped-specimens",
        ],
    }),
    defineCanonicalFixture({
        id: "rule.edge.subject-nfc-canonicalization",
        capabilities: [subjectContainsCapability.id, markReadCapability.id],
        expression: createRuleExpression(subjectContains("Cafe\u0301"), [
            markRead(),
        ]),
        expectedValidation: "valid",
        notes: "Definition edge: decomposed Unicode subject needle is canonicalized to NFC.",
    }),
    defineCanonicalFixture({
        id: "rule.edge.subject-whitespace-needle",
        capabilities: [subjectContainsCapability.id, markReadCapability.id],
        expression: createRuleExpression(subjectContains(" "), [markRead()]),
        expectedValidation: "valid",
        notes: "Definition edge: a non-empty whitespace needle remains valid.",
    }),
    defineCanonicalFixture({
        id: "rule.edge.and-reversed-operands",
        capabilities: [
            subjectContainsCapability.id,
            hasAttachmentCapability.id,
            logicalAndCapability.id,
            markReadCapability.id,
        ],
        expression: createRuleExpression(
            createAndExpression(
                createCapabilitySpecimen(logicalAndCapability, null),
                [hasAttachment(), subjectContains("invoice")],
            ),
            [markRead()],
        ),
        expectedValidation: "valid",
        notes: "Structural edge: reversed conjunction operand order is retained as supplied.",
    }),
]);
