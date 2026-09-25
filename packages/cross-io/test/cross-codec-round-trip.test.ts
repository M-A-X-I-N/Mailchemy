/**
 * Proves canonical-routed semantic preservation across every currently eligible
 * ordered pair of initial adapter codecs.
 *
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";

import { runInitialCrossCodecRoundTrips } from "../src/index.js";

/**
 * Exercises the shared Direct mark-read portability subset without introducing
 * pair-specific native converters.
 */
describe("initial cross-codec semantic round trips", () => {
    /**
     * Proves both valid mark-read fixtures survive all 12 ordered distinct codec
     * pairs, producing 24 successful semantic paths.
     */
    it("preserves meaning across every currently Direct ordered codec pair", () => {
        const run = runInitialCrossCodecRoundTrips();

        expect(run.results).toHaveLength(24);
        expect(run.passed).toBe(true);
        expect(run.results.every((result) => result.passed)).toBe(true);
    });

    /**
     * Proves the tested path set is exactly the Cartesian ordered adapter-pair
     * surface, reinforcing that portability routes through canonical IR rather
     * than bespoke source→target converters.
     */
    it("routes every path through canonical semantics rather than pair-specific converters", () => {
        const run = runInitialCrossCodecRoundTrips();
        const paths = new Set(
            run.results.map(
                (result) =>
                    result.sourceCodecId + " -> " + result.targetCodecId,
            ),
        );

        expect(paths).toEqual(
            new Set([
                "sieve.initial@1 -> gmail.filter.initial@1",
                "sieve.initial@1 -> outlook.graph.inbox-rule.initial@1",
                "sieve.initial@1 -> thunderbird.msg-filter-rules.initial@1",
                "gmail.filter.initial@1 -> sieve.initial@1",
                "gmail.filter.initial@1 -> outlook.graph.inbox-rule.initial@1",
                "gmail.filter.initial@1 -> thunderbird.msg-filter-rules.initial@1",
                "outlook.graph.inbox-rule.initial@1 -> sieve.initial@1",
                "outlook.graph.inbox-rule.initial@1 -> gmail.filter.initial@1",
                "outlook.graph.inbox-rule.initial@1 -> thunderbird.msg-filter-rules.initial@1",
                "thunderbird.msg-filter-rules.initial@1 -> sieve.initial@1",
                "thunderbird.msg-filter-rules.initial@1 -> gmail.filter.initial@1",
                "thunderbird.msg-filter-rules.initial@1 -> outlook.graph.inbox-rule.initial@1",
            ]),
        );
    });
});
