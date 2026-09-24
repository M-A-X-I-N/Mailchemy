import type { GmailFilterNative } from "../../src/index.js";

export interface NativeGmailFixture {
    readonly id: string;
    readonly native: GmailFilterNative;
    readonly expectedKind: "decoded" | "unsupported-native" | "opaque";
    readonly expectedReasonCode?:
        "invalid-native" | "semantic-unsupported" | "exactness-unproven";
}

export const nativeGmailFixtures = Object.freeze([
    {
        id: "native.mark-read.minimal",
        native: {
            action: {
                removeLabelIds: ["UNREAD"],
            },
        },
        expectedKind: "decoded",
    },
    {
        id: "native.mark-read.with-server-id",
        native: {
            id: "filter-123",
            action: {
                removeLabelIds: ["UNREAD"],
            },
        },
        expectedKind: "decoded",
    },
    {
        id: "native.subject-mark-read",
        native: {
            criteria: {
                subject: "invoice",
            },
            action: {
                removeLabelIds: ["UNREAD"],
            },
        },
        expectedKind: "unsupported-native",
        expectedReasonCode: "exactness-unproven",
    },
    {
        id: "native.has-attachment",
        native: {
            criteria: {
                hasAttachment: true,
            },
        },
        expectedKind: "unsupported-native",
        expectedReasonCode: "exactness-unproven",
    },
    {
        id: "native.query-preserved",
        native: {
            criteria: {
                query: "subject:invoice has:attachment",
            },
        },
        expectedKind: "opaque",
    },
    {
        id: "native.additional-label-effect-preserved",
        native: {
            action: {
                removeLabelIds: ["UNREAD", "INBOX"],
            },
        },
        expectedKind: "opaque",
    },
] satisfies readonly NativeGmailFixture[]);
