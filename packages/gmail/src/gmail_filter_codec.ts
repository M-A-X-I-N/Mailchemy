/**
 * Implements the initial offline Gmail Filter API codec and native object
 * preservation rules.
 *
 * @remarks
 * The codec models a deliberately narrow exact subset. Removing the system
 * label `UNREAD` is mapped exactly to canonical mark-read. Structured Subject
 * and attachment criteria are recognized but refused as `exactness-unproven`
 * because Gmail's provider-defined semantics are not proven identical to the
 * current canonical contracts. Gmail query language and unknown/native-only
 * fields are preserved opaquely rather than guessed.
 *
 * @packageDocumentation
 */

import {
    createActionExpression,
    createCapabilityInstance,
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
 * Initial structural view of Gmail Filter API criteria.
 *
 * @remarks
 * The string index signature intentionally permits provider fields outside the
 * initial codec so they can be detected and preserved opaquely.
 */
export interface GmailFilterCriteriaNative {
    /** Gmail structured Subject phrase criterion when present. */
    readonly subject?: string;
    /** Gmail attachment criterion when present. */
    readonly hasAttachment?: boolean;
    /** Embedded Gmail search-language query. */
    readonly query?: string;
    /** Embedded Gmail search-language query that must not match. */
    readonly negatedQuery?: string;
    /** Additional Gmail/provider fields retained for opaque detection. */
    readonly [key: string]: unknown;
}

/**
 * Initial structural view of Gmail Filter API actions.
 */
export interface GmailFilterActionNative {
    /** Label IDs Gmail should add to matching messages. */
    readonly addLabelIds?: readonly string[];
    /** Label IDs Gmail should remove from matching messages. */
    readonly removeLabelIds?: readonly string[];
    /** Preconfigured forwarding destination when present. */
    readonly forward?: string;
    /** Additional Gmail/provider fields retained for opaque detection. */
    readonly [key: string]: unknown;
}

/**
 * Initial structural view of the Gmail Filter API resource.
 */
export interface GmailFilterNative {
    /** Server-assigned filter identity when reading an existing filter. */
    readonly id?: string;
    /** Criteria object controlling which messages match. */
    readonly criteria?: GmailFilterCriteriaNative;
    /** Action object applied to matching messages. */
    readonly action?: GmailFilterActionNative;
    /** Additional top-level Gmail/provider fields retained for opaque detection. */
    readonly [key: string]: unknown;
}

/**
 * Top-level Filter fields the initial codec understands structurally.
 */
const TOP_LEVEL_KEYS = new Set(["id", "criteria", "action"]);
/**
 * Criteria fields the initial codec can classify explicitly.
 */
const CRITERIA_KEYS = new Set([
    "subject",
    "hasAttachment",
    "query",
    "negatedQuery",
]);
/**
 * Action fields the initial codec can classify explicitly.
 */
const ACTION_KEYS = new Set(["addLabelIds", "removeLabelIds", "forward"]);

/**
 * Initial Gmail Filter semantic codec.
 *
 * @remarks
 * Mark-read is the only currently encoded/decoded exact semantic mapping.
 */
export const gmailFilterCodec = defineSemanticCodec<GmailFilterNative>({
    id: "gmail.filter.initial@1",
    encode: encodeGmailFilter,
    decode: decodeGmailFilter,
});

/**
 * Encodes the canonical subset currently proven exact for Gmail Filters.
 *
 * @param expression Canonical expression to encode.
 * @returns Native Filter object for exact mark-read, or structured Unsupported
 * evidence for unproven/absent mappings.
 */
function encodeGmailFilter(expression: CanonicalExpression) {
    if (
        expression.kind === "action" &&
        expression.instance.capabilityId === markReadCapability.id
    ) {
        return encodedNative({
            action: Object.freeze({
                removeLabelIds: Object.freeze(["UNREAD"]),
            }),
        });
    }

    if (containsUnprovenGmailCriterion(expression)) {
        return unsupportedRealization(
            unsupportedReason(
                "exactness-unproven",
                "Gmail exposes analogous subject/attachment criteria, but exact equivalence to the current canonical contracts is not proven.",
            ),
        );
    }

    return unsupportedRealization(
        unsupportedReason(
            "capability-absent",
            "The minimal Gmail Filter codec does not encode this canonical expression.",
        ),
    );
}

/**
 * Decodes one Gmail Filter API object into the initial canonical subset.
 *
 * @param native Gmail Filter resource candidate.
 * @returns Decoded canonical mark-read, opaque preservation, or structured
 * native-decode refusal.
 */
function decodeGmailFilter(native: GmailFilterNative) {
    if (!isRecord(native))
        return invalidNative("Expected a Gmail Filter object.");

    /** First top-level field outside the initial structural vocabulary. */
    const unknownTopLevelKey = firstUnknownKey(native, TOP_LEVEL_KEYS);

    if (unknownTopLevelKey !== undefined) {
        return opaqueNative(
            native,
            `Gmail Filter field "${unknownTopLevelKey}" is outside the initial codec.`,
        );
    }

    if (native.id !== undefined && typeof native.id !== "string")
        return invalidNative("Gmail Filter id must be a string when present.");

    /** Classification of criteria semantics before action-only decoding. */
    const criteriaResult = inspectCriteria(native.criteria);

    if (criteriaResult.kind !== "none") {
        if (criteriaResult.kind === "opaque")
            return opaqueNative(native, criteriaResult.message);

        if (criteriaResult.kind === "invalid")
            return invalidNative(criteriaResult.message);

        return unsupportedNativeDecode(
            nativeDecodeReason("exactness-unproven", criteriaResult.message),
        );
    }

    return decodeActionOnly(native, native.action);
}

/**
 * Internal classification of Gmail criteria relative to the initial semantic
 * slice.
 */
type CriteriaInspection =
    | {
          /** Criteria contain no semantic fields relevant to the initial slice. */
          readonly kind: "none";
      }
    | {
          /** Criteria are understood structurally but exact semantics are unproven. */
          readonly kind: "unproven";

          /** Human-readable exactness boundary. */
          readonly message: string;
      }
    | {
          /** Criteria must be preserved without semantic interpretation. */
          readonly kind: "opaque";

          /** Human-readable preservation boundary. */
          readonly message: string;
      }
    | {
          /** Criteria are malformed relative to the Filter API shape used here. */
          readonly kind: "invalid";

          /** Human-readable native-shape error. */
          readonly message: string;
      };

/**
 * Classifies Gmail criteria before any action-only semantic mapping is attempted.
 *
 * @remarks
 * Query strings remain opaque. Subject/hasAttachment are recognized but
 * exactness-unproven. Unknown fields are preserved opaquely.
 *
 * @param criteria Native criteria object or absence thereof.
 * @returns Internal criteria classification.
 */
function inspectCriteria(
    criteria: GmailFilterCriteriaNative | undefined,
): CriteriaInspection {
    if (criteria === undefined)
        return { kind: "none" };

    if (!isRecord(criteria)) {
        return {
            kind: "invalid",
            message: "Gmail Filter criteria must be an object when present.",
        };
    }

    /** First criteria field outside the initial structural vocabulary. */
    const unknownKey = firstUnknownKey(criteria, CRITERIA_KEYS);

    if (unknownKey !== undefined) {
        return {
            kind: "opaque",
            message: `Gmail criteria field "${unknownKey}" is outside the initial codec.`,
        };
    }

    if (criteria.query !== undefined || criteria.negatedQuery !== undefined) {
        if (
            (criteria.query !== undefined &&
                typeof criteria.query !== "string") ||
            (criteria.negatedQuery !== undefined &&
                typeof criteria.negatedQuery !== "string")
        ) {
            return {
                kind: "invalid",
                message: "Gmail query criteria must be strings when present.",
            };
        }

        return {
            kind: "opaque",
            message:
                "Gmail query/negatedQuery syntax is preserved opaquely by the initial codec.",
        };
    }

    if (
        criteria.subject !== undefined &&
        typeof criteria.subject !== "string"
    ) {
        return {
            kind: "invalid",
            message: "Gmail subject criterion must be a string when present.",
        };
    }

    if (
        criteria.hasAttachment !== undefined &&
        typeof criteria.hasAttachment !== "boolean"
    ) {
        return {
            kind: "invalid",
            message:
                "Gmail hasAttachment criterion must be boolean when present.",
        };
    }

    if (criteria.hasAttachment === false) {
        return {
            kind: "opaque",
            message:
                "Gmail hasAttachment=false is an inverse predicate not represented by the initial canonical slice.",
        };
    }

    if (criteria.subject !== undefined || criteria.hasAttachment === true) {
        return {
            kind: "unproven",
            message:
                "Gmail subject/hasAttachment criteria are understood, but exact equivalence to the current canonical contracts is not proven.",
        };
    }

    return { kind: "none" };
}

/**
 * Decodes Filter actions after criteria have been proven irrelevant to the
 * initial semantic slice.
 *
 * @param native Full native Filter object retained for opaque results.
 * @param action Native action object or absence thereof.
 * @returns Canonical mark-read only for exactly removing `UNREAD`; otherwise
 * opaque preservation or malformed-native refusal.
 */
function decodeActionOnly(
    native: GmailFilterNative,
    action: GmailFilterActionNative | undefined,
) {
    if (action === undefined) {
        return opaqueNative(
            native,
            "Gmail Filter has no initial semantic fields to decode.",
        );
    }

    if (!isRecord(action)) {
        return invalidNative(
            "Gmail Filter action must be an object when present.",
        );
    }

    /** First action field outside the initial structural vocabulary. */
    const unknownKey = firstUnknownKey(action, ACTION_KEYS);

    if (unknownKey !== undefined) {
        return opaqueNative(
            native,
            `Gmail action field "${unknownKey}" is outside the initial codec.`,
        );
    }

    if (action.addLabelIds !== undefined || action.forward !== undefined) {
        return opaqueNative(
            native,
            "Gmail addLabelIds/forward actions are outside the initial canonical slice.",
        );
    }

    if (action.removeLabelIds === undefined) {
        return opaqueNative(
            native,
            "Gmail Filter action has no initial semantic fields to decode.",
        );
    }

    if (
        !Array.isArray(action.removeLabelIds) ||
        action.removeLabelIds.some((value) => typeof value !== "string")
    ) {
        return invalidNative(
            "Gmail removeLabelIds must be an array of strings.",
        );
    }

    if (
        action.removeLabelIds.length === 1 &&
        action.removeLabelIds[0] === "UNREAD"
    ) {
        return decodedNative(
            createActionExpression(
                createCapabilityInstance(markReadCapability, null),
            ),
        );
    }

    return opaqueNative(
        native,
        "Gmail label removals beyond exactly UNREAD carry semantics outside the initial slice.",
    );
}

/**
 * Detects canonical conditions that resemble Gmail's currently recognized
 * structured criteria but whose exact equivalence is unproven.
 *
 * @param expression Canonical expression to inspect recursively.
 * @returns Whether Subject-containment or attachment-presence semantics occur.
 */
function containsUnprovenGmailCriterion(
    expression: CanonicalExpression,
): boolean {
    switch (expression.kind) {
        case "condition":
            return (
                expression.instance.capabilityId ===
                    subjectContainsCapability.id ||
                expression.instance.capabilityId === hasAttachmentCapability.id
            );
        case "action":
            return false;
        case "and":
            return expression.operands.some(containsUnprovenGmailCriterion);
        case "rule":
            return containsUnprovenGmailCriterion(expression.condition);
    }
}

/**
 * Constructs a malformed-Gmail-native decode result.
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
 * @param value Native object to inspect.
 * @param allowed Fields understood structurally by this codec stage.
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
 * @returns Whether the value can be inspected as a Gmail native object.
 */
function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
