# Control-flow investigation method

## 1. Purpose

The first semantic surveys established what the initial rule systems can express. The next research block must establish **how those expressions execute over time**.

This matters because two systems can expose apparently identical conditions and actions while still producing different results because of:

- rule ordering;
- action ordering;
- stop/return behavior;
- default or implicit delivery;
- message-state mutation;
- move/delete visibility;
- trigger context;
- error handling;
- whether all matching rules run or only some of them.

The initial control-flow investigations cover:

- Sieve, with Purelymail endpoint behavior kept separate where relevant;
- Gmail Filters;
- Microsoft Outlook/Hotmail Inbox Rules;
- Thunderbird message filters.

The investigations should answer:

> Given the same initial message and rule set, what observable sequence of evaluations, state changes, deliveries, and side effects does this system perform?

This document defines the comparison contract for M19-M22. The later M23 synthesis will compare the results.

## 2. Scope boundary

The control-flow investigations focus on execution semantics, not on redoing the earlier feature inventories.

They should investigate:

- when and why rule processing begins;
- the order in which rules are considered;
- which rules are evaluated after a match;
- the order and visibility of actions;
- the scope of stop/return/termination constructs;
- effects of move/copy/delete/discard/forward on later processing;
- implicit/default delivery behavior;
- mutation visibility across actions and rules;
- error and partial-execution behavior where evidence exists;
- differences between automatic and manual execution where relevant.

They should **not** yet:

- freeze final Mailchemy capability IDs;
- design the concrete control-flow IR;
- choose a rewrite-planner algorithm;
- claim cross-system equivalence before M23;
- invent behavior where authoritative evidence is missing;
- expand into general synchronization/conflict policy.

## 3. Evidence discipline

The source hierarchy and evidence labels from [SEMANTIC_SURVEY_METHOD.md](SEMANTIC_SURVEY_METHOD.md) continue to apply.

For control-flow claims, precision matters especially because documentation often describes UI intent rather than exact execution behavior.

Prefer, in order:

1. normative specifications for standardized systems;
2. official vendor/upstream documentation that explicitly describes execution;
3. authoritative source code where documentation is incomplete;
4. reproducible observations/tests with version, trigger context, and rule set recorded;
5. official issue reports that expose edge cases;
6. secondary sources only as leads or clearly labeled supporting evidence.

Do not turn a UI checkbox label such as 'stop processing more rules' into a full semantic contract without establishing its exact scope.

## 4. Control-flow vocabulary for research

These are working research terms, not final Mailchemy type names.

### 4.1 Trigger

The event/context that begins rule processing.

Examples include:

- final mail delivery;
- arrival in Inbox;
- after junk classification;
- manual execution on an existing folder;
- post-send;
- archive;
- provider-specific account-level preprocessing.

### 4.2 Rule consideration order

The order in which independently stored rules or rule-like units are considered.

This is separate from condition evaluation order inside one rule.

### 4.3 Match snapshot

The message/state view against which a condition is evaluated.

A central research question is whether later rules see:

- the original message/state;
- mutations from earlier actions;
- a mixture depending on mutation type;
- no message at all after a terminal action.

### 4.4 Declared action order

The order in which actions appear in the native rule representation or UI.

### 4.5 Effective action order

The order in which the implementation actually performs those actions.

Thunderbird already proves these can differ.

### 4.6 Terminality

Whether an action or control-flow construct prevents further evaluation or delivery behavior.

Terminality may apply to different scopes:

- rest of current action list;
- rest of current rule;
- rest of current script;
- later rules in the same rule set;
- subsequent processing stages;
- default/implicit delivery.

### 4.7 Observable side effect

Any externally or later-observable result, such as:

- folder/mailbox placement;
- copy creation;
- label/category/tag mutation;
- read/star/importance state;
- forwarding/redirect;
- reply/vacation response;
- rejection;
- deletion/discard;
- header/body mutation;
- provider/client state.

## 5. Trace-oriented investigation model

Each system should be describable, at least conceptually, as an execution trace:

```text
initial message/state S0
        ↓
trigger context T
        ↓
rule R1: evaluate against some state
        ↓
actions / state changes / side effects
        ↓
rule R2: evaluate against some state
        ↓
...
        ↓
final message placements + state + external side effects
```

The point is **not** to force each native system into this implementation model. The point is to record enough evidence that two systems' observable traces can later be compared.

Where useful, investigations should record small examples in the form:

```text
Initial:
  message in Inbox, unread, subject = X

Rule 1:
  if subject contains X → mark read, move to Folder A

Rule 2:
  if unread → tag Y

Observed/result:
  ...
```

