/**
 * Implements the canonical `core.condition.has-attachment@1` semantic
 * contract and its provider-independent evaluator.
 *
 * @packageDocumentation
 */

import { defineSemanticCapability } from "../capability-contract.js";
import { parseCapabilityId } from "../capability-id.js";
import { invalid, valid, validationIssue } from "../validation.js";

/**
 * Minimal MIME-entity view required to evaluate canonical attachment presence.
 *
 * @remarks
 * The semantic contract intentionally ignores filenames, media types, and
 * provider/UI attachment heuristics.
 */
export interface MimeEntityAttachmentView {
    /** Parsed Content-Disposition disposition type, or null when absent. */
    readonly dispositionType: string | null;

    /** Whether this MIME entity is itself multipart rather than a leaf entity. */
    readonly isMultipart: boolean;
}

/**
 * Canonical parameterless attachment-presence condition.
 *
 * @remarks
 * The semantic contract is true only when at least one non-multipart MIME
 * entity explicitly declares disposition type `attachment`. Registering this
 * contract does not claim any target can realize it directly.
 *
 * @see docs/SEMANTIC_CAPABILITIES.md#coreconditionhas-attachment1
 */
export const hasAttachmentCapability = defineSemanticCapability<null>({
    id: parseCapabilityId("core.condition.has-attachment@1"),
    role: "condition",
    description:
        'Matches when at least one non-multipart MIME entity has an explicit Content-Disposition disposition type of "attachment".',
    references: [
        "docs/SEMANTIC_CAPABILITIES.md#coreconditionhas-attachment1",
        "research/FIRST_CROSS_SYSTEM_SEMANTIC_COMPARISON.md#46-attachment-presence-is-a-three-system-overlap",
    ],
    validateParameters: (value) =>
        value === null
            ? valid(null)
            : invalid(
                validationIssue(
                    "has-attachment.parameters",
                    "has-attachment@1 takes no parameters; expected null.",
                ),
            ),
    areParametersEqual: () => true,
});

/**
 * Evaluates canonical attachment presence over parsed MIME entity metadata.
 *
 * @param entities MIME entities participating in the message view.
 * @returns Whether any non-multipart entity explicitly declares attachment
 * disposition, using case-insensitive disposition-type comparison.
 */
export function evaluateHasAttachment(
    entities: readonly MimeEntityAttachmentView[],
): boolean {
    return entities.some(
        (entity) =>
            !entity.isMultipart &&
            entity.dispositionType?.toLowerCase() === "attachment",
    );
}
