/**
 * Proves the initial Sieve codec's exact mark-read mapping, narrow parser
 * coverage, exactness refusals, opaque preservation, and malformed-input
 * diagnostics.
 *
 * @remarks
 * These tests exercise Sieve text representation only. They do not establish
 * whether any concrete ManageSieve endpoint advertises the extensions used.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    createActionExpression,
    createCapabilityInstance,
    createConditionExpression,
    markReadCapability,
    subjectContainsCapability,
} from "@mailchemy/core";

import { sieveCodec } from "../src/index.js";

/**
 * Exercises the initial offline Sieve codec and parser boundaries.
 */
describe("initial Sieve codec", () => {
    /**
     * Proves canonical mark-read encodes to the exact initial `imap4flags`
     * `addflag \Seen` representation.
     */
    it("encodes canonical mark-read using imap4flags addflag Seen", () => {
        const expression = createActionExpression(
            createCapabilityInstance(markReadCapability, null),
        );

        expect(sieveCodec.encode(expression)).toEqual({
            kind: "encoded",
            native: 'require "imap4flags";\n\naddflag "\\\\Seen";\n',
        });
    });

    /**
     * Proves the generated mark-read representation decodes back to the
     * canonical action.
     */
    it("decodes the exact generated mark-read form", () => {
        expect(
            sieveCodec.decode('require "imap4flags";\naddflag "\\\\Seen";'),
        ).toEqual({
            kind: "decoded",
            expression: createActionExpression(
                createCapabilityInstance(markReadCapability, null),
            ),
        });
    });

    /**
     * Proves comments and equivalent string-list `require` syntax do not alter
     * the supported mark-read semantic mapping.
     */
    it("accepts comments and a string-list require declaration", () => {
        expect(
            sieveCodec.decode(
                '# generated elsewhere\nrequire ["fileinto", "imap4flags"];\n/* exact leaf */ addflag ["\\\\Seen"];',
            ),
        ).toMatchObject({
            kind: "decoded",
        });
    });

    /**
     * Proves recognized `addflag` syntax is invalid for this script when the
     * required `imap4flags` extension declaration is absent.
     */
    it("rejects addflag without the required imap4flags declaration", () => {
        expect(sieveCodec.decode('addflag "\\\\Seen";')).toEqual({
            kind: "unsupported-native",
            reason: {
                code: "invalid-native",
                message: 'Sieve addflag requires require "imap4flags".',
            },
        });
    });

    /**
     * Proves adding `\Seen` together with another flag is not collapsed into
     * canonical mark-read because the native mutation has additional semantics.
     */
    it("does not confuse adding other flags with canonical mark-read", () => {
        expect(
            sieveCodec.decode(
                'require "imap4flags"; addflag ["\\\\Seen", "\\\\Flagged"];',
            ),
        ).toMatchObject({
            kind: "unsupported-native",
            reason: {
                code: "semantic-unsupported",
            },
        });
    });

    /**
     * Proves native Subject `:contains` syntax can be parsed while semantic
     * decoding still refuses the unproven comparator/normalization equivalence.
     */
    it("understands Subject contains syntax but refuses an unproven exact mapping", () => {
        const native =
            'require "imap4flags"; if header :contains "Subject" "invoice" { addflag "\\\\Seen"; }';

        expect(sieveCodec.decode(native)).toMatchObject({
            kind: "unsupported-native",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves parsing `allof` structure does not manufacture exactness for
     * contained Subject predicates whose mapping remains unproven.
     */
    it("understands allof structure without manufacturing canonical exactness", () => {
        const native =
            'require "imap4flags"; if allof (header :contains "Subject" "invoice", header :contains :comparator "i;ascii-casemap" "Subject" "paid") { addflag "\\\\Seen"; }';

        expect(sieveCodec.decode(native)).toMatchObject({
            kind: "unsupported-native",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves canonical Subject containment is refused at encode time with
     * `exactness-unproven` rather than being emitted as superficially similar
     * Sieve syntax.
     */
    it("refuses canonical Subject contains encoding until equivalence is proven", () => {
        const expression = createConditionExpression(
            createCapabilityInstance(subjectContainsCapability, {
                needle: "invoice",
            }),
        );

        expect(sieveCodec.encode(expression)).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    /**
     * Proves valid-looking constructs outside the initial parser/mapping subset
     * are preserved opaquely instead of being misclassified as invalid native
     * input or decoded semantics.
     */
    it("preserves unrelated Sieve constructs opaquely", () => {
        expect(sieveCodec.decode("discard;")).toEqual({
            kind: "opaque",
            native: "discard;",
            message:
                'Sieve construct is outside the minimal initial codec: statement "discard" is not implemented',
        });
    });

    /**
     * Proves malformed syntax inside the recognized subset is distinguished from
     * unsupported-but-preservable constructs.
     */
    it("reports malformed supported syntax as invalid native input", () => {
        expect(
            sieveCodec.decode('require "imap4flags"; addflag "\\\\Seen"'),
        ).toMatchObject({
            kind: "unsupported-native",
            reason: {
                code: "invalid-native",
            },
        });
    });
});
