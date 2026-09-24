export interface NativeSieveFixture {
    readonly id: string;
    readonly source: string;
    readonly expectedKind: "decoded" | "unsupported-native" | "opaque";
    readonly expectedReasonCode?:
        "invalid-native" | "semantic-unsupported" | "exactness-unproven";
}

export const nativeSieveFixtures = Object.freeze([
    {
        id: "native.mark-read.minimal",
        source: 'require "imap4flags"; addflag "\\\\Seen";',
        expectedKind: "decoded",
    },
    {
        id: "native.mark-read.require-list-and-comments",
        source: '# native fixture\nrequire ["fileinto", "imap4flags"];\n/* flag leaf */ addflag ["\\\\Seen"];',
        expectedKind: "decoded",
    },
    {
        id: "native.subject-contains.default-comparator",
        source: 'require "imap4flags"; if header :contains "Subject" "invoice" { addflag "\\\\Seen"; }',
        expectedKind: "unsupported-native",
        expectedReasonCode: "exactness-unproven",
    },
    {
        id: "native.unrelated-discard",
        source: "discard;",
        expectedKind: "opaque",
    },
] satisfies readonly NativeSieveFixture[]);
