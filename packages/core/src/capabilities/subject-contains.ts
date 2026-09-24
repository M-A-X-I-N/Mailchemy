import { defineSemanticCapability } from "../capability-contract.js";
import { parseCapabilityId } from "../capability-id.js";
import { invalid, valid, validationIssue } from "../validation.js";

export interface SubjectContainsParameters {
    readonly needle: string;
}

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

export function evaluateSubjectContains(
    subjectFields: readonly string[],
    parameters: SubjectContainsParameters,
): boolean {
    const needle = normalizeComparableSubjectText(parameters.needle);

    return subjectFields.some((subject) =>
        normalizeComparableSubjectText(subject).includes(needle),
    );
}

function normalizeComparableSubjectText(value: string): string {
    return value.normalize("NFC").toLowerCase();
}
