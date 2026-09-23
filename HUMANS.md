# 1. HUMANS.md

Hello, biological contributor.

If `AGENTS.md` is for the tireless silicon interns, this file is for the people who eventually have to decide whether any of this bullshit is actually a good idea.

## 1.1 What this repository is

**Mailchemy** is an interoperability project for translating email-filter and message-rule semantics between heterogeneous rule systems without silently changing what the rules mean.

At the moment, the repository is intentionally much better at **describing the transmutation circle** than actually transmuting mail.

The architecture currently centers on a canonical semantic IR, versioned semantic capabilities, adapter-local capability refinements/constraints, exact semantic rewrites, and a separation between rule dialects/codecs and stores/endpoints.

There is no product implementation yet.

That is deliberate.

## 1.2 Why "Mailchemy"?

Because "cross-provider semantic email-rule interoperability framework" is technically descriptive and spiritually unacceptable.

The rough idea is:

```text
Gmail bullshit
      ↓
 semantic crucible
      ↓
Outlook bullshit
```

except with enough rigor that "bullshit" does not quietly become **different bullshit** during the conversion.

The name is a joke.

The semantic guarantees are not.

## 1.3 Who gets the final say?

Humans do.

Agents, specifications, APIs, provider documentation, test suites, capability graphs, rewrite planners, and increasingly suspicious amounts of Markdown may inform decisions, but architecture/scope/release decisions remain human decisions.

In particular, examples in design documents are not automatically implementation commitments. Mailchemy has not yet selected a programming language, package layout, CLI design, plugin system, portable serialization format, or final capability vocabulary.

If you find a document claiming otherwise, congratulations: you found either a bug, stale documentation, or premature enthusiasm.

## 1.4 Where to look

- [`README.md`](README.md) — project overview and current high-level state.
- [`docs/README.md`](docs/README.md) — documentation map and reading order.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — canonical architecture and semantic-interoperability model.
- [`docs/INITIAL_TARGETS.md`](docs/INITIAL_TARGETS.md) — the first motivating rule systems/endpoints.
- [`research/`](research/) — evidence, semantic-surface investigations, and later cross-system syntheses.
- [`AGENTS.md`](AGENTS.md) — instructions and repository boundaries for automated contributors.
- [`.agents/`](.agents/) — heavier persisted agent workflow/context.

There is intentionally **no repository TODO file**. Active task/checkpoint tracking lives in the working conversation instead of becoming another stale artifact somebody has to excavate six months later.

## 1.5 Project philosophy

The repository generally prefers:

- semantic meaning over similar-looking syntax;
- explicit incompatibility over silent approximation;
- small, recoverable checkpoints over heroic mega-commits;
- evidence over provider folklore;
- local adapter constraints over polluting the global semantic vocabulary;
- exact rewrites over hand-wavy "close enough" mappings;
- keeping representation separate from storage/transport;
- admitting uncertainty over manufacturing confidence;
- architectures that survive the addition of one more weird provider without requiring a taxonomic exorcism.

A particularly important rule is:

> If Mailchemy cannot prove that a translation preserves the rule's meaning, it should say so rather than pretend.

## 1.6 Credits

The actual filtering systems Mailchemy aims to understand and interoperate with belong to their respective authors, standards bodies, vendors, and contributors.

The project currently takes inspiration from systems including Sieve/ManageSieve, Gmail Filters, Microsoft Outlook/Hotmail Inbox Rules, Thunderbird message filters, and whatever other horrors are eventually invited into the laboratory.

A frankly unreasonable amount of architecture discussion, documentation, research assistance, and rubber-ducking has also been performed with OpenAI's ChatGPT.

Any future working implementation will still have to survive the oldest interoperability test in software engineering:

> "Okay, but why the fuck did *that* email end up *there*?"

## 1.7 Finally

If you are here to contribute: welcome.

If you are here because a translation changed meaning: that is a bug.

If you are here because Git history caught fire: check [`.agents/WORKFLOW.md`](.agents/WORKFLOW.md) before reaching for increasingly creative `--force` flags.

And if you are here wondering why there is this much architecture for email filters:

you have not yet met enough email-filter systems.
