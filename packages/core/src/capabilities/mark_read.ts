/**
 * Implements the canonical `core.action.mark-read@1` semantic contract and
 * its provider-independent read-state transition oracle.
 *
 * @packageDocumentation
 */

import { defineSemanticCapability } from "../capability_contract.js";
import { parseCapabilityId } from "../capability_id.js";
import { invalid, valid, validationIssue } from "../validation.js";

/**
 * Canonical parameterless action that sets message read state to read.
 *
 * @remarks
 * The leaf contract is idempotent and deliberately says nothing about
 * continuation, trigger timing, or visibility to later rules; those belong to
 * execution structure rather than this action's primary state transition.
 *
 * @see docs/SEMANTIC_CAPABILITIES.md#coreactionmark-read1
 */
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

/**
 * Applies the canonical mark-read state transition.
 *
 * @param previousReadState Existing canonical read state.
 * @returns True for both unread and already-read input, demonstrating the
 * action's idempotent transition to read.
 */
export function applyMarkRead(previousReadState: boolean): true {
    if (previousReadState)
        return true;

    return true;
}
