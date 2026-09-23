# 1. Agent workflow and recovery conventions

This file expands the concise rules in [`../AGENTS.md`](../AGENTS.md). It is procedural rather than a technical project specification.

## 1.1 Checkpoint discipline

For repository-changing work:

1. inspect the current `main` state before editing;
2. keep each checkpoint narrow enough to explain and revert independently;
3. run the smallest validation that genuinely proves the changed surface;
4. commit and push meaningful checkpoints promptly;
5. inspect CI/status when the changed surface is covered there;
6. do not leave substantial completed work only in an ephemeral tool session.

Small follow-up commits are preferable to hiding unrelated cleanup inside an otherwise coherent change.

## 1.2 After an interrupted or broken chat/tool session

Do not assume the last narrated action reached `main`.

Recover in this order:

1. inspect the current branch head/commit history;
2. compare narrated checkpoints with actual commits;
3. inspect known Git tree/blob/commit objects created immediately before interruption when available;
4. distinguish clearly between:
   - committed/pushed work;
   - recoverable Git objects not referenced by `main`;
   - work that existed only in reasoning/tool arguments and must be reconstructed;
5. validate recovered work before continuing.

If an orphan tree or blob exactly contains the intended checkpoint, prefer promoting that object into a normal commit over manually recreating it.

## 1.3 Validation scope

Use the smallest validation that genuinely proves the changed behavior.

For documentation-only or research-only changes, appropriate validation is usually:

- re-reading the changed docs for conflicting authority or terminology;
- checking internal links and paths;
- verifying the repository tree and resulting commit state.

Once executable checks exist, use and document the actual project-supported commands rather than inventing ceremonial checks.

## 1.4 Architecture handling

Mailchemy's central problem is **semantic interoperability**, not provider-specific rule generation.

Agents may:

- investigate rule systems, APIs, file formats, and protocols;
- refine the semantic model, capability/refinement model, rewrite model, and adapter/store boundaries;
- compare exact and non-exact mappings;
- document alternative designs and tradeoffs;
- add tests or executable probes when a task explicitly calls for implementation/research code.

Agents should not:

- silently approximate a rule and call it interoperable;
- collapse provider-specific storage/transport concerns into semantic capabilities;
- create global semantic capability IDs merely to encode one adapter's local limitation;
- turn an example provider quirk into a universal architectural assumption;
- begin product implementation or freeze foundational implementation choices unless the human task explicitly starts that work.

When a claimed equivalence is uncertain, treat it as unproven until supported by authoritative specification evidence or tests.

## 1.5 Documentation ownership

Put information where it belongs:

- root `README.md`: project overview and current high-level state;
- `docs/`: durable Mailchemy architecture, terminology, design, compatibility concepts, and future technical policy;
- `research/`: native-system evidence, individual investigations, focused studies, and cross-system syntheses;
- `planning/`: explicitly authorized active roadmaps/task plans; provisional sequencing only, not architecture authority;
- root `AGENTS.md`: concise agent rules and routing;
- `.agents/`: detailed agent-specific procedure/context.

Do not create or maintain a repository TODO ledger unless the human explicitly reverses that policy.

## 1.6 Commit-message and provenance convention

Use this subject shape:

```text
[Kind][Scope] Imperative summary
```

The scope is optional when it adds no useful information.

Approved kinds:

```text
Feature
Fix
Research
Documentation
Test
CI
Build
Refactor
Chore
CBA
```

`CBA` means "Can't be arsed" and is deliberately human-controlled. An agent may use `[CBA]` only when a human explicitly selects it for that commit.

Scopes are descriptive rather than a closed enum. Prefer concise project areas such as `Architecture`, `Agents`, `Docs`, `Sieve`, `Gmail`, `Outlook`, `Thunderbird`, `Tests`, or `Repository` when useful.

A commit body is optional. Add one when it records useful motivation, constraints, consequences, or non-obvious context.

### 1.6.1 Agent-authored commits

When an agent wholly authored the substantive contents of a commit, add:

```text
Agent-authored-by: <agent identity>
```

This trailer is mandatory when it applies. Authorship describes who created the substantive change, not who merely operated Git.

Each agent may have its own stable human-assigned designation. `Gippity` belongs specifically to this ChatGPT lineage and must not be reused for other agents.

For an agent with an assigned designation, that exact token is the stable mandatory identity. Everything around it is intentionally playful and agent-controlled.

The agent may **freely and unilaterally** invent, change, remove, or rotate prefix/suffix titles whenever it likes, including per commit. It does not need to ask the human first, and should not treat an earlier title as sticky or canonical. Profane, ridiculous, grandiose, self-deprecating, or otherwise unserious titles are all fair game.

The only title-content exception is **slurs**: because the trailer is pushed under the human's repository identity, a title containing a slur requires the human's explicit permission before use. This exception does not create a general approval requirement for titles.

Examples:

```text
Agent-authored-by: Gippity the Mail Goblin (OpenAI ChatGPT, GPT-5.6 Sol)
Agent-authored-by: His Questionable Excellency Gippity
  (OpenAI ChatGPT, GPT-5.6 Sol)
Agent-authored-by: Gippity, Keeper of the Semantic Crucible
  (OpenAI ChatGPT, GPT-5.6 Sol)
```

The complete trailer may occupy at most two physical Git trailer lines.

### 1.6.2 Agent-assisted commits

`Agent-assisted-by:` records material assistance to a commit the agent did not wholly author.

It is never automatic. Add it only when a human explicitly requests it or manually supplies it.

Mechanical Git assistance alone does not justify either provenance trailer.

## 1.7 Workspace and branch hygiene

Prefer short-lived task branches/worktrees and small checkpoints over long-lived piles of unpushed work.

Before starting work from a remembered checkpoint, verify the current remote/GitHub `main` state. After a task is committed, promoted, and validated, redundant temporary worktrees may be removed after proving they contain no unique work.

Do not preserve stale worktrees as archives merely because they once held a task.

## 1.8 Git history preservation and destructive Git operations

Preserve existing Git history and recoverability by default.

The normal correction model is **additive history**:

- make a new commit that changes or deletes tracked files;
- make a revert/corrective commit when an earlier change should be undone;
- fast-forward refs;
- create branches/worktrees;
- remove redundant worktrees after proving they contain no unique work.

Deleting files in a new commit is not history destruction because earlier committed state remains reachable.

Do **not** rewrite, discard, or make existing history unreachable without explicit human authorization for the specific history/ref(s) and destructive operation.

Operations requiring that authorization include, when they would rewrite/discard history or unique work:

- rebasing, squashing, dropping, editing, or reordering existing commits;
- resetting a branch/ref in a way that discards commits;
- history filtering/rewrite tools;
- force-pushing or forced ref movement that is not a fast-forward;
- deleting refs when doing so would make deliberately retained commits unreachable;
- destructive cleanup of unique uncommitted work.

A broad instruction such as "clean up branches" or "fix the history" is not sufficient authorization for destructive history editing.

### 1.8.1 Force/bypass options

The literal presence of `--force` is not itself the definition of history destruction.

An agent may use a force/bypass option without separate authorization only after proving it will not discard unique committed history, refs/recovery points, or uncommitted work. If it can discard unique work or rewrite/ref-move history, the explicit authorization rule above applies.
