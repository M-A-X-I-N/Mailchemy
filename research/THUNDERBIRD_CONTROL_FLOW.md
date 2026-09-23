# Thunderbird message-filter control-flow investigation

## 1. Scope and execution contexts

This investigation covers Thunderbird's core message-filter execution semantics using current Thunderbird documentation and `comm-central` implementation evidence.

Thunderbird has several filter trigger contexts, including:

- incoming mail;
- incoming mail before or after junk classification;
- manual execution on a selected folder;
- post-send;
- archive;
- additional implementation-defined/specialized contexts.

The implementation has more than one execution path. In particular, current source exposes an 'after the fact' executor used for manual/existing-message filtering.

Where source evidence applies specifically to that executor, this document says so rather than silently generalizing it to every automatic incoming path.

## 2. Evidence baseline

Primary sources:

- **Officially documented:** Thunderbird Help — Organize your messages with filters — https://support.mozilla.org/en-US/kb/organize-your-messages-using-filters
- **Implementation-derived:** Searchfox — `nsMsgFilter.cpp` — https://searchfox.org/comm-central/source/mailnews/search/src/nsMsgFilter.cpp
- **Implementation-derived:** Searchfox — `nsMsgFilterService.cpp` — https://searchfox.org/comm-central/source/mailnews/search/src/nsMsgFilterService.cpp
- **Implementation-derived:** Searchfox — message-filter interfaces under `mailnews/search/public/`.

## 3. Trigger and execution stage

### 3.1 Incoming execution has selectable timing around junk classification

Thunderbird's UI lets incoming filters run before or after junk/spam classification.

That timing changes which client-derived state may exist when conditions/actions execute.

Therefore one stored condition/action set does not necessarily have one trigger-independent semantic trace.

### 3.2 Automatic incoming filters normally operate on Inbox arrival

Thunderbird Help describes Getting New Mail as the default trigger and notes that automatic filters normally affect newly arriving messages in Inbox.

### 3.3 Manual execution has explicit folder scope

Manual Run Filters can apply selected filters to messages in a selected folder.

This differs structurally from the automatic incoming trigger because the initial message already exists in mailbox storage.

### 3.4 Post-send and archive are distinct triggers

Rules enabled for After Sending or Archiving execute in different lifecycle stages and must not be assumed to share every available action/state semantic with incoming rules.

## 4. Rule ordering and continuation

### 4.1 Filters are ordinarily ordered

Thunderbird Help states that filters are executed in the order they appear in the filter list.

That order is user-visible and user-controlled.

### 4.2 Effective ordering may be adjusted when necessary

Thunderbird Help also documents that the requested order is not always executable.

Its example describes an earlier move filter and a later reply filter: because replying after the message has moved would fail, Thunderbird changes the effective ordering so the reply can occur before the move.

This is unusually important for Mailchemy:

```text
displayed rule order
may differ from
effective execution order
```

The precise implementation mechanism for all cross-filter reorder cases was not established by the source review, so the documented behavior should be treated as authoritative while the exact algorithm remains unresolved.

### 4.3 StopExecution suppresses later filters

Current filter-service source tracks messages for which filtering has been stopped.

In the after-the-fact/manual executor, the StopExecution action adds matched messages to the stop-filtering set so subsequent filters do not process those messages.

## 5. Condition evaluation

Thunderbird's filter conditions are evaluated using its message-search machinery.

The reviewed execution source does not establish a universal side-effecting condition language like Sieve variables/match captures.

Condition ordering is therefore less control-flow-sensitive than action/state sequencing for the built-in terms.

Custom extension terms could theoretically introduce additional behavior; no generic exact contract is assumed for them.

## 6. Effective action ordering within one filter

### 6.1 Actions are deliberately normalized

`nsMsgFilter.cpp::GetSortedActionList` explicitly states that filter actions form a unit but that some ordering constraints must be imposed.

The current implementation broadly orders actions as:

1. Fetch body from POP3 server;
2. ordinary/normal actions, preserving their relative order;
3. CopyToFolder actions;
4. MoveToFolder or Delete;
5. StopExecution.

Thus the saved/UI action order is **not** a free arbitrary execution sequence.

### 6.2 Thunderbird minimizes reordering but correctness wins

The implementation attempts to reorder as little as possible while enforcing the above constraints.

This gives Mailchemy a direct example of why an unordered 'set of actions' and an arbitrary ordered 'action list' are both insufficient abstractions by themselves.

### 6.3 Some action interleavings cannot be represented in one filter

The source explicitly calls out a sequence like:

```text
tag A
copy
tag B
copy a differently-tagged state
```

