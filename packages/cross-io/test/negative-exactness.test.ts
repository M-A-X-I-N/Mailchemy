import { describe, expect, it } from "vitest";

import {
    createCoreCapabilityRegistry,
    validateCanonicalExpression,
    type CanonicalExpression,
} from "@mailchemy/core";
import {
    hasAttachmentFixtures,
    markReadFixtures,
    subjectContainsFixtures,
    type CanonicalFixture,
} from "@mailchemy/conformance";
import {
    outlookDirectRealizationTarget,
    outlookInboxRuleCodec,
} from "@mailchemy/outlook";
import {
    createSieveEndpointRealizationTarget,
    defineSieveEndpointProfile,
    sieveCodec,
    sieveDirectRealizationTarget,
} from "@mailchemy/sieve";

const registry = createCoreCapabilityRegistry();

describe("negative cross-IO exactness", () => {
    it("refuses canonical attachment semantics at the Sieve dialect layer", () => {
        const expression = validExpression(
            hasAttachmentFixtures,
            "has-attachment.explicit-attachment",
        );

        expect(
            sieveDirectRealizationTarget.checkDirectRealization(expression),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "capability-absent",
            },
        });
        expect(sieveCodec.encode(expression)).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "capability-absent",
            },
        });
    });

    it("refuses Outlook Subject containment while exact comparison semantics remain unproven", () => {
        const expression = validExpression(
            subjectContainsFixtures,
            "subject.contains.ascii-case-insensitive",
        );

        expect(
            outlookDirectRealizationTarget.checkDirectRealization(expression),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
        expect(outlookInboxRuleCodec.encode(expression)).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    it("narrows Direct Sieve mark-read when an endpoint profile lacks imap4flags", () => {
        const expression = validExpression(
            markReadFixtures,
            "mark-read.from-unread",
        );
        const profile = defineSieveEndpointProfile(
            "synthetic.no-imap4flags",
            [],
        );
        const target = createSieveEndpointRealizationTarget(profile);

        expect(
            sieveDirectRealizationTarget.checkDirectRealization(expression),
        ).toEqual({
            kind: "direct",
        });
        expect(target.checkDirectRealization(expression)).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "endpoint-profile-missing",
            },
        });
    });
});

function validExpression(
    fixtures: readonly CanonicalFixture[],
    fixtureId: string,
): CanonicalExpression {
    const fixture = fixtures.find((candidate) => candidate.id === fixtureId);

    if (fixture === undefined)
        throw new Error('Missing shared fixture "' + fixtureId + '".');

    if (fixture.expectedValidation !== "valid") {
        throw new Error(
            'Shared fixture "' + fixtureId + '" is not canonically valid.',
        );
    }

    const validation = validateCanonicalExpression(
        registry,
        fixture.expression,
    );

    if (!validation.ok) {
        throw new Error(
            'Shared fixture "' + fixtureId + '" failed canonical validation.',
        );
    }

    return validation.value;
}
