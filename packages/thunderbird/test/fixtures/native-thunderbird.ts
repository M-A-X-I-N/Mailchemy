export interface NativeThunderbirdFixture {
    readonly id: string;
    readonly source: string;
    readonly expectedKind: "decoded" | "unsupported-native" | "opaque";
    readonly expectedReasonCode?:
        "invalid-native" | "semantic-unsupported" | "exactness-unproven";
}

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
