import { describe, expect, it } from "vitest";

import { runInitialCrossCodecRoundTrips } from "../src/index.js";

describe("initial cross-codec semantic round trips", () => {
  it("preserves meaning across every currently Direct ordered codec pair", () => {
    const run = runInitialCrossCodecRoundTrips();

    expect(run.results).toHaveLength(24);
    expect(run.passed).toBe(true);
    expect(run.results.every((result) => result.passed)).toBe(true);
  });

  it("routes every path through canonical semantics rather than pair-specific converters", () => {
    const run = runInitialCrossCodecRoundTrips();
    const paths = new Set(
      run.results.map(
        (result) => result.sourceCodecId + " -> " + result.targetCodecId,
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
