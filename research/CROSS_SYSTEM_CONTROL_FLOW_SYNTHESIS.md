# Cross-system control-flow synthesis

## 1. Purpose

This document synthesizes the initial control-flow investigations:

- [Sieve control flow](SIEVE_CONTROL_FLOW.md)
- [Gmail control flow](GMAIL_CONTROL_FLOW.md)
- [Outlook / Microsoft Graph control flow](OUTLOOK_CONTROL_FLOW.md)
- [Thunderbird control flow](THUNDERBIRD_CONTROL_FLOW.md)

It compares observable execution semantics rather than merely comparing native keywords such as `move`, `stop`, or `delete`.

The goal is to determine which execution concepts appear portable, which mappings require strict preconditions, and which seemingly obvious transformations are unsafe.

This remains a research synthesis. It does **not** define final Mailchemy capability IDs or a concrete control-flow IR.

## 2. Four fundamentally different execution models

The initial systems do not share one natural rule-engine model.

### 2.1 Sieve: sequential stateful script

Sieve is an ordered program with conditional branches, mutable variables/flags, explicit script termination, implicit delivery state, and extension-defined side effects.

Execution structure itself is native semantics.

### 2.2 Gmail: publicly unordered filter set

Gmail exposes filters as independent criteria/action resources without:

- user-controlled sequence;
- a stop-processing primitive;
- an ordered action list;
- documented sequential state chaining.

The exact internal scheduler is not part of the public contract.

For exact interoperability, Gmail must therefore be treated as supporting only transformations whose meaning does not depend on an assumed filter order or intermediate mutation visibility.

### 2.3 Outlook: explicit ordered rule list

Outlook Inbox Rules expose:

- explicit rule sequence;
- normal continuation through later matching rules;
- explicit `stopProcessingRules` to suppress later rules.

However, the public action object is not itself an ordered action list, and general visibility of earlier rule mutations to later predicates remains underdocumented.

### 2.4 Thunderbird: ordered but normalized execution

Thunderbird exposes ordered filters, but the displayed/stored structure is not always the effective execution structure.

It may:

- reorder actions inside a filter by semantic class;
- alter effective cross-filter ordering when a move would prevent a later action;
- treat move/delete/stop as terminal for later filtering in the manual/after-the-fact execution path.

Rule boundaries can therefore be observably significant.

## 3. Comparison matrix

| Dimension | Sieve | Gmail | Outlook | Thunderbird |
| --- | --- | --- | --- | --- |
| User-visible rule/script order | yes, script order | no public sequence | yes, explicit sequence | yes, filter list order |
| Engine may normalize order | delivery commit timing may vary | internal scheduling undocumented | intra-rule action order undocumented | yes, actions and sometimes effective filter order |
| Explicit stop-like control | `stop`; `return` for include scope | none exposed | `stopProcessingRules` | StopExecution |
| Stop scope | whole script; `return` narrower | n/a | later rules | later filters for message in proven manual path |
| Intermediate mutable state | yes | not documented as chainable | likely some state exists, visibility not generally specified | yes in proven manual path |
| Move inherently stops later processing | no | no folder move primitive | no | yes in proven manual path |
| Copy inherently stops | no | no folder-copy primitive | no stop implied | no in proven manual path |
| Default-delivery state explicit | yes, implicit keep | no | no | no |
| Action list user-ordered | script statements, but side-effect commit timing varies | no, action object/set | no, action object | stored list normalized by engine |
| Atomic failure contract | no universal atomicity | unresolved | unresolved | no global atomicity |
| Manual alternate trigger | not base delivery model | one-time apply workflow only | yes | yes, first-class |

## 4. Stop semantics are related but not identical

Three systems expose some form of explicit continuation barrier:

- Sieve `stop`;
- Outlook `stopProcessingRules`;
- Thunderbird StopExecution.

Gmail exposes no equivalent primitive.

### 4.1 Sieve `stop`

Sieve `stop` terminates all remaining script processing.

If implicit keep remains uncancelled, stopping still allows that default delivery.

It therefore affects both:

- later conditional/script statements;
- the point at which the script's implicit-delivery state is finalized.

### 4.2 Outlook stop-processing

Outlook's stop flag suppresses **subsequent rules** after the current matching rule's actions.

It is not documented as an intra-rule action barrier.

### 4.3 Thunderbird StopExecution

In the proven manual/after-the-fact path, StopExecution prevents subsequent filters from processing the matched message.

