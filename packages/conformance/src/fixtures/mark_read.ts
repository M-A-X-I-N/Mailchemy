/**
 * Defines canonical valid/invalid evidence for `core.action.mark-read@1`,
 * including state-transition oracle inputs that prove idempotence.
 *
 * @remarks
 * These fixtures prove the action's canonical state transition only. They do
 * not define provider continuation, commit timing, or later-rule visibility.
 *
 * @packageDocumentation
 */

import {
    createActionExpression,
    createCapabilityInstance,
    markReadCapability,
} from "@mailchemy/core";

import { defineCanonicalFixture } from "./canonical_fixture.js";

/**
 * Builds one valid mark-read fixture with the prior state needed by the pure
 * semantic transition oracle.
 *
 * @param id Stable fixture identity.
 * @param previousReadState Canonical message read state before the action.
 * @param notes Human-readable explanation of the exercised transition.
 * @returns Immutable valid canonical fixture expecting read state true.
 */
function validFixture(id: string, previousReadState: boolean, notes: string) {
    return defineCanonicalFixture({
        id,
        capabilities: [markReadCapability.id],
        expression: createActionExpression(
            createCapabilityInstance(markReadCapability, null),
        ),
        expectedValidation: "valid",
        oracle: Object.freeze({
            previousReadState,
            expectedReadState: true,
        }),
        notes,
        references: ["docs/SEMANTIC_CAPABILITIES.md#coreactionmark-read1"],
    });
}

/**
 * Canonical fixture suite covering unread/read inputs and the invalid
 * non-null-parameter boundary.
 */
export const markReadFixtures = Object.freeze([
    validFixture(
        "mark-read.from-unread",
        false,
        "An unread message becomes read.",
    ),
    validFixture(
        "mark-read.from-read",
        true,
        "The action is idempotent when the message is already read.",
    ),
    defineCanonicalFixture({
        id: "mark-read.invalid-parameters",
        capabilities: [markReadCapability.id],
        expression: {
            kind: "action",
            instance: {
                kind: "capability",
                capabilityId: markReadCapability.id,
                parameters: {},
            },
        },
        expectedValidation: "invalid",
    }),
]);
