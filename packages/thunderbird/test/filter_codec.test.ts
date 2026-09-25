/**
 * Proves the initial Thunderbird filter codec's exact mark-read fragment,
 * recognized-but-unproven conditions, envelope/custom preservation, and
 * malformed-line handling.
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

import { thunderbirdFilterCodec } from "../src/index.js";

/**
 * Builds canonical mark-read for codec expectations.
 *
 * @returns Canonical mark-read action.
 */
function markRead() {
    return createActionExpression(
        createCapabilityInstance(markReadCapability, null),
    );
}

/**
 * Exercises the offline Thunderbird text codec independently of profile/file
 * deployment or trigger execution.
 */
describe("initial Thunderbird filter codec", () => {
    /**
     * Proves canonical mark-read encodes as the isolated native `Mark read`
     * action fragment.
     */
    it("encodes canonical mark-read as a native Mark read action fragment", () => {
        expect(thunderbirdFilterCodec.encode(markRead())).toEqual({
            kind: "encoded",
            native: 'action="Mark read"\n',
        });
    });

    /**
     * Proves the isolated native `Mark read` action fragment decodes to the
     * canonical mark-read action.
     */
    it("decodes an isolated Mark read action fragment", () => {
        expect(thunderbirdFilterCodec.decode('action="Mark read"')).toEqual({
            kind: "decoded",
            expression: markRead(),
        });
    });

    /**
     * Proves Thunderbird Subject Contains syntax is recognized while charset,
     * case, and normalization equivalence remain unproven.
     */
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

    /**
     * Proves Thunderbird attachment-status syntax is recognized without claiming
     * equivalence to the canonical explicit MIME-disposition definition.
     */
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

    /**
     * Proves real stored-filter envelope/trigger fields prevent collapse to a
     * leaf semantic fragment because they carry execution/store semantics.
     */
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

    /**
     * Proves extension-defined custom IDs/action values are preserved rather
     * than guessed into core semantics.
     */
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

    /**
     * Proves canonical Subject containment remains `exactness-unproven` at
     * encode time despite analogous Thunderbird filter syntax.
     */
    it("refuses canonical Subject encoding until comparison semantics are proven", () => {
        const expression = createConditionExpression(
            createCapabilityInstance(subjectContainsCapability, {
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

    /**
     * Proves unknown serialized fields are retained opaquely rather than dropped.
     */
    it("preserves unknown native fields opaquely", () => {
        expect(
            thunderbirdFilterCodec.decode('vendorThing="mystery"'),
        ).toMatchObject({
            kind: "opaque",
        });
    });

    /**
     * Proves malformed quoted line syntax yields `invalid-native` rather than
     * opaque preservation or semantic decoding.
     */
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
