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

describe("Outlook direct realization", () => {
    it("marks canonical mark-read Direct", () => {
        expect(
            outlookDirectRealizationTarget.checkDirectRealization(markRead()),
        ).toEqual({
            kind: "direct",
        });
    });

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
