import { describe, expect, it } from "vitest";

import {
    createActionExpression,
    createCapabilitySpecimen,
    createConditionExpression,
    markReadCapability,
    subjectContainsCapability,
} from "@mailchemy/core";

import { sieveCodec } from "../src/index.js";

describe("initial Sieve codec", () => {
    it("encodes canonical mark-read using imap4flags addflag Seen", () => {
        const expression = createActionExpression(
            createCapabilitySpecimen(markReadCapability, null),
        );

        expect(sieveCodec.encode(expression)).toEqual({
            kind: "encoded",
            native: 'require "imap4flags";\n\naddflag "\\\\Seen";\n',
        });
    });

    it("decodes the exact generated mark-read form", () => {
        expect(
            sieveCodec.decode('require "imap4flags";\naddflag "\\\\Seen";'),
        ).toEqual({
            kind: "decoded",
            expression: createActionExpression(
                createCapabilitySpecimen(markReadCapability, null),
            ),
        });
    });

    it("accepts comments and a string-list require declaration", () => {
        expect(
            sieveCodec.decode(
                '# generated elsewhere\nrequire ["fileinto", "imap4flags"];\n/* exact leaf */ addflag ["\\\\Seen"];',
            ),
        ).toMatchObject({
            kind: "decoded",
        });
    });

    it("rejects addflag without the required imap4flags declaration", () => {
        expect(sieveCodec.decode('addflag "\\\\Seen";')).toEqual({
            kind: "unsupported-native",
            reason: {
                code: "invalid-native",
                message: 'Sieve addflag requires require "imap4flags".',
            },
        });
    });

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

    it("refuses canonical Subject contains encoding until equivalence is proven", () => {
        const expression = createConditionExpression(
            createCapabilitySpecimen(subjectContainsCapability, {
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

    it("preserves unrelated Sieve constructs opaquely", () => {
        expect(sieveCodec.decode("discard;")).toEqual({
            kind: "opaque",
            native: "discard;",
            message:
                'Sieve construct is outside the minimal initial codec: statement "discard" is not implemented',
        });
    });

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
