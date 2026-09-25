/**
 * Implements `core.condition.subject.contains@1`, including parameter
 * canonicalization and the provider-independent Subject comparison oracle.
 *
 * @packageDocumentation
 */

import { defineSemanticCapability } from "../capability_contract.js";
import { parseCapabilityId } from "../capability_id.js";
import { invalid, valid, validationIssue } from "../validation.js";

/**
 * Canonical parameters for version-1 Subject containment.
 */
export interface SubjectContainsParameters {
    /**
     * Non-empty NFC-normalized substring sought in logical Subject field
     * values before comparison normalization is applied.
     */
    readonly needle: string;
}

/**
 * Canonical Subject-containment condition contract.
 *
 * @remarks
 * Parameters are canonicalized to NFC. Evaluation then applies NFC plus
 * locale-independent Unicode lowercasing to both needle and each logical
 * Subject field before contiguous substring matching. The contract deliberately
 * does not use full Unicode case folding.
 *
 * @see docs/SEMANTIC_CAPABILITIES.md#coreconditionsubjectcontains1
 */
export const subjectContainsCapability =
    defineSemanticCapability<SubjectContainsParameters>({
        id: parseCapabilityId("core.condition.subject.contains@1"),
        role: "condition",
        description:
            "Matches when any logical Subject field contains a non-empty Unicode needle under the version-1 normalization/comparison contract.",
        references: [
            "docs/SEMANTIC_CAPABILITIES.md#coreconditionsubjectcontains1",
            "research/FIRST_CROSS_SYSTEM_SEMANTIC_COMPARISON.md#43-subject-contains-is-broadly-shared-but-not-yet-universally-exact",
        ],
        validateParameters: (value) => {
            if (
                typeof value !== "object" ||
                value === null ||
                !("needle" in value) ||
                typeof value.needle !== "string"
            ) {
                return invalid(
                    validationIssue(
                        "subject.contains.parameters",
                        'Expected an object containing a string property "needle".',
                    ),
                );
            }

            if (Object.keys(value).length !== 1) {
                return invalid(
                    validationIssue(
                        "subject.contains.parameters.extra",
                        'Only the "needle" parameter is valid for subject.contains@1.',
                    ),
                );
            }

            /** Canonical NFC form stored in Subject-containment capability instances. */
            const needle = value.needle.normalize("NFC");

            if (needle.length === 0) {
                return invalid(
                    validationIssue(
                        "subject.contains.needle.empty",
                        "The subject containment needle must not be empty.",
                        ["needle"],
                    ),
                );
            }

            return valid(Object.freeze({ needle }));
        },
        areParametersEqual: (left, right) => left.needle === right.needle,
    });

/**
 * Evaluates Subject containment across all logical Subject field values.
 *
 * @param subjectFields Decoded/unfolded logical Subject values; an empty array
 * represents a missing Subject and therefore cannot match.
 * @param parameters Canonical version-1 containment parameters.
 * @returns Whether any Subject field contains the normalized comparison needle.
 */
export function evaluateSubjectContains(
    subjectFields: readonly string[],
    parameters: SubjectContainsParameters,
): boolean {
    /** Comparison-normalized form of the canonical needle. */
    const needle = normalizeComparableSubjectText(parameters.needle);

    return subjectFields.some((subject) =>
        normalizeComparableSubjectText(subject).includes(needle),
    );
}

/**
 * Applies the version-1 comparison normalization shared by Subject values and
 * the search needle.
 *
 * @param value Unicode text to normalize for comparison.
 * @returns NFC-normalized, locale-independent lowercase text.
 */
function normalizeComparableSubjectText(value: string): string {
    return value.normalize("NFC").toLowerCase();
}
