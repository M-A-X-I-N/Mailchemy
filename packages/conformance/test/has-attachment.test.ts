import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    evaluateHasAttachment,
    hasAttachmentCapability,
} from "@mailchemy/core";
import {
    hasAttachmentFixtures,
    runCapabilityContractTests,
} from "@mailchemy/conformance";

describe("core.condition.has-attachment@1", () => {
    it("satisfies its canonical contract fixture suite", () => {
        const registry = new CapabilityRegistry();
        registry.register(hasAttachmentCapability);

        const result = runCapabilityContractTests(
            registry,
            hasAttachmentFixtures,
            {
                oracles: new Map([
                    [
                        hasAttachmentCapability.id,
                        (fixture) => {
                            const entities = fixture.oracle?.entities;
                            const expectedMatch = fixture.oracle?.expectedMatch;

                            if (
                                !Array.isArray(entities) ||
                                typeof expectedMatch !== "boolean"
                            ) {
                                return {
                                    passed: false,
                                    message:
                                        "Attachment fixture oracle metadata is malformed.",
                                };
                            }

                            const parsed = entities.map((entity) => {
                                if (
                                    typeof entity !== "object" ||
                                    entity === null ||
                                    !("dispositionType" in entity) ||
                                    !("isMultipart" in entity) ||
                                    (entity.dispositionType !== null &&
                                        typeof entity.dispositionType !==
                                            "string") ||
                                    typeof entity.isMultipart !== "boolean"
                                )
                                    return null;

                                return {
                                    dispositionType: entity.dispositionType,
                                    isMultipart: entity.isMultipart,
                                };
                            });

                            if (parsed.some((entity) => entity === null)) {
                                return {
                                    passed: false,
                                    message:
                                        "Attachment fixture entity metadata is malformed.",
                                };
                            }

                            const actual = evaluateHasAttachment(
                                parsed as {
                                    readonly dispositionType: string | null;
                                    readonly isMultipart: boolean;
                                }[],
                            );

                            return {
                                passed: actual === expectedMatch,
                                message:
                                    "Evaluated has-attachment@1 semantic oracle.",
                            };
                        },
                    ],
                ]),
            },
        );

        expect(result.passed).toBe(true);
        expect(result.coverage).toEqual([
            {
                capabilityId: hasAttachmentCapability.id,
                validFixtureCount: 6,
                invalidFixtureCount: 1,
                passed: true,
            },
        ]);
    });
});
