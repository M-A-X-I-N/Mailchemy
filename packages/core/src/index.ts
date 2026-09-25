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
} from "./capabilities/id.js";

export {
    InvalidCapabilityContractError,
    defineSemanticCapability,
    type CapabilityRole,
    type RegisteredCapabilityContract,
    type SemanticCapabilityContract,
    type SemanticCapabilityDefinition,
} from "./capabilities/contract.js";

export {
    CapabilityRegistry,
    DuplicateCapabilityIdError,
} from "./capabilities/registry.js";

export {
    invalid,
    valid,
    validationIssue,
    type ValidationIssue,
    type ValidationPathSegment,
    type ValidationResult,
} from "./validation_result.js";

export {
    InvalidCapabilityParametersError,
    areCapabilityInstancesEqual,
    createCapabilityInstance,
    type CapabilityInstance,
} from "./capabilities/instance.js";

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
} from "./canonical/expression.js";

export {
    validateCanonicalExpression,
    validateCapabilityInstance,
} from "./canonical/validation.js";

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
} from "./realization/result.js";

export {
    InvalidRealizationTargetError,
    defineDirectRealizationTarget,
    type DirectRealizationResult,
    type DirectRealizationTarget,
    type DirectRealizationTargetDefinition,
} from "./realization/direct_target.js";

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
} from "./semantic_codec.js";

export {
    InvalidEndpointProfileError,
    defineEndpointCapabilityProfile,
    refineTargetWithEndpointProfile,
    type EndpointCapabilityProfile,
    type EndpointCapabilityProfileDefinition,
    type EndpointProfileRefinement,
    type EndpointRefinedRealizationTarget,
    type EndpointRefinedRealizationTargetDefinition,
} from "./realization/endpoint_profile.js";

export {
    defineStructuredDirectRealizationTarget,
    type LeafSemanticExpression,
    type StructuralSemanticExpression,
    type StructuredDirectRealizationTarget,
    type StructuredDirectRealizationTargetDefinition,
} from "./realization/structured_target.js";

export {
    evaluateSubjectContains,
    subjectContainsCapability,
    type SubjectContainsParameters,
} from "./capabilities/builtins/subject_contains.js";

export {
    createCoreCapabilityRegistry,
    registerCoreSemanticCapabilities,
} from "./capabilities/core_registry.js";

export {
    evaluateHasAttachment,
    hasAttachmentCapability,
    type MimeEntityAttachmentView,
} from "./capabilities/builtins/has_attachment.js";

export { applyMarkRead, markReadCapability } from "./capabilities/builtins/mark_read.js";

export {
    evaluateLogicalAnd,
    logicalAndCapability,
} from "./capabilities/builtins/logical_and.js";