Counterexamples are particularly valuable. A tiny rule set that proves two systems differ is more useful than a broad statement that they are 'similar'.

## 6. Investigation dimensions

### 6.1 Trigger and execution stage

Determine:

- what event starts evaluation;
- whether only new/incoming mail is affected;
- whether processing occurs before or after delivery into a mailbox;
- whether spam/junk classification occurs before, after, or optionally around filtering;
- whether manual execution uses the same semantics;
- whether multiple trigger contexts exist for one stored rule.

Do not assume a rule that has identical condition/action syntax behaves identically under every trigger context.

### 6.2 Rule ordering

Determine:

- whether rules have an explicit sequence/order;
- whether order is stable and user-controlled;
- whether the API/file representation preserves that order;
- whether all enabled rules are candidates;
- whether any system uses undefined or provider-selected ordering;
- whether disabled/error/read-only rules participate.

If rules can be reordered automatically by the system, document both requested and effective order.

### 6.3 Match-all, first-match, or conditional continuation

Establish whether:

- every matching rule executes;
- only the first matching rule executes;
- matching continues unless a stop flag/action fires;
- action type implicitly terminates later matching;
- processing differs by trigger context.

A statement such as 'rules run in order' is incomplete unless continuation semantics are also known.

### 6.4 Condition evaluation order and short-circuiting

Where observable, determine:

- left-to-right versus unspecified evaluation;
- AND/OR short-circuit behavior;
- whether predicate evaluation can mutate state;
- whether captures/match variables from one predicate affect later predicates;
- whether exceptions are evaluated before/after positive conditions in a semantically observable way.

Sieve variables/match captures are an obvious place where this may matter.

### 6.5 Action order within one rule

Determine:

- whether declared order is preserved;
- whether the system normalizes/reorders action classes;
- whether several actions are conceptually simultaneous;
- whether one action can suppress another;
- whether invalid combinations are rejected, normalized, or partially executed.

For systems with action objects rather than lists, investigate whether the platform defines any effective ordering at all.

### 6.6 State mutation visibility

For each important mutation family, ask whether subsequent actions/rules can observe it:

- read/unread;
- flags/stars;
- tags/categories/labels;
- importance/priority;
- junk/spam state;
- header/body edits;
- folder/container membership.

Do not assume all mutations share one visibility boundary.

### 6.7 Move and copy behavior

Determine:

- whether move happens immediately or after rule evaluation;
- whether later rules still see/process the message;
- whether later conditions see the new folder/container;
- whether copies themselves are re-filtered;
- whether copy preserves all state;
- whether moving cancels default/implicit delivery;
- whether the source message remains addressable during later actions.

This dimension is critical for deciding whether one source rule can be split into multiple target rules.

### 6.8 Delete, discard, reject, and trash behavior

These actions must be researched separately.

For each, determine:

- whether later rules still execute;
- whether prior side effects remain;
- whether the message is recoverable;
- whether delivery is considered accepted or refused;
- whether deletion is immediate or deferred;
- whether default delivery is cancelled.

Do not use 'delete' as shorthand for all of them.

### 6.9 Forwarding, redirect, reply, and external side effects

Determine:

- whether local delivery still occurs;
- whether forwarding itself terminates processing;
- whether several forward/redirect targets can run;
- whether later rules can add more routing side effects;
- whether the original or mutated message is forwarded;
- whether failures roll back or coexist with local delivery;
- whether duplicate/retry suppression exists.

Message-construction details belong here only when they affect execution equivalence.

### 6.10 Implicit/default delivery

Determine what happens if no explicit terminal delivery action occurs.

Questions include:

- is there implicit keep/default Inbox delivery?;
- which actions cancel it?;
- can it coexist with forwarding/copying?;
- can later rules restore or cancel it?;
- is default delivery decided per rule, per script, or after the whole ruleset?

Sieve makes this explicit through implicit keep; other systems may encode the same outcome differently or have no comparable concept.

### 6.11 Stop / return / continuation controls

For each native construct, document its exact scope.

Possible meanings include:

- stop evaluating later actions in the current rule;
- stop evaluating later rules;
- return from an included script but continue caller processing;
- stop all filtering but still perform default delivery;
- terminate message delivery entirely.

Do not infer equivalence from the word 'stop'.

### 6.12 Errors and partial execution

When evidence exists, determine:

- what happens if one action fails after earlier actions succeeded;
- whether the rule is atomic;
- whether later actions/rules continue;
- whether the system disables a bad rule;
- whether errors cause fallback/default delivery;
- whether failures are reported to the user/admin.

