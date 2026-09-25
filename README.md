# Mailchemy

**Mailchemy** is an interoperability project for translating email-filter and message-rule semantics between heterogeneous rule systems **without silently changing what the rules mean**.

The initial architecture/research bootstrap, R0 conformance-harness foundation, and R1 first canonical semantic tranche are complete. Mailchemy now implements documented core contracts for subject containment, explicit MIME attachment presence, mark-read, and conjunction, plus shared rule-shaped fixtures. The first Sieve/Purelymail, Gmail, Outlook / Microsoft Graph, and Thunderbird slices are complete with offline codecs, direct-realization classifications, and semantic/native conformance. Milestone R2 is complete: the first generated cross-IO matrix, canonical-routed cross-codec round trips, negative exactness tests, and CI regression baseline are in place. The staged CRH-44 implementation-hygiene pass is active. Four-space indentation and brace-less next-line single-statement control bodies are repository style, the exhaustive CRH-44C TypeScript documentation pass is complete, and CRH-44D1 has frozen the provisional source naming/browseability design. CRH-44D2 has standardized authored TypeScript filenames on `lower_snake_case` with exact import casing enforced, CRH-44D3 has applied the approved semantic naming cleanup, CRH-44D4 has reorganized Core by conceptual responsibility, CRH-44D5 has reorganized Conformance/Cross-IO for clearer evidence navigation, and CRH-44D6 has aligned the flat adapter-package layouts without erasing real Sieve-specific structure; CRH-44D7 (imports/exports/docs reconciliation) is next.

## What Mailchemy is trying to solve

Email filtering systems look similar on the surface, but their actual semantics differ:

- Sieve has standardized language semantics and extensions.
- Gmail exposes its own filter/search/label model.
- Microsoft Outlook/Hotmail exposes Inbox Rules through Microsoft Graph.
- Thunderbird has its own local rule format and execution behavior.
- Future inputs/outputs may be files, clients, APIs, servers, or entirely different rule systems.

Mailchemy's goal is not to invent one "true" replacement rule language. Instead, it uses a canonical semantic intermediate representation and adapter-specific capability declarations to determine what can be translated exactly between the systems involved in a particular conversion.

## Core principles

- Translate **meaning**, not syntax.
- Do not silently broaden, narrow, drop, or approximate a rule.
- The internal semantic IR is not globally limited by the weakest supported adapter.
- Compatibility is negotiated dynamically for the actual source, target(s), concrete rule instances, and semantically relevant execution structure.
- Adapter limitations are represented as **refinements/constraints** on semantic capabilities rather than contaminating the global capability vocabulary.
- Exact semantic rewrites may provide alternative realizations when a target cannot encode a capability or execution structure directly.
- Ordered/stateful rules require preserving relevant execution semantics: rule boundaries, continuation, mutation visibility, trigger context, and terminality can affect meaning.
- Endpoint capability profiles can further refine what a dialect/codec can realize on a particular connected service.
- Rule language/dialect semantics are separate from storage/transport. Sieve and ManageSieve, for example, are distinct concerns.
- Local/client formats such as Thunderbird rules are first-class potential inputs/outputs alongside hosted providers.
- If a portable file format is useful later, it can be another codec/adapter rather than becoming the internal architecture.

## Initial motivating systems

The first systems under consideration are:

- Sieve, with Purelymail/ManageSieve as an initial real endpoint;
- Gmail Filters and the Gmail API;
- Microsoft Outlook/Hotmail Inbox Rules through Microsoft Graph;
- Thunderbird message filters;
- future portable serialization formats.

These are initial targets, not a closed list.

## Documentation

Start with [`docs/README.md`](docs/README.md).

Project vocabulary is defined in [`docs/GLOSSARY.md`](docs/GLOSSARY.md), the current architecture in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), and initial target-system notes in [`docs/INITIAL_TARGETS.md`](docs/INITIAL_TARGETS.md).

The explicitly authorized first implementation roadmap lives under [`planning/`](planning/), starting with [`planning/CAPABILITY_REGISTRY_HARNESS.md`](planning/CAPABILITY_REGISTRY_HARNESS.md).

Evidence-gathering, native-system investigations, and cross-system syntheses live under [`research/`](research/). See [`research/README.md`](research/README.md) for the evidence lineage and both current research methodologies.

## Repository policy

Agent-facing workflow and repository conventions live in [`AGENTS.md`](AGENTS.md) and [`.agents/`](.agents/).

Active task tracking stays in the working conversation unless explicitly changed; the repository should contain durable project facts rather than a chat-derived TODO ledger.