The engine sorts StopExecution to the end of the current filter's effective action list.

### 4.4 Constrained overlap

These three constructs may share a future semantic family resembling:

```text
do not evaluate later rule-processing units for this message
```

but only under structural preconditions.

For example, Sieve `stop` can behave like later-rule suppression when:

- the Sieve script is being interpreted as a linear sequence of rule-like blocks;
- there is no included-script boundary involved;
- no remaining same-rule/script statements need separate representation;
- implicit keep state is represented independently.

Therefore an exact rewrite may be possible for a restricted shape, but **the native constructs are not globally interchangeable**.

## 5. Move semantics split sharply on continuation

The control-flow studies invalidate any design where 'move' secretly carries one universal continuation behavior.

### 5.1 Sieve

`fileinto` cancels implicit keep but does **not** stop later script execution.

### 5.2 Outlook

`moveToFolder` is explicitly distinct from stop-processing. Later rules may still execute unless stop is requested.

### 5.3 Thunderbird

In the proven manual/after-the-fact executor, MoveToFolder stops further filtering for that message.

### 5.4 Gmail

Gmail has no equivalent exclusive folder-move primitive; archive + label is a state transformation with different semantics.

### 5.5 Required conclusion

A future canonical move/container-placement operation should not embed terminality.

Instead, the execution context must separately express whether processing continues after the move.

Otherwise one semantic ID would necessarily mean different things on Sieve, Outlook, and Thunderbird.

## 6. Copy semantics are also execution-sensitive

Sieve, Outlook, and Thunderbird can all produce folder/mailbox copies, but their surrounding semantics differ.

### Sieve

`fileinto :copy` preserves implicit keep. That preservation is specifically different from issuing an explicit `keep`.

### Outlook

`copyToFolder` is a distinct action and carries no documented stop behavior.

### Thunderbird

CopyToFolder is non-terminal in the proven manual path, and action sorting places copy before move/delete.

### Consequence

An abstract copy operation may be portable, but exact equivalence requires separate treatment of:

- default/local delivery;
- copied message state;
- whether the copy re-enters filtering;
- action ordering.

## 7. Rule boundaries are semantically observable

One of the strongest synthesis results is that splitting and merging rules cannot be treated as structural cleanup.

### 7.1 Thunderbird proves boundaries affect effective action order

Suppose separate filters produce:

```text
Filter A: tag A
Filter B: copy
Filter C: tag B
```

Merging those actions into one Thunderbird filter can cause the action sorter to execute:

```text
tag A
tag B
copy
```

which changes the state of the copied message.

Thus:

```text
same conditions + same actions
!= necessarily
same semantics
```

### 7.2 Outlook boundaries define stop scope and interleaving

Moving actions between ordered rules can:

- change which later rules are suppressed;
- change which conditions are re-evaluated;
- permit or remove unrelated rule interleaving.

### 7.3 Sieve boundaries/branches carry mutable state

Variables, match captures, flag state, header mutations, implicit keep, and `stop` all make arbitrary block splitting unsafe.

### 7.4 Gmail cannot safely emulate ordered boundaries

Because Gmail exposes no dependable sequence/stop model, importing meaningful source rule boundaries as separate Gmail filters can lose ordering semantics even when every individual action is available.

### 7.5 Design implication

A future canonical representation must preserve enough execution grouping/ordering information to distinguish rule structures that have identical leaf conditions/actions but different traces.

This does **not** yet decide the concrete IR type shape.

## 8. Intermediate state visibility is a first-class compatibility dimension

A critical scenario is:

```text
R1: mutate state S
R2: test state S
```

### Sieve

Mutation visibility is explicit for several state types:

- variables;
- match captures;
- IMAP flag variable;
- edited headers when the extension is available.

### Thunderbird

In the manual/after-the-fact path, state mutations such as read/tag/flag changes are applied before later filters and can therefore affect later processing.

### Outlook

Rules are ordered, but the reviewed documentation does not define a universal mutation-snapshot contract for read/category/importance/folder state.

### Gmail

Sequential mutation visibility between filters is not part of the documented public contract.

### Consequence

Mailchemy should treat:

```text
target has action A
target has predicate B
```

as insufficient evidence that:

```text
A then B
```

is realizable as an exact ordered chain.

Support may need to be expressed over the **whole execution expression**, not only individual nodes.

## 9. Default delivery must remain separate from action semantics

Sieve's implicit keep makes this particularly obvious.

A message may have:

