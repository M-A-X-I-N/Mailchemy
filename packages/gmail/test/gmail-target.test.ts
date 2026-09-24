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

function subjectContains(needle: string) {
    return createConditionExpression(
        createCapabilitySpecimen(subjectContainsCapability, { needle }),
    );
}

function hasAttachment() {
    return createConditionExpression(
        createCapabilitySpecimen(hasAttachmentCapability, null),
    );
}

function markRead() {
    return createActionExpression(
        createCapabilitySpecimen(markReadCapability, null),
    );
}

describe("Gmail direct realization", () => {
    it("marks canonical mark-read Direct", () => {
        expect(
            gmailDirectRealizationTarget.checkDirectRealization(markRead()),
        ).toEqual({
            kind: "direct",
        });
    });

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
