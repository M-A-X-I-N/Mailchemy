/**
 * Implements the initial offline Thunderbird `msgFilterRules.dat` text codec,
 * including its narrow line parser and semantic-preservation boundaries.
 *
 * @remarks
 * The exact semantic slice is deliberately smaller than Thunderbird's stored
 * filter format. An isolated native `Mark read` action maps exactly to
 * canonical mark-read. Subject/attachment terms are recognized but remain
 * `exactness-unproven`. Real filter-envelope fields, trigger context,
 * custom/action-value data, and unknown constructs are preserved opaquely so
 * the codec does not silently erase Thunderbird-specific execution semantics.
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
 * Native line-oriented Thunderbird filter text accepted/produced by the initial
 * codec.
 */
export type ThunderbirdFilterNative = string;

/**
 * Parsed structural view of the line-oriented fields recognized by the initial
 * Thunderbird codec.
 */
interface ParsedThunderbirdText {
    /** Parsed file-format version field when present. */
    readonly version: string | undefined;
    /** Parsed list-level logging setting when present. */
    readonly logging: string | undefined;
    /** Human-visible filter name. */
    readonly name: string | undefined;
    /** Stored enabled-state value. */
    readonly enabled: string | undefined;
    /** Stored filter description. */
    readonly description: string | undefined;
    /** Stored Thunderbird filter-type/trigger representation. */
    readonly type: string | undefined;
    /** Native action names in serialized order. */
    readonly actions: readonly string[];
    /** Native action-value strings associated with value-bearing actions. */
    readonly actionValues: readonly string[];
    /** Extension-defined custom action/term identifiers. */
    readonly customIds: readonly string[];
    /** Serialized filter condition expression when present. */
    readonly condition: string | undefined;
    /** Unrecognized field names retained for opaque preservation. */
    readonly unknownKeys: readonly string[];
}

/**
 * Serialized Thunderbird field names the initial line parser understands
 * structurally.
 */
const KNOWN_KEYS = new Set([
    "version",
    "logging",
    "name",
    "enabled",
    "description",
    "type",
    "action",
    "actionValue",
    "customId",
    "condition",
]);

/**
 * Initial Thunderbird filter semantic codec.
 *
 * @remarks
 * Only the isolated `Mark read` action currently has an exact canonical
 * mapping. Parsing a fuller stored filter does not imply that its envelope,
 * trigger context, custom behavior, or action ordering can be dropped.
 */
export const thunderbirdFilterCodec =
    defineSemanticCodec<ThunderbirdFilterNative>({
        id: "thunderbird.msg-filter-rules.initial@1",
        encode: encodeThunderbird,
        decode: decodeThunderbird,
    });

/**
 * Encodes the canonical subset currently proven exact for Thunderbird filters.
 *
 * @param expression Canonical expression to encode.
 * @returns Native action fragment for exact mark-read, otherwise structured
 * Unsupported evidence for unproven/absent mappings.
 */
function encodeThunderbird(expression: CanonicalExpression) {
    if (
        expression.kind === "action" &&
        expression.instance.capabilityId === markReadCapability.id
    )
        return encodedNative('action="Mark read"\n');

    if (containsUnprovenThunderbirdCondition(expression)) {
        return unsupportedRealization(
            unsupportedReason(
                "exactness-unproven",
                "Thunderbird exposes analogous Subject/attachment filter conditions, but exact equivalence to the current canonical contracts is not proven.",
            ),
        );
    }

    return unsupportedRealization(
        unsupportedReason(
            "capability-absent",
            "The minimal Thunderbird filter codec does not encode this canonical expression.",
        ),
    );
}

/**
 * Parses and semantically classifies one Thunderbird filter text fragment.
 *
 * @param native Native line-oriented filter text.
 * @returns Decoded canonical mark-read, opaque preservation, or structured
 * native-decode refusal.
 */
