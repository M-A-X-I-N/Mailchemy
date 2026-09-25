/**
 * Defines representative native Sieve decode evidence for the initial codec.
 *
 * @packageDocumentation
 */

/**
 * One native Sieve source specimen and its expected decode evidence category.
 */
export interface NativeSieveFixture {
    /** Stable fixture identity. */
    readonly id: string;
    /** Native Sieve source text supplied to the codec. */
    readonly source: string;
    /** Expected top-level native decode outcome. */
    readonly expectedKind: "decoded" | "unsupported-native" | "opaque";
    /** Expected refusal category when the decode outcome is unsupported-native. */
    readonly expectedReasonCode?:
        "invalid-native" | "semantic-unsupported" | "exactness-unproven";
}

/**
 * Representative initial native Sieve corpus covering exact mark-read,
 * syntactic variation, unproven Subject exactness, and opaque preservation.
 */
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
