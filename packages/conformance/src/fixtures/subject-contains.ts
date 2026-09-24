import {
    createCapabilitySpecimen,
    createConditionExpression,
    subjectContainsCapability,
} from "@mailchemy/core";

import { defineCanonicalFixture } from "../fixture.js";

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
