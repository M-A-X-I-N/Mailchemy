# First cross-system semantic comparison

## 1. Purpose

This synthesis compares the initial investigations:

- [Sieve](SIEVE_SEMANTIC_SURVEY.md)
- [Purelymail Sieve profile](PURELYMAIL_SIEVE_CAPABILITY_PROFILE.md)
- [Gmail](GMAIL_SEMANTIC_SURVEY.md)
- [Outlook / Microsoft Graph](OUTLOOK_SEMANTIC_SURVEY.md)
- [Thunderbird](THUNDERBIRD_SEMANTIC_SURVEY.md)

It identifies recurring semantic areas, important mismatches, candidate semantic families, and likely rewrite territory **without freezing final Mailchemy capability IDs**.

Purelymail is treated as an endpoint refinement of Sieve, not a fifth dialect.

## 2. Comparison rule

A shared-looking feature is not automatically an exact equivalence.

This document distinguishes:

- **shared semantic family** — same broad semantic area;
- **potential exact overlap** — may be exactly realizable for some concrete instances;
- **related but distinct** — similar user intent, materially different semantics;
- **system-specific** — no useful common semantic identity established;
- **deferred** — exactness depends on the dedicated control-flow investigation and synthesis phase.

## 3. High-level matrix

| Area | Sieve | Purelymail | Gmail | Outlook | Thunderbird |
| --- | --- | --- | --- | --- | --- |
| Raw header matching | yes | yes | via Gmail search/header operators | headerContains | arbitrary/custom headers |
| Parsed address matching | yes | yes | provider-specific criteria/search | typed addresses + string predicates | operator-dependent parsed-address behavior |
| SMTP envelope matching | extension | advertised | no equivalent primitive identified | no equivalent primitive identified | no equivalent primitive identified |
| Subject matching | yes | yes | yes | yes | yes |
| Body matching | extension | advertised | Gmail search | bodyContains | yes |
| Size matching | yes | yes | yes | size range | yes |
| Attachment predicate | no simple base primitive | no dedicated capability identified | yes | yes | yes |
| Date/age matching | extensions | date advertised | rich search syntax | none identified in current Rule API | date + age |
| Folder/mailbox move | fileinto | advertised | no native folder move | yes | yes |
| Folder/mailbox copy | copy/fileinto semantics | copy advertised | no equivalent folder model | yes | yes |
| User tag/category metadata | IMAP keywords | imap4flags advertised | user labels | categories | tags/keywords |
| Read state | IMAP flags | supported | UNREAD state | markAsRead | mark read/unread |
| Star/flag | IMAP Flagged | supported | STARRED | no equivalent action identified | mark flagged |
| Forwarding/routing | redirect | base | forward | forward / forward-as-attachment / redirect | forward |
| Delete lifecycle | discard/reject/fileinto are distinct | subset | Trash state | Deleted Items / permanent delete | account-dependent delete |
| Auto-response | vacation | advertised | Send template in UI | none identified in surveyed Graph actions | reply |

## 4. Message source and match semantics

### 4.1 Data source should be separate from match operator

The surveys strongly support decomposing conditions into at least:

- what data is inspected;
- how that data is interpreted;
- what comparison/match relation is applied.

For example, these are not the same semantic source:

- raw From header text;
- parsed From address;
- SMTP envelope sender.

Sieve makes this distinction explicitly with header, address, and envelope. Thunderbird also changes behavior depending on operator, and Outlook exposes both typed addresses and string-oriented sender/recipient predicates.

**Conclusion:** raw headers, parsed message addresses, and transport-envelope addresses should remain separate candidate semantic sources.

### 4.2 Text matching is not one generic capability

Across the systems we found exact equality, contains, prefix, suffix, glob/wildcard, negative operators, provider search syntax, and comparator/case-normalization differences.

Sieve cleanly separates match type from comparator. Thunderbird exposes separate operators. Gmail has provider-specific normalization and a free-form search language. Outlook leaves some exact string semantics underdocumented.

**Conclusion:** a future model should not collapse these into one generic textMatch operation.

### 4.3 Subject contains is broadly shared but not yet universally exact

All four systems can express a subject-containment concept, but the detailed comparison/normalization contracts differ.

This is a strong candidate semantic family, with adapter refinements rather than a single provider-shaped definition.

### 4.4 Body matching is even less uniform

Sieve distinguishes raw, MIME-content-selected, and implementation-dependent text extraction. Gmail uses provider search semantics. Outlook exposes bodyContains. Thunderbird performs client-side body scanning with MIME/charset/content-availability effects.

**Conclusion:** body matching probably needs an explicit body-view/normalization contract, not just body.contains.

### 4.5 Size comparison is a promising common family

All four systems expose message-size predicates, although units and exact boundaries differ.

