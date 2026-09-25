/**
 * Implements the initial offline Microsoft Graph Inbox Rule codec and native
 * rule-preservation boundaries.
 *
 * @remarks
 * The exact semantic slice is deliberately narrow: `markAsRead=true` maps to
 * canonical mark-read. Analogous Subject/attachment predicates are recognized
 * but remain `exactness-unproven`. Rule ordering, enable/error/read-only state,
 * exceptions, and `stopProcessingRules` carry control-flow/store semantics
 * outside the initial canonical slice and are preserved opaquely.
 *
 * This module describes the Graph Inbox Rule representation. It does not model
 * remote Graph transport/store operations.
 *
 * @packageDocumentation
 */

import {
    createActionExpression,
    createCapabilitySpecimen,
    decodedNative,
    defineSemanticCodec,
    encodedNative,
    hasAttachmentCapability,
    markReadCapability,
    nativeDecodeReason,
    opaqueNative,
    subjectContainsCapability,
    unsupportedNativeDecode,
    unsupportedRealization,
    unsupportedReason,
    type CanonicalExpression,
} from "@mailchemy/core";

/**
 * Initial structural view of Microsoft Graph `messageRulePredicates`.
 *
 * @remarks
 * The index signature permits fields outside the initial codec so they can be
 * detected and preserved rather than silently dropped.
 */
export interface OutlookMessageRulePredicatesNative {
    /** Graph Subject-substring predicate values when present. */
    readonly subjectContains?: readonly string[];
    /** Graph attachment-presence predicate when present. */
    readonly hasAttachments?: boolean;
    /** Additional Graph predicate fields retained for opaque detection. */
    readonly [key: string]: unknown;
}

/**
 * Initial structural view of Microsoft Graph `messageRuleActions`.
 */
export interface OutlookMessageRuleActionsNative {
    /** Whether matching messages should be marked read. */
    readonly markAsRead?: boolean;
    /** Whether subsequent Inbox Rules should be suppressed. */
    readonly stopProcessingRules?: boolean;
    /** Additional Graph action fields retained for opaque detection. */
    readonly [key: string]: unknown;
}

/**
 * Initial structural view of the Microsoft Graph `messageRule` resource.
 */
export interface OutlookMessageRuleNative {
    /** Provider-assigned rule identity when reading an existing rule. */
    readonly id?: string;
    /** Human-visible rule name. */
    readonly displayName?: string;
    /** Native execution order among Inbox Rules. */
    readonly sequence?: number;
    /** Whether the rule is enabled for execution. */
    readonly isEnabled?: boolean;
    /** Graph-reported error state for the existing rule. */
    readonly hasError?: boolean;
    /** Whether the rule is modifiable through the Graph Rules API. */
    readonly isReadOnly?: boolean;
    /** Positive predicates that participate in the rule match decision. */
    readonly conditions?: OutlookMessageRulePredicatesNative;
    /** Exclusion predicates belonging to the same rule match decision. */
    readonly exceptions?: OutlookMessageRulePredicatesNative;
    /** Action fields applied by a matching rule. */
    readonly actions?: OutlookMessageRuleActionsNative;
    /** Additional top-level Graph fields retained for opaque detection. */
    readonly [key: string]: unknown;
}

/**
 * Top-level `messageRule` fields the initial codec classifies structurally.
 */
const TOP_LEVEL_KEYS = new Set([
    "id",
    "displayName",
    "sequence",
    "isEnabled",
    "hasError",
    "isReadOnly",
    "conditions",
    "exceptions",
    "actions",
]);
/**
 * Predicate fields the initial codec understands enough to classify.
 */
const CONDITION_KEYS = new Set(["subjectContains", "hasAttachments"]);
/**
 * Action fields the initial codec understands enough to classify.
 */
const ACTION_KEYS = new Set(["markAsRead", "stopProcessingRules"]);

/**
 * Initial Microsoft Graph Inbox Rule semantic codec.
 *
 * @remarks
 * Canonical mark-read is the only exact semantic mapping currently emitted or
 * decoded. Native rule/store/control-flow fields are preserved, not flattened.
 */
export const outlookInboxRuleCodec =
    defineSemanticCodec<OutlookMessageRuleNative>({
        id: "outlook.graph.inbox-rule.initial@1",
        encode: encodeOutlookRule,
        decode: decodeOutlookRule,
    });

/**
 * Encodes the canonical subset currently proven exact for Graph Inbox Rules.
 *
 * @param expression Canonical expression to encode.
 * @returns Native action-only rule for exact mark-read, or structured
 * Unsupported evidence for unproven/absent mappings.
 */
function encodeOutlookRule(expression: CanonicalExpression) {
    if (
        expression.kind === "action" &&
        expression.specimen.capabilityId === markReadCapability.id
    ) {
        return encodedNative({
            actions: Object.freeze({
                markAsRead: true,
            }),
        });
    }

    if (containsInitialOutlookPredicate(expression)) {
        return unsupportedRealization(
            unsupportedReason(
                "exactness-unproven",
                "Outlook exposes analogous subject/attachment predicates, but exact equivalence to the current canonical contracts is not proven.",
            ),
        );
    }

    return unsupportedRealization(
        unsupportedReason(
            "capability-absent",
            "The minimal Outlook Inbox Rule codec does not encode this canonical expression.",
        ),
    );
}

