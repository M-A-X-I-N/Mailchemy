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

export const mailchemyConformanceScaffold = "mailchemy-conformance" as const;
