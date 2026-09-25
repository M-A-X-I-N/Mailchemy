/**
 * Defines canonical valid/invalid evidence for
 * `core.condition.subject.contains@1`, including logical-Subject oracle data
 * for normalization, repeated fields, and version-1 case behavior.
 *
 * @remarks
 * The fixtures record canonical Subject semantics. They intentionally do not
 * assert that similarly named native provider predicates are exact.
 *
 * @packageDocumentation
 */

import {
    createCapabilitySpecimen,
    createConditionExpression,
    subjectContainsCapability,
} from "@mailchemy/core";

import { defineCanonicalFixture } from "../fixture.js";

/**
 * Builds one valid Subject-containment fixture plus logical Subject field
 * values consumed by the pure semantic evaluator.
 *
 * @param id Stable fixture identity.
 * @param needle Canonical containment needle supplied to the capability.
 * @param subjectFields Decoded/unfolded logical Subject values.
 * @param expectedMatch Expected canonical predicate result.
 * @param notes Human-readable explanation of the exercised semantic boundary.
 * @returns Immutable valid Subject-containment fixture.
 */
function validFixture(
    id: string,
    needle: string,
    subjectFields: readonly string[],
    expectedMatch: boolean,
    notes: string,
) {
    return defineCanonicalFixture({
        id,
        capabilities: [subjectContainsCapability.id],
        expression: createConditionExpression(
            createCapabilitySpecimen(subjectContainsCapability, { needle }),
        ),
        expectedValidation: "valid",
        oracle: Object.freeze({
            subjectFields: Object.freeze([...subjectFields]),
            expectedMatch,
        }),
        notes,
        references: [
            "docs/SEMANTIC_CAPABILITIES.md#coreconditionsubjectcontains1",
        ],
    });
}

/**
 * Canonical fixture suite covering missing/repeated Subject fields, NFC
 * equivalence, lowercase-without-full-folding behavior, whitespace needles, and
 * invalid parameter shapes.
 */
export const subjectContainsFixtures = Object.freeze([
    validFixture(
        "subject.contains.ascii-case-insensitive",
        "report",
        ["Quarterly REPORT"],
        true,
        "ASCII case differences do not prevent a match.",
    ),
    validFixture(
        "subject.contains.missing-subject",
        "report",
        [],
        false,
        "A message with no Subject field does not match.",
    ),
    validFixture(
        "subject.contains.repeated-second-match",
        "needle",
        ["first value", "contains NEEDLE here"],
        true,
        "Repeated Subject fields use any-field semantics.",
    ),
    validFixture(
        "subject.contains.nfc-equivalence",
        "CAFÉ",
        ["Cafe\u0301 status"],
        true,
        "NFC-equivalent Unicode sequences compare equal after normalization.",
    ),
    validFixture(
        "subject.contains.no-full-case-fold",
        "STRASSE",
        ["Straße"],
        false,
        "Version 1 uses lowercase conversion, not full Unicode case folding.",
    ),
    validFixture(
        "subject.contains.whitespace-needle",
        " ",
        ["hello world"],
        true,
        "Whitespace is a valid non-empty needle.",
    ),
    defineCanonicalFixture({
        id: "subject.contains.invalid-empty-needle",
        capabilities: [subjectContainsCapability.id],
        expression: {
            kind: "condition",
            specimen: {
                kind: "capability",
                capabilityId: subjectContainsCapability.id,
                parameters: { needle: "" },
            },
        },
        expectedValidation: "invalid",
        references: [
            "docs/SEMANTIC_CAPABILITIES.md#coreconditionsubjectcontains1",
        ],
    }),
    defineCanonicalFixture({
        id: "subject.contains.invalid-missing-needle",
        capabilities: [subjectContainsCapability.id],
        expression: {
            kind: "condition",
            specimen: {
                kind: "capability",
                capabilityId: subjectContainsCapability.id,
                parameters: {},
            },
        },
        expectedValidation: "invalid",
    }),
    defineCanonicalFixture({
        id: "subject.contains.invalid-extra-parameter",
        capabilities: [subjectContainsCapability.id],
        expression: {
            kind: "condition",
            specimen: {
                kind: "capability",
                capabilityId: subjectContainsCapability.id,
                parameters: { needle: "x", caseSensitive: true },
            },
        },
        expectedValidation: "invalid",
    }),
]);
