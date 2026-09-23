# Research

This directory contains Mailchemy's **evidence and investigations**: what native rule systems actually do, how their constructs behave, and where their semantics are documented or remain uncertain.

It is deliberately separate from [`../docs/`](../docs/).

- `research/` asks **what is true about the systems Mailchemy wants to interoperate with?**
- `docs/` owns **what Mailchemy has decided or currently believes about its own architecture and terminology.**

Research findings may justify later changes to architecture documentation, but an investigation does not silently become project architecture merely because it exists.

## Current methodology

- [`SEMANTIC_SURVEY_METHOD.md`](SEMANTIC_SURVEY_METHOD.md) — common scope, evidence rules, comparison dimensions, and document template for the initial per-system semantic-surface surveys.
- [`CONTROL_FLOW_INVESTIGATION_METHOD.md`](CONTROL_FLOW_INVESTIGATION_METHOD.md) — trace-oriented contract for comparing rule order, action order, mutation visibility, stop behavior, delivery lifecycle, and other execution semantics.

## Current semantic-surface surveys

These are individual native-system investigations performed under [`SEMANTIC_SURVEY_METHOD.md`](SEMANTIC_SURVEY_METHOD.md). They are evidence inputs, not the cross-system synthesis.

- [`SIEVE_SEMANTIC_SURVEY.md`](SIEVE_SEMANTIC_SURVEY.md) — standardized Sieve baseline plus relevant standards-track extensions; provider-specific Sieve behavior remains separate.
- [`PURELYMAIL_SIEVE_CAPABILITY_PROFILE.md`](PURELYMAIL_SIEVE_CAPABILITY_PROFILE.md) — live 2026 Purelymail ManageSieve capability advertisement and endpoint-specific Sieve subset.
- [`GMAIL_SEMANTIC_SURVEY.md`](GMAIL_SEMANTIC_SURVEY.md) — Gmail Filter criteria/actions, Gmail search-language surface, labels/state, and public-API versus product-surface asymmetries.
- [`OUTLOOK_SEMANTIC_SURVEY.md`](OUTLOOK_SEMANTIC_SURVEY.md) — Microsoft Graph Inbox Rules, typed predicates/actions, folders/categories, sequence, and read/write asymmetries.
- [`THUNDERBIRD_SEMANTIC_SURVEY.md`](THUNDERBIRD_SEMANTIC_SURVEY.md) — Thunderbird client-local message filters, search terms/actions, local persistence, tags/folders, and extension points.

The first cross-system comparison consumes these native-system surveys together with the Purelymail endpoint profile rather than rewriting them into provider-pair-specific notes.

## Current control-flow investigations

These studies apply [`CONTROL_FLOW_INVESTIGATION_METHOD.md`](CONTROL_FLOW_INVESTIGATION_METHOD.md) to the initial rule systems. They preserve the individual execution evidence consumed by the separate cross-system control-flow synthesis.

- [`SIEVE_CONTROL_FLOW.md`](SIEVE_CONTROL_FLOW.md) — script sequencing, implicit keep, stop/return scope, mutable variables/flags/headers, delivery-action interaction, failure semantics, and Purelymail-specific execution caveats.
- [`GMAIL_CONTROL_FLOW.md`](GMAIL_CONTROL_FLOW.md) — incoming-filter execution, lack of public ordering/stop primitives, action-object semantics, and explicitly unresolved multi-filter mutation visibility.
- [`OUTLOOK_CONTROL_FLOW.md`](OUTLOOK_CONTROL_FLOW.md) — explicit rule sequence, `stopProcessingRules`, move-versus-stop behavior, action-object ordering limits, and unresolved intermediate-state visibility.
- [`THUNDERBIRD_CONTROL_FLOW.md`](THUNDERBIRD_CONTROL_FLOW.md) — trigger contexts, effective filter/action ordering, manual-path mutation visibility, move/delete terminality, copy continuation, and non-atomic failure behavior.

## Current syntheses

- [`FIRST_CROSS_SYSTEM_SEMANTIC_COMPARISON.md`](FIRST_CROSS_SYSTEM_SEMANTIC_COMPARISON.md) — first comparison across Sieve/Purelymail, Gmail, Outlook, and Thunderbird; identifies candidate semantic families and explicit non-equivalences without freezing final capability IDs.
- [`CROSS_SYSTEM_CONTROL_FLOW_SYNTHESIS.md`](CROSS_SYSTEM_CONTROL_FLOW_SYNTHESIS.md) — compares execution traces, rule boundaries, stop scope, mutation visibility, move/copy/delete continuation, trigger context, failure semantics, and transformation safety.

## Research lineage

Use this directory so a fresh reader can distinguish:

1. **methodology** — how comparable investigations are performed;
2. **individual investigations** — one native rule system at a time;
3. **focused follow-up studies** — narrow questions that need deeper treatment;
4. **syntheses/comparisons** — conclusions drawn across multiple investigations.

Do not rewrite individual investigations into retrospective summaries after a synthesis exists. Their value is preserving the evidence and reasoning lineage that produced later conclusions.

## Research policy

- Prefer primary/normative sources over summaries.
- Record uncertainty instead of filling gaps with plausible assumptions.
- Separate a standardized dialect from provider-specific implementation quirks.
- Do not invent Mailchemy capability IDs inside evidence-gathering surveys.
- Do not treat similar-looking constructs as equivalent until that equivalence is actually established.
- Active task/checkpoint tracking remains in the working conversation, not in this directory.
