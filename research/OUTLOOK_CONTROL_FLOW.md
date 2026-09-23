# Outlook / Microsoft Graph Inbox Rules control-flow investigation

## 1. Scope and execution context

This investigation covers server-side Outlook Inbox Rules exposed through Microsoft Graph and current Outlook/Outlook.com rule behavior documented by Microsoft.

It focuses on the ordered Inbox Rule model, not Exchange transport rules or classic client-only/custom-action rules.

## 2. Evidence baseline

Primary sources:

- **Officially documented:** Microsoft Graph — messageRule — https://learn.microsoft.com/en-us/graph/api/resources/messagerule?view=graph-rest-1.0
- **Officially documented:** Microsoft Graph — messageRuleActions — https://learn.microsoft.com/en-us/graph/api/resources/messageruleactions?view=graph-rest-1.0
- **Officially documented:** Microsoft Support — Manage email messages by using rules in Outlook — https://support.microsoft.com/en-us/outlook/mail/manage-email-messages-by-using-rules-in-outlook
- **Officially documented:** Microsoft Support — Stop processing more rules in Outlook — https://support.microsoft.com/en-us/outlook/mail/stop-processing-more-rules-in-outlook

## 3. Trigger and execution stage

### 3.1 Inbox Rules apply to incoming messages

Microsoft Graph defines `messageRule` as a rule applied to incoming messages in the user's Inbox.

The persistent automatic execution model is therefore server-side incoming-message processing.

### 3.2 Existing-message/manual execution also exists

Current Outlook interfaces provide commands to run rules on existing messages.

This demonstrates an alternate trigger context, but Microsoft documentation reviewed here does not guarantee that every predicate/action behaves identically between incoming automatic execution and manual 'Run Rules' execution.

Manual execution should remain separately qualified until individual differences are established.

## 4. Rule ordering and continuation

### 4.1 Rule order is explicit

The Graph `messageRule.sequence` property defines the order in which a rule executes among other rules.

Outlook UIs also allow users to move rules up/down in the ordered list.

This is a materially stronger execution contract than Gmail's unordered public filter model.

### 4.2 Processing normally continues unless stopped

Microsoft documentation states that when multiple rules match, later rules continue to be applied when Stop processing more rules is disabled.

The rule sequence therefore represents semantically observable ordering, not merely a display preference.

### 4.3 `stopProcessingRules` stops subsequent rules

The Graph action property `stopProcessingRules` determines whether subsequent rules should be evaluated.

When true on a matching rule:

- that rule's actions apply;
- later rules are ignored even if their conditions would also match.

This is a ruleset-continuation control, not merely an intra-rule action terminator.

### 4.4 UI defaults are not the semantic contract

Microsoft Support documents Stop processing more rules as enabled by default in some Outlook rule-creation flows.

Mailchemy must read/encode the actual rule property rather than treating any UI default as universal semantics.

## 5. Conditions and evaluation

### 5.1 Top-level conditions are conjunctive

Outlook documents configured positive conditions as all needing to match.

Exceptions provide a separate exclusion set.

### 5.2 Exact condition evaluation order is not exposed

The Graph representation does not define an ordered list of condition evaluations or short-circuit behavior.

No condition-side capture/variable mechanism analogous to Sieve match variables is exposed.

Therefore condition evaluation order is not currently an observable semantic dimension for the surveyed typed predicates.

### 5.3 Exceptions are semantic exclusions, not later rules

Exceptions belong to the same rule's match decision.

Mailchemy should not model them as separate lower-priority rules merely because an equivalent boolean form may sometimes exist.

## 6. Action ordering within one rule

### 6.1 Graph actions are fields, not an ordered action list

`messageRuleActions` is a typed object containing independent fields such as:

- moveToFolder;
- copyToFolder;
- delete;
- permanentDelete;
- forwardTo;
- redirectTo;
- assignCategories;
- markAsRead;
- markImportance;
- stopProcessingRules.

The public representation does not provide a user-controlled sequence among those action fields.

### 6.2 Effective intra-rule ordering is underdocumented

The reviewed Microsoft documentation defines what each action means but does not provide a complete total order such as:

```text
mark state -> copy -> forward -> move -> stop
```

