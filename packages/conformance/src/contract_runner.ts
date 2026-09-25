/**
 * Runs canonical semantic-capability fixture suites against registry validation
 * and optional pure semantic oracles, while accounting for valid/invalid
 * boundary coverage per registered capability.
 *
 * @remarks
 * This harness verifies canonical contract evidence. It does not classify
 * target realizability, codec support, or provider behavior.
 *
 * @packageDocumentation
 */

import {
    validateCanonicalExpression,
    type CapabilityId,
    type CapabilityRegistry,
    type CanonicalExpression,
} from "@mailchemy/core";

import type { CanonicalFixture } from "./fixture.js";

/**
 * Result returned by one optional semantic oracle.
 */
export interface ContractOracleResult {
    /** Whether the fixture's oracle expectation matched evaluated semantics. */
    readonly passed: boolean;

    /** Optional human-readable evidence/diagnostic from the oracle. */
    readonly message?: string;
}

/**
 * Pure semantic evaluator attached to one capability contract in a run.
 *
 * @param fixture Valid canonical fixture whose capability list includes the
 * oracle's capability.
 * @param expression Canonically validated expression.
 * @returns Pass/fail evidence for the fixture's capability-specific oracle.
 */
export type CapabilityContractOracle = (
    fixture: CanonicalFixture,
    expression: CanonicalExpression,
) => ContractOracleResult;

/**
 * Recorded execution of one capability oracle for one fixture.
 */
export interface ContractOracleExecution {
    /** Capability whose semantic oracle was evaluated. */
    readonly capabilityId: CapabilityId;

    /** Whether the oracle expectation was satisfied. */
    readonly passed: boolean;

    /** Optional human-readable oracle evidence. */
    readonly message?: string;
}

/**
 * Canonical-validation and oracle outcome for one fixture.
 */
export interface CapabilityFixtureResult {
    /** Stable fixture identity. */
    readonly fixtureId: string;

    /** Validation outcome declared by the fixture evidence. */
    readonly expectedValidation: "valid" | "invalid";

    /** Validation outcome observed from the canonical validator. */
    readonly actualValidation: "valid" | "invalid";

    /** Whether expected and actual canonical validation agree. */
    readonly validationPassed: boolean;

    /** Frozen semantic-oracle executions performed for a valid fixture. */
    readonly oracleResults: readonly ContractOracleExecution[];

    /** Whether validation expectation and every executed oracle passed. */
    readonly passed: boolean;
}

/**
 * Positive/negative boundary coverage observed for one registered capability.
 */
export interface CapabilityCoverageResult {
    /** Registered semantic capability whose fixtures were counted. */
    readonly capabilityId: CapabilityId;

    /** Number of fixtures declaring valid canonical instances for the contract. */
    readonly validFixtureCount: number;

    /** Number of fixtures declaring invalid canonical instances for the contract. */
    readonly invalidFixtureCount: number;

    /** Whether at least one valid and one invalid boundary fixture are present. */
    readonly passed: boolean;
}

/**
 * Aggregate result of one capability-contract fixture run.
 */
export interface CapabilityContractRun {
    /** Per-fixture validation/oracle evidence. */
    readonly fixtureResults: readonly CapabilityFixtureResult[];

    /** Per-registered-capability boundary-coverage accounting. */
    readonly coverage: readonly CapabilityCoverageResult[];

    /** Whether every fixture and every registered capability coverage check passed. */
    readonly passed: boolean;
}

/**
 * Optional behavior supplied to a capability-contract run.
 */
export interface CapabilityContractRunnerOptions {
    /**
     * Capability-specific pure semantic oracles.
     *
     * @remarks
     * Oracles run only after canonical validation succeeds on a fixture that was
     * itself expected to be valid.
     */
    readonly oracles?: ReadonlyMap<CapabilityId, CapabilityContractOracle>;
}

/**
 * Evaluates canonical fixture validation, optional semantic oracles, and
 * positive/negative boundary coverage for every registered capability.
 *
 * @param registry Registry whose semantic contracts define validation/coverage.
 * @param fixtures Canonical evidence cases participating in the run.
 * @param options Optional capability-specific semantic oracles.
 * @returns Frozen aggregate contract-run evidence.
 */
export function runCapabilityContractTests(
    registry: CapabilityRegistry,
    fixtures: readonly CanonicalFixture[],
    options: CapabilityContractRunnerOptions = {},
): CapabilityContractRun {
    /** Per-fixture validation/oracle evidence in supplied fixture order. */
    const fixtureResults = fixtures.map((fixture) =>
        runFixture(registry, fixture, options.oracles),
    );

    /**
     * Boundary-coverage accounting for every registered contract, independent
     * of whether that contract currently has an oracle implementation.
     */
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

/**
 * Evaluates one fixture against canonical validation and any applicable pure
 * semantic oracles.
 *
 * @param registry Registry that owns canonical validation contracts.
 * @param fixture Fixture evidence to evaluate.
 * @param oracles Optional oracle map keyed by semantic capability identity.
 * @returns Frozen per-fixture validation/oracle result.
 */
function runFixture(
    registry: CapabilityRegistry,
    fixture: CanonicalFixture,
    oracles: ReadonlyMap<CapabilityId, CapabilityContractOracle> | undefined,
): CapabilityFixtureResult {
    /** Canonical structural/parameter validation evidence for the fixture. */
    const validation = validateCanonicalExpression(
        registry,
        fixture.expression,
    );

    /** Simplified validation classification used by fixture expectations. */
    const actualValidation = validation.ok ? "valid" : "invalid";

    /** Whether canonical validation agrees with the fixture's declared boundary. */
    const validationPassed = actualValidation === fixture.expectedValidation;

    /** Capability-oracle executions collected only for valid fixture evidence. */
    const oracleResults: ContractOracleExecution[] = [];

    if (validation.ok && fixture.expectedValidation === "valid") {
        for (const capabilityId of fixture.capabilities) {
            const oracle = oracles?.get(capabilityId);

            if (oracle === undefined)
                continue;

            const result = oracle(fixture, validation.value);
            oracleResults.push(
                Object.freeze({
                    capabilityId,
                    passed: result.passed,
                    ...(result.message === undefined
                        ? {}
                        : { message: result.message }),
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
        passed:
            validationPassed && oracleResults.every((result) => result.passed),
    });
}