/**
 * Decodes one Graph `messageRule` object into the initial canonical subset.
 *
 * @param native Graph Inbox Rule resource candidate.
 * @returns Decoded canonical mark-read, opaque preservation, or structured
 * native-decode refusal.
 */
function decodeOutlookRule(native: OutlookMessageRuleNative) {
    if (!isRecord(native))
        return invalidNative("Expected an Outlook messageRule object.");

    /** First top-level field outside the initial structural vocabulary. */
    const unknownTopLevelKey = firstUnknownKey(native, TOP_LEVEL_KEYS);

    if (unknownTopLevelKey !== undefined) {
        return opaqueNative(
            native,
            `Outlook messageRule field "${unknownTopLevelKey}" is outside the initial codec.`,
        );
    }

    /**
     * Preservation diagnostic for rule/store/control-flow structure outside the
     * initial canonical semantic slice.
     */
    const structuralMessage = inspectUnmodeledRuleStructure(native);

    if (structuralMessage !== undefined)
        return opaqueNative(native, structuralMessage);

    /** Classification of positive-condition semantics before action decoding. */
    const conditionsResult = inspectConditions(native.conditions);

    if (conditionsResult.kind !== "none") {
        if (conditionsResult.kind === "opaque")
            return opaqueNative(native, conditionsResult.message);

        if (conditionsResult.kind === "invalid")
            return invalidNative(conditionsResult.message);

        return unsupportedNativeDecode(
            nativeDecodeReason("exactness-unproven", conditionsResult.message),
        );
    }

    return decodeActionOnly(native, native.actions);
}

/**
 * Detects native rule metadata/control-flow fields that cannot be erased without
 * changing or losing Inbox Rule semantics.
 *
 * @remarks
 * Sequence, enabled/error/read-only state, and exceptions are intentionally
 * preserved opaquely. Provider identity/display metadata are tolerated only
 * when they have the expected primitive shape.
 *
 * @param native Object-shaped Graph rule.
 * @returns Opaque-preservation or malformed-field message, if any.
 */
function inspectUnmodeledRuleStructure(
    native: Readonly<Record<string, unknown>>,
): string | undefined {
    for (const key of [
        "sequence",
        "isEnabled",
        "hasError",
        "isReadOnly",
        "exceptions",
    ] as const) {
        if (native[key] !== undefined)
            return `Outlook messageRule field "${key}" carries rule/store semantics outside the initial canonical slice and is preserved opaquely.`;

    }

    if (native.id !== undefined && typeof native.id !== "string")
        return 'Outlook messageRule field "id" must be a string when present.';

    if (
        native.displayName !== undefined &&
        typeof native.displayName !== "string"
    )
        return 'Outlook messageRule field "displayName" must be a string when present.';

    return undefined;
}

/**
 * Internal classification of Graph positive conditions relative to the initial
 * canonical semantic slice.
 */
type ConditionInspection =
    | {
          /** No initial semantic condition fields are present. */
          readonly kind: "none";
      }
    | {
          /** Conditions are structurally understood but exact semantics are unproven. */
          readonly kind: "unproven";

          /** Human-readable exactness boundary. */
          readonly message: string;
      }
    | {
          /** Conditions require opaque preservation instead of interpretation. */
          readonly kind: "opaque";

          /** Human-readable preservation boundary. */
          readonly message: string;
      }
    | {
          /** Conditions are malformed relative to the supported Graph shape. */
          readonly kind: "invalid";

          /** Human-readable native-shape error. */
          readonly message: string;
      };

/**
 * Classifies positive Graph predicates before action-only semantic decoding.
 *
 * @remarks
 * Subject/attachment predicates are recognized but exactness-unproven. Unknown
 * predicates, inverse attachment state, and empty Subject collections are
 * preserved opaquely rather than assigned invented canonical meaning.
 *
 * @param conditions Native positive predicates, or absence thereof.
 * @returns Internal condition classification.
 */
