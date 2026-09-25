/**
 * Proves the initial Thunderbird direct target's leaf and one-rule
 * classifications without assigning broader trigger/control-flow semantics.
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

import { thunderbirdDirectRealizationTarget } from "../src/index.js";

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
 * Exercises Thunderbird exactness classifications at the semantic leaf/initial
 * structure layer.
 */
describe("Thunderbird direct realization", () => {
    /**
     * Proves mark-read is Direct as a leaf semantic without silently selecting
     * incoming/manual/post-send/archive trigger behavior.
     */
    it("marks canonical mark-read Direct without assigning a trigger context", () => {
        expect(
            thunderbirdDirectRealizationTarget.checkDirectRealization(
                markRead(),
            ),
        ).toEqual({
            kind: "direct",
        });
    });

    /**
     * Proves Thunderbird Subject matching remains `exactness-unproven` under
     * the canonical Unicode/NFC contract.
     */
    it("keeps canonical Subject containment exactness unproven", () => {
        expect(
            thunderbirdDirectRealizationTarget.checkDirectRealization(
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
     * Proves Thunderbird's attachment-status predicate does not establish the
     * canonical MIME-disposition attachment definition.
     */
    it("keeps the canonical MIME attachment predicate exactness unproven", () => {
        expect(
            thunderbirdDirectRealizationTarget.checkDirectRealization(
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
     * Proves conjunction structure cannot manufacture exactness for unproven
     * Thunderbird condition leaves.
     */
    it("propagates unsupported conjuncts through Thunderbird AND structure", () => {
        const expression = createAndExpression(
            createCapabilitySpecimen(logicalAndCapability, null),
            [subjectContains("invoice"), hasAttachment()],
        );

        expect(
            thunderbirdDirectRealizationTarget.checkDirectRealization(
                expression,
            ),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves an initial single-filter rule remains Unsupported when its condition
     * leaf's exactness is unproven.
     */
    it("propagates leaf exactness through rule structure", () => {
        const expression = createRuleExpression(subjectContains("invoice"), [
            markRead(),
        ]);

        expect(
            thunderbirdDirectRealizationTarget.checkDirectRealization(
                expression,
            ),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });
});
