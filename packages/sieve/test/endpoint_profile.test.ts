/**
 * Proves Sieve endpoint-profile normalization/narrowing and the dated
 * Purelymail ManageSieve capability snapshot.
 *
 * @remarks
 * Synthetic profiles exercise generic endpoint mechanics. Only the explicitly
 * dated Purelymail case represents provider-specific observed evidence.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    createActionExpression,
    createCapabilityInstance,
    createConditionExpression,
    markReadCapability,
    subjectContainsCapability,
} from "@mailchemy/core";

import {
    InvalidSieveEndpointProfileError,
    createSieveEndpointRealizationTarget,
    defineSieveEndpointProfile,
    purelymailSieveExtensions20260924,
    purelymailSieveProfile20260924,
    purelymailSieveTarget20260924,
} from "../src/index.js";

/**
 * Builds canonical mark-read, whose current Sieve realization requires
 * `imap4flags`.
 *
 * @returns Canonical mark-read action.
 */
function markRead() {
    return createActionExpression(
        createCapabilityInstance(markReadCapability, null),
    );
}

/**
 * Builds canonical Subject containment used to prove endpoint refinement cannot
 * broaden a dialect-level exactness refusal.
 *
 * @param needle Canonical Subject substring.
 * @returns Canonical condition expression.
 */
function subjectContains(needle: string) {
    return createConditionExpression(
        createCapabilityInstance(subjectContainsCapability, { needle }),
    );
}

/**
 * Exercises runtime extension-profile refinement separately from Sieve dialect
 * semantics.
 */
describe("Sieve endpoint profiles", () => {
    /**
     * Proves an endpoint profile containing `imap4flags` preserves the base
     * target's Direct mark-read classification.
     */
    it("keeps mark-read Direct when imap4flags is available", () => {
        const profile = defineSieveEndpointProfile("synthetic.with-flags", [
            "imap4flags",
        ]);
        const target = createSieveEndpointRealizationTarget(profile);

        expect(target.checkDirectRealization(markRead())).toEqual({
            kind: "direct",
        });
    });

    /**
     * Proves missing endpoint extension evidence narrows an otherwise-Direct
     * dialect realization to `endpoint-profile-missing`.
     */
    it("narrows mark-read when imap4flags is absent", () => {
        const profile = defineSieveEndpointProfile(
            "synthetic.without-flags",
            [],
        );
        const target = createSieveEndpointRealizationTarget(profile);

        expect(target.checkDirectRealization(markRead())).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "endpoint-profile-missing",
            },
        });
    });

    /**
     * Proves endpoint classification follows supplied runtime/profile data
     * rather than a built-in assumption about one provider.
     */
    it("follows the runtime-supplied profile instead of a hard-coded provider assumption", () => {
        const withFlags = createSieveEndpointRealizationTarget(
            defineSieveEndpointProfile("runtime.with-flags", ["imap4flags"]),
        );
        const withoutFlags = createSieveEndpointRealizationTarget(
            defineSieveEndpointProfile("runtime.without-flags", []),
        );

        expect(withFlags.checkDirectRealization(markRead()).kind).toBe(
            "direct",
        );
        expect(withoutFlags.checkDirectRealization(markRead())).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "endpoint-profile-missing",
            },
        });
    });

    /**
     * Proves endpoint extension availability cannot upgrade a base
     * `exactness-unproven` result to Direct.
     */
    it("never broadens a base Sieve exactness refusal", () => {
        const profile = defineSieveEndpointProfile(
            "synthetic.everything-needed",
            ["imap4flags"],
        );
        const target = createSieveEndpointRealizationTarget(profile);

        expect(
            target.checkDirectRealization(subjectContains("invoice")),
        ).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves extension names are trimmed, lowercased, deduplicated, and sorted
     * before being retained as endpoint evidence.
     */
    it("normalizes extension names deterministically", () => {
        const profile = defineSieveEndpointProfile("synthetic.normalized", [
            " IMAP4FLAGS ",
            "body",
            "imap4flags",
        ]);

        expect(profile.data.extensions).toEqual(["body", "imap4flags"]);
    });

    /**
     * Proves malformed profile entries fail explicitly instead of silently
     * changing the observed/supplied extension set.
     */
    it("rejects empty extension names instead of silently dropping malformed profile data", () => {
        expect(() =>
            defineSieveEndpointProfile("synthetic.invalid", [
                "imap4flags",
                " ",
            ]),
        ).toThrow(InvalidSieveEndpointProfileError);
    });

    /**
     * Proves the 2026-09-24 Purelymail observation retains its dated identity,
     * extension snapshot, and resulting mark-read availability without becoming
     * a timeless definition of the provider.
     */
    it("keeps the observed Purelymail snapshot as a dated replaceable fixture", () => {
        expect(purelymailSieveProfile20260924.id).toBe(
            "purelymail.managesieve.2026-09-24",
        );
        expect(purelymailSieveProfile20260924.data.extensions).toEqual(
            purelymailSieveExtensions20260924,
        );
        expect(
            purelymailSieveTarget20260924.checkDirectRealization(markRead()),
        ).toEqual({
            kind: "direct",
        });
    });
});
