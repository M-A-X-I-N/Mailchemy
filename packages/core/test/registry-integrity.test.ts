import { describe, expect, it } from "vitest";

import {
  CapabilityRegistry,
  DuplicateCapabilityIdError,
  createCapabilitySpecimen,
  createConditionExpression,
  defineSemanticCapability,
  invalid,
  parseCapabilityId,
  valid,
  validateCanonicalExpression,
  validationIssue,
  type CapabilityRole,
  type SemanticCapabilityContract,
} from "@mailchemy/core";

interface ContractFixture {
  readonly input: unknown;
  readonly valid: boolean;
}

function stringContract(
  id: string,
  role: CapabilityRole,
): SemanticCapabilityContract<string> {
  return defineSemanticCapability<string>({
    id: parseCapabilityId(id),
    role,
    description: "Synthetic registry-integrity capability.",
    references: ["synthetic:registry-integrity"],
    validateParameters: (value) =>
      typeof value === "string"
        ? valid(value)
        : invalid(
            validationIssue("test.string.invalid", "Expected a string value."),
          ),
    areParametersEqual: (left, right) => left === right,
  });
}

describe("registry integrity", () => {
  const conditionV1 = stringContract("test.condition.value@1", "condition");
  const conditionV2 = stringContract("test.condition.value@2", "condition");
  const action = stringContract("test.action.noop@1", "action");

  const contracts = [action, conditionV2, conditionV1] as const;

  const fixtures = new Map<string, readonly ContractFixture[]>([
    [
      conditionV1.id,
      [
        { input: "alpha", valid: true },
        { input: 1, valid: false },
      ],
    ],
    [
      conditionV2.id,
      [
        { input: "beta", valid: true },
        { input: null, valid: false },
      ],
    ],
    [
      action.id,
      [
        { input: "noop", valid: true },
        { input: {}, valid: false },
      ],
    ],
  ]);

  function buildRegistry() {
    const registry = new CapabilityRegistry();

    for (const contract of contracts) {
      registry.register(contract);
    }

    return registry;
  }

  it("keeps semantic versions as distinct registry entries", () => {
    const registry = buildRegistry();

    expect(registry.size).toBe(3);
    expect(registry.has(conditionV1.id)).toBe(true);
    expect(registry.has(conditionV2.id)).toBe(true);
    expect(conditionV1.id).not.toBe(conditionV2.id);
  });

  it("rejects accidental duplicate registration", () => {
    const registry = buildRegistry();

    expect(() => registry.register(conditionV1)).toThrow(
      DuplicateCapabilityIdError,
    );
  });

  it("enumerates deterministically regardless of registration order", () => {
    const registry = buildRegistry();

    expect(registry.list().map((contract) => contract.id)).toEqual([
      "test.action.noop@1",
      "test.condition.value@1",
      "test.condition.value@2",
    ]);
  });

  it("requires explicit contract fixtures for every registered capability", () => {
    const registry = buildRegistry();

    expect(
      [...fixtures.keys()].sort((left, right) => left.localeCompare(right)),
    ).toEqual(registry.list().map((contract) => contract.id));

    for (const contract of registry.list()) {
      const contractFixtures = fixtures.get(contract.id);

      expect(contractFixtures).toBeDefined();

      if (contractFixtures === undefined) {
        continue;
      }

      for (const fixture of contractFixtures) {
        expect(contract.validateParameters(fixture.input).ok).toBe(
          fixture.valid,
        );
      }
    }
  });

  it("detects specimen/expression role mismatch through the registry contract", () => {
    const registry = buildRegistry();
    const actionSpecimen = createCapabilitySpecimen(action, "noop");
    const incorrectlyWrapped = createConditionExpression(actionSpecimen);

    const result = validateCanonicalExpression(registry, incorrectlyWrapped);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues.map((issue) => issue.code)).toContain(
        "capability.role-mismatch",
      );
    }
  });
});