as something Thunderbird cannot represent as one filter under its action ordering rules. Separate filters are required.

That is a genuine native expressiveness constraint.

## 7. State mutation visibility

### 7.1 Manual/after-the-fact executor applies state mutations before moving to the next filter

Current `nsMsgFilterService.cpp` code for the after-the-fact path performs state actions such as:

- MarkRead;
- MarkUnread;
- MarkFlagged;
- AddTag;

against the current message/folder and then continues to the next action/filter.

Thus for that execution path, later filter processing occurs after those mutations have been applied.

### 7.2 Later manual filters may therefore observe changed database state

For built-in predicates that inspect read/tag/flag state, the implementation structure supports later filters seeing those earlier mutations in the manual/after-the-fact path.

This is **implementation-derived for that path**, not yet a universal claim for every automatic incoming-filter path.

### 7.3 Trigger context must remain part of support/refinement

A translation whose exactness depends on:

```text
Rule 1 marks read
Rule 2 tests unread
```

cannot simply say 'Thunderbird supports this' without specifying which execution context has been proven.

## 8. Move and copy semantics

### 8.1 Move is terminal for further filtering in the manual/after-the-fact executor

Current source marks messages moved by MoveToFolder as stopped for subsequent filtering.

It also skips the remaining actions for that message after initiating the move.

This gives MoveToFolder an effective terminal role in that execution path.

### 8.2 Move failure can still terminate/disable processing

The source contains failure paths where an invalid or unavailable move target causes the filter to be disabled and remaining actions skipped.

Therefore 'move failed' does not imply a clean transactional rollback followed by ordinary continuation.

### 8.3 Copy is not terminal

CopyToFolder is executed asynchronously and then filtering continues.

The copied message is a side effect; the original message remains the subject of the current filter pass.

Whether the newly created copy independently triggers another filter pass depends on account/trigger behavior and is not established as a universal rule here.

### 8.4 Official help agrees that move affects later filtering

Thunderbird Help warns that moving a message can prevent later filters from operating on it, which is why execution order may be adjusted.

This makes move semantics materially different from Outlook's documented 'move does not inherently stop later rules' model.

## 9. Delete semantics

### 9.1 Delete is terminal for the message in the manual/after-the-fact executor

Current source stops further filtering for messages processed by the Delete action and skips remaining actions for that message.

### 9.2 Delete's mailbox/protocol lifecycle meaning is separate

Exactly what Delete does to storage depends on account type and deletion settings.

Therefore two independent semantic questions exist:

- does Delete stop this filter execution trace?;
- what mailbox lifecycle result does Delete produce?

Mailchemy should not collapse those into one generic delete capability.

## 10. Forward, reply, and external side effects

Thunderbird has built-in Forward and Reply actions.

The official ordering guidance demonstrates that reply/forward-like actions may need to happen before movement removes access to the message.

The exact message construction, send-failure behavior, and duplicate/retry semantics were not established deeply enough here to claim equivalence with Sieve redirect, Gmail forwarding, or Outlook forward/redirect.

The important control-flow finding is that external-message actions participate in Thunderbird's action/rule ordering constraints rather than implicitly terminating the rule set.

## 11. Default delivery

Thunderbird incoming filters operate on mail being delivered into the client/account's normal folder flow.

There is no Sieve-style explicit implicit-keep variable in the filter representation.

A no-move/no-delete rule ordinarily leaves the message in its existing/default location while applying metadata or side effects.

Move/Delete alter that lifecycle state.

Manual execution begins with an already-stored message, making 'default delivery' largely inapplicable to that trigger.

This is another reason trigger context must be modeled separately from condition/action semantics.

## 12. StopExecution semantics

### 12.1 StopExecution is an explicit action

Thunderbird has a native StopExecution action.

### 12.2 Current action sorting places it last

The current sorted action list puts StopExecution after move/delete class actions.

That means it cannot be used as an arbitrary intra-rule barrier between two other actions.

### 12.3 Manual executor uses it to prevent later filters

In the after-the-fact path, StopExecution marks the message so subsequent filters are skipped.

Its semantic scope is therefore later-filter suppression for the message, not 'return from a nested script'.

## 13. Errors and partial execution

### 13.1 Execution is not globally atomic

The implementation performs actions and asynchronous folder operations incrementally.

Earlier mutations/side effects can occur before a later action encounters an error.

### 13.2 Failure handling is action-specific

Current source contains different behaviors depending on the failing action, including:

- logging/reporting errors;
- skipping remaining actions;
- disabling a filter when its move target is invalid;
- continuing the outer filter process in other cases.

There is no evidence for a universal rollback transaction across a filter's actions.