A future semantic shape based on normalized size units plus comparison/range semantics looks promising.

### 4.6 Attachment presence is a three-system overlap

Gmail, Outlook, and Thunderbird expose explicit attachment predicates. No equally direct base/Purelymail Sieve capability was identified.

A Sieve MIME-derived implementation may eventually be possible through rewrites, but exact attachment semantics must be defined first.

### 4.7 Date and age are related but distinct

Sieve and Purelymail support date semantics, Gmail has date/age search syntax, and Thunderbird exposes both date and dynamic age-in-days. Outlook's surveyed Inbox Rule model did not expose a general equivalent.

Absolute dates, timestamps, current date, and age-relative predicates should remain distinct candidate concepts.

## 5. Boolean structure

### 5.1 AND is the strongest common logical primitive

All four systems support conjunction in some native form.

### 5.2 OR support depends on expression shape

Sieve has recursive anyof. Gmail has OR/grouping inside query syntax. Thunderbird has match-any behavior. Outlook's positive conditions are conjunctive, while its exception set provides a different disjunctive structure.

**Conclusion:** support for OR will likely be expression-shape-sensitive rather than a boolean adapter flag.

### 5.3 Negation is heterogeneous

Sieve has general NOT, Gmail has negative query forms, Outlook often expresses exclusion through exceptions, and Thunderbird frequently uses negative operators.

This is promising territory for exact rewrites, but only after surrounding boolean structure is modeled precisely.

## 6. Containers, labels, categories, and tags

### 6.1 Folder/mailbox placement is a real shared family

Sieve fileinto, Outlook moveToFolder, and Thunderbird MoveToFolder all operate on mailbox-like placement.

Purelymail advertises fileinto.

Exactness still depends on delivery timing, target identity, source/default placement, and later rule execution, so final equivalence is deferred to the control-flow block.

### 6.2 Gmail labels are not folders

Gmail labels are many-to-many memberships. Adding a user label does not inherently remove Inbox or any other label.

Therefore:

`Gmail add label X` is not equivalent to `move to folder X`.

A common user workflow such as 'archive under label' is itself a compound state change: remove Inbox plus add user label.

### 6.3 Outlook and Thunderbird both have folders plus independent tag metadata

Outlook uses categories; Thunderbird uses tags/keywords.

This strongly supports keeping:

- exclusive/location-like container placement;
- non-exclusive tag/category/keyword membership;

as separate semantic families.

### 6.4 Cross-system tag metadata is promising but not proven identical

Potentially related concepts:

- Gmail user labels;
- Outlook categories;
- Thunderbird tags/keywords;
- Sieve IMAP keywords.

Purelymail advertises imap4flags.

Names, identity, metadata, allowed values, and lifecycle differ, so this is a candidate family rather than an established universal capability.

## 7. Message-state actions

### 7.1 Read/unread is one of the strongest candidates

Native realizations exist in all four ecosystems:

- Sieve/IMAP Seen state;
- Purelymail imap4flags;
- Gmail UNREAD removal;
- Outlook markAsRead;
- Thunderbird MarkRead/MarkUnread.

This is a strong example of one likely semantic operation with several native encodings.

### 7.2 Star/flag is broad but not universal

Sieve IMAP Flagged, Gmail STARRED, and Thunderbird MarkFlagged line up closely enough to be a strong candidate family. No equivalent Outlook Inbox Rule action was identified.

### 7.3 Importance and priority should not yet be unified

Gmail IMPORTANT, Outlook importance, and Thunderbird priority solve related user problems but are not proven to share one semantic contract.

These should remain separate until researched more precisely.

### 7.4 Junk/spam is provider/context sensitive

Purelymail advertises spamtest, Thunderbird has junk score/status, and Gmail exposes Spam state. Their scoring and lifecycle semantics differ.

This is a related family, not an established exact common capability.

## 8. Routing and deletion lifecycle

### 8.1 Forward is not one operation

The systems expose:

- Sieve redirect;
- Gmail forward;
- Outlook forward, forward-as-attachment, and redirect;
- Thunderbird Forward.

Important dimensions include envelope behavior, message reconstruction, header preservation, continued local delivery, and later rule processing.

Outlook alone proves that several distinct forwarding semantics must exist.

### 8.2 Reject, discard, Trash, Deleted Items, and permanent delete are distinct

Do not prematurely unify:

- Sieve reject;
- Sieve discard;
- Gmail Trash;
- Outlook Deleted Items;
- Outlook permanent delete;
- Thunderbird Delete;
- move/fileinto a trash-like folder.

Mapping Sieve discard to Gmail Delete would be especially dangerous: they operate at different lifecycle layers and have different recoverability semantics.

### 8.3 Auto-response semantics are non-uniform

