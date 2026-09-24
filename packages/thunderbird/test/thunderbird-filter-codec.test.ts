import { describe, expect, it } from "vitest";

import {
    createActionExpression,
    createCapabilitySpecimen,
    createConditionExpression,
    markReadCapability,
    subjectContainsCapability,
} from "@mailchemy/core";

import { thunderbirdFilterCodec } from "../src/index.js";

function markRead() {
    return createActionExpression(
        createCapabilitySpecimen(markReadCapability, null),
    );
}

describe("initial Thunderbird filter codec", () => {
    it("encodes canonical mark-read as a native Mark read action fragment", () => {
        expect(thunderbirdFilterCodec.encode(markRead())).toEqual({
            kind: "encoded",
            native: 'action="Mark read"\n',
        });
    });

    it("decodes an isolated Mark read action fragment", () => {
        expect(thunderbirdFilterCodec.decode('action="Mark read"')).toEqual({
            kind: "decoded",
            expression: markRead(),
        });
    });

    it("understands Subject Contains condition syntax but keeps exactness unproven", () => {
        expect(
            thunderbirdFilterCodec.decode(
                'condition="AND (subject,contains,invoice)"',
            ),
        ).toMatchObject({
            kind: "unsupported-native",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    it("understands attachment-status condition syntax but keeps MIME exactness unproven", () => {
        expect(
            thunderbirdFilterCodec.decode(
                'condition="AND (has attachment status,is,has attachments)"',
            ),
        ).toMatchObject({
            kind: "unsupported-native",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    it("preserves real filter trigger/envelope metadata opaquely", () => {
        const native = [
            'version="9"',
            'logging="no"',
            'name="Mailchemy fixture"',
            'enabled="yes"',
            'type="17"',
            'action="Mark read"',
            'condition="AND (subject,contains,invoice)"',
        ].join("\n");

        expect(thunderbirdFilterCodec.decode(native)).toMatchObject({
            kind: "opaque",
        });
    });

    it("preserves custom actions opaquely", () => {
        expect(
            thunderbirdFilterCodec.decode(
                [
                    'action="Custom"',
                    'customId="example@example.invalid#action"',
                ].join("\n"),
            ),
        ).toMatchObject({
            kind: "opaque",
        });
    });

    it("refuses canonical Subject encoding until comparison semantics are proven", () => {
        const expression = createConditionExpression(
            createCapabilitySpecimen(subjectContainsCapability, {
                needle: "invoice",
            }),
        );

        expect(thunderbirdFilterCodec.encode(expression)).toMatchObject({
            kind: "unsupported",
            reason: {
                code: "exactness-unproven",
            },
        });
    });

    it("preserves unknown native fields opaquely", () => {
        expect(
            thunderbirdFilterCodec.decode('vendorThing="mystery"'),
        ).toMatchObject({
            kind: "opaque",
        });
    });

    it("reports malformed line-oriented syntax explicitly", () => {
        expect(
            thunderbirdFilterCodec.decode('action="Mark read'),
        ).toMatchObject({
            kind: "unsupported-native",
            reason: {
                code: "invalid-native",
            },
        });
    });
});
