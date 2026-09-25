/**
 * Proves the initial Graph Inbox Rule codec's exact mark-read mapping,
 * exactness refusals, preservation of rule/control-flow structure, and
 * malformed-native handling.
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

import { outlookInboxRuleCodec } from "../src/index.js";

/**
 * Builds canonical mark-read for codec expectations.
 *
 * @returns Canonical mark-read action.
 */
function markRead() {
    return createActionExpression(
        createCapabilitySpecimen(markReadCapability, null),
    );
}

/**
 * Exercises the offline Graph Inbox Rule codec independently of remote Graph
 * store operations.
 */
describe("initial Outlook Inbox Rule codec", () => {
    /**
     * Proves canonical mark-read encodes as the isolated Graph
     * `markAsRead=true` action.
     */
    it("encodes canonical mark-read as markAsRead=true", () => {
        expect(outlookInboxRuleCodec.encode(markRead())).toEqual({
            kind: "encoded",
            native: {
                actions: {
                    markAsRead: true,
                },
            },
        });
    });

    /**
     * Proves an isolated `markAsRead=true` action decodes to canonical
     * mark-read while provider ID/display metadata remains non-semantic.
     */
    it("decodes an isolated markAsRead=true action as canonical mark-read", () => {
        expect(
            outlookInboxRuleCodec.decode({
                id: "provider-id",
                displayName: "Mark it read",
                actions: {
                    markAsRead: true,
                },
            }),
        ).toEqual({
            kind: "decoded",
            expression: markRead(),
        });
    });

    /**
     * Proves Graph `subjectContains` is recognized without claiming the exact
     * canonical Subject comparison/normalization contract.
     */
    it("understands subjectContains but keeps exactness unproven", () => {
        expect(
            outlookInboxRuleCodec.decode({
                conditions: {
                    subjectContains: ["invoice"],
                },
                actions: {
                    markAsRead: true,
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
     * Proves Graph `hasAttachments=true` is recognized while the canonical
     * explicit-MIME-disposition attachment definition remains unproven.
     */
    it("understands hasAttachments=true but keeps the canonical MIME definition unproven", () => {
        expect(
            outlookInboxRuleCodec.decode({
                conditions: {
                    hasAttachments: true,
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
     * Proves rule `sequence` is preserved rather than discarded because it is
     * semantically observable execution-order state.
     */
    it("preserves rule ordering metadata opaquely", () => {
        expect(
            outlookInboxRuleCodec.decode({
                sequence: 3,
                actions: {
                    markAsRead: true,
                },
            }),
        ).toMatchObject({
            kind: "opaque",
        });
    });

    /**
     * Proves same-rule exception predicates are not rewritten or dropped by the
     * initial canonical slice.
     */
    it("preserves exceptions opaquely", () => {
        expect(
            outlookInboxRuleCodec.decode({
                exceptions: {
                    subjectContains: ["ignore"],
                },
                actions: {
                    markAsRead: true,
                },
            }),
        ).toMatchObject({
            kind: "opaque",
        });
    });

    /**
     * Proves explicit `stopProcessingRules` state is preserved even when false,
     * avoiding invented continuation semantics.
     */
    it("preserves stopProcessingRules even when false instead of inventing continuation semantics", () => {
        expect(
            outlookInboxRuleCodec.decode({
                actions: {
                    markAsRead: true,
                    stopProcessingRules: false,
                },
            }),
        ).toMatchObject({
            kind: "opaque",
        });
    });

    /**
     * Proves canonical Subject containment remains `exactness-unproven` at
     * encode time despite the analogous Graph predicate.
     */
    it("refuses canonical Subject encoding until exact comparison semantics are proven", () => {
        const expression = createConditionExpression(
            createCapabilitySpecimen(subjectContainsCapability, {
                needle: "invoice",
            }),
        );

        expect(outlookInboxRuleCodec.encode(expression)).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves Graph actions outside the initial semantic slice are preserved
     * opaquely rather than silently erased.
     */
    it("preserves unrelated action fields opaquely", () => {
        expect(
            outlookInboxRuleCodec.decode({
                actions: {
                    delete: true,
                },
            }),
        ).toMatchObject({
            kind: "opaque",
        });
    });

    /**
     * Proves malformed values for recognized Graph fields produce
     * `invalid-native` instead of opaque preservation or semantic decoding.
     */
    it("reports malformed supported native values explicitly", () => {
        expect(
            outlookInboxRuleCodec.decode({
                actions: {
                    markAsRead: "yes",
                },
            } as unknown as Parameters<typeof outlookInboxRuleCodec.decode>[0]),
        ).toMatchObject({
            kind: "unsupported-native",
            reason: {
                code: "invalid-native",
            },
        });
    });
});