Sieve vacation is standardized and Purelymail advertises vacation/vacation-seconds. Gmail exposes Send template in the UI. Thunderbird has Reply. The surveyed Outlook Graph rule actions have no obvious general equivalent.

These belong to a broad automated-response area, not one exact operation yet.

## 9. Candidate semantic families

These are candidate families only; no stable IDs are assigned.

### 9.1 Message data sources

- raw header field;
- parsed sender/recipient address;
- transport-envelope address;
- subject;
- body-derived content;
- message size;
- attachment presence;
- date/time;
- message age;
- message/provider state.

### 9.2 Match operations

- exact equality;
- contains;
- starts-with;
- ends-with;
- glob/wildcard;
- relational comparison;
- range;
- existence/presence;
- negation.

Comparator and normalization policy may need to be modeled separately.

### 9.3 Logic

- AND;
- OR;
- NOT;
- exception/exclusion as either a first-class form or an exact derived realization.

### 9.4 Container and metadata state

- move/deliver to mailbox-like container;
- copy to mailbox-like container;
- named non-exclusive tag/keyword membership;
- read/unread;
- flagged/starred;
- possibly separate importance, priority, and spam/junk families.

### 9.5 Routing/lifecycle

- redirect/resend;
- forward-as-new-message;
- forward-as-attachment;
- reject delivery;
- silently discard;
- recoverable trash/deleted-items state;
- permanent deletion;
- automated response.

## 10. Likely exact-rewrite territory

No rewrites are approved here, but several areas look promising:

- NOT of a predicate lowered to a native negative operator or exception;
- set-read lowered to Gmail UNREAD removal, Outlook markAsRead, Thunderbird MarkRead, or Sieve flag mutation;
- named tag membership lowered to Gmail label, Outlook category, Thunderbird tag, or IMAP keyword where identity semantics line up;
- glob patterns lowered to starts-with / ends-with / contains when the exact glob grammar/comparator proves equivalence.

Trash-state rewrites may also be possible, but Purelymail currently lacks advertised special-use semantics and Thunderbird delete behavior is context-dependent.

## 11. Purelymail validates endpoint refinement

The Purelymail endpoint-profile investigation gives a concrete three-layer model:

```text
semantic operation exists in Mailchemy
        ↓
Sieve codec can represent it
        ↓
connected Sieve endpoint advertises/accepts it
```

A semantic may therefore be representable in Sieve generally but unavailable on the connected Purelymail endpoint.

This is direct evidence against a boolean 'supports Sieve' adapter model.

Runtime-discovered endpoint capabilities should participate in realization planning alongside static codec capabilities/refinements.

## 12. Decode/encode asymmetry is universal

Every initial target demonstrates some asymmetry:

- Sieve/Purelymail: the codec may understand standardized extensions absent from the endpoint;
- Gmail: product UI semantics exceed the documented Filter API action schema, and arbitrary query strings may exceed Mailchemy's understood subset;
- Outlook: isReadOnly and hasError separate visibility from writability/health;
- Thunderbird: unknown or custom filters can be preserved without being semantically understood.

A future result model will likely need more nuance than simply supported/unsupported.

## 13. Things that should not be globally unified

Do not prematurely merge:

- folder placement and Gmail labels;
- Outlook categories and Outlook folders;
- Gmail Importance and Thunderbird Priority;
- Sieve discard and trash/delete;
- reject and delete;
- all forwarding/redirect variants;
- provider search syntax and ordinary text matching;
- raw headers and parsed addresses;
- message-header addresses and SMTP envelope addresses;
- standardized Sieve semantics and Purelymail's advertised subset;
- Thunderbird custom extension semantics and built-in terms/actions.

## 14. Control-flow boundary

This synthesis intentionally does not settle:

- whether all matching rules execute;
- action ordering;
- move/delete effects on later rules;
- forwarding interaction with local delivery;
- implicit keep interaction;
- stop-processing semantics;
- whether splitting one source rule into several target rules preserves meaning.

Those questions now matter more because several otherwise-promising mappings depend on execution order.

They belong to the dedicated control-flow investigations and cross-system control-flow synthesis.

## 15. Conclusions

The first cross-system comparison supports the current Mailchemy architecture.

1. The canonical vocabulary should be semantic and compositional, not a clone of any provider rule object.
2. Capability support must be instance-sensitive and expression-shape-sensitive.
3. Exact rewrites will be essential because the same likely meaning is encoded differently by each system.
4. Endpoint capability refinement is a real requirement, demonstrated directly by Purelymail.
5. The first concrete capability registry should **wait until after the control-flow block**, because execution semantics may split concepts that currently look identical.

The result of this first semantic synthesis is therefore not a frozen registry. It is a much narrower answer to what that registry will eventually need to describe.