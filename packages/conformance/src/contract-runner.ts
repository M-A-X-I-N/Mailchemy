import {
  validateCanonicalExpression,
  type CapabilityId,
  type CapabilityRegistry,
  type CanonicalExpression,
} from "@mailchemy/core";

import type { CanonicalFixture } from "./fixture.js";

export interface ContractOracleResult {
  readonly passed: boolean;
  readonly message?: string;
}

export type CapabilityContractOracle = (
  fixture: CanonicalFixture,
  expression: CanonicalExpression,
) => ContractOracleResult;

export interface ContractOracleExecution {
  readonly capabilityId: CapabilityId;
  readonly passed: boolean;
  readonly message?: string;
}

export interface CapabilityFixtureResult {
  readonly fixtureId: string;
  readonly expectedValidation: "valid" | "invalid";
  readonly actualValidation: "valid" | "invalid";
  readonly validationPassed: boolean;
  readonly oracleResults: readonly ContractOracleExecution[];
  readonly passed: boolean;
}

export interface CapabilityCoverageResult {
  readonly capabilityId: CapabilityId;
  readonly validFixtureCount: number;
  readonly invalidFixtureCount: number;
  readonly passed: boolean;
}

export interface CapabilityContractRun {
  readonly fixtureResults: readonly CapabilityFixtureResult[];
  readonly coverage: readonly CapabilityCoverageResult[];
  readonly passed: boolean;
}

export interface CapabilityContractRunnerOptions {
  readonly oracles?: ReadonlyMap<CapabilityId, CapabilityContractOracle>;
}

export function runCapabilityContractTests(
  registry: CapabilityRegistry,
  fixtures: readonly CanonicalFixture[],
  options: CapabilityContractRunnerOptions = {},
): CapabilityContractRun {
  const fixtureResults = fixtures.map((fixture) =>
    runFixture(registry, fixture, options.oracles),
  );
  const coverage = registry.list().map((contract) => {
    const applicable = fixtures.filter((fixture) =>
      fixture.capabilities.includes(contract.id),
    );
    const validFixtureCount = applicable.filter(
      (fixture) => fixture.expectedValidation === "valid",
    ).length;
    const invalidFixtureCount = applicable.filter(
      (fixture) => fixture.expectedValidation === "invalid",
    ).length;

    return Object.freeze({
      capabilityId: contract.id,
      validFixtureCount,
      invalidFixtureCount,
      passed: validFixtureCount > 0 && invalidFixtureCount > 0,
    });
  });

  return Object.freeze({
    fixtureResults: Object.freeze(fixtureResults),
    coverage: Object.freeze(coverage),
    passed:
      fixtureResults.every((result) => result.passed) &&
      coverage.every((result) => result.passed),
  });
}

function runFixture(
  registry: CapabilityRegistry,
  fixture: CanonicalFixture,
  oracles: ReadonlyMap<CapabilityId, CapabilityContractOracle> | undefined,
): CapabilityFixtureResult {
  const validation = validateCanonicalExpression(registry, fixture.expression);
  const actualValidation = validation.ok ? "valid" : "invalid";
  const validationPassed = actualValidation === fixture.expectedValidation;

  const oracleResults: ContractOracleExecution[] = [];

  if (validation.ok && fixture.expectedValidation === "valid") {
    for (const capabilityId of fixture.capabilities) {
      const oracle = oracles?.get(capabilityId);

      if (oracle === undefined) {
        continue;
      }

      const result = oracle(fixture, validation.value);
      oracleResults.push(
        Object.freeze({
          capabilityId,
          passed: result.passed,
          ...(result.message === undefined ? {} : { message: result.message }),
        }),
      );
    }
  }

  return Object.freeze({
    fixtureId: fixture.id,
    expectedValidation: fixture.expectedValidation,
    actualValidation,
    validationPassed,
    oracleResults: Object.freeze(oracleResults),
    passed: validationPassed && oracleResults.every((result) => result.passed),
  });
}
