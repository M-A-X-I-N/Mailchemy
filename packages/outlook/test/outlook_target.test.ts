/**
 * Proves the initial Outlook/Graph direct target's leaf and structure
 * classifications.
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

import { outlookDirectRealizationTarget } from "../src/index.js";

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
 * Exercises Graph exactness classifications without treating typed native fields
 * as automatic proof of canonical equivalence.
 */
describe("Outlook direct realization", () => {
    /**
     * Proves canonical mark-read is Direct through Graph `markAsRead=true`.
     */
    it("marks canonical mark-read Direct", () => {
        expect(
            outlookDirectRealizationTarget.checkDirectRealization(markRead()),
        ).toEqual({
            kind: "direct",
        });
    });

    /**
     * Proves underdocumented Graph Subject matching remains
     * `exactness-unproven`.
     */
    it("keeps canonical Subject containment exactness unproven", () => {
        expect(
            outlookDirectRealizationTarget.checkDirectRealization(
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
     * Proves Graph attachment presence does not establish the canonical
     * MIME-disposition attachment definition.
     */
    it("keeps the canonical MIME attachment predicate exactness unproven", () => {
        expect(
            outlookDirectRealizationTarget.checkDirectRealization(
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
     * Proves Graph's conjunctive native condition shape cannot manufacture
     * exactness for unproven canonical operands.
     */
    it("propagates unsupported conjuncts through Graph's conjunctive condition shape", () => {
        const expression = createAndExpression(
            createCapabilitySpecimen(logicalAndCapability, null),
            [subjectContains("invoice"), hasAttachment()],
        );

        expect(
            outlookDirectRealizationTarget.checkDirectRealization(expression),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves an otherwise supported single-rule envelope remains Unsupported
     * when its condition leaf's exactness is unproven.
     */
    it("propagates leaf exactness through rule structure", () => {
        const expression = createRuleExpression(subjectContains("invoice"), [
            markRead(),
        ]);

        expect(
            outlookDirectRealizationTarget.checkDirectRealization(expression),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });
});
