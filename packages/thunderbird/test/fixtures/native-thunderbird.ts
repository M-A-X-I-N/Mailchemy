/**
 * Defines representative Thunderbird native-text decode evidence for the
 * initial codec.
 *
 * @packageDocumentation
 */

/**
 * One native Thunderbird filter-text specimen and expected decode category.
 */
export interface NativeThunderbirdFixture {
    /** Stable fixture identity. */
    readonly id: string;
    /** Native Thunderbird filter text supplied to the codec. */
    readonly source: string;
    /** Expected top-level native decode outcome. */
    readonly expectedKind: "decoded" | "unsupported-native" | "opaque";
    /** Expected refusal category when decode yields unsupported-native. */
    readonly expectedReasonCode?:
        "invalid-native" | "semantic-unsupported" | "exactness-unproven";
}

/**
 * Representative native corpus covering exact mark-read fragments, CRLF,
 * unproven conditions, real filter envelopes, custom actions, and unknown
 * fields.
 */
export const nativeThunderbirdFixtures = Object.freeze([
    {
        id: "native.mark-read.fragment",
        source: 'action="Mark read"',
        expectedKind: "decoded",
    },
    {
        id: "native.mark-read.fragment-crlf",
        source: 'action="Mark read"\r\n',
        expectedKind: "decoded",
    },
    {
        id: "native.subject-contains-fragment",
        source: 'condition="AND (subject,contains,invoice)"',
        expectedKind: "unsupported-native",
        expectedReasonCode: "exactness-unproven",
    },
    {
        id: "native.attachment-status-fragment",
        source: 'condition="AND (has attachment status,is,has attachments)"',
        expectedKind: "unsupported-native",
        expectedReasonCode: "exactness-unproven",
    },
    {
        id: "native.real-filter-envelope-preserved",
        source: [
            'version="9"',
            'logging="no"',
            'name="Invoice reader"',
            'enabled="yes"',
            'type="17"',
            'action="Mark read"',
            'condition="AND (subject,contains,invoice)"',
        ].join("\n"),
        expectedKind: "opaque",
    },
    {
        id: "native.custom-action-preserved",
        source: [
            'action="Custom"',
            'customId="example@example.invalid#custom-action"',
            'actionValue="opaque-value"',
        ].join("\n"),
        expectedKind: "opaque",
    },
    {
        id: "native.unknown-field-preserved",
        source: 'futureThing="future-value"',
        expectedKind: "opaque",
    },
] satisfies readonly NativeThunderbirdFixture[]);
