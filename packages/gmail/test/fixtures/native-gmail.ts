/**
 * Defines representative native Gmail Filter decode evidence for the initial
 * codec.
 *
 * @packageDocumentation
 */

import type { GmailFilterNative } from "../../src/index.js";

/**
 * One native Gmail Filter specimen and its expected decode evidence category.
 */
export interface NativeGmailFixture {
    /** Stable fixture identity. */
    readonly id: string;
    /** Native Gmail Filter object supplied to the codec. */
    readonly native: GmailFilterNative;
    /** Expected top-level native decode outcome. */
    readonly expectedKind: "decoded" | "unsupported-native" | "opaque";
    /** Expected refusal category when decode yields unsupported-native. */
    readonly expectedReasonCode?:
        "invalid-native" | "semantic-unsupported" | "exactness-unproven";
}

/**
 * Representative Gmail corpus covering exact mark-read, server metadata,
 * unproven structured criteria, opaque query syntax, and additional label
 * effects.
 */
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
