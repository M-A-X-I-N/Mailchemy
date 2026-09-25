/**
 * Proves the initial Sieve dialect target's Direct/Unsupported classifications
 * independently of any endpoint capability profile.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    createActionExpression,
    createAndExpression,
    createCapabilityInstance,
    createConditionExpression,
    createRuleExpression,
    hasAttachmentCapability,
    logicalAndCapability,
    markReadCapability,
    subjectContainsCapability,
} from "@mailchemy/core";

import { sieveDirectRealizationTarget } from "../src/index.js";

/**
 * Builds a canonical Subject-containment condition for dialect-target tests.
 *
 * @param needle Canonical Subject substring.
 * @returns Condition expression under the core Subject contract.
 */
function subjectContains(needle: string) {
    return createConditionExpression(
        createCapabilityInstance(subjectContainsCapability, { needle }),
    );
}

/**
 * Builds the canonical narrow attachment-presence condition.
 *
 * @returns Canonical attachment condition expression.
 */
function hasAttachment() {
    return createConditionExpression(
        createCapabilityInstance(hasAttachmentCapability, null),
    );
}

/**
 * Builds the canonical mark-read action.
 *
 * @returns Canonical action expression.
 */
function markRead() {
    return createActionExpression(
        createCapabilityInstance(markReadCapability, null),
    );
}

/**
 * Exercises Sieve dialect-level exactness classifications before endpoint
 * extension availability is considered.
 */
describe("Sieve direct realization", () => {
    /**
     * Proves mark-read is Direct for the initial Sieve dialect mapping itself.
     */
    it("marks the canonical mark-read leaf Direct at the Sieve dialect layer", () => {
        expect(
            sieveDirectRealizationTarget.checkDirectRealization(markRead()),
        ).toEqual({
            kind: "direct",
        });
    });

    /**
     * Proves similar-looking native `header :contains` syntax does not elevate
     * canonical Subject containment beyond `exactness-unproven`.
     */
    it("keeps canonical Subject containment exactness unproven", () => {
        expect(
            sieveDirectRealizationTarget.checkDirectRealization(
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
     * Proves the current direct Sieve target has no registered exact realization
     * for the narrow canonical MIME attachment predicate.
     */
    it("reports the narrow attachment predicate as absent from direct Sieve realizations", () => {
        expect(
            sieveDirectRealizationTarget.checkDirectRealization(
                hasAttachment(),
            ),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "capability-absent",
            },
        });
    });

    /**
     * Proves conjunction structure cannot hide/refine away Unsupported evidence
     * from an operand.
     */
    it("propagates an unsupported AND operand instead of inferring support from structure alone", () => {
        const expression = createAndExpression(
            createCapabilityInstance(logicalAndCapability, null),
            [subjectContains("invoice"), hasAttachment()],
        );

        expect(
            sieveDirectRealizationTarget.checkDirectRealization(expression),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves an otherwise supported rule envelope remains Unsupported when its
     * condition leaf's exactness is unproven.
     */
    it("propagates leaf exactness through rule structure", () => {
        const expression = createRuleExpression(subjectContains("invoice"), [
            markRead(),
        ]);

        expect(
            sieveDirectRealizationTarget.checkDirectRealization(expression),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });
});
