# 1. Agent operating guide

Mailchemy is an interoperability project for translating email-filter and message-rule semantics between heterogeneous rule systems without silently changing their meaning.

This file is intentionally concise. Durable technical and architectural facts belong in the human-facing documentation under `docs/`; detailed agent procedure belongs under [`.agents/`](.agents/).

## 1.1 Before changing anything

1. Read the root [`README.md`](README.md) for current scope and project status.
2. Read [`docs/README.md`](docs/README.md) for the design-document map and current architectural vocabulary.
3. If present and relevant, consult persisted agent-specific context under [`.agents/`](.agents/).
4. Inspect the current repository state before assuming an earlier chat, checkpoint, or remembered design still matches `main`.
5. Read only the leaf documents relevant to the task after orienting through the navigation documents.

Repository state and durable project documentation are authoritative over remembered conversation context. A conversation may carry newer task sequencing, but durable design decisions discovered there should be written back to the appropriate project document.

## 1.2 Current project phase

Mailchemy is currently in architecture/documentation bootstrap.

Do not begin product implementation, select a programming language/runtime, create package-manager scaffolding, or freeze concrete public APIs unless the human task explicitly asks for that work.

Research, documentation, repository policy, format/protocol investigation, and design refinement are allowed. Small executable probes may be added later when a task explicitly calls for them, but they must not silently become the architecture.

## 1.3 Architectural hard rules

These are current project invariants unless the human explicitly changes them:

- Mailchemy translates **semantics**, not merely syntax.
- The canonical intermediate representation (IR) is an internal semantic model; it does not need a human-authored textual language or serialization format.
- The IR is **not** restricted to the global intersection of every supported system.
- Semantic operations use stable, versioned identifiers. Versioning belongs to semantic contracts, not to provider quirks.
- An adapter may support only a constrained/refined subset of a semantic capability. Such restrictions do not create new global semantic capabilities merely because one endpoint is limited.
- Compatibility is evaluated for the concrete source/target set and concrete rule instances, not by a single global yes/no capability matrix.
- Adapters may realize semantics directly or through exact, semantics-preserving rewrites.
- One semantic expression may have multiple valid exact realizations, and a realization may expand into an arbitrary expression tree rather than a one-to-one capability substitution.
- Unsupported or lossy mappings must be reported explicitly. Do not silently broaden, narrow, drop, or approximate a rule.
- Approximate/lossy conversion, if ever supported, must be an explicit mode distinct from normal exact interoperability.
- Dialect/codec semantics and rule storage/transport are separate concerns. For example, Sieve is a rule language while ManageSieve is a transport/store interface.
- Remote providers are not privileged. Local/client formats such as Thunderbird rules and future serialization formats are first-class potential inputs/outputs.
- A portable/export format, if desired, should be modeled as another adapter/codec with a schema rather than made the internal architecture.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the detailed rationale and model.

## 1.4 Repository rules

- Do not create a repository-local active TODO/task ledger unless the human explicitly asks for one. Active task/checkpoint tracking belongs in the working conversation.
- Keep root documentation navigational and high-level; avoid duplicating detailed architecture across multiple files.
- Keep agent-only procedure in `.agents/`; do not hide authoritative project facts there.
- Prefer precise terminology. In particular, distinguish semantic capability, constraint/refinement, rewrite, codec/dialect, and store/endpoint.
- Avoid provider-specific assumptions in core architectural documentation unless they are clearly presented as examples.
- Preserve Git history and recoverability by default. Do not rewrite, discard, or make existing commits/history unreachable through destructive ref movement or history editing without explicit human authorization naming the affected history/ref(s) and destructive action. Prefer additive corrective/revert commits.

## 1.5 Validation

Use the smallest validation that genuinely proves the changed surface.

At this early documentation-only stage there may be no executable checks. Do not invent ceremonial build/test commands merely to claim validation. Instead:

- re-read changed documentation for authority and terminology conflicts;
- verify internal links and file paths when practical;
- inspect the resulting repository tree and commit state.

When executable tests, linters, schemas, or CI are introduced later, update this guide or the relevant documentation with the actual supported commands.

## 1.6 Working style

- Prefer small, coherent, revertible commits.
- Push meaningful checkpoints instead of accumulating a large unpushed change set.
- Keep `main` coherent between checkpoints when practical.
- If a change exposes a genuine project-direction ambiguity, document the alternatives and ask rather than smuggling in an architectural choice.
- If a task changes durable project facts, update the relevant human-facing documentation in the same checkpoint or immediately after it.
- Treat semantic equivalence claims as things to prove with specifications/tests, not assumptions based on similar-looking provider features.

## 1.7 Commit messages and agent provenance

Commit subjects use `[Kind][Scope] Imperative summary`; omit `[Scope]` when it adds no useful information. Approved kinds are `Feature`, `Fix`, `Research`, `Documentation`, `Test`, `CI`, `Build`, `Refactor`, `Chore`, and human-selected-only `CBA`. Agents must never choose `CBA` for themselves.

Use `Agent-authored-by:` when an agent wholly authored the substantive contents of a commit. Merely staging, committing, rebasing, or pushing another author's work is not authorship.

`Agent-assisted-by:` is opt-in only: add it only when a human explicitly requests it or manually supplies it.

Each agent may have its own stable human-assigned designation. `Gippity` is reserved specifically for this ChatGPT lineage and must not be reused for Codex, Claude, Copilot, or other agents. See [`.agents/WORKFLOW.md`](.agents/WORKFLOW.md) for detailed formatting and decision rules.

Detailed agent-only workflow/context may live under [`.agents/`](.agents/) when it would make this root guide noisy. Durable technical facts belong in `docs/`, not only in agent notes.
