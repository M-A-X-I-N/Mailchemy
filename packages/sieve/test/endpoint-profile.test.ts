import { describe, expect, it } from "vitest";

import {
    createActionExpression,
    createCapabilitySpecimen,
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

function markRead() {
    return createActionExpression(
        createCapabilitySpecimen(markReadCapability, null),
    );
}

function subjectContains(needle: string) {
    return createConditionExpression(
        createCapabilitySpecimen(subjectContainsCapability, { needle }),
    );
}

describe("Sieve endpoint profiles", () => {
    it("keeps mark-read Direct when imap4flags is available", () => {
        const profile = defineSieveEndpointProfile("synthetic.with-flags", [
            "imap4flags",
        ]);
        const target = createSieveEndpointRealizationTarget(profile);

        expect(target.checkDirectRealization(markRead())).toEqual({
            kind: "direct",
        });
    });

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

    it("normalizes extension names deterministically", () => {
        const profile = defineSieveEndpointProfile("synthetic.normalized", [
            " IMAP4FLAGS ",
            "body",
            "imap4flags",
        ]);

        expect(profile.data.extensions).toEqual(["body", "imap4flags"]);
    });

    it("rejects empty extension names instead of silently dropping malformed profile data", () => {
        expect(() =>
            defineSieveEndpointProfile("synthetic.invalid", [
                "imap4flags",
                " ",
            ]),
        ).toThrow(InvalidSieveEndpointProfileError);
    });

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
