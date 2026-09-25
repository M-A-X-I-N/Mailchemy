/**
 * Proves the canonical mark-read fixture family against the pure read-state
 * transition oracle and its idempotence boundary.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import {
    CapabilityRegistry,
    applyMarkRead,
    markReadCapability,
} from "@mailchemy/core";
import {
    markReadFixtures,
    runCapabilityContractTests,
} from "@mailchemy/conformance";

/**
 * Exercises canonical mark-read state semantics only; continuation/provider
 * execution behavior is outside this evidence surface.
 */
describe("core.action.mark-read@1", () => {
    /**
     * Proves valid/invalid mark-read fixtures agree with canonical validation and
     * the state-transition oracle while satisfying boundary coverage.
     */
    it("satisfies its canonical contract fixture suite", () => {
        const registry = new CapabilityRegistry();
        registry.register(markReadCapability);

        const result = runCapabilityContractTests(registry, markReadFixtures, {
            oracles: new Map([
                [
                    markReadCapability.id,
                    (fixture) => {
                        const previousReadState =
                            fixture.oracle?.previousReadState;
                        const expectedReadState =
                            fixture.oracle?.expectedReadState;

                        if (
                            typeof previousReadState !== "boolean" ||
                            expectedReadState !== true
                        ) {
                            return {
                                passed: false,
                                message:
                                    "mark-read fixture oracle metadata is malformed.",
                            };
                        }

                        return {
                            passed:
                                applyMarkRead(previousReadState) ===
                                expectedReadState,
                            message:
                                "Evaluated mark-read@1 state transition oracle.",
                        };
                    },
                ],
            ]),
        });

        expect(result.passed).toBe(true);
        expect(result.coverage).toEqual([
            {
                capabilityId: markReadCapability.id,
                validFixtureCount: 2,
                invalidFixtureCount: 1,
                passed: true,
            },
        ]);
    });

    /**
     * Proves repeated application converges on/read state true for both possible
     * canonical input states.
     */
    it("is idempotent over canonical read state", () => {
        expect(applyMarkRead(false)).toBe(true);
        expect(applyMarkRead(true)).toBe(true);
        expect(applyMarkRead(applyMarkRead(false))).toBe(true);
    });
});
