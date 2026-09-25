/**
 * Proves endpoint capability profiles can narrow a dialect/base target's Direct
 * realization domain without redefining or broadening that base target.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    createCapabilitySpecimen,
    createConditionExpression,
    defineDirectRealizationTarget,
    defineEndpointCapabilityProfile,
    defineSemanticCapability,
    directRealization,
    invalid,
    parseCapabilityId,
    refineTargetWithEndpointProfile,
    unsupportedRealization,
    unsupportedReason,
    valid,
    validationIssue,
} from "@mailchemy/core";

/**
 * Synthetic condition whose base-target realization requires an endpoint
 * feature in the refinement layer.
 */
const flagCondition = defineSemanticCapability<null>({
    id: parseCapabilityId("test.condition.requires-flag@1"),
    role: "condition",
    description: "Synthetic endpoint-profile condition.",
    validateParameters: (value) =>
        value === null
            ? valid(null)
            : invalid(
                validationIssue(
                    "test.null.invalid",
                    "Expected a null parameter.",
                ),
            ),
    areParametersEqual: () => true,
});

/**
 * Synthetic condition deliberately unsupported by the base target.
 */
const absentCondition = defineSemanticCapability<null>({
    id: parseCapabilityId("test.condition.absent@1"),
    role: "condition",
    description: "Synthetic capability absent from the base target.",
    validateParameters: (value) =>
        value === null
            ? valid(null)
            : invalid(
                validationIssue(
                    "test.null.invalid",
                    "Expected a null parameter.",
                ),
            ),
    areParametersEqual: () => true,
});

/**
 * Wraps one synthetic parameterless capability as a canonical condition.
 *
 * @param contract Synthetic contract selected for the endpoint-profile case.
 * @returns Canonical condition expression for target classification.
 */
function condition(contract: typeof flagCondition | typeof absentCondition) {
    return createConditionExpression(createCapabilitySpecimen(contract, null));
}

/**
 * Synthetic dialect/base target that can directly realize only the flag-backed
 * condition before endpoint constraints are applied.
 */
const baseTarget = defineDirectRealizationTarget({
    id: "synthetic.dialect",
    checkDirectRealization: (expression) =>
        expression.kind === "condition" &&
        expression.specimen.capabilityId === flagCondition.id
            ? directRealization()
            : unsupportedRealization(
                unsupportedReason(
                    "capability-absent",
                    "Synthetic dialect does not expose this capability.",
                ),
            ),
});

/**
 * Exercises endpoint refinement independently of any real provider capability
 * profile.
 */
describe("endpoint capability-profile refinement", () => {
    /**
     * Proves an endpoint profile may turn a base Direct result into Unsupported
     * when the concrete endpoint lacks a required runtime feature.
     */
    it("narrows Direct support when a runtime profile lacks a required feature", () => {
        const profile = defineEndpointCapabilityProfile({
            id: "synthetic.endpoint.without-flag",
            data: Object.freeze({ features: Object.freeze([] as string[]) }),
        });
        const target = refineTargetWithEndpointProfile({
            id: "synthetic.dialect@without-flag",
            baseTarget,
            profile,
            refineDirectRealization: (_expression, endpoint) =>
                endpoint.data.features.includes("flag")
                    ? directRealization()
                    : unsupportedRealization(
                        unsupportedReason(
                            "endpoint-profile-missing",
                            'Endpoint profile does not advertise required feature "flag".',
                        ),
                    ),
        });

        expect(
            baseTarget.checkDirectRealization(condition(flagCondition)),
        ).toEqual({
            kind: "direct",
        });
        expect(target.checkDirectRealization(condition(flagCondition))).toEqual(
            {
                kind: "unsupported",
                reason: {
                    code: "endpoint-profile-missing",
                    message:
                        'Endpoint profile does not advertise required feature "flag".',
                },
            },
        );
    });

    /**
     * Proves the same base-target realization remains Direct under a different
     * endpoint profile that advertises the required feature.
     */
    it("allows the same dialect realization when another supplied profile has the feature", () => {
        const profile = defineEndpointCapabilityProfile({
            id: "synthetic.endpoint.with-flag",
            data: Object.freeze({
                features: Object.freeze(["flag"]),
            }),
        });
        const target = refineTargetWithEndpointProfile({
            id: "synthetic.dialect@with-flag",
            baseTarget,
            profile,
            refineDirectRealization: (_expression, endpoint) =>
                endpoint.data.features.includes("flag")
                    ? directRealization()
                    : unsupportedRealization(
                        unsupportedReason(
                            "endpoint-profile-missing",
                            "Required feature is missing.",
                        ),
                    ),
        });

        expect(target.checkDirectRealization(condition(flagCondition))).toEqual(
            {
                kind: "direct",
            },
        );
    });

    /**
     * Proves endpoint refinement cannot upgrade an expression the base
     * dialect/target already classified Unsupported.
     */
    it("cannot broaden a base target that already reports Unsupported", () => {
        let refinementCalls = 0;
        const profile = defineEndpointCapabilityProfile({
            id: "synthetic.endpoint.any",
            data: null,
        });
        const target = refineTargetWithEndpointProfile({
            id: "synthetic.dialect@any",
            baseTarget,
            profile,
            refineDirectRealization: () => {
                refinementCalls += 1;
                return directRealization();
            },
        });

        expect(
            target.checkDirectRealization(condition(absentCondition)),
        ).toEqual({
            kind: "unsupported",
            reason: {
                code: "capability-absent",
                message: "Synthetic dialect does not expose this capability.",
            },
        });
        expect(refinementCalls).toBe(0);
    });

    /**
     * Proves the refined target retains separately inspectable base-target and
     * endpoint-profile evidence instead of flattening the two layers.
     */
    it("keeps the endpoint profile separately inspectable from the base target", () => {
        const profile = defineEndpointCapabilityProfile({
            id: "synthetic.endpoint.runtime-profile",
            data: Object.freeze({ discoveredAtRuntime: true }),
        });
        const target = refineTargetWithEndpointProfile({
            id: "synthetic.dialect@runtime-profile",
            baseTarget,
            profile,
            refineDirectRealization: () => directRealization(),
        });

        expect(target.baseTarget.id).toBe("synthetic.dialect");
        expect(target.profile).toBe(profile);
        expect(target.profile.data.discoveredAtRuntime).toBe(true);
    });
});
