/**
 * Proves the initial Gmail Filter target's Direct/Unsupported classifications
 * and structural propagation rules.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

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

import { gmailDirectRealizationTarget } from "../src/index.js";

/**
 * Builds a canonical Subject-containment condition.
 *
 * @param needle Canonical Subject substring.
 * @returns Canonical condition expression.
 */
function subjectContains(needle: string) {
    return createConditionExpression(
        createCapabilitySpecimen(subjectContainsCapability, { needle }),
    );
}

/**
 * Builds the canonical MIME-defined attachment condition.
 *
 * @returns Canonical attachment-presence expression.
 */
function hasAttachment() {
    return createConditionExpression(
        createCapabilitySpecimen(hasAttachmentCapability, null),
    );
}

/**
 * Builds canonical mark-read.
 *
 * @returns Canonical action expression.
 */
function markRead() {
    return createActionExpression(
        createCapabilitySpecimen(markReadCapability, null),
    );
}

/**
 * Exercises Gmail exactness classifications without relying on superficial
 * field-name similarity.
 */
describe("Gmail direct realization", () => {
    /**
     * Proves canonical mark-read is Direct through Gmail `UNREAD` removal.
     */
    it("marks canonical mark-read Direct", () => {
        expect(
            gmailDirectRealizationTarget.checkDirectRealization(markRead()),
        ).toEqual({
            kind: "direct",
        });
    });

    /**
     * Proves Gmail's structured Subject criterion does not by itself establish
     * canonical Subject-comparison equivalence.
     */
    it("keeps canonical Subject containment exactness unproven", () => {
        expect(
            gmailDirectRealizationTarget.checkDirectRealization(
                subjectContains("invoice"),
            ),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves Gmail's attachment criterion does not establish the canonical
     * MIME-disposition definition.
     */
    it("keeps the canonical MIME attachment predicate exactness unproven", () => {
        expect(
            gmailDirectRealizationTarget.checkDirectRealization(
                hasAttachment(),
            ),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves AND-shaped native criteria structure cannot manufacture exactness
     * for unsupported/unproven canonical operands.
     */
    it("propagates unsupported conjuncts instead of inferring support from Gmail's AND-shaped criteria object", () => {
        const expression = createAndExpression(
            createCapabilitySpecimen(logicalAndCapability, null),
            [subjectContains("invoice"), hasAttachment()],
        );

        expect(
            gmailDirectRealizationTarget.checkDirectRealization(expression),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves an otherwise supported filter-shaped rule remains Unsupported when
     * its condition leaf's exactness is unproven.
     */
    it("propagates leaf exactness through filter rule structure", () => {
        const expression = createRuleExpression(subjectContains("invoice"), [
            markRead(),
        ]);

        expect(
            gmailDirectRealizationTarget.checkDirectRealization(expression),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });
});
