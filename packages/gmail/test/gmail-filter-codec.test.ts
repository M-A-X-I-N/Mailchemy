import { describe, expect, it } from "vitest";

import {
    createActionExpression,
    createCapabilitySpecimen,
    createConditionExpression,
    markReadCapability,
    subjectContainsCapability,
} from "@mailchemy/core";

import { gmailFilterCodec } from "../src/index.js";

function markRead() {
    return createActionExpression(
        createCapabilitySpecimen(markReadCapability, null),
    );
}

describe("initial Gmail Filter codec", () => {
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
