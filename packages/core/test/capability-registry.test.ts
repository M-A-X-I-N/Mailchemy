import { describe, expect, it } from "vitest";

import {
  CapabilityRegistry,
  DuplicateCapabilityIdError,
  InvalidCapabilityContractError,
  defineSemanticCapability,
  invalid,
  parseCapabilityId,
  valid,
  validationIssue,
} from "@mailchemy/core";

interface BooleanParameters {
  readonly value: boolean;
}

function booleanParameters(value: unknown) {
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
}

function makeContract(id: string, references: readonly string[] = []) {
  return defineSemanticCapability<BooleanParameters>({
    id: parseCapabilityId(id),
    role: "condition",
    description: "Synthetic boolean condition used by registry tests.",
    references,
    validateParameters: booleanParameters,
    areParametersEqual: (left, right) => left.value === right.value,
  });
}

describe("CapabilityRegistry", () => {
  it("registers immutable contracts and validates their parameters", () => {
    const sourceReferences = ["synthetic:test"];
    const contract = makeContract("test.condition.boolean@1", sourceReferences);
    sourceReferences.push("mutated-after-definition");

    const registry = new CapabilityRegistry();
    const registered = registry.register(contract);

    expect(Object.isFrozen(contract)).toBe(true);
    expect(Object.isFrozen(contract.references)).toBe(true);
    expect(Object.isFrozen(registered)).toBe(true);
    expect(contract.references).toEqual(["synthetic:test"]);

    expect(registered.validateParameters({ value: true })).toEqual({
      ok: true,
      value: { value: true },
    });
    expect(registered.areParametersEqual({ value: true }, { value: true })).toBe(
      true,
    );
    expect(registered.areParametersEqual({ value: true }, { value: false })).toBe(
      false,
    );
    expect(registered.areParametersEqual({ value: true }, { nope: true })).toBe(
      false,
    );
  });

  it("rejects duplicate semantic identities instead of redefining them", () => {
    const registry = new CapabilityRegistry();
    const first = makeContract("test.condition.boolean@1");
    const replacement = defineSemanticCapability<BooleanParameters>({
      ...first,
      description: "Attempted replacement semantics.",
    });

    registry.register(first);

    expect(() => registry.register(replacement)).toThrow(
      DuplicateCapabilityIdError,
    );
    expect(registry.get(first.id)?.description).toBe(first.description);
  });

  it("enumerates contracts deterministically by canonical ID", () => {
    const registry = new CapabilityRegistry();

    registry.register(makeContract("zeta.condition.boolean@1"));
    registry.register(makeContract("alpha.condition.boolean@2"));
    registry.register(makeContract("alpha.condition.boolean@1"));

    expect(registry.list().map((contract) => contract.id)).toEqual([
      "alpha.condition.boolean@1",
      "alpha.condition.boolean@2",
      "zeta.condition.boolean@1",
    ]);
  });

  it("requires non-empty contract metadata", () => {
    expect(() =>
      defineSemanticCapability<BooleanParameters>({
        id: parseCapabilityId("test.condition.blank@1"),
        role: "condition",
        description: " ",
        validateParameters: booleanParameters,
        areParametersEqual: (left, right) => left.value === right.value,
      }),
    ).toThrow(InvalidCapabilityContractError);
  });
});
