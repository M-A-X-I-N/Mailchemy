/**
 * Defines canonical valid/invalid evidence for `core.logic.and@1`, including
 * boolean oracle metadata for conjunction truth and minimum-arity boundaries.
 *
 * @remarks
 * The fixtures prove canonical conjunction semantics and structure. They do not
 * imply a target can directly realize the same composition.
 *
 * @packageDocumentation
 */

import {
    createAndExpression,
    createCapabilitySpecimen,
    createConditionExpression,
    logicalAndCapability,
    subjectContainsCapability,
} from "@mailchemy/core";

import { defineCanonicalFixture } from "../fixture.js";

/**
 * Builds a synthetic canonical condition operand whose identity/order can be
 * inspected by conjunction fixtures.
 *
 * @param needle Distinct Subject needle used to identify the operand.
 * @returns Canonical Subject condition expression.
 */
function subject(needle: string) {
    return createConditionExpression(
        createCapabilitySpecimen(subjectContainsCapability, { needle }),
    );
}

/**
 * Builds one valid conjunction fixture plus pre-evaluated operand-result oracle
 * metadata.
 *
 * @param id Stable fixture identity.
 * @param operandResults Ordered boolean results supplied to the semantic oracle.
 * @param expectedMatch Expected conjunction result.
 * @param notes Human-readable explanation of the exercised boundary.
 * @returns Immutable valid conjunction fixture.
 */
function validFixture(
    id: string,
    operandResults: readonly boolean[],
    expectedMatch: boolean,
    notes: string,
) {
    return defineCanonicalFixture({
        id,
        capabilities: [logicalAndCapability.id],
        expression: createAndExpression(
            createCapabilitySpecimen(logicalAndCapability, null),
            operandResults.map((_, index) =>
                subject(`operand-${String(index)}`),
            ),
        ),
        expectedValidation: "valid",
        oracle: Object.freeze({
            operandResults: Object.freeze([...operandResults]),
            expectedMatch,
        }),
        notes,
        references: ["docs/SEMANTIC_CAPABILITIES.md#corelogicand1"],
    });
}

/**
 * Canonical fixture suite covering conjunction truth, n-ary support, invalid
 * arity, and invalid operator parameters.
 */
export const logicalAndFixtures = Object.freeze([
    validFixture(
        "logic.and.all-true",
        [true, true],
        true,
        "Conjunction is true only when every operand is true.",
    ),
    validFixture(
        "logic.and.one-false",
        [true, false],
        false,
        "One false operand makes conjunction false.",
    ),
    validFixture(
        "logic.and.three-operands",
        [true, true, false],
        false,
        "Version 1 supports conjunction over more than two operands.",
    ),
    defineCanonicalFixture({
        id: "logic.and.invalid-empty",
        capabilities: [logicalAndCapability.id],
        expression: createAndExpression(
            createCapabilitySpecimen(logicalAndCapability, null),
            [],
        ),
        expectedValidation: "invalid",
    }),
    defineCanonicalFixture({
        id: "logic.and.invalid-single",
        capabilities: [logicalAndCapability.id],
        expression: createAndExpression(
            createCapabilitySpecimen(logicalAndCapability, null),
            [subject("only-child")],
        ),
        expectedValidation: "invalid",
    }),
    defineCanonicalFixture({
        id: "logic.and.invalid-parameters",
        capabilities: [logicalAndCapability.id],
        expression: {
            kind: "and",
            operator: {
                kind: "capability",
                capabilityId: logicalAndCapability.id,
                parameters: {},
            },
            operands: [subject("left"), subject("right")],
        },
        expectedValidation: "invalid",
    }),
]);
