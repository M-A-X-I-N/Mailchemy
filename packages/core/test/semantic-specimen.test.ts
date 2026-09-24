import { describe, expect, it } from "vitest";

import {
  CapabilityRegistry,
  InvalidCapabilityParametersError,
  areCapabilitySpecimensEqual,
  createCapabilitySpecimen,
  defineSemanticCapability,
  invalid,
  parseCapabilityId,
  valid,
  validationIssue,
} from "@mailchemy/core";

interface BooleanParameters {
  readonly value: boolean;
}

function makeBooleanContract(id: string) {
  return defineSemanticCapability<BooleanParameters>({
    id: parseCapabilityId(id),
    role: "condition",
    description: "Synthetic boolean specimen contract.",
    validateParameters: (value) => {
      if (
        typeof value === "object" &&
        value !== null &&
        "value" in value &&
        typeof value.value === "boolean"
      ) {
        return valid<BooleanParameters>(
          Object.freeze({
            value: value.value,
          }),
        );
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
}

describe("CapabilitySpecimen", () => {
  it("stores a validated canonical parameter value", () => {
    const contract = makeBooleanContract("test.condition.boolean@1");
    const input = { value: true };
    const specimen = createCapabilitySpecimen(contract, input);

    input.value = false;

    expect(Object.isFrozen(specimen)).toBe(true);
    expect(specimen.capabilityId).toBe(contract.id);
    expect(specimen.parameters).toEqual({ value: true });
    expect(Object.isFrozen(specimen.parameters)).toBe(true);
  });

  it("rejects parameters that violate the semantic contract", () => {
    const contract = makeBooleanContract("test.condition.boolean@1");

    expect(() =>
      createCapabilitySpecimen(contract, { value: "not-boolean" } as never),
    ).toThrow(InvalidCapabilityParametersError);
  });

  it("delegates semantic parameter equality to the registered contract", () => {
    const contract = makeBooleanContract("test.condition.boolean@1");
    const otherContract = makeBooleanContract("test.condition.other@1");
    const registry = new CapabilityRegistry();
    registry.register(contract);
    registry.register(otherContract);

    const trueA = createCapabilitySpecimen(contract, { value: true });
    const trueB = createCapabilitySpecimen(contract, { value: true });
    const falseValue = createCapabilitySpecimen(contract, { value: false });
    const other = createCapabilitySpecimen(otherContract, { value: true });

    expect(areCapabilitySpecimensEqual(registry, trueA, trueB)).toBe(true);
    expect(areCapabilitySpecimensEqual(registry, trueA, falseValue)).toBe(
      false,
    );
    expect(areCapabilitySpecimensEqual(registry, trueA, other)).toBe(false);
  });

  it("does not invent equality semantics for an unregistered capability", () => {
    const contract = makeBooleanContract("test.condition.boolean@1");
    const specimen = createCapabilitySpecimen(contract, { value: true });

    expect(
      areCapabilitySpecimensEqual(new CapabilityRegistry(), specimen, specimen),
    ).toBe(false);
  });
});
