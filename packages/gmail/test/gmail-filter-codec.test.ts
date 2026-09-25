/**
 * Proves the initial Gmail Filter codec's exact mark-read mapping, opaque
 * preservation boundaries, exactness refusals, and malformed-native handling.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    createActionExpression,
    createCapabilitySpecimen,
    createConditionExpression,
    markReadCapability,
    subjectContainsCapability,
} from "@mailchemy/core";

import { gmailFilterCodec } from "../src/index.js";

/**
 * Builds the canonical mark-read action used by codec expectations.
 *
 * @returns Canonical mark-read expression.
 */
function markRead() {
    return createActionExpression(
        createCapabilitySpecimen(markReadCapability, null),
    );
}

/**
 * Exercises the initial offline Gmail Filter codec independently of any remote
 * Gmail API endpoint operation.
 */
describe("initial Gmail Filter codec", () => {
    /**
     * Proves canonical mark-read encodes as removal of Gmail's `UNREAD`
     * system label and nothing else.
     */
    it("encodes canonical mark-read as removal of UNREAD", () => {
        expect(gmailFilterCodec.encode(markRead())).toEqual({
            kind: "encoded",
            native: {
                action: {
                    removeLabelIds: ["UNREAD"],
                },
            },
        });
    });

    /**
     * Proves exactly one `UNREAD` label removal decodes to canonical mark-read,
     * while a provider-assigned Filter ID remains representation-only metadata.
     */
    it("decodes exactly-UNREAD removal as canonical mark-read", () => {
        expect(
            gmailFilterCodec.decode({
                id: "server-assigned-id",
                action: {
                    removeLabelIds: ["UNREAD"],
                },
            }),
        ).toEqual({
            kind: "decoded",
            expression: markRead(),
        });
    });

    /**
     * Proves additional label removals prevent semantic collapse to mark-read and
     * are instead preserved opaquely.
     */
    it("does not drop additional Gmail label-removal semantics", () => {
        expect(
            gmailFilterCodec.decode({
                action: {
                    removeLabelIds: ["UNREAD", "INBOX"],
                },
            }),
        ).toMatchObject({
            kind: "opaque",
        });
    });

    /**
     * Proves Gmail's structured Subject field is recognized but not asserted
     * equivalent to Mailchemy's NFC/Unicode-lowercase Subject contract.
     */
    it("understands structured Subject criteria but keeps exactness unproven", () => {
        expect(
            gmailFilterCodec.decode({
                criteria: {
                    subject: "invoice",
                },
                action: {
                    removeLabelIds: ["UNREAD"],
                },
            }),
        ).toMatchObject({
            kind: "unsupported-native",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves Gmail `hasAttachment=true` is recognized while the MIME-level
     * canonical attachment definition remains unproven.
     */
    it("understands hasAttachment=true but keeps canonical attachment exactness unproven", () => {
        expect(
            gmailFilterCodec.decode({
                criteria: {
                    hasAttachment: true,
                },
            }),
        ).toMatchObject({
            kind: "unsupported-native",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves embedded Gmail query-language strings remain opaque instead of
     * being guessed into canonical predicates.
     */
    it("preserves Gmail query syntax opaquely instead of parsing unrelated search language", () => {
        expect(
            gmailFilterCodec.decode({
                criteria: {
                    query: "subject:invoice has:attachment",
                },
            }),
        ).toMatchObject({
            kind: "opaque",
        });
    });

    /**
     * Proves canonical Subject containment is refused at encode time with
     * `exactness-unproven` despite Gmail exposing an analogous Subject field.
     */
    it("refuses canonical Subject encoding until exact comparison semantics are proven", () => {
        const expression = createConditionExpression(
            createCapabilitySpecimen(subjectContainsCapability, {
                needle: "invoice",
            }),
        );

        expect(gmailFilterCodec.encode(expression)).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves native fields outside the initial structural vocabulary are
     * retained opaquely rather than silently discarded.
     */
    it("preserves unknown Gmail fields opaquely", () => {
        expect(
            gmailFilterCodec.decode({
                criteria: {
                    from: "sender@example.com",
                },
            }),
        ).toMatchObject({
            kind: "opaque",
        });
    });

    /**
     * Proves malformed values for recognized fields yield `invalid-native`
     * instead of opaque preservation or semantic decoding.
     */
    it("reports malformed native values explicitly", () => {
        expect(
            gmailFilterCodec.decode({
                action: {
                    removeLabelIds: "UNREAD",
                },
            } as unknown as Parameters<typeof gmailFilterCodec.decode>[0]),
        ).toMatchObject({
            kind: "unsupported-native",
            reason: {
                code: "invalid-native",
            },
        });
    });
});
