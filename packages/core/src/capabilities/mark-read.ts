import { defineSemanticCapability } from "../capability-contract.js";
import { parseCapabilityId } from "../capability-id.js";
import { invalid, valid, validationIssue } from "../validation.js";

export const markReadCapability = defineSemanticCapability<null>({
    id: parseCapabilityId("core.action.mark-read@1"),
    role: "action",
    description:
        "Sets the canonical message read state to read; the leaf contract does not define continuation or later-rule visibility.",
    references: [
        "docs/SEMANTIC_CAPABILITIES.md#coreactionmark-read1",
        "research/FIRST_CROSS_SYSTEM_SEMANTIC_COMPARISON.md#71-readunread-is-one-of-the-strongest-candidates",
        "research/CROSS_SYSTEM_CONTROL_FLOW_SYNTHESIS.md",
    ],
    validateParameters: (value) =>
        value === null
            ? valid(null)
            : invalid(
                validationIssue(
                    "mark-read.parameters",
                    "mark-read@1 takes no parameters; expected null.",
                ),
            ),
    areParametersEqual: () => true,
});

export function applyMarkRead(previousReadState: boolean): true {
    if (previousReadState)
        return true;

    return true;
}
