export {
  InvalidCapabilityIdError,
  capabilityIdKey,
  capabilityIdParts,
  createCapabilityId,
  parseCapabilityId,
  type CapabilityId,
  type CapabilityIdParts,
} from "./capability-id.js";

export {
  InvalidCapabilityContractError,
  defineSemanticCapability,
  type CapabilityRole,
  type RegisteredCapabilityContract,
  type SemanticCapabilityContract,
  type SemanticCapabilityDefinition,
} from "./capability-contract.js";

export {
  CapabilityRegistry,
  DuplicateCapabilityIdError,
} from "./capability-registry.js";

export {
  invalid,
  valid,
  validationIssue,
  type ValidationIssue,
  type ValidationPathSegment,
  type ValidationResult,
} from "./validation.js";

export {
  InvalidCapabilityParametersError,
  areCapabilitySpecimensEqual,
  createCapabilitySpecimen,
  type CapabilitySpecimen,
} from "./semantic-specimen.js";

export {
  createActionExpression,
  createAndExpression,
  createConditionExpression,
  createRuleExpression,
  type ActionCapabilityExpression,
  type ActionExpression,
  type AndExpression,
  type CanonicalExpression,
  type ConditionCapabilityExpression,
  type ConditionExpression,
  type RuleExpression,
} from "./expression.js";

export {
  validateCanonicalExpression,
  validateCapabilitySpecimen,
} from "./semantic-validation.js";

export {
  derivedRealization,
  directRealization,
  unsupportedRealization,
  unsupportedReason,
  type DerivedRealization,
  type DirectRealization,
  type RealizationResult,
  type UnsupportedRealization,
  type UnsupportedReason,
  type UnsupportedReasonCode,
} from "./realization.js";

export {
  InvalidRealizationTargetError,
  defineDirectRealizationTarget,
  type DirectRealizationResult,
  type DirectRealizationTarget,
  type DirectRealizationTargetDefinition,
} from "./realization-target.js";
