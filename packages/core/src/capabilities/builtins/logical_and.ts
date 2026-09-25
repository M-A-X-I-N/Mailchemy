/**
 * Implements the canonical `core.logic.and@1` contract and its pure boolean
 * conjunction oracle.
 *
 * @packageDocumentation
 */

import { defineSemanticCapability } from "../contract.js";
import { parseCapabilityId } from "../id.js";
import { invalid, valid, validationIssue } from "../../validation_result.js";

/**
 * Canonical parameterless logical conjunction contract.
 *
 * @remarks
 * The semantic model requires at least two operands and preserves their
 * representation order. This declaration defines meaning only; target
 * structural realizability is evaluated elsewhere.
 *
 * @see docs/SEMANTIC_CAPABILITIES.md#corelogicand1
 */
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

/**
 * Evaluates the truth oracle for canonical logical conjunction.
 *
 * @param operandResults Ordered boolean results of the operand conditions.
 * @returns True exactly when every operand result is true.
 * @throws RangeError When fewer than two operands are supplied, matching the
 * semantic contract's minimum arity.
 */
export function evaluateLogicalAnd(
    operandResults: readonly boolean[],
): boolean {
    if (operandResults.length < 2)
        throw new RangeError("logic.and@1 requires at least two operands.");

    return operandResults.every(Boolean);
}
