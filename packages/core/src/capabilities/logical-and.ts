import { defineSemanticCapability } from "../capability-contract.js";
import { parseCapabilityId } from "../capability-id.js";
import { invalid, valid, validationIssue } from "../validation.js";

export const logicalAndCapability = defineSemanticCapability<null>({
    id: parseCapabilityId("core.logic.and@1"),
    role: "logic",
    description:
        "Logical conjunction over at least two canonical condition operands; operand order is preserved in representation and is not normalized away.",
    references: [
        "docs/SEMANTIC_CAPABILITIES.md#corelogicand1",
        "research/FIRST_CROSS_SYSTEM_SEMANTIC_COMPARISON.md#51-and-is-the-strongest-common-logical-primitive",
        "research/CROSS_SYSTEM_CONTROL_FLOW_SYNTHESIS.md",
    ],
    validateParameters: (value) =>
        value === null
            ? valid(null)
            : invalid(
                validationIssue(
                    "logic.and.parameters",
                    "logic.and@1 takes no parameters; expected null.",
                ),
            ),
    areParametersEqual: () => true,
});

export function evaluateLogicalAnd(
    operandResults: readonly boolean[],
): boolean {
    if (operandResults.length < 2)
        throw new RangeError("logic.and@1 requires at least two operands.");

    return operandResults.every(Boolean);
}