- a delivery action;
- a copy/redirect side effect;
- an implicit default delivery still pending;
- that implicit delivery cancelled later.

Other systems produce default Inbox/folder state without exposing the same internal mechanism.

Therefore Mailchemy should model observable default/local-delivery meaning without forcing all adapters to simulate Sieve's internal implicit-keep variable.

This also explains why:

```text
Sieve fileinto :copy
```

cannot generally be rewritten as:

```text
fileinto + explicit keep
```

even though both may initially appear to leave two copies.

## 10. Destructive-looking actions do not imply one terminality class

The research found several very different behaviors:

- Sieve `discard` cancels implicit keep but compatible later/other actions still matter;
- Sieve `reject` controls delivery refusal but is not simply `stop`;
- Gmail Trash is label/state mutation with no exposed stop semantics;
- Outlook delete/permanentDelete are separate from stop-processing;
- Thunderbird Delete is terminal for later filtering in the proven manual executor.

Therefore:

```text
destructive lifecycle effect
```

and:

```text
terminate further rule evaluation
```

must be modeled independently.

## 11. Forwarding/routing also needs continuation as a separate dimension

None of the research justifies one generic operation called simply 'forward'.

Control-flow differences include:

- Sieve redirect normally cancels implicit keep unless `:copy` is used;
- Gmail forwarding is represented independently of label/local-state actions;
- Outlook routing actions coexist with a separate stop-processing flag;
- Thunderbird forwarding participates in ordering constraints and does not inherently define later-filter suppression.

Even after message-construction semantics are separated, continuation/local-delivery behavior remains independently relevant.

## 12. Trigger context is semantic execution context

Thunderbird makes trigger context particularly explicit:

- incoming before junk;
- incoming after junk;
- manual;
- post-send;
- archive.

Sieve normally runs at delivery time, with extension-defined alternate triggers possible.

Gmail persistent filters target incoming messages; applying a new filter to existing conversations is a distinct workflow.

Outlook has automatic incoming rules and manual Run Rules behavior.

### Consequence

The same condition/action expression may not have one portable meaning independent of its trigger.

Trigger/execution context should therefore be preserved somewhere in Mailchemy's semantic/execution model or adapter applicability constraints.

It should not be dismissed as mere endpoint UI metadata.

## 13. Failure atomicity cannot be assumed

### Sieve

The standard explicitly permits implementations where earlier actions have occurred before a later runtime failure.

### Thunderbird

Actions are performed incrementally and failure handling is action-specific; there is no global rollback.

### Gmail / Outlook

The reviewed public documentation does not define transactional rollback guarantees for multi-action runtime failures.

### Consequence

Mailchemy should not make cross-system equivalence depend on a transaction guarantee that the native systems do not provide.

For normal successful execution, semantic equivalence can still be defined.

For failure-sensitive rules/workflows, exact portability may require explicit adapter knowledge or remain unsupported.

## 14. Transformation safety results

### 14.1 Splitting one rule into several

**Not generally safe.**

It is only a candidate exact rewrite when all of the following relevant properties are proven:

- target rule order is deterministic enough;
- no intermediate mutation changes re-evaluated conditions;
- no stop/terminal action changes scope;
- no unrelated rule can interleave observably;
- action failure boundaries are irrelevant to the required semantics;
- trigger context is equivalent.

Gmail often fails the first prerequisite because no order is exposed.

Thunderbird may fail because rule boundaries change action normalization and terminality.

### 14.2 Merging several rules

**Not generally safe.**

Potential failures include:

- Thunderbird action sorting;
- Outlook stop/interleaving scope;
- Sieve mutable state and branch structure;
- Gmail boolean/action conflict changes.

### 14.3 Replacing move with tag-plus-archive

**Not generally safe.**

Even when the final Gmail visual location looks similar, folder move and Gmail state transitions have different continuation/container semantics.

### 14.4 Replacing stop constructs across systems

**Potentially exact only with scope preconditions.**

Sieve `stop`, Outlook stop-processing, and Thunderbird StopExecution share later-processing suppression in some structures but do not have globally identical scope.

### 14.5 Replacing delete with trash movement

**Not generally safe.**

Recoverability, delivery acceptance, terminality, and later-rule visibility differ.

### 14.6 Reordering independent metadata actions

Potentially safe only when:

- the actions commute semantically;
- no later condition observes an intermediate state;
- copied/forwarded message snapshots are unaffected.

Thunderbird's copy/tag example proves this precondition matters.