function inspectConditions(
    conditions: OutlookMessageRulePredicatesNative | undefined,
): ConditionInspection {
    if (conditions === undefined)
        return { kind: "none" };

    if (!isRecord(conditions)) {
        return {
            kind: "invalid",
            message:
                "Outlook messageRule conditions must be an object when present.",
        };
    }

    /** First predicate field outside the initial structural vocabulary. */
    const unknownKey = firstUnknownKey(conditions, CONDITION_KEYS);

    if (unknownKey !== undefined) {
        return {
            kind: "opaque",
            message: `Outlook condition field "${unknownKey}" is outside the initial codec.`,
        };
    }

    if (conditions.subjectContains !== undefined) {
        if (
            !Array.isArray(conditions.subjectContains) ||
            conditions.subjectContains.some(
                (value) => typeof value !== "string",
            )
        ) {
            return {
                kind: "invalid",
                message: "Outlook subjectContains must be an array of strings.",
            };
        }

        if (conditions.subjectContains.length === 0) {
            return {
                kind: "opaque",
                message:
                    "Outlook subjectContains with an empty collection has no proven canonical meaning in the initial slice.",
            };
        }
    }

    if (
        conditions.hasAttachments !== undefined &&
        typeof conditions.hasAttachments !== "boolean"
    ) {
        return {
            kind: "invalid",
            message: "Outlook hasAttachments must be boolean when present.",
        };
    }

    if (conditions.hasAttachments === false) {
        return {
            kind: "opaque",
            message:
                "Outlook hasAttachments=false is an inverse predicate not represented by the initial canonical slice.",
        };
    }

    if (
        conditions.subjectContains !== undefined ||
        conditions.hasAttachments === true
    ) {
        return {
            kind: "unproven",
            message:
                "Outlook subjectContains/hasAttachments predicates are understood, but exact equivalence to the current canonical contracts is not proven.",
        };
    }

    return { kind: "none" };
}

/**
 * Decodes Graph actions after rule structure and positive conditions have been
 * proven irrelevant to the initial canonical subset.
 *
 * @remarks
 * `stopProcessingRules` is preserved even when false because its explicit
 * presence belongs to Outlook continuation/control-flow state that the initial
 * canonical action model does not encode.
 *
 * @param native Full native rule retained for opaque results.
 * @param actions Graph action object or absence thereof.
 * @returns Canonical mark-read only for isolated `markAsRead=true`; otherwise
 * opaque preservation or malformed-native refusal.
 */
function decodeActionOnly(
    native: OutlookMessageRuleNative,
    actions: OutlookMessageRuleActionsNative | undefined,
) {
    if (actions === undefined) {
        return opaqueNative(
            native,
            "Outlook messageRule has no initial semantic fields to decode.",
        );
    }

    if (!isRecord(actions)) {
        return invalidNative(
            "Outlook messageRule actions must be an object when present.",
        );
    }

    /** First action field outside the initial structural vocabulary. */
    const unknownKey = firstUnknownKey(actions, ACTION_KEYS);

    if (unknownKey !== undefined) {
        return opaqueNative(
            native,
            `Outlook action field "${unknownKey}" is outside the initial codec.`,
        );
    }

    if (actions.stopProcessingRules !== undefined) {
        if (typeof actions.stopProcessingRules !== "boolean") {
            return invalidNative(
                "Outlook stopProcessingRules must be boolean when present.",
            );
        }

        return opaqueNative(
            native,
            "Outlook stopProcessingRules carries continuation semantics outside the initial canonical slice.",
        );
    }

    if (actions.markAsRead === undefined) {
        return opaqueNative(
            native,
            "Outlook messageRule actions have no initial semantic fields to decode.",
        );
    }

    if (typeof actions.markAsRead !== "boolean") {
        return invalidNative(
            "Outlook markAsRead must be boolean when present.",
        );
    }

    if (actions.markAsRead) {
        return decodedNative(
            createActionExpression(
                createCapabilitySpecimen(markReadCapability, null),
            ),
        );
    }

    return opaqueNative(
        native,
        "Outlook markAsRead=false does not encode the canonical mark-read action.",
    );
}

/**
 * Detects canonical conditions that resemble Graph predicates whose exact
 * equivalence remains unproven.
 *
 * @param expression Canonical expression to inspect recursively.
 * @returns Whether Subject-containment or attachment-presence semantics occur.
 */
function containsInitialOutlookPredicate(
    expression: CanonicalExpression,
): boolean {
    switch (expression.kind) {
        case "condition":
            return (
                expression.specimen.capabilityId ===
                    subjectContainsCapability.id ||
                expression.specimen.capabilityId === hasAttachmentCapability.id
            );
        case "action":
            return false;
        case "and":
            return expression.operands.some(containsInitialOutlookPredicate);
        case "rule":
            return containsInitialOutlookPredicate(expression.condition);
    }
}

/**
 * Constructs a malformed-Graph-native decode result.
 *
 * @param message Human-readable native-shape diagnostic.
 * @returns Unsupported-native result with `invalid-native` reason.
 */
function invalidNative(message: string) {
    return unsupportedNativeDecode(
        nativeDecodeReason("invalid-native", message),
    );
}

/**
 * Finds the first enumerable object field outside an allowed key set.
 *
 * @param value Native Graph object to inspect.
 * @param allowed Fields understood structurally at this codec stage.
 * @returns First unknown key in object enumeration order, if any.
 */
function firstUnknownKey(
    value: Readonly<Record<string, unknown>>,
    allowed: ReadonlySet<string>,
): string | undefined {
    return Object.keys(value).find((key) => !allowed.has(key));
}

/**
 * Narrows an unknown native value to a non-null, non-array object record.
 *
 * @param value Runtime candidate.
 * @returns Whether the value can be inspected as a Graph native object.
 */
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
