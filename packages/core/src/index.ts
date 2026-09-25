/**
 * Exposes the public `@mailchemy/core` TypeScript surface by re-exporting
 * semantic primitives, canonical expression types, validation, realization,
 * codec, endpoint-profile, and current core capability APIs.
 *
 * @remarks
 * Re-exporting an implementation here does not strengthen its semantic or
 * exactness claims; each underlying module owns those details.
 *
 * @packageDocumentation
 */

export {
    InvalidCapabilityIdError,
    capabilityIdKey,
    capabilityIdParts,
    createCapabilityId,
    parseCapabilityId,
    type CapabilityId,
    type CapabilityIdParts,
} from "./capability_id.js";

export {
    InvalidCapabilityContractError,
    defineSemanticCapability,
    type CapabilityRole,
    type RegisteredCapabilityContract,
    type SemanticCapabilityContract,
    type SemanticCapabilityDefinition,
} from "./capability_contract.js";

export {
    CapabilityRegistry,
    DuplicateCapabilityIdError,
} from "./capability_registry.js";

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
    areCapabilityInstancesEqual,
    createCapabilityInstance,
    type CapabilityInstance,
} from "./capability_instance.js";

export {
    createActionExpression,
    createAndExpression,
    createConditionExpression,
    createRuleExpression,
    type ActionLeafExpression,
    type ActionExpression,
    type AndExpression,
    type CanonicalExpression,
    type ConditionLeafExpression,
    type ConditionExpression,
    type RuleExpression,
} from "./expression.js";

export {
    validateCanonicalExpression,
    validateCapabilityInstance,
} from "./semantic_validation.js";

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
} from "./realization_target.js";

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
} from "./endpoint_profile.js";

export {
    defineStructuredDirectRealizationTarget,
    type LeafSemanticExpression,
    type StructuralSemanticExpression,
    type StructuredDirectRealizationTarget,
    type StructuredDirectRealizationTargetDefinition,
} from "./structured_realization_target.js";

export {
    evaluateSubjectContains,
    subjectContainsCapability,
    type SubjectContainsParameters,
} from "./capabilities/subject_contains.js";

export {
    createCoreCapabilityRegistry,
    registerCoreSemanticCapabilities,
} from "./core_capability_registry.js";

export {
    evaluateHasAttachment,
    hasAttachmentCapability,
    type MimeEntityAttachmentView,
} from "./capabilities/has_attachment.js";

export { applyMarkRead, markReadCapability } from "./capabilities/mark_read.js";

export {
    evaluateLogicalAnd,
    logicalAndCapability,
} from "./capabilities/logical_and.js";
