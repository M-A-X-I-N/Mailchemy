# 1. Persisted agent context

This directory stores **agent-specific persisted context** that is useful across chats or tool sessions but is too procedural or meta-level for the root [`AGENTS.md`](../AGENTS.md).

It is not a second project-documentation tree.

## 1.1 What belongs here

Good candidates:

- detailed agent workflow/checkpoint conventions;
- recovery guidance for interrupted tool sessions;
- durable context about how to navigate or interpret the repository;
- agent-specific cautions that would be noise in human-facing technical documentation;
- provenance/commit conventions;
- guidance for preserving semantic and Git-history integrity while changing the project.

What does **not** belong here:

- the active task/TODO list;
- authoritative architecture or interoperability contracts that belong in `docs/`;
- generated output;
- machine-local configuration;
- duplicated copies of design documents;
- private chat history or unrelated personal information.

## 1.2 Current files

- [`WORKFLOW.md`](WORKFLOW.md) — detailed operating, checkpoint, recovery, provenance, and history-preservation conventions.

## 1.3 Fresh-session reading order

For substantive repository work, use this default orientation path:

1. [`../AGENTS.md`](../AGENTS.md) — concise project boundaries, current phase, semantic-interoperability invariants, and repository rules.
2. [`WORKFLOW.md`](WORKFLOW.md) — checkpoint, recovery, commit/provenance, and Git-history rules.
3. [`../README.md`](../README.md) — project purpose and current status.
4. [`../docs/README.md`](../docs/README.md) — durable documentation map.
5. [`../docs/GLOSSARY.md`](../docs/GLOSSARY.md) — canonical project vocabulary.
6. [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — current canonical architecture and rationale.
7. [`../research/README.md`](../research/README.md) — research lineage, methodologies, individual investigations, and syntheses when the task involves native-system evidence or comparison.
8. Read only the leaf documents relevant to the current task.

Repository state and current files remain authoritative over remembered conversation context. The working conversation may carry newer task sequencing, but durable technical conclusions belong in the repository.

## 1.4 Source-of-truth hierarchy

When information conflicts, prefer the source that owns the subject:

1. repository source/configuration for what the tree currently does;
2. `docs/` for durable Mailchemy architecture, semantics, policy, and design;
3. `research/` for evidence, native-system investigations, and cross-system research synthesis;
4. root `README.md` for project orientation/current high-level state;
5. root `AGENTS.md` for concise agent rules and routing;
6. `.agents/` for supporting agent workflow/context.

The working conversation may contain newer **task status**, but it should not silently override durable project documentation. If a conversation changes a durable project fact, update the appropriate repository document.
