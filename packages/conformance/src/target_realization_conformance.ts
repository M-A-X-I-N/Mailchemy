/**
 * Runs direct-realization conformance cases against concrete target contracts
 * after first proving that each fixture is canonically valid.
 *
 * @remarks
 * The runner compares executable target classifications with explicit expected
 * evidence classes. It does not infer provider semantics beyond the supplied
 * target implementation and expectation.
 *
 * @packageDocumentation
 */

import {
    validateCanonicalExpression,
    type CapabilityRegistry,
    type DirectRealizationResult,
    type DirectRealizationTarget,
    type UnsupportedReasonCode,
} from "@mailchemy/core";

import type { CanonicalFixture } from "./fixtures/canonical_fixture.js";

/**
 * Expected direct-realization outcome for one target/fixture conformance case.
 */
export type TargetRealizationExpectation =
    | {
          /** Expect exact direct realization. */
          readonly kind: "direct";
      }
    | {
          /** Expect explicit Unsupported evidence. */
          readonly kind: "unsupported";

          /** Exact refusal category expected from the target. */
          readonly reasonCode: UnsupportedReasonCode;
      };

/**
 * One fixture/expectation pair evaluated against a direct-realization target.
 */
export interface TargetRealizationCase {
    /** Canonically valid fixture whose target classification is under test. */
    readonly fixture: CanonicalFixture;

    /** Expected exactness classification for this target and fixture. */
    readonly expected: TargetRealizationExpectation;
}

/**
 * Result of evaluating one target-realization conformance case.
 */
export interface TargetRealizationCaseResult {
    /** Stable fixture identity. */
    readonly fixtureId: string;

    /** Expected Direct/Unsupported classification. */
    readonly expected: TargetRealizationExpectation;

    /** Actual target result when canonical validation permitted target execution. */
    readonly actual?: DirectRealizationResult;

    /** Whether the fixture was eligible for target execution as valid canonical IR. */
    readonly canonicalValid: boolean;

    /** Whether actual classification matched the expected evidence class. */
    readonly passed: boolean;

    /** Optional human-readable failure diagnostic. */
    readonly message?: string;
}

/**
 * Aggregate realization-conformance result for one target.
 */
export interface TargetRealizationRun {
    /** Stable target identity copied from the executable target contract. */
    readonly targetId: string;

    /** Frozen case results in supplied case order. */
    readonly results: readonly TargetRealizationCaseResult[];

    /** Whether every target/fixture expectation matched. */
    readonly passed: boolean;
}

/**
 * Executes realization conformance for one direct target over supplied cases.
 *
 * @param registry Registry used to prove fixture canonical validity.
 * @param target Executable target contract being evaluated.
 * @param cases Fixture/expectation pairs for this target.
 * @returns Frozen target run with per-case evidence.
 */
export function runTargetRealizationConformance(
    registry: CapabilityRegistry,
    target: DirectRealizationTarget,
    cases: readonly TargetRealizationCase[],
): TargetRealizationRun {
    /** Per-case evidence retained in caller-supplied order. */
    const results = cases.map((testCase) =>
        runCase(registry, target, testCase),
    );

    return Object.freeze({
        targetId: target.id,
        results: Object.freeze(results),
        passed: results.every((result) => result.passed),
    });
}

/**
 * Validates and executes one target realization case.
 *
 * @param registry Registry owning canonical semantic validation.
 * @param target Direct-realization target under test.
 * @param testCase Fixture plus expected classification.
 * @returns Frozen per-case result.
 */
function runCase(
    registry: CapabilityRegistry,
    target: DirectRealizationTarget,
    testCase: TargetRealizationCase,
): TargetRealizationCaseResult {
    /** Canonical validation gate that must pass before target execution. */
    const validation = validateCanonicalExpression(
        registry,
        testCase.fixture.expression,
    );

    if (testCase.fixture.expectedValidation !== "valid" || !validation.ok) {
        return Object.freeze({
            fixtureId: testCase.fixture.id,
            expected: testCase.expected,
            canonicalValid: false,
            passed: false,
            message:
                "Target realization conformance requires a canonically valid fixture.",
        });
    }

    /** Executable target classification for the validated canonical expression. */
    const actual = target.checkDirectRealization(validation.value);

    /** Whether the actual evidence class exactly matches the expected class/code. */
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

/**
 * Compares an executable target result with the expected evidence category.
 *
 * @param actual Direct or Unsupported result returned by the target.
 * @param expected Expected target conformance classification.
 * @returns Whether both kind and, for Unsupported, refusal reason code match.
 */
function matchesExpectation(
    actual: DirectRealizationResult,
    expected: TargetRealizationExpectation,
): boolean {
    if (expected.kind === "direct")
        return actual.kind === "direct";

    return (
        actual.kind === "unsupported" &&
        actual.reason.code === expected.reasonCode
    );
}