function decodeThunderbird(native: ThunderbirdFilterNative) {
    /** Parsed line-oriented structure used after syntactic validation succeeds. */
    let parsed: ParsedThunderbirdText;

    try {
        parsed = parseThunderbirdText(native);
    } catch (error) {
        return unsupportedNativeDecode(
            nativeDecodeReason(
                "invalid-native",
                error instanceof Error
                    ? error.message
                    : "Thunderbird filter text could not be parsed.",
            ),
        );
    }

    /** First unrecognized native field requiring opaque preservation. */
    const unknownKey = parsed.unknownKeys[0];

    if (unknownKey !== undefined) {
        return opaqueNative(
            native,
            `Thunderbird filter field "${unknownKey}" is outside the initial codec.`,
        );
    }

    /** First rule-envelope/trigger field outside the initial canonical slice. */
    const envelopeField = firstEnvelopeField(parsed);

    if (envelopeField !== undefined) {
        return opaqueNative(
            native,
            `Thunderbird filter field "${envelopeField}" carries rule/store or trigger semantics outside the initial canonical slice.`,
        );
    }

    if (parsed.customIds.length > 0 || parsed.actionValues.length > 0) {
        return opaqueNative(
            native,
            "Thunderbird custom/action-value semantics are outside the initial canonical slice.",
        );
    }

    if (parsed.condition !== undefined)
        return decodeConditionFragment(native, parsed);

    if (parsed.actions.length === 1 && parsed.actions[0] === "Mark read") {
        return decodedNative(
            createActionExpression(
                createCapabilityInstance(markReadCapability, null),
            ),
        );
    }

    if (parsed.actions.length > 0) {
        return opaqueNative(
            native,
            "Thunderbird actions beyond an isolated Mark read fragment are outside the initial canonical slice.",
        );
    }

    return opaqueNative(
        native,
        "Thunderbird filter text has no initial semantic fields to decode.",
    );
}

/**
 * Classifies a parsed Thunderbird condition fragment without inventing exact
 * equivalence for native search terms.
 *
 * @remarks
 * `ALL` is preserved as a rule-level match wrapper. A narrow linear `AND`
 * term parser recognizes Subject Contains and attachment-status syntax only
 * well enough to return `exactness-unproven`; all other terms remain opaque.
 *
 * @param native Full native source retained for opaque results.
 * @param parsed Parsed Thunderbird text containing the condition.
 * @returns Exactness refusal or opaque preservation for the condition fragment.
 */
function decodeConditionFragment(
    native: ThunderbirdFilterNative,
    parsed: ParsedThunderbirdText,
) {
    /** Serialized condition text known to be present on this path. */
    const condition = parsed.condition ?? "";

    if (condition === "ALL") {
        return opaqueNative(
            native,
            "Thunderbird match-all condition is an execution wrapper not represented by the initial canonical leaf slice.",
        );
    }

    /** Narrowly parsed linear AND terms, or undefined for unsupported syntax. */
    const terms = parseLinearCondition(condition);

    if (terms === undefined) {
        return opaqueNative(
            native,
            "Thunderbird condition syntax is outside the initial parser.",
        );
    }

    if (
        terms.some(
            (term) =>
                term.field === "subject" &&
                term.operator === "contains" &&
                term.value.length > 0,
        )
    ) {
        return unsupportedNativeDecode(
            nativeDecodeReason(
                "exactness-unproven",
                "Thunderbird Subject Contains is understood, but its charset/case/normalization behavior is not proven exactly equivalent to core.condition.subject.contains@1.",
            ),
        );
    }

    if (
        terms.some(
            (term) =>
                term.field === "has attachment status" &&
                term.operator === "is",
        )
    ) {
        return unsupportedNativeDecode(
            nativeDecodeReason(
                "exactness-unproven",
                "Thunderbird attachment status is a client/message-database predicate and is not proven equivalent to core.condition.has-attachment@1.",
            ),
        );
    }

    return opaqueNative(
        native,
        "Thunderbird condition terms are outside the initial canonical slice.",
    );
}

/**
 * One normalized term from the narrow linear Thunderbird condition parser.
 */
interface ParsedConditionTerm {
    /** Lowercased Thunderbird search attribute name. */
    readonly field: string;
    /** Lowercased Thunderbird search operator name. */
    readonly operator: string;
    /** Trimmed serialized term value. */
    readonly value: string;
}

/**
 * Parses the deliberately narrow `AND (field,operator,value)` condition form
 * needed to identify initial Subject/attachment evidence.
 *
 * @param condition Serialized Thunderbird condition text.
 * @returns Ordered normalized terms when the entire source matches the narrow
 * grammar; otherwise undefined.
 */
function parseLinearCondition(
    condition: string,
): readonly ParsedConditionTerm[] | undefined {
    if (!condition.startsWith("AND "))
        return undefined;

    /** Condition body after the required leading `AND ` marker. */
    const source = condition.slice(4).trim();
    /** Parenthesized term matches found in source order. */
    const matches = [...source.matchAll(/\(([^,]+),([^,]+),([^)]*)\)/gu)];

    if (matches.length === 0)
        return undefined;

    /** Reconstructed matched source used to reject partially parsed syntax. */
    const consumed = matches.map((match) => match[0]).join(" ");
    /** Whitespace-normalized source used only for full-consumption comparison. */
    const normalizedSource = source.replace(/\s+/gu, " ").trim();

    if (consumed !== normalizedSource)
        return undefined;

    return matches.map((match) => ({
        field: (match[1] ?? "").trim().toLowerCase(),
        operator: (match[2] ?? "").trim().toLowerCase(),
        value: (match[3] ?? "").trim(),
    }));
}

