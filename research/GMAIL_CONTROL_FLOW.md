# Gmail control-flow investigation

## 1. Scope and execution context

This investigation covers Gmail's persistent server-side filters as exposed through the current Gmail product and Gmail API.

It focuses on incoming-message execution and deliberately distinguishes:

- behavior guaranteed by official Gmail documentation/API contracts;
- behavior described only in Google-hosted community answers;
- behavior that remains undocumented and therefore unproven for exact Mailchemy translation.

Gmail's persistent filter model is not an ordered scripting language. The public Filter API exposes criteria and an action object, but no rule sequence, stop-processing field, or general control-flow construct.

## 2. Evidence baseline

Primary sources:

- **Officially documented:** Gmail Help — Create rules to filter your emails — https://support.google.com/mail/answer/6579
- **Officially documented:** Gmail API — Manage Gmail filters — https://developers.google.com/workspace/gmail/api/guides/filter_settings
- **Officially documented:** Gmail API — users.settings.filters — https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.filters

Secondary/supporting evidence:

- **Google-hosted community guidance:** Gmail Community Product Expert answers stating that filters do not have a user-controlled order and are all run against new messages.

Community answers are not normative product contracts. They are retained as useful evidence but are not promoted to official guarantees.

## 3. Trigger and execution stage

### 3.1 Persistent filters target incoming mail

Gmail's official documentation describes filters as rules for managing **incoming email**.

Forwarding through a filter applies to new messages that arrive after the filter is configured.

Replies in an existing conversation are filtered only when the reply itself meets the filter criteria.

### 3.2 Creation-time application to existing conversations is separate

The Gmail UI can optionally apply a newly created filter to existing matching conversations.

That is a one-time creation/edit workflow, not evidence of a persistent manual 'run this rule set now' execution mode analogous to Thunderbird or Outlook Run Rules.

Mailchemy should keep:

```text
persistent incoming filter execution
separate from
one-time apply-to-existing-matches behavior
```

## 4. Rule ordering and continuation

### 4.1 The public model has no rule order

The Gmail Filter resource contains:

- id;
- criteria;
- action.

The list API returns a collection of filters, but there is no `sequence`, priority, ordinal, or stop-processing property in the public filter model.

The API likewise exposes no operation whose semantics are 'move this filter before/after another filter'.

### 4.2 No official stop-processing construct is exposed

There is no public Filter API field equivalent to:

- Sieve `stop`;
- Outlook `stopProcessingRules`;
- Thunderbird StopExecution.

No ordinary Gmail filter action documented by Google is defined as 'stop evaluating later filters'.

### 4.3 Community consensus says all filters are evaluated independently

Google-hosted Gmail Community Product Expert answers repeatedly state, in substance, that Gmail filters:

- do not have an order the user can control;
- are all run against new messages;
- should not be designed to depend on the result of another filter.

This is consistent with the public API shape, but it remains **secondary evidence**, not an authoritative execution specification.

### 4.4 Exact multi-filter scheduling remains unresolved

The official sources reviewed do not specify whether the implementation internally:

- snapshots the original message state and evaluates every filter against it;
- evaluates filters in some internal order while hiding that order;
- batches predicates and later resolves actions;
- or uses another equivalent implementation.

Mailchemy must therefore avoid claiming an exact sequential model where Google has not documented one.

## 5. Condition evaluation

### 5.1 Criteria inside one filter are conjunctive

The public API documents that populated top-level Criteria fields must all be satisfied.

The embedded Gmail `query` and `negatedQuery` strings can themselves contain Gmail-search boolean syntax.

### 5.2 Evaluation order is not part of the public contract

The API does not expose:

- left-to-right criterion order;
- short-circuit behavior;
- condition captures or variables;
- condition-side mutations.

Because Gmail filter predicates are not documented as mutating message state, condition order is normally not externally observable from the public model.

## 6. Action ordering within one filter

### 6.1 The API action is a state-description object, not an ordered list

The public Action resource contains:

- label IDs to add;
- label IDs to remove;
- an optional forwarding destination.

