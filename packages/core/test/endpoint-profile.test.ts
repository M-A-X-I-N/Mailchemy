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

const flagCondition = defineSemanticCapability<null>({
  id: parseCapabilityId("test.condition.requires-flag@1"),
  role: "condition",
  description: "Synthetic endpoint-profile condition.",
  validateParameters: (value) =>
    value === null
      ? valid(null)
      : invalid(
          validationIssue("test.null.invalid", "Expected a null parameter."),
        ),
  areParametersEqual: () => true,
});

const absentCondition = defineSemanticCapability<null>({
  id: parseCapabilityId("test.condition.absent@1"),
  role: "condition",
  description: "Synthetic capability absent from the base target.",
  validateParameters: (value) =>
    value === null
      ? valid(null)
      : invalid(
          validationIssue("test.null.invalid", "Expected a null parameter."),
        ),
  areParametersEqual: () => true,
});

function condition(contract: typeof flagCondition | typeof absentCondition) {
  return createConditionExpression(createCapabilitySpecimen(contract, null));
}

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

describe("endpoint capability-profile refinement", () => {
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

    expect(baseTarget.checkDirectRealization(condition(flagCondition))).toEqual(
      {
        kind: "direct",
      },
    );
    expect(target.checkDirectRealization(condition(flagCondition))).toEqual({
      kind: "unsupported",
      reason: {
        code: "endpoint-profile-missing",
        message: 'Endpoint profile does not advertise required feature "flag".',
      },
    });
  });

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

    expect(target.checkDirectRealization(condition(flagCondition))).toEqual({
      kind: "direct",
    });
  });

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

    expect(target.checkDirectRealization(condition(absentCondition))).toEqual({
      kind: "unsupported",
      reason: {
        code: "capability-absent",
        message: "Synthetic dialect does not expose this capability.",
      },
    });
    expect(refinementCalls).toBe(0);
  });

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
