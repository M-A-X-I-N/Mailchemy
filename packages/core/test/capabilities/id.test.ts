/**
 * Proves canonical capability-ID parsing, construction, namespace depth,
 * malformed-input rejection, and semantic-version identity.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    InvalidCapabilityIdError,
    capabilityIdKey,
    capabilityIdParts,
    createCapabilityId,
    parseCapabilityId,
} from "@mailchemy/core";

/**
 * Exercises the stable textual identity contract for semantic capabilities.
 */
describe("CapabilityId", () => {
    /**
     * Proves canonical core IDs round-trip through parsing, keying, and
     * structured decomposition without losing namespace or version data.
     */
    it("parses and renders canonical core IDs", () => {
        const id = parseCapabilityId("core.condition.subject.contains@1");

        expect(id).toBe("core.condition.subject.contains@1");
        expect(capabilityIdKey(id)).toBe(id);
        expect(capabilityIdParts(id)).toEqual({
            segments: ["core", "condition", "subject", "contains"],
            version: 1,
        });
    });

    /**
     * Proves the identity grammar permits extension namespaces deeper than the
     * current core naming hierarchy.
     */
    it("supports extension namespaces with arbitrary depth", () => {
        const id = createCapabilityId(
            ["org", "example", "vendor", "condition", "custom-match"],
            12,
        );

        expect(id).toBe("org.example.vendor.condition.custom-match@12");
    });

    /**
     * Proves non-canonical or structurally invalid identity strings are rejected
     * rather than being normalized into a different semantic identity.
     */
    it.each([
        "",
        "core@1",
        "core.condition.subject.contains",
        "core.condition.subject.contains@0",
        "core.condition.subject.contains@01",
        "core.condition.subject.contains@1@2",
        "Core.condition.subject.contains@1",
        "core.condition.subject_contains@1",
        "core..contains@1",
        "core.condition.contains@9007199254740992",
    ])("rejects malformed ID %j", (value) => {
        expect(() => parseCapabilityId(value)).toThrow(
            InvalidCapabilityIdError,
        );
    });

    /**
     * Proves semantic version is part of registry/map identity instead of
     * metadata that can be ignored when keying a capability.
     */
    it("treats semantic version as part of identity", () => {
        const version1 = parseCapabilityId("core.condition.subject.contains@1");
        const version2 = parseCapabilityId("core.condition.subject.contains@2");

        expect(version1).not.toBe(version2);

        const keyed = new Map<string, string>([
            [capabilityIdKey(version1), "v1"],
            [capabilityIdKey(version2), "v2"],
        ]);

        expect(keyed.get(version1)).toBe("v1");
        expect(keyed.get(version2)).toBe("v2");
    });
});
