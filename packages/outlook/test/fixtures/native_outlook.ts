/**
 * Defines representative Microsoft Graph Inbox Rule decode evidence for the
 * initial Outlook codec.
 *
 * @packageDocumentation
 */

import type { OutlookMessageRuleNative } from "../../src/index.js";

/**
 * One native Graph Inbox Rule specimen and its expected decode evidence category.
 */
export interface NativeOutlookFixture {
    /** Stable fixture identity. */
    readonly id: string;
    /** Native Graph `messageRule` object supplied to the codec. */
    readonly native: OutlookMessageRuleNative;
    /** Expected top-level native decode outcome. */
    readonly expectedKind: "decoded" | "unsupported-native" | "opaque";
    /** Expected refusal category when decode yields unsupported-native. */
    readonly expectedReasonCode?:
        "invalid-native" | "semantic-unsupported" | "exactness-unproven";
}

/**
 * Representative Graph corpus covering exact mark-read, provider metadata,
 * unproven predicates, rule sequence, exceptions, stop-processing state, and
 * unrelated action preservation.
 */
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
