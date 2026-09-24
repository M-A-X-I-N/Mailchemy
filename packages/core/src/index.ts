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

export {
    InvalidCodecDefinitionError,
    decodedNative,
    defineSemanticCodec,
    encodedNative,
    nativeDecodeReason,
    opaqueNative,
    unsupportedNativeDecode,
    type DecodeResult,
    type DecodedNative,
    type EncodeResult,
    type EncodedNative,
    type NativeDecodeReason,
    type NativeDecodeReasonCode,
    type OpaqueNative,
    type SemanticCodec,
    type SemanticCodecDefinition,
    type UnsupportedNativeDecode,
} from "./codec.js";

export {
    InvalidEndpointProfileError,
    defineEndpointCapabilityProfile,
    refineTargetWithEndpointProfile,
    type EndpointCapabilityProfile,
    type EndpointCapabilityProfileDefinition,
    type EndpointProfileRefinement,
    type EndpointRefinedRealizationTarget,
    type EndpointRefinedRealizationTargetDefinition,
} from "./endpoint-profile.js";

export {
    defineStructuredDirectRealizationTarget,
    type LeafSemanticExpression,
    type StructuralSemanticExpression,
    type StructuredDirectRealizationTarget,
    type StructuredDirectRealizationTargetDefinition,
} from "./structured-realization-target.js";

export {
    evaluateSubjectContains,
    subjectContainsCapability,
    type SubjectContainsParameters,
} from "./capabilities/subject-contains.js";

export {
    createCoreCapabilityRegistry,
    registerCoreSemanticCapabilities,
} from "./core-capability-registry.js";

export {
    evaluateHasAttachment,
    hasAttachmentCapability,
    type MimeEntityAttachmentView,
} from "./capabilities/has-attachment.js";

export { applyMarkRead, markReadCapability } from "./capabilities/mark-read.js";

export {
    evaluateLogicalAnd,
    logicalAndCapability,
} from "./capabilities/logical-and.js";