Unknown error semantics should remain explicitly unresolved rather than assumed transactional.

### 6.13 Rule metadata that affects execution

Record execution relevance of:

- enabled/disabled state;
- read-only state;
- error state;
- trigger type;
- account/folder scope;
- endpoint capability availability;
- provider-specific layers such as Purelymail account-level versus user-level Sieve.

These may ultimately live outside the semantic expression tree, but they can still change observable rule behavior.

### 6.14 Manual versus automatic execution

If a system supports manual re-running of filters, compare it with automatic execution.

Determine whether there are differences in:

- available predicates;
- available actions;
- target folder scope;
- forwarding/reply behavior;
- junk-classification state;
- stop semantics;
- treatment of already-moved messages.

Do not assume manual execution is simply the same engine with a different button.

## 7. Equivalence-sensitive transformation questions

The system-specific studies should explicitly collect evidence relevant to these future Mailchemy transformations.

### 7.1 Splitting one rule into several rules

Can:

```text
if X → A, B
```

be exactly represented as:

```text
if X → A
if X → B
```

Only if rule ordering, condition re-evaluation, state visibility, and stop behavior make the traces equivalent.

### 7.2 Merging several rules

Can adjacent rules with the same condition be merged into one multi-action rule?

Not if action reordering, stop semantics, or intermediate state observation changes the result.

### 7.3 Replacing move with tag-plus-archive

This common-looking Gmail realization is exact only if later processing and final container/state semantics also line up.

### 7.4 Replacing NOT with exception/native negative operator

Exactness may depend on rule-level continuation and exception scope, not only boolean truth.

### 7.5 Replacing delete with trash-folder movement

Exact only if recoverability, later-rule behavior, and delivery lifecycle match.

These questions should be used as probes, not assumed rewrites.

## 8. Minimal scenario matrix

Each system-specific investigation should try to establish, where applicable, behavior for scenarios like:

| Scenario | What it reveals |
| --- | --- |
| Two matching rules, no stop | all-match versus first-match behavior |
| Matching rule with explicit stop | stop scope |
| Rule 1 marks read; Rule 2 matches unread | state mutation visibility |
| Rule 1 adds tag/category; Rule 2 tests it | metadata mutation visibility |
| Rule 1 moves; Rule 2 also matches original message | move timing / later-rule visibility |
| Rule 1 copies; later rules run | whether copies are reprocessed / state copied |
| Rule 1 trashes/deletes; Rule 2 matches | terminality and lifecycle |
| Rule forwards then later rule mutates | forwarded-message snapshot and continuation |
| Several actions in one rule | declared versus effective action order |
| One action fails after an earlier side effect | partial execution / atomicity |
| Manual run of same filter | trigger-context differences |

Not every system supports every scenario. Unsupported scenarios are themselves useful results.

## 9. Suggested investigation document shape

Each of M19-M22 should generally follow:

```text
# <System> control-flow investigation

## 1. Scope and execution contexts
## 2. Evidence baseline
## 3. Rule ordering and continuation
## 4. Condition evaluation / short-circuiting
## 5. Action ordering
## 6. State mutation visibility
## 7. Move/copy semantics
## 8. Delete/trash/discard/reject semantics
## 9. Forward/reply/external side effects
## 10. Default/implicit delivery
## 11. Stop/return semantics
## 12. Error and partial-execution behavior
## 13. Manual/alternate trigger behavior
## 14. Transformation/equivalence hazards
## 15. Unresolved questions
## 16. Control-flow summary
```

The shape may be adapted where the native system genuinely differs.

## 10. Completion criteria

A system-specific control-flow study is ready for M23 when it can say, with evidence or explicit uncertainty:

- what starts processing;
- how rules are ordered;
- whether all matching rules normally continue;
- what stops continuation and at what scope;
- how action order is determined;
- what message/state later rules observe;
- what move/copy/delete/forward do to continuation;
- how default/implicit delivery works;
- whether manual/alternate triggers differ;
- what major error/partial-execution behavior is known;
- which obvious-looking rule splits/merges are unsafe or still unproven.

Unknown is acceptable. Hidden assumptions are not.

## 11. Expected synthesis output

M23 should be able to compare **execution traces**, not merely native keywords.

The desired end state is enough evidence to say things such as:

- these two stop constructs are exactly equivalent in this context;
- these two move actions share a semantic family but differ in later-rule visibility;
- this source rule can be split safely on target A but not target B;
- this apparent rewrite is invalid because an intermediate mutation becomes visible;
- these systems have equivalent final state only when no later rules exist.

Only after that should Mailchemy freeze control-flow-related semantic contracts or exact rewrites.