Therefore Mailchemy must not infer ordered-action semantics from JSON property order or UI presentation.

### 6.3 Stop-processing concerns later rules

`stopProcessingRules` should not be read as 'stop executing the remaining action fields in this same rule'.

Its documented target is **subsequent rules**.

## 7. State mutation visibility

### 7.1 Rules are sequential, but mutation visibility is incompletely documented

Because rules execute in sequence, it is tempting to assume a later rule always evaluates against state mutated by earlier actions.

The reviewed Microsoft sources do not provide a sufficiently general contract for that assumption across:

- read state;
- categories;
- importance;
- folder location;
- deletion state.

Therefore the scenario:

```text
Rule 1 -> mark as read
Rule 2 -> condition depends on unread state
```

remains **unproven** for exact Mailchemy translation unless the relevant predicate/action combination is separately documented or tested.

### 7.2 Category mutation likewise requires evidence

Graph can assign categories, and rules can test categories.

But the reviewed docs do not explicitly state whether a category assigned by Rule 1 is visible to Rule 2's match evaluation during the same incoming-rule pass.

Do not infer visibility merely from the fact that both features exist.

## 8. Move and copy semantics

### 8.1 Move does not inherently terminate rule processing

Microsoft's Stop processing more rules documentation gives a concrete example in which:

- an earlier rule moves a matching message to a folder;
- a later matching rule can still perform another action unless Stop processing more rules is selected.

This proves that **move and stop are distinct control-flow semantics**.

Mailchemy must not model `moveToFolder` as intrinsically terminal.

### 8.2 Copy is independently available

`copyToFolder` is a distinct action and does not carry an explicit stop semantic in its definition.

Whether the copied message itself enters another rule pass is not established by the reviewed documentation and should not be assumed.

### 8.3 Match snapshot after move remains partially unresolved

The documentation proves that later rules can still matter after an earlier move, but it does not fully define whether later predicates evaluate:

- the original Inbox-context snapshot;
- the mutated current message state;
- or action-specific/provider-internal state.

This distinction matters if a later predicate depends on folder membership or another prior mutation.

## 9. Delete and lifecycle semantics

### 9.1 Soft delete and permanent delete are distinct actions

`delete` moves the message to Deleted Items.

`permanentDelete` deletes it without retaining it in Deleted Items.

### 9.2 Neither action should be assumed equivalent to stop-processing

The action model has a separate `stopProcessingRules` property.

That separation is evidence against treating delete-like actions as synonymous with continuation control.

However, exact later-rule behavior after delete/permanent-delete is not fully specified by the reviewed docs and remains an explicit research gap.

### 9.3 Move-to-Deleted-Items is not Sieve discard/reject

Even if a later rule cannot practically act on a deleted message in some context, the delivery/lifecycle meaning differs from silent pre-delivery discard or rejection.

## 10. Forward, redirect, and external side effects

Outlook exposes distinct actions for:

- forward;
- forward as attachment;
- redirect.

The Graph action object can also contain local state/folder actions.

The reviewed documentation does not define these routing actions as automatically stopping later Inbox Rules.

If a source semantic requires forwarding **and then halting all later rules**, Outlook needs the separate stop-processing state.

Exact message snapshot, ordering, and failure interaction between routing and local actions remain underdocumented.

## 11. Default delivery

Outlook Inbox Rules operate on messages destined for the Inbox and mutate their delivery/state according to rule actions.

There is no exposed Sieve-style implicit-keep variable.

Default Inbox delivery is therefore part of the surrounding rule-engine/mailbox lifecycle rather than a first-class rule action state.

Move/delete actions alter that destination/state; copy/category/read actions can coexist with ordinary delivery.

Mailchemy should model the observable delivery result, not import Sieve's implicit-keep mechanism wholesale.

## 12. Stop-processing semantics

`stopProcessingRules = true` is one of the clearest control-flow contracts among the initial targets:

```text
ordered rules
R1 matches
R1 actions execute
R1.stopProcessingRules = true
=> R2 and later rules are not evaluated
```

This scope aligns with **later-rule suppression**, not included-script return or intra-rule action termination.