The representation provides no user-defined ordering among those fields.

Therefore a future Gmail codec must not invent source-order semantics such as:

```text
remove Inbox
then add label
then forward
```

unless Google separately documents that ordering.

### 6.2 Effective conflict resolution is underdocumented

Official documentation explains many individual label-based actions, but does not provide a complete precedence/transaction contract for contradictory or interacting actions contributed by several matching filters.

Examples needing caution include combinations around:

- Inbox/archive state;
- Spam/not-spam behavior;
- Important/not-important behavior;
- Trash;
- forwarding from several filters.

Google-hosted community discussions contain observed examples, but they are not strong enough to define canonical Mailchemy semantics.

## 7. State mutation visibility

### 7.1 Label/state changes are observable final effects

Gmail filter actions can add/remove system or user labels, thereby changing states such as:

- Inbox/archive;
- unread/read;
- starred;
- important;
- trash;
- user-label membership.

### 7.2 Later-filter visibility is not officially specified

The crucial trace question:

```text
Filter 1 removes UNREAD
Filter 2 matches is:unread
```

is **not answered precisely by the official documentation reviewed**.

Community guidance that filters should not depend on the result of other filters suggests independent evaluation rather than reliable chaining, but this should not be upgraded to a normative guarantee.

For Mailchemy, any exact translation that depends on one Gmail filter's state mutation changing another filter's match result is therefore unsupported/unproven until experimentally established for a defined product version/account context.

### 7.3 Same warning applies to labels

Likewise:

```text
Filter 1 adds user label X
Filter 2 matches label:X
```

must not be assumed to form a reliable sequential pipeline.

## 8. Archive, Trash, and other lifecycle actions

### 8.1 Archive is a label-state mutation

Skip Inbox / Archive is represented by removing the `INBOX` label.

It is not a terminal 'move' operation in the public filter representation.

Google-hosted community guidance explicitly says archiving does not stop other filters from applying, but again that statement is secondary rather than a formal API contract.

### 8.2 Delete means adding Trash state

The documented filter Delete action is represented by adding the `TRASH` label.

It is not the same operation as the Gmail API's immediate/permanent message deletion methods.

### 8.3 Terminality is not exposed

Neither archive nor Trash carries a documented stop-processing flag in the filter model.

Thus Mailchemy should not translate Sieve `stop`, Outlook stop-processing, or Thunderbird StopExecution into any Gmail archive/delete action.

## 9. Forwarding and external side effects

### 9.1 Forward is an independent filter action

The public filter action can forward matching incoming messages to a pre-verified forwarding address.

Forwarding does not structurally replace the label add/remove portions of the action object.

### 9.2 Local-delivery cancellation is not represented as part of forward

The public model does not define `forward` as a terminal routing action analogous to Sieve redirect cancelling implicit keep.

Local Inbox/archive/trash state remains controlled separately through label actions.

### 9.3 Multi-filter forwarding interaction is not an official contract

Google-hosted community reports suggest multiple matching forwarding filters can produce multiple forwards, but those reports are secondary and sometimes context-dependent.

Mailchemy should not register an exact 'multiple forward accumulation' rule without stronger evidence or direct tests.

## 10. Default delivery

Gmail does not expose a Sieve-style explicit 'implicit keep' state.

Operationally, an incoming message remains in its normal Gmail delivery state unless filter actions alter that state, for example by removing `INBOX`, adding `TRASH`, or changing Spam behavior.

That outcome should not be modeled by simply copying Sieve's implicit-keep machinery into Gmail.

The useful abstraction is likely:

```text
default Gmail delivery/state
+ cumulative filter state changes
```

but exact multi-filter accumulation semantics still require stronger evidence.

## 11. Stop and continuation semantics

Gmail exposes no user-visible or public-API equivalent to an explicit stop-processing control.

Consequently:

- a source rule whose exact meaning depends on halting later rules cannot be directly represented as a Gmail filter through a stop primitive;
- splitting an ordered source ruleset into Gmail filters may change semantics if later source rules were conditionally suppressed;
- preserving only final action sets is insufficient when source continuation itself is observable.

