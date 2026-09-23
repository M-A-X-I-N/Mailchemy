# Outlook / Microsoft Graph Inbox Rules semantic-surface survey

## 1. Scope

This survey describes the server-side Outlook Inbox Rule model exposed through Microsoft Graph v1.0 and the corresponding current Outlook/Outlook.com rule behavior documented by Microsoft.

The primary target is the rule system represented by:

```text
/m(e|users/...)/mailFolders/inbox/messageRules
```

This includes the motivating personal Microsoft-account case such as Outlook.com/Hotmail where Microsoft Graph supports delegated rule access.

This survey intentionally does **not** treat every historical/classic Outlook client-side rule type as part of the same writable Graph surface.

### 1.1 Evidence baseline

Primary sources:

- **Officially documented:** [Microsoft Graph — messageRule resource](https://learn.microsoft.com/en-us/graph/api/resources/messagerule?view=graph-rest-1.0)
- **Officially documented:** [Microsoft Graph — messageRulePredicates](https://learn.microsoft.com/en-us/graph/api/resources/messagerulepredicates?view=graph-rest-1.0)
- **Officially documented:** [Microsoft Graph — messageRuleActions](https://learn.microsoft.com/en-us/graph/api/resources/messageruleactions?view=graph-rest-1.0)
- **Officially documented:** [Microsoft Graph — Create rule](https://learn.microsoft.com/en-us/graph/api/mailfolder-post-messagerules?view=graph-rest-1.0)
- **Officially documented:** [Microsoft Graph — Update rule](https://learn.microsoft.com/en-us/graph/api/messagerule-update?view=graph-rest-1.0)
- **Officially documented:** [Microsoft Graph — Get rule](https://learn.microsoft.com/en-us/graph/api/messagerule-get?view=graph-rest-1.0)
- **Officially documented:** [Microsoft Graph — Organize Outlook messages](https://learn.microsoft.com/en-us/graph/outlook-organize-messages)
- **Officially documented:** [Microsoft Graph — sizeRange](https://learn.microsoft.com/en-us/graph/api/resources/sizerange?view=graph-rest-1.0)
- **Officially documented:** [Microsoft Graph — outlookCategory](https://learn.microsoft.com/en-us/graph/api/resources/outlookcategory?view=graph-rest-1.0)
- **Officially documented:** [Microsoft Support — Manage email messages by using rules in Outlook](https://support.microsoft.com/en-us/outlook/mail/manage-email-messages-by-using-rules-in-outlook)
- **Officially documented:** [Microsoft Support — Stop processing more rules in Outlook](https://support.microsoft.com/en-us/outlook/mail/stop-processing-more-rules-in-outlook)

The Graph resource documentation cited here was current in Microsoft Learn during this 2026 survey. The rule-resource pages themselves were last updated between 2024 and 2025.

## 2. Native rule model

### 2.1 Inbox message rules

**Evidence: Officially documented — Microsoft Graph.**

A `messageRule` represents a rule that applies to incoming messages in a user's Inbox.

The Graph resource contains:

| Property | Semantic/operational role |
| --- | --- |
| `conditions` | predicates that trigger the rule |
| `exceptions` | predicates that exclude matching messages |
| `actions` | actions to perform |
| `displayName` | human-visible name |
| `id` | unique rule identifier, read-only |
| `isEnabled` | whether the rule is active |
| `sequence` | execution order among rules |
| `hasError` | whether the rule is in an error condition, read-only |
| `isReadOnly` | rule cannot be modified/deleted through Rules REST API |

The public REST API supports:

- list;
- get;
- create;
- update/PATCH;
- delete.

This contrasts with Gmail's create/delete replacement model.

### 2.2 Conditions, exceptions, actions

**Evidence: Officially documented — Graph and Microsoft Support.**

A rule may contain:

- multiple conditions;
- multiple actions;
- multiple exceptions.

Microsoft's Outlook on the web documentation describes the UI in explicitly logical terms:

- the message must match **all** configured conditions;
- actions are all performed;
- an exception applies if it matches **any** configured exception condition.

That gives the ordinary rule shape:

```text
ALL conditions
AND NOT(ANY exceptions)
→ perform configured actions
```

This should not be confused with Exchange transport/mail-flow rules, which are a different rule system even though some terminology overlaps.

### 2.3 Ordered rule collection

**Evidence: Officially documented — messageRule `sequence`; Outlook Support.**

Rules are ordered.

The `sequence` property identifies execution order, and Outlook's UI exposes changing rule order.

Detailed multi-rule execution is analyzed in [`OUTLOOK_CONTROL_FLOW.md`](OUTLOOK_CONTROL_FLOW.md), but order is part of the native model rather than merely UI presentation.

## 3. Conditions and match semantics

Graph exposes one `messageRulePredicates` structure for both conditions and exceptions.

### 3.1 Text/content predicates

**Evidence: Officially documented — messageRulePredicates.**

The following collection-valued predicates are exposed:

| Predicate | Documented meaning |
| --- | --- |
| `bodyContains` | strings that should appear in message body |
| `bodyOrSubjectContains` | strings that should appear in body or subject |
| `headerContains` | strings that should appear in message headers |
| `recipientContains` | strings appearing in To or Cc recipients |
| `senderContains` | strings appearing in From |
| `subjectContains` | strings appearing in Subject |

Microsoft's resource reference documents these as "contains"/"appear" predicates but does **not** in the reviewed source precisely specify:

- case sensitivity;
- Unicode/canonicalization rules;
- tokenization;
- whether multiple values inside one collection use OR semantics;
- exact substring boundary behavior;
- how display names and email addresses are rendered for the string-oriented sender/recipient predicates.

These details therefore remain **unresolved** rather than inferred.

### 3.2 Exact/specific address predicates

**Evidence: Officially documented — messageRulePredicates.**

Graph separately exposes structured `recipient` collections:

- `fromAddresses` — specific sender email addresses;
- `sentToAddresses` — specific destination addresses.

That distinction strongly suggests two separate native semantics:

```text
senderContains("adele")
vs
fromAddresses([{address: "adele@example.com"}])
```

The first is a string-containment-style sender predicate; the second identifies specific email addresses.

Mailchemy should not collapse them until their exact matching contracts are established.

### 3.3 Recipient-position predicates

**Evidence: Officially documented — messageRulePredicates.**

Graph exposes several mailbox-owner-relative recipient predicates:

- `sentCcMe`;
- `sentOnlyToMe`;
- `sentToMe`;
- `sentToOrCcMe`;
- `notSentToMe`.

These are semantically richer than generic address-string matching because they refer to the mailbox owner and recipient position.

### 3.4 Attachment and message-type predicates

**Evidence: Officially documented — messageRulePredicates.**

Boolean predicates include:

- `hasAttachments`;
- `isApprovalRequest`;
- `isAutomaticForward`;
- `isAutomaticReply`;
- `isEncrypted`;
- `isMeetingRequest`;
- `isMeetingResponse`;
- `isNonDeliveryReport`;
- `isPermissionControlled`;
- `isReadReceipt`;
- `isSigned`;
- `isVoicemail`.

These expose provider/mail-system message classifications not obviously reducible to raw header checks without evidence.

### 3.5 Importance, sensitivity, action flag

**Evidence: Officially documented — messageRulePredicates.**

The rule model can test:

- `importance`: `low`, `normal`, `high`;
- `sensitivity`: `normal`, `personal`, `private`, `confidential`;
- `messageActionFlag`: values such as `call`, `followUp`, `forward`, `reply`, `review`, and others.

These are native message-state/property predicates rather than general text search.

### 3.6 Categories as predicates

**Evidence: Officially documented — messageRulePredicates / outlookCategory.**

The `categories` predicate tests categories associated with the incoming message.

Outlook categories are user-defined organizational tags. Multiple categories may be applied to one item.

This is distinct from mailbox-folder membership.

### 3.7 Size range

**Evidence: Officially documented — sizeRange.**

`withinSizeRange` uses:

- `minimumSize`;
- `maximumSize`;

measured in kilobytes.

Microsoft describes the incoming message as needing to fall within that range for the predicate to apply.

The exact boundary inclusivity at equal minimum/maximum values was not explicitly stated in the reviewed resource page and should not be guessed.

## 4. Logical composition

### 4.1 Conditions

**Evidence: Officially documented — Outlook on the web Support.**

The UI describes rules as matching **all** configured conditions.

Thus multiple top-level conditions are conjunctive.

### 4.2 Exceptions

**Evidence: Officially documented — Outlook on the web Support.**

The UI describes the exception section as:

> Except if it matches any of these conditions

Thus multiple exceptions are disjunctive exclusions.

Conceptually:

```text
match = AND(conditions) AND NOT(OR(exceptions))
```

### 4.3 No arbitrary general-purpose predicate AST in Graph

The Graph resource provides a fixed predicate-property structure.

It does not expose arbitrary nested AND/OR/NOT expression nodes comparable to Sieve's `allof/anyof/not`.

Where a desired behavior requires OR across independent condition families, separate ordered rules may be necessary.

Exactly how equivalent such decompositions are depends on later control-flow analysis.

## 5. Actions and state transitions

### 5.1 Folder actions

**Evidence: Officially documented — messageRuleActions.**

Graph exposes:

- `moveToFolder` — move to folder ID;
- `copyToFolder` — copy to folder ID.

Move and copy are distinct semantics.

The destination is represented by folder identifier, not by a filter-local display-name string.

### 5.2 Delete versus permanent delete

**Evidence: Officially documented — messageRuleActions.**

Graph distinguishes:

- `delete: true` — move the message to **Deleted Items**;
- `permanentDelete: true` — permanently delete it without saving in Deleted Items.

These must not be represented as one generic "delete" semantic without preserving the distinction.

### 5.3 Forwarding and redirect families

**Evidence: Officially documented — messageRuleActions.**

Graph exposes three distinct recipient-routing actions:

- `forwardTo`;
- `forwardAsAttachmentTo`;
- `redirectTo`.

The API intentionally distinguishes ordinary forwarding, forwarding as an attachment, and redirection.

Exact envelope/header behavior and cross-system equivalence should be established before mapping any of these to Sieve `redirect` or Gmail forwarding.

### 5.4 Read and importance state

Graph exposes:

- `markAsRead`;
- `markImportance` with `low`, `normal`, `high`.

These mutate independent message-state properties.

### 5.5 Categories

`assignCategories` applies a list of category names to the message.

Outlook categories are non-exclusive tags; one message may carry multiple categories.

Assigning a category is therefore semantically distinct from moving/copying the message to a folder.

### 5.6 Stop processing rules

`stopProcessingRules` determines whether later rules should be evaluated.

This is an explicit control-flow action/property and is preserved here for completeness, with deeper analysis in [`OUTLOOK_CONTROL_FLOW.md`](OUTLOOK_CONTROL_FLOW.md).

## 6. Container and message-state model

### 6.1 Mail folders are hierarchical organizational containers

**Evidence: Officially documented — Outlook mail API.**

Outlook supports a folder-oriented mailbox model, and Graph rule actions copy or move messages to specific mail-folder IDs.

This is much closer to traditional mailbox filing than Gmail's many-label model.

### 6.2 Categories are independent tagging metadata

**Evidence: Officially documented — outlookCategory.**

Outlook categories:

- are user-defined in a master category list;
- have a unique display name within that list;
- have an associated color;
- can be applied in multiples to messages and other Outlook items.

Thus the Outlook native model supports **both**:

```text
folder membership
+
multi-valued category tagging
```

A future Mailchemy model must not force those into one organizational primitive.

### 6.3 Deleted Items is not permanent deletion

The native actions explicitly distinguish moving to Deleted Items from permanent deletion.

This is semantically similar to a trash/container lifecycle distinction, not simply one boolean deleted state.

## 7. Representation and store boundary

### 7.1 Graph resource representation

The native server-rule representation exposed by Graph is JSON over `messageRule`, `messageRulePredicates`, and `messageRuleActions`.

This representation is provider-specific and typed rather than embedding a free-form query language like Gmail's `query`.

### 7.2 Graph is also the remote endpoint

Microsoft Graph provides the remote store/API operations for Inbox Rules:

- list/get;
- create;
- update;
- delete.

Architecturally, Mailchemy should still separate:

```text
Outlook Inbox Rule codec semantics
from
Microsoft Graph transport/store mechanics
```

even though they are tightly coupled by Microsoft's API.

### 7.3 Personal Microsoft accounts

**Evidence: Officially documented — create/update/get endpoints.**

For personal Microsoft accounts, delegated rule access is supported.

The current create/update API documentation lists:

```text
MailboxSettings.ReadWrite
```

as the least-privileged delegated permission for personal accounts.

Read-only get operations can use `MailboxSettings.Read`.

This confirms Outlook.com/Hotmail as a viable initial endpoint target without requiring Mailchemy to pretend all Microsoft mail products share one rule implementation surface.

## 8. Provider/client boundaries

### 8.1 Graph Inbox Rules are not every Outlook rule ever created

**Evidence: Officially documented — Microsoft Support / messageRule.**

Classic Outlook historically supports client-side/custom-action rules that require local Outlook and installed components.

Microsoft Support notes that custom action add-in rules can run only on the computer where the add-in exists and while Outlook is running.

Those are outside the ordinary Graph Inbox Rule semantic surface surveyed here.

### 8.2 Read-only rules

Graph exposes `isReadOnly` specifically to indicate a rule that **cannot be modified or deleted by the Rules REST API**.

This proves that rule visibility/readability and rule writability are separate capabilities even inside the same endpoint family.

### 8.3 Error-state rules

`hasError` is read-only and reports that a rule is in an error condition.

A future decoder/synchronizer must not silently treat such a rule as healthy merely because its JSON is retrievable.

## 9. Limits and validation

### 9.1 Required create fields

**Evidence: Officially documented — Create rule.**

The Graph create endpoint typically requires:

- `actions`;
- `displayName`;
- `sequence`.

Conditions and exceptions are optional in the API model.

That means Graph can structurally represent a rule without an explicit positive condition, although product/UI behavior and usefulness of such rules should be verified before assuming universal "match all" semantics.

### 9.2 Writable/read-only property distinction

Some properties are read-only or conditionally unmodifiable:

- `id`;
- `hasError`;
- a rule with `isReadOnly = true` cannot be modified/deleted through Rules REST API.

### 9.3 Matching details are incompletely specified

The Graph predicate reference describes semantic categories but leaves several exact matching details undocumented.

For Mailchemy, undocumented behavior is a **restriction on what we can currently prove**, not permission to infer conventional Outlook behavior.

### 9.4 Folder target validity

Rule move/copy destinations are folder IDs. Creation/selection of destination folders uses other Graph mail-folder APIs.

Endpoint/account state can therefore invalidate an otherwise meaningful "move to folder X" request.

This is store/account-state validation, separate from the semantic concept of moving.

## 10. Control-flow facts for later follow-up

These facts are preserved here and studied systematically in [`OUTLOOK_CONTROL_FLOW.md`](OUTLOOK_CONTROL_FLOW.md).

### 10.1 Explicit sequence

`sequence` identifies rule execution order.

### 10.2 Stop-processing behavior

**Evidence: Officially documented — Microsoft Support.**

When Stop processing more rules is enabled on a matching rule, subsequent rules are ignored even if they would also apply.

Outlook on the web documentation says that with the option disabled, all matching inbox rules are applied.

### 10.3 UI default

Microsoft Support currently documents Stop processing more rules as enabled by default in Outlook on the web in relevant rule-creation flows.

Default UI state is not itself a semantic requirement of the Graph resource, so a Mailchemy adapter must read/write the actual rule state rather than assuming the default.

### 10.4 Interaction between move/delete and later rules

The exact effect of folder moves, deletes, redirects, and state mutation on later rule evaluation is analyzed further in [`OUTLOOK_CONTROL_FLOW.md`](OUTLOOK_CONTROL_FLOW.md).

No conclusion is made here.

## 11. Decode/encode asymmetries

### 11.1 Readable but not writable rules

`isReadOnly` creates an explicit asymmetry:

```text
rule can exist / be represented
but
Rules REST API cannot modify or delete it
```

A future synchronizer must surface that rather than claiming full bidirectional support.

### 11.2 Error-state rules

A retrieved rule can have `hasError = true`.

Decoding its declared predicates/actions is therefore not equivalent to asserting that the server can currently execute it correctly.

### 11.3 Client-only/custom-action rules

Classic Outlook can have rules/actions whose execution depends on local client functionality and which should not be assumed encodable through Graph.

### 11.4 Typed API surface

Graph exposes only its known typed predicate/action fields.

A future decoder encountering a server rule outside the writable API subset may need opaque preservation, diagnostics, or refusal rather than fabricating a nearest typed equivalent.

## 12. Unresolved questions

1. Exact case sensitivity and Unicode normalization of each `*Contains` predicate.
2. Exact OR/AND behavior of multiple values within each collection-valued predicate. The resource reference names collections but the reviewed source does not state the per-property combination rule precisely enough to rely on.
3. Exact matching behavior of `senderContains` / `recipientContains` across display names versus addresses.
4. Boundary semantics for `minimumSize` and `maximumSize`.
5. Whether conditionless rules created through Graph behave as unconditional match-all rules in all target account types.
6. How multiple actions within one rule are ordered and whether order can affect observable behavior.
7. How move/copy/delete/redirect actions affect subsequent rules. See [`OUTLOOK_CONTROL_FLOW.md`](OUTLOOK_CONTROL_FLOW.md).
8. What kinds of existing Outlook rules surface as `isReadOnly`, and whether any relevant rules are omitted entirely from Graph listing.
9. How category-name changes affect stored rule predicates/actions that reference category strings.
10. Account/product-specific rule-count, size, or complexity limits.
11. Exact semantic distinction among `forwardTo`, `redirectTo`, and Sieve/Gmail forwarding at the envelope/header level.
12. Whether rules manually run against existing messages use exactly the same predicate/action semantics as automatic incoming-message execution.

## 13. Survey summary

The Graph Inbox Rule system exposes a comparatively structured semantic surface:

- conjunctive top-level conditions;
- disjunctive exception handling;
- ordered server-side rules;
- typed text/address/message-property predicates;
- mailbox-owner-relative recipient predicates;
- message-class predicates;
- importance/sensitivity/action-flag predicates;
- size-range predicates;
- folder move and copy;
- category tagging;
- read/importance mutation;
- soft deletion to Deleted Items;
- permanent deletion;
- three distinct forwarding/redirection actions;
- explicit stop-processing behavior.

Two architectural warnings stand out.

First, Outlook has **two independent organizational models**: hierarchical mail folders and many-valued categories. Categories are not folders, and folder moves are not category assignment.

Second, Graph itself exposes **read/write asymmetry** through `isReadOnly` and `hasError`. A rule's existence and inspectability do not imply that Mailchemy can recreate or modify it through the same endpoint.

The Graph model is much more typed than Gmail's free-form search-query escape hatch, but several exact string-matching details remain underdocumented. Those gaps should remain explicit until tested or documented rather than being filled with assumptions.