/**
 * Finds the first stored rule-envelope/trigger field whose semantics are outside
 * the initial leaf-oriented canonical slice.
 *
 * @param parsed Parsed Thunderbird text.
 * @returns Field name requiring opaque preservation, if any.
 */
function firstEnvelopeField(parsed: ParsedThunderbirdText): string | undefined {
    if (parsed.name !== undefined)
        return "name";

    if (parsed.enabled !== undefined)
        return "enabled";

    if (parsed.type !== undefined)
        return "type";

    if (parsed.description !== undefined)
        return "description";

    return undefined;
}

/**
 * Parses Thunderbird's line-oriented quoted key/value representation used by
 * the initial codec.
 *
 * @remarks
 * The parser accepts repeated action/actionValue/customId fields but requires
 * singleton fields to appear at most once. It is intentionally not a full
 * compatibility parser for every historical Thunderbird filter format.
 *
 * @param source Native filter text.
 * @returns Parsed recognized fields plus unknown field names.
 * @throws Error For malformed lines or repeated singleton fields.
 */
function parseThunderbirdText(source: string): ParsedThunderbirdText {
    /** Parsed values grouped by serialized field name in encounter order. */
    const values = new Map<string, string[]>();

    for (const rawLine of source.split(/\r?\n/u)) {
        const line = rawLine.trim();

        if (line.length === 0)
            continue;

        /** Key/quoted-value parse result for one non-empty native line. */
        const match = /^([^=]+)="((?:[^"\\]|\\.)*)"$/u.exec(line);

        if (match === null)
            throw new Error(`Invalid Thunderbird filter line: ${line}`);

        /** Trimmed serialized field name. */
        const key = (match[1] ?? "").trim();
        /** Decoded quoted field value. */
        const value = unescapeQuotedValue(match[2] ?? "");
        /** Previously parsed occurrences for this field, if any. */
        const existing = values.get(key);

        if (existing === undefined)
            values.set(key, [value]);
        else
            existing.push(value);

    }

    /**
     * Retrieves one field that must occur at most once in the initial parser.
     *
     * @param key Serialized field name.
     * @returns Sole parsed value, or undefined when absent.
     * @throws Error When the field repeats.
     */
    const singleton = (key: string): string | undefined => {
        const entries = values.get(key);

        if (entries === undefined)
            return undefined;

        if (entries.length !== 1) {
            throw new Error(
                `Thunderbird filter field "${key}" must not repeat in the initial parser.`,
            );
        }

        return entries[0];
    };

    return {
        version: singleton("version"),
        logging: singleton("logging"),
        name: singleton("name"),
        enabled: singleton("enabled"),
        description: singleton("description"),
        type: singleton("type"),
        actions: Object.freeze([...(values.get("action") ?? [])]),
        actionValues: Object.freeze([...(values.get("actionValue") ?? [])]),
        customIds: Object.freeze([...(values.get("customId") ?? [])]),
        condition: singleton("condition"),
        unknownKeys: Object.freeze(
            [...values.keys()].filter((key) => !KNOWN_KEYS.has(key)),
        ),
    };
}

/**
 * Decodes backslash escapes inside one Thunderbird quoted field value.
 *
 * @param value Raw quoted-string body without surrounding quotes.
 * @returns Value with each backslash escape reduced to its escaped character.
 * @throws Error When the value ends with a dangling escape character.
 */
function unescapeQuotedValue(value: string): string {
    /** Incrementally decoded field value. */
    let result = "";

    for (let index = 0; index < value.length; index += 1) {
        /** Current raw character under inspection. */
        const character = value.charAt(index);

        if (character !== "\\") {
            result += character;
            continue;
        }

        /** Character escaped by a backslash at the current offset. */
        const escaped = value[index + 1];

        if (escaped === undefined) {
            throw new Error(
                "Thunderbird quoted value ends with an escape character.",
            );
        }

        result += escaped;
        index += 1;
    }

    return result;
}

/**
 * Detects canonical conditions that resemble Thunderbird terms whose exact
 * equivalence remains unproven.
 *
 * @param expression Canonical expression to inspect recursively.
 * @returns Whether Subject-containment or attachment-presence semantics occur.
 */
function containsUnprovenThunderbirdCondition(
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
            return expression.operands.some(
                containsUnprovenThunderbirdCondition,
            );
        case "rule":
            return containsUnprovenThunderbirdCondition(expression.condition);
    }
}
