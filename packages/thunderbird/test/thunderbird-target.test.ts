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

describe("Thunderbird direct realization", () => {
    it("marks canonical mark-read Direct without assigning a trigger context", () => {
        expect(
            thunderbirdDirectRealizationTarget.checkDirectRealization(
                markRead(),
            ),
        ).toEqual({
            kind: "direct",
        });
    });

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
