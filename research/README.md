# Research

This directory contains Mailchemy's **evidence and investigations**: what native rule systems actually do, how their constructs behave, and where their semantics are documented or remain uncertain.

It is deliberately separate from [`../docs/`](../docs/).

- `research/` asks **what is true about the systems Mailchemy wants to interoperate with?**
- `docs/` owns **what Mailchemy has decided or currently believes about its own architecture and terminology.**

Research findings may justify later changes to architecture documentation, but an investigation does not silently become project architecture merely because it exists.

## Current methodology

- [`SEMANTIC_SURVEY_METHOD.md`](SEMANTIC_SURVEY_METHOD.md) — common scope, evidence rules, comparison dimensions, and document template for the initial per-system semantic-surface surveys.

## Current semantic-surface surveys

These are individual native-system investigations performed under [`SEMANTIC_SURVEY_METHOD.md`](SEMANTIC_SURVEY_METHOD.md). They are evidence inputs, not the cross-system synthesis.

- [`SIEVE_SEMANTIC_SURVEY.md`](SIEVE_SEMANTIC_SURVEY.md) — standardized Sieve baseline plus relevant standards-track extensions; provider-specific Sieve behavior remains separate.
- [`PURELYMAIL_SIEVE_CAPABILITY_PROFILE.md`](PURELYMAIL_SIEVE_CAPABILITY_PROFILE.md) — live 2026 Purelymail ManageSieve capability advertisement and endpoint-specific Sieve subset.
- [`GMAIL_SEMANTIC_SURVEY.md`](GMAIL_SEMANTIC_SURVEY.md) — Gmail Filter criteria/actions, Gmail search-language surface, labels/state, and public-API versus product-surface asymmetries.
- [`OUTLOOK_SEMANTIC_SURVEY.md`](OUTLOOK_SEMANTIC_SURVEY.md) — Microsoft Graph Inbox Rules, typed predicates/actions, folders/categories, sequence, and read/write asymmetries.
- [`THUNDERBIRD_SEMANTIC_SURVEY.md`](THUNDERBIRD_SEMANTIC_SURVEY.md) — Thunderbird client-local message filters, search terms/actions, local persistence, tags/folders, and extension points.

The first cross-system comparison should consume these four documents rather than rewriting them into provider-pair-specific notes.

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
