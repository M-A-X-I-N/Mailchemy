import { defineSemanticCapability } from "../capability-contract.js";
import { parseCapabilityId } from "../capability-id.js";
import { invalid, valid, validationIssue } from "../validation.js";

export interface MimeEntityAttachmentView {
    readonly dispositionType: string | null;
    readonly isMultipart: boolean;
}

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

export function evaluateHasAttachment(
    entities: readonly MimeEntityAttachmentView[],
): boolean {
    return entities.some(
        (entity) =>
            !entity.isMultipart &&
            entity.dispositionType?.toLowerCase() === "attachment",
    );
}
