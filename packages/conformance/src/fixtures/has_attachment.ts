/**
 * Defines canonical valid/invalid evidence for
 * `core.condition.has-attachment@1`, including semantic-oracle metadata for
 * the provider-independent MIME-entity evaluator.
 *
 * @remarks
 * These fixtures prove the canonical contract boundary. They do not claim that
 * any particular target can encode attachment presence exactly.
 *
 * @packageDocumentation
 */

import {
    createCapabilityInstance,
    createConditionExpression,
    hasAttachmentCapability,
} from "@mailchemy/core";

import { defineCanonicalFixture } from "../fixture.js";

/**
 * Builds one valid has-attachment fixture plus MIME-entity oracle metadata.
 *
 * @param id Stable fixture identity.
 * @param entities Parsed MIME-entity views supplied to the semantic evaluator.
 * @param expectedMatch Expected canonical condition result.
 * @param notes Human-readable explanation of the exercised boundary.
 * @returns Immutable valid canonical fixture.
 */
function validFixture(
    id: string,
    entities: readonly {
        /** Parsed Content-Disposition type, or null when absent. */
        readonly dispositionType: string | null;

        /** Whether the entity is itself multipart. */
        readonly isMultipart: boolean;
    }[],
    expectedMatch: boolean,
    notes: string,
) {
    return defineCanonicalFixture({
        id,
        capabilities: [hasAttachmentCapability.id],
        expression: createConditionExpression(
            createCapabilityInstance(hasAttachmentCapability, null),
        ),
        expectedValidation: "valid",
        oracle: Object.freeze({
            entities: Object.freeze(
                entities.map((entity) => Object.freeze({ ...entity })),
            ),
            expectedMatch,
        }),
        notes,
        references: [
            "docs/SEMANTIC_CAPABILITIES.md#coreconditionhas-attachment1",
        ],
    });
}

/**
 * Canonical fixture suite for explicit attachment disposition semantics plus the
 * invalid non-null parameter boundary.
 */
export const hasAttachmentFixtures = Object.freeze([
    validFixture(
        "has-attachment.explicit-attachment",
        [{ dispositionType: "attachment", isMultipart: false }],
        true,
        'Explicit non-multipart disposition "attachment" matches.',
    ),
    validFixture(
        "has-attachment.case-insensitive-disposition-token",
        [{ dispositionType: "ATTACHMENT", isMultipart: false }],
        true,
        "Disposition type tokens compare case-insensitively.",
    ),
    validFixture(
        "has-attachment.inline-does-not-count",
        [{ dispositionType: "inline", isMultipart: false }],
        false,
        "Inline content is not an attachment in version 1.",
    ),
    validFixture(
        "has-attachment.missing-disposition-does-not-count",
        [{ dispositionType: null, isMultipart: false }],
        false,
        "Filename/content-type heuristics are intentionally excluded.",
    ),
    validFixture(
        "has-attachment.multipart-container-does-not-count",
        [{ dispositionType: "attachment", isMultipart: true }],
        false,
        "A multipart container itself does not count as an attachment.",
    ),
    validFixture(
        "has-attachment.any-entity",
        [
            { dispositionType: "inline", isMultipart: false },
            { dispositionType: null, isMultipart: false },
            { dispositionType: "attachment", isMultipart: false },
        ],
        true,
        "Any qualifying MIME entity is sufficient.",
    ),
    defineCanonicalFixture({
        id: "has-attachment.invalid-parameters",
        capabilities: [hasAttachmentCapability.id],
        expression: {
            kind: "condition",
            instance: {
                kind: "capability",
                capabilityId: hasAttachmentCapability.id,
                parameters: {},
            },
        },
        expectedValidation: "invalid",
    }),
]);
