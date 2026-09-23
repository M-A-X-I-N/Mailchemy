# Gmail Filters semantic-surface survey

## 1. Scope

This survey describes Gmail's native server-side filter semantics as exposed through the current Gmail product documentation and Gmail API.

It intentionally distinguishes:

- Gmail's **filter/search/label model**;
- the public Gmail Filter API representation;
- Gmail web UI capabilities that may exceed the public Filter API surface;
- Gmail's message semantics from Sieve/mailbox-style concepts.

This is a descriptive survey. It does not define Mailchemy capability IDs or claim equivalence with Sieve, Outlook, or Thunderbird.

### 1.1 Evidence baseline

Primary sources:

- **Officially documented:** [Gmail Help — Create rules to filter your emails](https://support.google.com/mail/answer/6579)
- **Officially documented:** [Gmail Help — Refine searches in Gmail](https://support.google.com/mail/answer/7190)
- **Officially documented:** [Gmail API — Manage Gmail filters](https://developers.google.com/workspace/gmail/api/guides/filter_settings)
- **Officially documented:** [Gmail API — users.settings.filters](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.settings.filters)
- **Officially documented:** [Gmail API — Manage labels](https://developers.google.com/workspace/gmail/api/guides/labels)
- **Officially documented:** [Gmail API — users.labels](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.labels)
- **Officially documented:** [Gmail API overview](https://developers.google.com/workspace/gmail/api/guides)

At the time of this survey, Google's Manage Filters guide was last updated 2026-06-03 UTC and the Filter reference was current in 2026.

## 2. Native rule model

### 2.1 Filter resource

**Evidence: Officially documented — Gmail API.**

The public API models a filter as:

```text
Filter
├── id
├── criteria
└── action
```

The filter ID is assigned by Gmail.

Filters apply to **specific messages**, not entire email threads.

The public API supports:

- create;
- get;
- list;
- delete.

There is no API-level update/PATCH method. Editing a filter through API semantics therefore requires replacement rather than in-place mutation.

The Gmail web UI separately exposes an "Edit" workflow.

### 2.2 Incoming-message orientation

**Evidence: Officially documented — Gmail Help / API guide.**

Gmail describes filters as rules that evaluate incoming messages.

The filter guide says forwarding filters affect only new messages. Gmail's UI can optionally apply a newly created filter to existing matching conversations as a one-time action, but that should not be confused with the ongoing incoming-message rule semantics.

### 2.3 Criteria + action, not a general script

The public Filter resource is structurally flatter than Sieve:

- one criteria object;
- one action object;
- no public nested rule AST;
- no exposed variables or arbitrary sequential statements.

However, the `query` field embeds Gmail's advanced search language, which itself contains grouping, OR, negation, status operators, date operators, and other query constructs.

Thus the apparent flatness of the API does not imply a trivial condition language.

## 3. Conditions and match semantics

## 3.1 Structured Filter API criteria

**Evidence: Officially documented — users.settings.filters.**

The current public API exposes these criterion fields:

| Field | Documented semantic |
| --- | --- |
| `from` | sender display name or email address |
| `to` | recipient display name or email address; includes To, Cc, and Bcc |
| `subject` | case-insensitive phrase in subject |
| `query` | Gmail search-box query syntax |
| `negatedQuery` | Gmail search-box query that must not match |
| `hasAttachment` | message has an attachment |
| `excludeChats` | exclude chats |
| `size` + `sizeComparison` | compare entire RFC822 message size in bytes |

When multiple criterion fields are present, **all must be satisfied**.

### 3.2 `to` is broader than a literal To-header test

**Evidence: Officially documented — users.settings.filters.**

The API's `to` field includes recipients in the:

- To;
- Cc;
- Bcc

header fields.

It also permits partial/local-part-style matching: Google's reference explicitly states that values such as `example` and `example@` can match `example@gmail.com`.

The field is case-insensitive.

This is a major semantic warning: Gmail's structured `to` criterion is **not** simply equivalent to "raw header To equals X" or Sieve's structured `address "To"` test.

### 3.3 `subject`

**Evidence: Officially documented — users.settings.filters.**

The structured `subject` criterion is documented as a **case-insensitive phrase found in the subject**.

Leading/trailing whitespace is trimmed and adjacent spaces are collapsed.

Therefore this field has its own normalization and containment semantics rather than raw header equality.

### 3.4 Message size

**Evidence: Officially documented — users.settings.filters.**

The API's `size` is the size of the entire RFC822 message in bytes, explicitly including headers and attachments.

`sizeComparison` supports:

- `larger`;
- `smaller`.

This gives a relatively concrete size-threshold semantic.

### 3.5 Gmail search language via `query`

**Evidence: Officially documented — Gmail API and Gmail Help.**

`query` supports the same query format as the Gmail search box.

This dramatically expands the condition surface beyond the structured Criteria fields.

Documented search constructs include, among many others:

- `from:`;
- `to:`;
- `cc:`;
- `bcc:`;
- `subject:`;
- exact phrase matching with quotes;
- OR and grouping;
- negative criteria;
- date/age ranges;
- `size:`, `larger:`, `smaller:`;
- `has:attachment`;
- attachment `filename:`;
- `list:` mailing-list matching;
- `deliveredto:`;
- `rfc822msgid:`;
- `header:` custom-header searching;
- `label:`;
- `category:`;
- read/unread/starred/important state;
- user-label-presence tests;
- archive/snooze/mute and other Gmail-state predicates.

The exact grammar/normalization semantics are Gmail-defined rather than an IETF-standard match language.

A future Mailchemy adapter therefore cannot safely treat arbitrary `query` strings as one opaque generic "text search" capability if exact interoperability is desired.

### 3.6 `negatedQuery`

**Evidence: Officially documented — users.settings.filters.**

`negatedQuery` uses the same Gmail query language, but the filter requires the message **not** to match that query.

This is structurally equivalent to a negated Gmail-query predicate, not necessarily to negation of one atomic condition.

### 3.7 Query fields versus structured fields

A filter may combine structured fields with `query` and `negatedQuery`.

Because all criterion fields are conjunctive, a conceptual form is:

```text
from
AND to
AND subject
AND query
AND NOT(negatedQuery)
AND attachment/state/size constraints
```

where omitted fields contribute no constraint.

The internal semantics of `query` can itself include OR/grouping/negation.

## 4. Logical composition

### 4.1 Top-level API composition

**Evidence: Officially documented — Manage Gmail filters.**

Multiple populated Criteria fields are combined with logical **AND**.

### 4.2 Query-language composition

**Evidence: Officially documented — Gmail Help.**

The Gmail search language supports explicit alternatives and grouping.

For example, Gmail documents:

- `OR`;
- braces/grouping constructs;
- parentheses in some query forms;
- leading minus / negative search criteria.

This means Gmail can express richer boolean logic inside `query` than the Criteria JSON shape alone suggests.

### 4.3 No public general-purpose filter AST

The public API does not expose parsed query operators as typed nodes.

For Mailchemy, that creates an eventual design choice between:

- parsing/semantically interpreting supported Gmail query syntax;
- preserving unsupported query syntax opaquely;
- refusing exact conversion when semantics cannot be established.

This survey does not select that policy.

## 5. Actions and state transitions

### 5.1 Public Filter API action model

**Evidence: Officially documented — users.settings.filters.**

The public Action object contains:

- `addLabelIds[]`;
- `removeLabelIds[]`;
- `forward`.

Google's filter guide demonstrates common Gmail behaviors as label state transitions:

| Gmail behavior | API action |
| --- | --- |
| archive / skip Inbox | remove `INBOX` |
| mark read | remove `UNREAD` |
| never mark spam | remove `SPAM` |
| never mark important | remove `IMPORTANT` |
| mark important | add `IMPORTANT` |
| delete | add `TRASH` |
| star | add `STARRED` |
| apply user label | add user label ID |

This is a fundamentally different state model from "move message into one folder".

### 5.2 Forwarding

**Evidence: Officially documented — users.settings.filters; Gmail Help.**

The API `forward` action redirects the message to a configured address while maintaining the original sender in the From field.

The destination must be a verified forwarding address before it can be used.

Gmail Help additionally notes that a filter configured to forward applies that forwarding only to new matching messages.

Exact equivalence to Sieve `redirect` is **not** asserted here; envelope behavior and processing interaction need cross-system/control-flow study.

### 5.3 User-interface actions beyond the API Action object

**Evidence: Officially documented — Gmail Help.**

The Gmail filter UI currently exposes actions including:

- skip Inbox / archive;
- mark read;
- star;
- apply label;
- forward;
- delete;
- never send to Spam;
- send template;
- always mark important;
- never mark important;
- categorize as;
- optionally apply the new filter to existing matching conversations.

The public Filter API's Action schema only exposes label additions/removals and forwarding.

This is an explicit native/API asymmetry requiring later investigation.

Some UI actions are clearly representable as system-label changes. Others, especially **Send template**, are not represented by any field in the public Action object documented today.

## 6. Container and message-state model

### 6.1 Labels are many-to-many

**Evidence: Officially documented — Gmail API Manage labels.**

Gmail labels have a **many-to-many relationship** with messages and threads:

- one message/thread may have several labels;
- one label may apply to many messages/threads.

This is not a single-parent mailbox/folder model.

### 6.2 System versus user labels

**Evidence: Officially documented — Gmail API.**

Gmail distinguishes:

- `SYSTEM` labels managed by Gmail;
- `USER` labels created by users/applications.

System labels include state/container concepts such as:

- `INBOX`;
- `SPAM`;
- `TRASH`;
- `UNREAD`;
- `STARRED`;
- `IMPORTANT`;
- `SENT`;
- `DRAFT`;
- category labels.

Some system labels may be manually applied/removed; others cannot.

### 6.3 "Archive" is absence of Inbox

**Evidence: Officially documented — Manage Gmail filters.**

The filter API implements archive/skip-Inbox by removing the `INBOX` label.

Therefore archive is not "move into an Archive folder" in the native Gmail model.

### 6.4 "Delete" is Trash labeling in filter semantics

**Evidence: Officially documented — Manage Gmail filters.**

A filter's Delete behavior is represented by adding the `TRASH` label.

The Gmail API separately has immediate/permanent delete methods for messages, but that is not the semantics documented for the filter action.

### 6.5 User labels are tagging, not exclusive filing

Applying a user-defined label does not inherently remove other user labels or `INBOX`.

A filter may both remove `INBOX` and add a user label, producing the familiar "archive under label" effect.

That combined action is different from the individual semantics of either operation.

### 6.6 Label identity

The API exposes immutable label IDs and mutable/display names for user labels.

A future Gmail store/codec should distinguish semantic reference to a label from its human-visible name where possible.

The mailbox currently supports up to 10,000 labels according to the Label resource documentation.

## 7. Representation and store boundary

### 7.1 Gmail Filter API

The public API is both:

- a provider-specific native representation;
- a remote store/endpoint for those filters.

Conceptually Mailchemy should still separate the semantic codec from API transport/state management even though Google's product couples them.

### 7.2 XML import/export

**Evidence: Officially documented — Gmail Help.**

The Gmail settings UI can export selected filters to an XML file and import filters from such a file.

Google's user documentation confirms this representation exists and can be edited in a text editor.

This survey did not identify an official current schema contract that should be treated as equivalent in authority to the Gmail API reference.

Therefore Gmail XML should be considered a potential separate representation/store path whose exact schema requires dedicated investigation before implementation.

### 7.3 Search syntax is part of the native representation

The `query` and `negatedQuery` strings embed Gmail search syntax directly inside the Filter API representation.

A codec cannot fully understand arbitrary filters without understanding at least the relevant subset of Gmail query semantics.

## 8. Limits and validation

### 8.1 User-label-per-filter limit in API guide

**Evidence: Officially documented — Manage Gmail filters.**

Google's current guide states that only **one user-defined label is allowed per filter**, despite the Action schema structurally containing an `addLabelIds[]` list.

System label changes may coexist with that user label.

This is a good example of why structural API shape alone is insufficient to infer the valid direct-support domain.

### 8.2 Forwarding destination verification

A forwarding address must be configured/verified before it can be used in a filter.

This is an endpoint/account-state constraint rather than a generic semantic property of "forward".

### 8.3 Label-state constraints

Not all system labels can be arbitrarily applied or removed.

For example, Gmail documents `INBOX` and `UNREAD` as mutable in appropriate contexts while `SENT` and `DRAFT` are system-controlled.

### 8.4 Search-language behavior is provider-defined

The Gmail search language is actively product-defined, not a frozen standardized grammar.

Any exact adapter implementation will need tests and current documentation for the operators it claims to semantically decode/encode.

## 9. Control-flow facts for later follow-up

These facts are recorded for M19, not exhaustively analyzed here.

### 9.1 Filters are incoming-message rules

Gmail describes filters as evaluating incoming messages.

### 9.2 Filters operate on messages, not whole threads

The API explicitly says filters apply to specific messages.

This matters because Gmail's UI often presents conversations/threads, and Gmail search results can have thread-oriented display behavior.

### 9.3 Multiple-filter interaction remains a dedicated research question

The official sources reviewed here do not establish enough precise semantics about:

- filter evaluation order;
- whether actions from one filter affect matching by another;
- conflict resolution among multiple matching filters;
- whether all matching filters always contribute actions;
- ordering of multiple actions on one filter.

Those belong explicitly to M19.

### 9.4 "Apply filter to matching conversations" is creation-time behavior

The UI can apply a newly created filter's actions to existing matching conversations. That is not the same as the persistent incoming-message trigger and needs to stay separate from ongoing filter semantics.

## 10. Decode/encode asymmetries

### 10.1 UI versus Filter API

The web UI exposes action concepts such as Send template that are absent from the documented public Filter API Action schema.

Therefore:

```text
Gmail native/product semantics
    may be broader than
public Filter API writable semantics
```

Whether those rules are visible partially, opaquely, or not at all through the API remains to be verified.

### 10.2 Search query as semantic escape hatch

The API can store broad Gmail query syntax in `query`, but Mailchemy may only understand a subset exactly.

A future decoder may therefore need to distinguish:

- parsed/proven semantic query constructs;
- syntactically preserved but semantically unsupported query text.

### 10.3 API editing

The API has create/get/list/delete but no update method.

A future synchronizer must treat modification as replacement at the endpoint level unless another supported representation offers true editing.

This is store behavior, not rule meaning.

### 10.4 XML representation

The UI's XML export/import surface may encode constructs differently from the API.

Round-trip compatibility between XML and API representations is not assumed until researched.

## 11. Unresolved questions

1. Precisely how are multiple simultaneously matching filters ordered and combined? Deferred to M19.
2. Can public Filter API `get/list` faithfully represent UI filters containing `Send template` or other non-Action-schema behaviors?
3. What exact XML schema/version behavior does Gmail's import/export feature use today?
4. Which Gmail search operators are valid when used in filter `query`, versus valid only in interactive search contexts?
5. What are the exact normalization/matching semantics of structured `from` beyond Google's "display name or email address" description?
6. How do aliases and address canonicalization affect sender matching? Gmail Help notes alias-aware search behavior in some contexts, but filter-specific exact semantics require focused validation.
7. How should categories be modeled: as ordinary system-label transitions, classifier interaction, or provider-specific semantics?
8. Which action combinations are rejected or normalized when creating filters through the API?
9. Are there account/product-specific limits on total filter count or query complexity that matter to an adapter?
10. How does forwarding interact with other matching filter actions and multiple filters? Deferred to M19.

## 12. Survey summary

Gmail's native filter surface is built around three tightly coupled concepts:

1. **message matching**, including structured Criteria fields and the much broader Gmail search language;
2. **label/state transitions**, where Inbox, unread, trash, important, star, categories, and user organization are label states;
3. **provider endpoint behavior**, including verified forwarding destinations and API-specific validation.

Important semantic families observed include:

- sender/recipient/subject phrase matching;
- Gmail query-language predicates over headers, content, dates, attachments, labels, categories, message state, size, and other provider concepts;
- explicit negated query predicates;
- conjunction across top-level Criteria fields;
- user/system label addition/removal;
- archive as removal of Inbox state;
- read state as removal of Unread;
- trash/star/importance/category-related state;
- user tagging with non-exclusive labels;
- forwarding to a verified address.

The most important portability warning is that Gmail's organizational model is **not a folder tree**.

A message can carry several labels simultaneously, and many apparent "actions" are additions/removals of system labels. Translating those semantics into mailbox-oriented systems will require explicit semantic decomposition rather than treating Gmail labels as folders by name.

A second important warning is that the public Filter API is not obviously the entire native product surface. The UI documents actions that the public Action schema does not expose, so API reachability and Gmail semantic capability must remain separate questions.
