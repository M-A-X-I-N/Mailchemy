export {
    InvalidCanonicalFixtureError,
    defineCanonicalFixture,
    type CanonicalFixture,
    type CanonicalFixtureDefinition,
    type ExpectedCanonicalValidation,
} from "./fixture.js";

export {
    runCapabilityContractTests,
    type CapabilityContractOracle,
    type CapabilityContractRun,
    type CapabilityContractRunnerOptions,
    type CapabilityCoverageResult,
    type CapabilityFixtureResult,
    type ContractOracleExecution,
    type ContractOracleResult,
} from "./contract-runner.js";

export {
    runTargetRealizationConformance,
    type TargetRealizationCase,
    type TargetRealizationCaseResult,
    type TargetRealizationExpectation,
    type TargetRealizationRun,
} from "./target-runner.js";

export {
    runCodecRoundTrips,
    type CanonicalEquivalence,
    type CodecRoundTripCase,
    type CodecRoundTripCaseResult,
    type CodecRoundTripFailureKind,
    type CodecRoundTripRun,
} from "./round-trip.js";

export {
    buildConformanceMatrix,
    renderConformanceMatrixMarkdown,
    type ConformanceMatrix,
    type ConformanceMatrixCell,
    type ConformanceMatrixRow,
} from "./matrix.js";

export { hasAttachmentFixtures } from "./fixtures/has-attachment.js";
export { initialRuleFixtures } from "./fixtures/initial-rules.js";
export { logicalAndFixtures } from "./fixtures/logical-and.js";
export { markReadFixtures } from "./fixtures/mark-read.js";
export { subjectContainsFixtures } from "./fixtures/subject-contains.js";

export const mailchemyConformanceScaffold = "mailchemy-conformance" as const;
