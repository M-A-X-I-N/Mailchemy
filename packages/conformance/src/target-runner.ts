import {
  validateCanonicalExpression,
  type CapabilityRegistry,
  type DirectRealizationResult,
  type DirectRealizationTarget,
  type UnsupportedReasonCode,
} from "@mailchemy/core";

import type { CanonicalFixture } from "./fixture.js";

export type TargetRealizationExpectation =
  | {
      readonly kind: "direct";
    }
  | {
      readonly kind: "unsupported";
      readonly reasonCode: UnsupportedReasonCode;
    };

export interface TargetRealizationCase {
  readonly fixture: CanonicalFixture;
  readonly expected: TargetRealizationExpectation;
}

export interface TargetRealizationCaseResult {
  readonly fixtureId: string;
  readonly expected: TargetRealizationExpectation;
  readonly actual?: DirectRealizationResult;
  readonly canonicalValid: boolean;
  readonly passed: boolean;
  readonly message?: string;
}

export interface TargetRealizationRun {
  readonly targetId: string;
  readonly results: readonly TargetRealizationCaseResult[];
  readonly passed: boolean;
}

export function runTargetRealizationConformance(
  registry: CapabilityRegistry,
  target: DirectRealizationTarget,
  cases: readonly TargetRealizationCase[],
): TargetRealizationRun {
  const results = cases.map((testCase) =>
    runCase(registry, target, testCase),
  );

  return Object.freeze({
    targetId: target.id,
    results: Object.freeze(results),
    passed: results.every((result) => result.passed),
  });
}

function runCase(
  registry: CapabilityRegistry,
  target: DirectRealizationTarget,
  testCase: TargetRealizationCase,
): TargetRealizationCaseResult {
  const validation = validateCanonicalExpression(
    registry,
    testCase.fixture.expression,
  );

  if (
    testCase.fixture.expectedValidation !== "valid" ||
    !validation.ok
  ) {
    return Object.freeze({
      fixtureId: testCase.fixture.id,
      expected: testCase.expected,
      canonicalValid: false,
      passed: false,
      message:
        "Target realization conformance requires a canonically valid fixture.",
    });
  }

  const actual = target.checkDirectRealization(validation.value);
  const passed = matchesExpectation(actual, testCase.expected);

  return Object.freeze({
    fixtureId: testCase.fixture.id,
    expected: testCase.expected,
    actual,
    canonicalValid: true,
    passed,
    ...(passed
      ? {}
      : {
          message:
            "Target realization result did not match the expected exactness classification.",
        }),
  });
}

function matchesExpectation(
  actual: DirectRealizationResult,
  expected: TargetRealizationExpectation,
): boolean {
  if (expected.kind === "direct") {
    return actual.kind === "direct";
  }

  return (
    actual.kind === "unsupported" &&
    actual.reason.code === expected.reasonCode
  );
}
