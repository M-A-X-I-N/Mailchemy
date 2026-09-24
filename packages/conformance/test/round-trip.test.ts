import { describe, expect, it } from "vitest";

import {
  CapabilityRegistry,
  createCapabilitySpecimen,
  createConditionExpression,
  decodedNative,
  defineSemanticCapability,
  defineSemanticCodec,
  encodedNative,
  invalid,
  opaqueNative,
  parseCapabilityId,
  unsupportedRealization,
  unsupportedReason,
  valid,
  validationIssue,
} from "@mailchemy/core";
import {
  defineCanonicalFixture,
  runCodecRoundTrips,
  type CanonicalEquivalence,
} from "@mailchemy/conformance";

const booleanCapability = defineSemanticCapability<{
  readonly value: boolean;
}>({
  id: parseCapabilityId("test.condition.boolean@1"),
  role: "condition",
  description: "Synthetic round-trip condition.",
  validateParameters: (value) => {
    if (
      typeof value === "object" &&
      value !== null &&
      "value" in value &&
      typeof value.value === "boolean"
    ) {
      return valid(Object.freeze({ value: value.value }));
    }

    return invalid(
      validationIssue(
        "test.boolean.invalid",
        "Expected an object containing a boolean value.",
      ),
    );
  },
  areParametersEqual: (left, right) => left.value === right.value,
});

function expression(value: boolean) {
  return createConditionExpression(
    createCapabilitySpecimen(booleanCapability, { value }),
  );
}

function registry() {
  const result = new CapabilityRegistry();
  result.register(booleanCapability);
  return result;
}

const fixture = defineCanonicalFixture({
  id: "boolean.true",
  capabilities: [booleanCapability.id],
  expression: expression(true),
  expectedValidation: "valid",
});

const booleanEquivalence: CanonicalEquivalence = (left, right) => {
  if (left.kind !== "condition" || right.kind !== "condition") {
    return false;
  }

  if (left.specimen.capabilityId !== right.specimen.capabilityId) {
    return false;
  }

  const leftValue = left.specimen.parameters as { readonly value: boolean };
  const rightValue = right.specimen.parameters as { readonly value: boolean };

  return leftValue.value === rightValue.value;
};

describe("runCodecRoundTrips", () => {
  it("passes on semantic equivalence without comparing native bytes", () => {
    const codec = defineSemanticCodec<string>({
      id: "synthetic.normalizing-codec",
      encode: (canonical) => {
        const parameters =
          canonical.kind === "condition"
            ? (canonical.specimen.parameters as { readonly value: boolean })
            : { value: false };

        return encodedNative(parameters.value ? "TRUE\n" : "FALSE\n");
      },
      decode: (native) =>
        decodedNative(expression(native.trim().toUpperCase() === "TRUE")),
    });

    const result = runCodecRoundTrips(
      registry(),
      codec,
      [{ fixture }],
      booleanEquivalence,
    );

    expect(result.passed).toBe(true);
    expect(result.results).toEqual([
      {
        fixtureId: "boolean.true",
        passed: true,
      },
    ]);
  });

  it("fails when encode refuses a specimen expected to round trip", () => {
    const codec = defineSemanticCodec<string>({
      id: "synthetic.rejecting-codec",
      encode: () =>
        unsupportedRealization(
          unsupportedReason(
            "capability-absent",
            "Synthetic codec has no encoding.",
          ),
        ),
      decode: (native) => opaqueNative(native, "Unused."),
    });

    const result = runCodecRoundTrips(
      registry(),
      codec,
      [{ fixture }],
      booleanEquivalence,
    );

    expect(result.results[0]?.failureKind).toBe("encode-unsupported");
    expect(result.passed).toBe(false);
  });

  it("fails when a codec decodes its own output only opaquely", () => {
    const codec = defineSemanticCodec<string>({
      id: "synthetic.opaque-codec",
      encode: () => encodedNative("OPAQUE"),
      decode: (native) => opaqueNative(native, "Preserved but uninterpreted."),
    });

    const result = runCodecRoundTrips(
      registry(),
      codec,
      [{ fixture }],
      booleanEquivalence,
    );

    expect(result.results[0]?.failureKind).toBe("decode-opaque");
  });

  it("detects semantic drift even when encode/decode both succeed", () => {
    const codec = defineSemanticCodec<string>({
      id: "synthetic.drifting-codec",
      encode: () => encodedNative("TRUE"),
      decode: () => decodedNative(expression(false)),
    });

    const result = runCodecRoundTrips(
      registry(),
      codec,
      [{ fixture }],
      booleanEquivalence,
    );

    expect(result.results[0]).toEqual({
      fixtureId: "boolean.true",
      passed: false,
      failureKind: "semantic-mismatch",
      message: "Canonical meaning changed across encode/decode round trip.",
    });
  });
});