### 13.3 Disabled filters have execution-context edge cases

Source comments note edge cases during multi-folder/manual processing where a filter disabled as a result of an error may still have already participated in the current run.

This reinforces the distinction between persistent enabled state and the already-started execution trace.

## 14. Manual versus automatic execution

### 14.1 Manual execution is a first-class trigger

Thunderbird explicitly supports running filters manually against a selected folder.

### 14.2 Manual source evidence should not be overgeneralized

The strongest source-level evidence for:

- move/delete terminality;
- mutation visibility;
- StopExecution tracking;

comes from the after-the-fact/manual executor.

Official help supports the broad notions of ordered filters, move-sensitive execution, and multiple trigger contexts, but the automatic incoming path may use different implementation machinery.

Therefore this document intentionally records:

```text
proved for manual/after-the-fact path
!= automatically
proved for every Thunderbird trigger
```

### 14.3 Junk-stage choice changes available state

Incoming filters can run before or after junk classification, so junk predicates/actions and body availability may differ across trigger timing.

## 15. Transformation and equivalence hazards

### 15.1 Merging separate filters into one can change action order

Two separate filters can establish an observable state boundary:

```text
Filter 1: tag A
Filter 2: copy
Filter 3: tag B
```

Merging those into one multi-action filter may cause Thunderbird's action sorter to move copy after both tag actions, changing the copied message state.

This is a concrete example where rule merging is **not semantics-preserving**.

### 15.2 Splitting one filter can also change terminality

Because move/delete and StopExecution have special terminal behavior, distributing actions across several filters can expose or suppress later rules differently.

### 15.3 Move is not portable as a generic non-terminal action

Thunderbird's manual executor treats move as terminal for further filtering, while Outlook documents move and stop as separate.

Any shared Move semantic will therefore need control-flow context/refinement.

### 15.4 Saved action order cannot be round-tripped as arbitrary execution order

If a source system depends on an interleaving Thunderbird normalizes away, encoding it into one Thunderbird filter is not exact.

### 15.5 Trigger context can invalidate an otherwise valid rewrite

A rewrite proven for manual execution may not automatically be valid for incoming-before-junk, incoming-after-junk, post-send, or archive triggers.

## 16. Minimal scenario results

| Scenario | Thunderbird result |
| --- | --- |
| Two matching filters, no terminal action | normally execute in list order; effective ordering can be adjusted when required |
| Explicit StopExecution | later filters skipped for matched message in manual executor |
| Filter 1 marks read; Filter 2 tests unread | mutation is applied before next filter in manual/after-the-fact path; automatic path not universally proven |
| Filter 1 adds tag; Filter 2 tests tag | same manual-path visibility conclusion |
| Filter 1 moves; Filter 2 matches | move stops further filtering in manual executor; official help warns move affects later filters |
| Filter 1 copies; later rules run | copy is non-terminal in manual executor |
| Filter deletes; later rule | delete stops further filtering in manual executor |
| Several actions in one filter | actions are reordered by class; arbitrary interleaving unsupported |
| Reply lower than move | official Help says effective execution may be reordered so reply occurs before move |
| One action fails after prior state changes | no global rollback; handling is action-specific |
| Manual run | first-class selected-folder trigger with strong source-level evidence |

## 17. Unresolved questions

1. Exact parity/differences between the automatic incoming executor and the after-the-fact/manual executor for mutation visibility and move/delete terminality.
2. Exact algorithm used for cross-filter reordering described by Thunderbird Help.
3. Whether and when a copied message enters a fresh automatic filtering pass.
4. Detailed Forward/Reply failure and message-snapshot semantics.
5. Delete lifecycle across IMAP, POP, and local-folder configurations.
6. Exact behavior of custom extension actions within action sorting/terminality.
7. Whether StopExecution semantics differ across post-send/archive/other triggers.
8. Detailed body availability interactions before versus after junk classification.

## 18. Control-flow summary

Thunderbird has the most visibly normalized execution model among the initial targets:

- filters are ordered, but effective ordering may be adjusted when an earlier move would prevent a later action;
- actions inside one filter are sorted into semantic classes;
- arbitrary action interleavings are not representable;
- in the manual/after-the-fact executor, state mutations occur before later filters, Copy is non-terminal, and Move/Delete/StopExecution stop further filtering for the message;
- failures are not globally transactional;
- trigger context materially changes the initial state and sometimes the applicable execution path.

The strongest Mailchemy consequence is that **rule boundaries are semantically meaningful in Thunderbird**. Merging or splitting filters can change action ordering, intermediate state visibility, and terminality even when the same set of conditions/actions appears on paper.