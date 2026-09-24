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

export type ThunderbirdFilterNative = string;

interface ParsedThunderbirdText {
    readonly version: string | undefined;
    readonly logging: string | undefined;
    readonly name: string | undefined;
    readonly enabled: string | undefined;
    readonly description: string | undefined;
    readonly type: string | undefined;
    readonly actions: readonly string[];
    readonly actionValues: readonly string[];
    readonly customIds: readonly string[];
    readonly condition: string | undefined;
    readonly unknownKeys: readonly string[];
}

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

export const thunderbirdFilterCodec =
    defineSemanticCodec<ThunderbirdFilterNative>({
        id: "thunderbird.msg-filter-rules.initial@1",
        encode: encodeThunderbird,
        decode: decodeThunderbird,
    });

function encodeThunderbird(expression: CanonicalExpression) {
    if (
        expression.kind === "action" &&
        expression.specimen.capabilityId === markReadCapability.id
    ) {
        return encodedNative('action="Mark read"\n');
    }

    if (containsInitialThunderbirdCondition(expression)) {
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

function decodeThunderbird(native: ThunderbirdFilterNative) {
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

    const unknownKey = parsed.unknownKeys[0];

    if (unknownKey !== undefined) {
        return opaqueNative(
            native,
            `Thunderbird filter field "${unknownKey}" is outside the initial codec.`,
        );
    }

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

    if (parsed.condition !== undefined) {
        return decodeConditionFragment(native, parsed);
    }

    if (parsed.actions.length === 1 && parsed.actions[0] === "Mark read") {
        return decodedNative(
            createActionExpression(
                createCapabilitySpecimen(markReadCapability, null),
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

function decodeConditionFragment(
    native: ThunderbirdFilterNative,
    parsed: ParsedThunderbirdText,
) {
    const condition = parsed.condition ?? "";

    if (condition === "ALL") {
        return opaqueNative(
            native,
            "Thunderbird match-all condition is an execution wrapper not represented by the initial canonical leaf slice.",
        );
    }

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

interface ParsedConditionTerm {
    readonly field: string;
    readonly operator: string;
    readonly value: string;
}

function parseLinearCondition(
    condition: string,
): readonly ParsedConditionTerm[] | undefined {
    if (!condition.startsWith("AND ")) {
        return undefined;
    }

    const source = condition.slice(4).trim();
    const matches = [...source.matchAll(/\(([^,]+),([^,]+),([^)]*)\)/gu)];

    if (matches.length === 0) {
        return undefined;
    }

    const consumed = matches.map((match) => match[0]).join(" ");
    const normalizedSource = source.replace(/\s+/gu, " ").trim();

    if (consumed !== normalizedSource) {
        return undefined;
    }

    return matches.map((match) => ({
        field: (match[1] ?? "").trim().toLowerCase(),
        operator: (match[2] ?? "").trim().toLowerCase(),
        value: (match[3] ?? "").trim(),
    }));
}

function firstEnvelopeField(parsed: ParsedThunderbirdText): string | undefined {
    if (parsed.name !== undefined) {
        return "name";
    }

    if (parsed.enabled !== undefined) {
        return "enabled";
    }

    if (parsed.type !== undefined) {
        return "type";
    }

    if (parsed.description !== undefined) {
        return "description";
    }

    return undefined;
}

function parseThunderbirdText(source: string): ParsedThunderbirdText {
    const values = new Map<string, string[]>();

    for (const rawLine of source.split(/\r?\n/u)) {
        const line = rawLine.trim();

        if (line.length === 0) {
            continue;
        }

        const match = /^([^=]+)="((?:[^"\\]|\\.)*)"$/u.exec(line);

        if (match === null) {
            throw new Error(`Invalid Thunderbird filter line: ${line}`);
        }

        const key = (match[1] ?? "").trim();
        const value = unescapeQuotedValue(match[2] ?? "");
        const existing = values.get(key);

        if (existing === undefined) {
            values.set(key, [value]);
        } else {
            existing.push(value);
        }
    }

    const singleton = (key: string): string | undefined => {
        const entries = values.get(key);

        if (entries === undefined) {
            return undefined;
        }

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

function unescapeQuotedValue(value: string): string {
    let result = "";

    for (let index = 0; index < value.length; index += 1) {
        const character = value.charAt(index);

        if (character !== "\\") {
            result += character;
            continue;
        }

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

function containsInitialThunderbirdCondition(
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
            return expression.operands.some(
                containsInitialThunderbirdCondition,
            );
        case "rule":
            return containsInitialThunderbirdCondition(expression.condition);
    }
}
