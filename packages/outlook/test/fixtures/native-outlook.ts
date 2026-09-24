import type { OutlookMessageRuleNative } from "../../src/index.js";

export interface NativeOutlookFixture {
    readonly id: string;
    readonly native: OutlookMessageRuleNative;
    readonly expectedKind: "decoded" | "unsupported-native" | "opaque";
    readonly expectedReasonCode?:
        "invalid-native" | "semantic-unsupported" | "exactness-unproven";
}

export const nativeOutlookFixtures = Object.freeze([
    {
        id: "native.mark-read.minimal",
        native: {
            actions: {
                markAsRead: true,
            },
        },
        expectedKind: "decoded",
    },
    {
        id: "native.mark-read.with-provider-metadata",
        native: {
            id: "rule-123",
            displayName: "Mark read",
            actions: {
                markAsRead: true,
            },
        },
        expectedKind: "decoded",
    },
    {
        id: "native.subject-mark-read",
        native: {
            conditions: {
                subjectContains: ["invoice"],
            },
            actions: {
                markAsRead: true,
            },
        },
        expectedKind: "unsupported-native",
        expectedReasonCode: "exactness-unproven",
    },
    {
        id: "native.has-attachment",
        native: {
            conditions: {
                hasAttachments: true,
            },
        },
        expectedKind: "unsupported-native",
        expectedReasonCode: "exactness-unproven",
    },
    {
        id: "native.sequence-preserved",
        native: {
            sequence: 4,
            actions: {
                markAsRead: true,
            },
        },
        expectedKind: "opaque",
    },
    {
        id: "native.exceptions-preserved",
        native: {
            exceptions: {
                subjectContains: ["ignore"],
            },
            actions: {
                markAsRead: true,
            },
        },
        expectedKind: "opaque",
    },
    {
        id: "native-stop-preserved",
        native: {
            actions: {
                markAsRead: true,
                stopProcessingRules: true,
            },
        },
        expectedKind: "opaque",
    },
    {
        id: "native.unrelated-action-preserved",
        native: {
            actions: {
                delete: true,
            },
        },
        expectedKind: "opaque",
    },
] satisfies readonly NativeOutlookFixture[]);
