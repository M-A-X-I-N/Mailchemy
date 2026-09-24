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

export interface OutlookMessageRulePredicatesNative {
    readonly subjectContains?: readonly string[];
    readonly hasAttachments?: boolean;
    readonly [key: string]: unknown;
}

export interface OutlookMessageRuleActionsNative {
    readonly markAsRead?: boolean;
    readonly stopProcessingRules?: boolean;
    readonly [key: string]: unknown;
}

export interface OutlookMessageRuleNative {
    readonly id?: string;
    readonly displayName?: string;
    readonly sequence?: number;
    readonly isEnabled?: boolean;
    readonly hasError?: boolean;
    readonly isReadOnly?: boolean;
    readonly conditions?: OutlookMessageRulePredicatesNative;
    readonly exceptions?: OutlookMessageRulePredicatesNative;
    readonly actions?: OutlookMessageRuleActionsNative;
    readonly [key: string]: unknown;
}

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
const CONDITION_KEYS = new Set(["subjectContains", "hasAttachments"]);
const ACTION_KEYS = new Set(["markAsRead", "stopProcessingRules"]);

export const outlookInboxRuleCodec =
    defineSemanticCodec<OutlookMessageRuleNative>({
        id: "outlook.graph.inbox-rule.initial@1",
        encode: encodeOutlookRule,
        decode: decodeOutlookRule,
    });

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

function decodeOutlookRule(native: OutlookMessageRuleNative) {
    if (!isRecord(native))
        return invalidNative("Expected an Outlook messageRule object.");

    const unknownTopLevelKey = firstUnknownKey(native, TOP_LEVEL_KEYS);

    if (unknownTopLevelKey !== undefined) {
        return opaqueNative(
            native,
            `Outlook messageRule field "${unknownTopLevelKey}" is outside the initial codec.`,
        );
    }

    const structuralMessage = inspectUnmodeledRuleStructure(native);

    if (structuralMessage !== undefined)
        return opaqueNative(native, structuralMessage);

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

type ConditionInspection =
    | { readonly kind: "none" }
    | { readonly kind: "unproven"; readonly message: string }
    | { readonly kind: "opaque"; readonly message: string }
    | { readonly kind: "invalid"; readonly message: string };

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

function invalidNative(message: string) {
    return unsupportedNativeDecode(
        nativeDecodeReason("invalid-native", message),
    );
}

function firstUnknownKey(
    value: Readonly<Record<string, unknown>>,
    allowed: ReadonlySet<string>,
): string | undefined {
    return Object.keys(value).find((key) => !allowed.has(key));
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