Any eventual cross-system rewrite must preserve that exact scope.

## 13. Errors and partial execution

### 13.1 Rule health is exposed

Graph provides:

- `hasError` — rule is in an error condition;
- `isReadOnly` — rule cannot be modified/deleted through Rules REST API.

These properties distinguish configured representation from healthy/writable execution.

### 13.2 Runtime transaction semantics are not defined

The reviewed Graph/Support documentation does not state whether multiple actions within a matching rule execute atomically.

Unknowns include:

- whether earlier state mutations remain if a later forward/move fails;
- whether later rules continue after one action fails;
- whether a runtime error automatically marks `hasError`; 
- rollback behavior.

Mailchemy must not assume transactional rule execution.

## 14. Manual / alternate trigger behavior

Outlook can run rules against existing messages.

That provides useful operational parity for some workflows, but exact equivalence with automatic incoming execution remains underdocumented.

Possible differences that need targeted tests before exact modeling include:

- rules/actions unavailable for manual execution;
- current-folder versus Inbox context;
- already-moved/deleted message behavior;
- external forwarding side effects.

## 15. Transformation and equivalence hazards

### 15.1 Splitting one multi-action rule into several ordered rules can change stop scope

Source:

```text
if X -> A, B, stop later rules
```

is not automatically equivalent to:

```text
R1: if X -> A
R2: if X -> B + stop
```

because:

- X is re-evaluated;
- state from A may affect the second match;
- unrelated rules may interleave;
- failure boundaries differ.

### 15.2 Merging rules can suppress intermediate observability

If two rules currently permit another rule to run between them, merging their actions changes the sequence graph.

### 15.3 Move cannot be treated as implicit stop

Microsoft explicitly documents stop-processing as a separate choice after matching actions such as move.

### 15.4 Exceptions should not be rewritten into independent later rules without proof

An exception changes whether the current rule matches at all; a later compensating rule can have different side effects and continuation.

## 16. Minimal scenario results

| Scenario | Outlook result |
| --- | --- |
| Two matching rules, stop disabled | both rules are applied in sequence |
| Matching rule with stop enabled | later rules are ignored |
| Rule 1 moves, Rule 2 matches | move alone does not inherently stop Rule 2; Microsoft documents stop as needed to suppress later rule |
| Rule 1 marks read, Rule 2 tests unread | exact mutation visibility unresolved |
| Rule 1 adds category, Rule 2 tests category | exact mutation visibility unresolved |
| Rule 1 copies, later rules run | no stop implied by copy; copy reprocessing semantics unresolved |
| Delete then later rule | exact continuation/match behavior unresolved; delete and stop are distinct fields |
| Several actions in one rule | Graph action object has no user-defined order |
| Stop plus other actions | stop suppresses subsequent rules, not documented as suppressing same-rule actions |
| Runtime failure after prior action | atomicity/rollback unresolved |
| Manual run | supported for existing messages; semantic differences from incoming mode not fully specified |

## 17. Unresolved questions

1. Whether later rules observe read/category/importance mutations from earlier rules during the same incoming pass.
2. Exact predicate snapshot after a preceding move.
3. Exact continuation behavior after `delete` and `permanentDelete` without stop-processing.
4. Whether copied messages are themselves subject to rule evaluation.
5. Intra-rule action ordering or simultaneity.
6. Runtime failure/rollback semantics for several actions.
7. Exact semantic differences between automatic incoming execution and manual Run Rules.
8. Behavior of `hasError` rules in sequence: skipped, attempted, or otherwise handled.

## 18. Control-flow summary

Outlook/Graph provides a strong explicit ordered-rule model:

- rules have a defined `sequence`;
- matching normally continues through later rules;
- `stopProcessingRules` explicitly suppresses subsequent rules;
- move is **not** synonymous with stop;
- conditions/exceptions belong to one rule's match decision;
- action fields are not a user-ordered list.

The largest remaining uncertainty is **intermediate state visibility**. Microsoft documents rule ordering and stopping clearly, but not a universal snapshot/mutation contract for later rule predicates.

For Mailchemy this means Outlook can directly represent ordered continuation semantics better than Gmail, but state-dependent rule splitting/merging still requires targeted proof.