## 12. Errors and partial execution

The public Gmail filter documentation reviewed does not define transactional semantics for:

- one action failing while another succeeds;
- one matching filter failing while others match;
- forwarding failure combined with label actions;
- rollback of earlier label changes.

Therefore action/filter atomicity is **unresolved**.

Endpoint validation errors during filter creation are a separate concern from runtime action failure.

## 13. Manual and alternate execution

Gmail's filter UI can apply a filter to existing matching conversations at creation/edit time.

The reviewed documentation does not establish this as a general reusable manual-execution engine with semantics guaranteed identical to incoming-message execution.

It should therefore remain a distinct endpoint/UI operation in Mailchemy research.

## 14. Transformation and equivalence hazards

### 14.1 Ordered source rules cannot be naively flattened into Gmail filters

A source ruleset such as:

```text
R1: if X -> mark read; stop
R2: if unread -> label Y
```

depends on sequencing and stop semantics that Gmail's public filter model does not expose.

### 14.2 Splitting one Gmail filter into several may be unsafe

Even when the final action sets look additive, exact equivalence is unproven when:

- one filter changes state another filter can query;
- filters contain conflicting system-label changes;
- forwarding side effects are duplicated;
- product-internal conflict resolution matters.

### 14.3 Merging filters can alter criteria/action relationships

Combining filters with different predicates into one Gmail query may require boolean rewrites, and combining action objects may alter conflicts or forwarding behavior.

### 14.4 Tag-plus-archive is not a generic move primitive

Removing `INBOX` plus adding a user label produces a Gmail-native filing state, but it does not become equivalent to mailbox movement merely because no later Gmail filter behavior is visible.

## 15. Minimal scenario results

| Scenario | Current Gmail evidence |
| --- | --- |
| Two matching filters, no stop | public model permits both to exist; secondary Google-hosted guidance says all filters run |
| Explicit stop | unsupported: no stop field/construct |
| Filter 1 marks read; Filter 2 matches unread | exact visibility/order unresolved; do not rely on chaining |
| Filter 1 adds label; Filter 2 matches label | exact visibility/order unresolved; do not rely on chaining |
| Filter 1 archives; Filter 2 matches | archive has no stop primitive; secondary guidance says other filters still run |
| Filter 1 trashes; Filter 2 matches | exact conflict/continuation semantics not authoritatively specified |
| Several actions in one filter | represented as unordered action fields/sets, not a user-ordered list |
| Forward plus label changes | both can be represented in one action object; commit/ordering semantics unresolved |
| Runtime failure of one action | atomicity/partial-execution behavior unresolved |
| Manual run | only creation/edit-time apply-to-existing behavior documented; not a general ordered rerun model |

## 16. Unresolved questions

1. Precise internal match snapshot used when several filters match the same incoming message.
2. Whether state mutations from one filter can ever affect another filter's criteria during the same delivery pass.
3. Formal conflict precedence for contradictory system-label actions from several filters.
4. Atomicity/partial-failure behavior when forwarding and label mutations coexist.
5. Exact behavior of several matching forwarding filters.
6. Whether UI-only actions such as Send template participate in the same execution model as API-representable actions.
7. Whether one-time 'apply to matching conversations' uses exactly the same conflict/action semantics as incoming execution.

## 17. Control-flow summary

Gmail's public filter model is notable as much for what it **does not expose** as for what it does:

- no user-controlled rule sequence;
- no stop-processing primitive;
- no ordered action list;
- no variables or documented sequential state pipeline.

Official documentation establishes incoming-message filtering and individual action semantics, but not a complete multi-filter execution trace.

Google-hosted community guidance strongly suggests an all-filters, non-orderable model in which filters should not depend on results of earlier filters. Because that evidence is secondary, Mailchemy should treat sequential chaining and mutation visibility as **unproven**, not as guaranteed semantics.

The practical consequence is strict: ordered/stateful source rules can only be translated to Gmail exactly when their result does not depend on ordering, stop behavior, or intermediate mutation visibility.