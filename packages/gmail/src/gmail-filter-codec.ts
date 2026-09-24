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

export interface GmailFilterCriteriaNative {
  readonly subject?: string;
  readonly hasAttachment?: boolean;
  readonly query?: string;
  readonly negatedQuery?: string;
  readonly [key: string]: unknown;
}

export interface GmailFilterActionNative {
  readonly addLabelIds?: readonly string[];
  readonly removeLabelIds?: readonly string[];
  readonly forward?: string;
  readonly [key: string]: unknown;
}

export interface GmailFilterNative {
  readonly id?: string;
  readonly criteria?: GmailFilterCriteriaNative;
  readonly action?: GmailFilterActionNative;
  readonly [key: string]: unknown;
}

const TOP_LEVEL_KEYS = new Set(["id", "criteria", "action"]);
const CRITERIA_KEYS = new Set([
  "subject",
  "hasAttachment",
  "query",
  "negatedQuery",
]);
const ACTION_KEYS = new Set(["addLabelIds", "removeLabelIds", "forward"]);

export const gmailFilterCodec = defineSemanticCodec<GmailFilterNative>({
  id: "gmail.filter.initial@1",
  encode: encodeGmailFilter,
  decode: decodeGmailFilter,
});

function encodeGmailFilter(expression: CanonicalExpression) {
  if (
    expression.kind === "action" &&
    expression.specimen.capabilityId === markReadCapability.id
  ) {
    return encodedNative({
      action: Object.freeze({
        removeLabelIds: Object.freeze(["UNREAD"]),
      }),
    });
  }

  if (containsInitialGmailCriterion(expression)) {
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

function decodeGmailFilter(native: GmailFilterNative) {
  if (!isRecord(native)) {
    return invalidNative("Expected a Gmail Filter object.");
  }

  const unknownTopLevelKey = firstUnknownKey(native, TOP_LEVEL_KEYS);

  if (unknownTopLevelKey !== undefined) {
    return opaqueNative(
      native,
      `Gmail Filter field "${unknownTopLevelKey}" is outside the initial codec.`,
    );
  }

  if (native.id !== undefined && typeof native.id !== "string") {
    return invalidNative("Gmail Filter id must be a string when present.");
  }

  const criteriaResult = inspectCriteria(native.criteria);

  if (criteriaResult.kind !== "none") {
    if (criteriaResult.kind === "opaque") {
      return opaqueNative(native, criteriaResult.message);
    }

    if (criteriaResult.kind === "invalid") {
      return invalidNative(criteriaResult.message);
    }

    return unsupportedNativeDecode(
      nativeDecodeReason("exactness-unproven", criteriaResult.message),
    );
  }

  return decodeActionOnly(native, native.action);
}

type CriteriaInspection =
  | { readonly kind: "none" }
  | { readonly kind: "unproven"; readonly message: string }
  | { readonly kind: "opaque"; readonly message: string }
  | { readonly kind: "invalid"; readonly message: string };

function inspectCriteria(
  criteria: GmailFilterCriteriaNative | undefined,
): CriteriaInspection {
  if (criteria === undefined) {
    return { kind: "none" };
  }

  if (!isRecord(criteria)) {
    return {
      kind: "invalid",
      message: "Gmail Filter criteria must be an object when present.",
    };
  }

  const unknownKey = firstUnknownKey(criteria, CRITERIA_KEYS);

  if (unknownKey !== undefined) {
    return {
      kind: "opaque",
      message: `Gmail criteria field "${unknownKey}" is outside the initial codec.`,
    };
  }

  if (criteria.query !== undefined || criteria.negatedQuery !== undefined) {
    if (
      (criteria.query !== undefined && typeof criteria.query !== "string") ||
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

  if (criteria.subject !== undefined && typeof criteria.subject !== "string") {
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
      message: "Gmail hasAttachment criterion must be boolean when present.",
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
    return invalidNative("Gmail Filter action must be an object when present.");
  }

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
    return invalidNative("Gmail removeLabelIds must be an array of strings.");
  }

  if (
    action.removeLabelIds.length === 1 &&
    action.removeLabelIds[0] === "UNREAD"
  ) {
    return decodedNative(
      createActionExpression(
        createCapabilitySpecimen(markReadCapability, null),
      ),
    );
  }

  return opaqueNative(
    native,
    "Gmail label removals beyond exactly UNREAD carry semantics outside the initial slice.",
  );
}

function containsInitialGmailCriterion(
  expression: CanonicalExpression,
): boolean {
  switch (expression.kind) {
    case "condition":
      return (
        expression.specimen.capabilityId === subjectContainsCapability.id ||
        expression.specimen.capabilityId === hasAttachmentCapability.id
      );
    case "action":
      return false;
    case "and":
      return expression.operands.some(containsInitialGmailCriterion);
    case "rule":
      return containsInitialGmailCriterion(expression.condition);
  }
}

function invalidNative(message: string) {
  return unsupportedNativeDecode(nativeDecodeReason("invalid-native", message));
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
