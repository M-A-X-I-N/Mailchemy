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

export const mailchemyConformanceScaffold = "mailchemy-conformance" as const;
