/**
 * Exposes the public `@mailchemy/conformance` fixture, capability-contract
 * conformance, target-runner, round-trip, matrix, and shared-rule APIs.
 *
 * @remarks
 * Re-exporting evidence/harness machinery here does not strengthen any target,
 * codec, or provider exactness claim made by the underlying executable inputs.
 *
 * @packageDocumentation
 */

export {
    InvalidCanonicalFixtureError,
    defineCanonicalFixture,
    type CanonicalFixture,
    type CanonicalFixtureDefinition,
    type ExpectedCanonicalValidation,
} from "./fixture.js";

export {
    runCapabilityContractConformance,
    type CapabilityContractOracle,
    type CapabilityContractConformanceRun,
    type CapabilityContractConformanceOptions,
    type CapabilityCoverageResult,
    type CapabilityFixtureResult,
    type ContractOracleExecution,
    type ContractOracleResult,
} from "./capability_contract_conformance.js";

export {
    runTargetRealizationConformance,
    type TargetRealizationCase,
    type TargetRealizationCaseResult,
    type TargetRealizationExpectation,
    type TargetRealizationRun,
} from "./target_runner.js";

export {
    runCodecRoundTrips,
    type CanonicalEquivalence,
    type CodecRoundTripCase,
    type CodecRoundTripCaseResult,
    type CodecRoundTripFailureKind,
    type CodecRoundTripRun,
} from "./round_trip.js";

export {
    buildConformanceMatrix,
    renderConformanceMatrixMarkdown,
    type ConformanceMatrix,
    type ConformanceMatrixCell,
    type ConformanceMatrixRow,
} from "./matrix.js";

export { hasAttachmentFixtures } from "./fixtures/has_attachment.js";
export { sharedRuleFixtures } from "./fixtures/shared_rules.js";
export { logicalAndFixtures } from "./fixtures/logical_and.js";
export { markReadFixtures } from "./fixtures/mark_read.js";
export { subjectContainsFixtures } from "./fixtures/subject_contains.js";