## 15. Candidate control-flow semantic dimensions

These are candidate **dimensions**, not final capability IDs or types.

### 15.1 Execution trigger/context

Examples:

- incoming delivery;
- incoming post-junk;
- manual existing-message run;
- post-send;
- archive.

### 15.2 Ordered processing structure

The model needs to preserve whether units are:

- explicitly sequential;
- unordered/independent;
- conditionally continued;
- normalized/reordered by the target.

### 15.3 Continuation barrier

A concept for suppressing later processing units may be useful, but its scope must be explicit.

Possible scopes include:

- current nested script;
- remaining script;
- later rules/filters for the message.

### 15.4 Action grouping / rule boundary

Grouping may itself affect semantics and therefore cannot always be discarded during normalization.

### 15.5 Intermediate-state visibility

The semantic plan may need to know whether later predicates see earlier mutations.

This can be:

- guaranteed;
- unavailable;
- trigger-specific;
- unknown.

### 15.6 Default/local-delivery state

Observable local-delivery behavior should be representable separately from routing/copy actions.

### 15.7 Action terminality

An action's state/lifecycle effect and its effect on later processing should be independent dimensions.

### 15.8 Effective action-order constraints

Adapters may need to declare that:

- arbitrary action order is supported;
- actions are unordered fields;
- actions are normalized into classes;
- only certain interleavings are realizable.

## 16. Direct, derived, and structurally unsupported

The existing Direct / Derived / Unsupported idea remains useful, but control flow suggests support decisions may need to apply to **larger structures**.

For example:

```text
mark-read action      -> directly supported
unread predicate      -> directly supported

but:

mark-read then later test-unread
                      -> structurally unsupported or unproven
```

Thus support cannot always be computed independently per leaf capability.

The realization planner may need to ask whether the target can realize an entire control-flow region under its ordering/visibility constraints.

This is a refinement of the existing architecture, not yet an implementation design.

## 17. Cross-system stop/move summary

| Source concept | Sieve | Gmail | Outlook | Thunderbird |
| --- | --- | --- | --- | --- |
| Explicit later-processing stop | whole-script `stop` | none exposed | later-rule stop flag | later-filter StopExecution in proven path |
| Move/file action stops later processing | no | n/a | no | yes in proven manual path |
| Delete-like action stops later processing | discard: no | no stop primitive | separate from stop; exact delete continuation unresolved | yes in proven manual path |
| Copy stops later processing | no | n/a | no stop implied | no in proven manual path |

This table alone prevents several tempting but incorrect direct mappings.

## 18. Remaining high-value unknowns

The research is now sufficient for architecture reconciliation, but several unknowns should remain explicit rather than blocking all progress:

1. Gmail's exact multi-filter match snapshot and conflicting-action resolution.
2. Outlook's intermediate mutation visibility across sequential rules.
3. Outlook delete/permanent-delete continuation details.
4. Thunderbird automatic-incoming parity with the strongly evidenced manual/after-the-fact execution path.
5. Purelymail's exact account-level → user-level Sieve pipeline and implicit-keep handoff.
6. Runtime failure/rollback behavior for Gmail and Outlook.
7. Forward/reply message-snapshot and failure semantics across systems.

These can become targeted future experiments rather than reasons to invent answers now.

## 19. Synthesis conclusions

The control-flow block materially strengthens Mailchemy's architecture.

### 19.1 Semantic equivalence is trace equivalence, not leaf-feature equality

For stateful/ordered rules, the meaningful question is:

> Does the target produce the same observable execution trace and final/external effects for the relevant inputs?

Two representations containing the same conditions and actions can still be non-equivalent.

### 19.2 Rule boundaries and ordering cannot be normalized away blindly

Thunderbird provides the clearest counterexample, but Sieve and Outlook reinforce it.

### 19.3 Action meaning and continuation effect must be separate

Move, delete, discard, redirect, copy, and similar actions have different continuation behavior across systems.

### 19.4 Unknown execution semantics restrict exact conversion

Gmail and parts of Outlook are important examples: absence of a documented guarantee must result in an unproven/unsupported exact transformation, not a guessed one.

### 19.5 The first capability vocabulary can now be designed more safely

The project now has evidence for both:

- **leaf semantics**: conditions/actions/state;
- **execution semantics**: ordering, grouping, continuation, mutation visibility, trigger, default delivery.

That is enough to proceed to glossary and architecture reconciliation without pretending the final IR/API shape has already been chosen.