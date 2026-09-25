/**
 * Proves cross-IO orchestration preserves explicit refusal/exactness boundaries
 * instead of converting unsupported semantics opportunistically.
 *
 * @packageDocumentation
 */

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

/** Core registry used to recover validated canonical fixtures for refusal tests. */
const registry = createCoreCapabilityRegistry();

/**
 * Exercises representative refusal classes across dialect, codec, and endpoint
 * refinement layers.
 */
describe("negative cross-IO exactness", () => {
    /**
     * Proves both Sieve target and codec preserve the current
     * `capability-absent` attachment refusal.
     */
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

    /**
     * Proves Outlook target and codec agree on `exactness-unproven` for
     * canonical Subject containment rather than approximating it.
     */
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

    /**
     * Proves synthetic endpoint refinement can narrow base Sieve Direct
     * mark-read to `endpoint-profile-missing` when `imap4flags` is absent.
     *
     * @remarks
     * The profile is intentionally synthetic and proves refinement mechanics,
     * not a real endpoint observation.
     */
    it("narrows Direct Sieve mark-read when an endpoint profile lacks imap4flags", () => {
        const expression = validExpression(
            markReadFixtures,
            "mark-read.from-unread",
        );
        /** Synthetic empty-extension profile used only to prove narrowing mechanics. */
        const profile = defineSieveEndpointProfile(
            "synthetic.no-imap4flags",
            [],
        );
        /** Endpoint-refined target derived from the synthetic profile. */
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

/**
 * Retrieves one shared fixture by identity and proves it is valid canonical IR
 * before a negative exactness test uses it.
 *
 * @param fixtures Shared fixture family to search.
 * @param fixtureId Stable fixture identity required by the test.
 * @returns Validated canonical expression.
 * @throws Error When the fixture is missing, declared invalid, or fails current
 * canonical validation.
 */
function validExpression(
    fixtures: readonly CanonicalFixture[],
    fixtureId: string,
): CanonicalExpression {
    /** Shared fixture selected by stable identity. */
    const fixture = fixtures.find((candidate) => candidate.id === fixtureId);

    if (fixture === undefined)
        throw new Error('Missing shared fixture "' + fixtureId + '".');

    if (fixture.expectedValidation !== "valid") {
        throw new Error(
            'Shared fixture "' + fixtureId + '" is not canonically valid.',
        );
    }

    /** Current canonical-validation proof for the selected fixture expression. */
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
