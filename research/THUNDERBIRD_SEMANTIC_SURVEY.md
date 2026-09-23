# Thunderbird message-filter semantic-surface survey

## 1. Scope

This survey describes Thunderbird's **core message-filter rule system** as represented by the current Thunderbird user documentation and current `comm-central` implementation.

Thunderbird is deliberately treated as a first-class rule system even though it is a mail client rather than a hosted provider.

The relevant system is client-local and includes:

- per-account message-filter lists;
- several execution contexts such as incoming mail, manual execution, post-send, and archive;
- local `msgFilterRules.dat` persistence;
- a broad search-term vocabulary shared with Thunderbird's mail/news search machinery;
- built-in actions plus extension-defined custom terms/actions.

This survey does not attempt to characterize arbitrary add-on-defined semantics. It records the extension points so a future adapter can fail/preserve safely when custom constructs are encountered.

### 1.1 Evidence baseline

Primary/authoritative sources:

- **Officially documented:** [Thunderbird Help — Organize your messages with filters](https://support.mozilla.org/en-US/kb/organize-your-messages-using-filters)
- **Officially documented:** [Thunderbird Help — Quick Filter Toolbar](https://support.mozilla.org/en-US/kb/quick-filter-toolbar)
- **Implementation-derived:** [Searchfox — `nsMsgFilterCore.idl`](https://searchfox.org/comm-central/source/mailnews/search/public/nsMsgFilterCore.idl)
- **Implementation-derived:** [Searchfox — `nsMsgSearchCore.idl`](https://searchfox.org/comm-central/source/mailnews/search/public/nsMsgSearchCore.idl)
- **Implementation-derived:** [Searchfox — `nsMsgFilter.cpp`](https://searchfox.org/comm-central/source/mailnews/search/src/nsMsgFilter.cpp)
- **Implementation-derived:** [Searchfox — `nsMsgFilterList.cpp`](https://searchfox.org/comm-central/source/mailnews/search/src/nsMsgFilterList.cpp)
- **Implementation-derived:** [Searchfox — `nsMsgFilterList.h`](https://searchfox.org/comm-central/source/mailnews/search/src/nsMsgFilterList.h)
- **Implementation-derived:** [Searchfox — `nsMsgSearchTerm.cpp`](https://searchfox.org/comm-central/source/mailnews/search/src/nsMsgSearchTerm.cpp)
- **Official project issue evidence:** [Bugzilla 1777731 — `msgFilterRules.dat` example and per-account storage](https://bugzilla.mozilla.org/show_bug.cgi?id=1777731)

The Searchfox source reviewed here was from August 2026 revisions.

## 2. Native rule model

### 2.1 Per-account filter lists

**Evidence: Officially documented — Thunderbird Help.**

Each mail account has its own set of message filters.

A filter has at least:

- a name;
- enabled/disabled state;
- one or more conditions or a match-all state;
- one or more actions;
- an execution-context/type mask;
- an ordered position in the account's filter list.

The local persistence format additionally stores description and other implementation metadata.

### 2.2 Execution contexts

**Evidence: Officially documented — Thunderbird Help; implementation-derived — `nsMsgFilterCore.idl`.**

Thunderbird exposes several filter contexts.

The current implementation defines filter-type flags including:

- incoming Inbox rules;
- manual execution;
- post-plugin / after Bayesian junk classification;
- post-outgoing / after sending;
- archive;
- periodic/repeating-timer;
- news-related variants.

The user-facing documentation prominently exposes:

- **Getting New Mail** — default; incoming messages in Inbox;
- before or after junk/spam classification;
- **Manually Run**;
- **After Sending**;
- **Archiving**.

Thus "Thunderbird filter" is not one trigger semantic. The same stored rule may be enabled for multiple execution contexts.

### 2.3 Automatic versus manual folder scope

**Evidence: Officially documented — Thunderbird Help.**

Automatic incoming filters normally operate on new messages in Inbox.

Manual execution can target a selected folder.

After-send and archive filters operate on messages involved in those respective actions.

This execution scope is semantically relevant and should not be confused with the condition "message is in folder X".

### 2.4 Client-local execution

The filter engine is part of Thunderbird itself.

Unlike Gmail/Outlook server rules or a Sieve interpreter at final delivery, ordinary Thunderbird message-filter execution depends on the client and the relevant local account/profile state.

That is an architectural/store distinction, not evidence that Thunderbird semantics are less first-class.

## 3. Conditions and matching semantics

Thunderbird's filter conditions are built on its message-search term machinery.

### 3.1 Core attributes

**Evidence: Implementation-derived — `nsMsgSearchCore.idl`.**

Relevant built-in message-search attributes include:

- Subject;
- Sender;
- Body;
- Date;
- Priority;
- Message Status;
- To;
- Cc;
- To or Cc;
- All Addresses;
- Age in Days;
- Size;
- Any Text;
- Keywords/tags;
- Has Attachment Status;
- Junk/Spam status;
- junk percentage;
- junk-score origin;
- arbitrary/custom header properties;
- custom terms.

Not every attribute/operator combination is valid in every search/filter scope.

### 3.2 Core operators

**Evidence: Implementation-derived — `nsMsgSearchCore.idl`.**

The current core operator vocabulary includes:

- Contains;
- Doesn't Contain;
- Is;
- Isn't;
- Is Empty;
- Isn't Empty;
- Is Before;
- Is After;
- Is Higher Than;
- Is Lower Than;
- Begins With;
- Ends With;
- Is Greater Than;
- Is Less Than;
- Is In Address Book;
- Isn't In Address Book;
- Matches / Doesn't Match for custom terms.

This is richer than a generic `contains`/equality model.

### 3.3 Basic string matching is case-insensitive

**Evidence: Implementation-derived — `nsMsgSearchTerm.cpp::MatchString`.**

For ordinary string matching, the current implementation uses case-insensitive operations for:

- Contains;
- Doesn't Contain;
- Is;
- Isn't;
- Begins With;
- Ends With.

`Contains` uses a case-insensitive substring search.

`Is` uses case-insensitive whole-string equality.

`Begins With` and `Ends With` use case-insensitive prefix/suffix comparison.

Therefore these are distinct native semantic operators even though they share case-insensitive comparison behavior.

### 3.4 Charset conversion

**Evidence: Implementation-derived — `nsMsgSearchTerm.cpp`.**

Search-term matching converts message strings into Unicode using the available charset information.

If normal conversion fails, current code attempts UTF-8 and then falls back to ASCII/windows-1252-style copying.

Exact malformed-message behavior is therefore implementation-dependent and should not be generalized into a provider-neutral semantic promise.

### 3.5 Address/header matching has operator-dependent behavior

**Evidence: Implementation-derived — `nsMsgSearchTerm.cpp::MatchRfc822String`.**

Thunderbird does **not** treat every address-oriented operator identically.

For `Contains`, the current implementation deliberately avoids parsing addresses and performs matching on the RFC2047-decoded header string. The source comments acknowledge that this can permit punctuation-related matches.

For other operators, Thunderbird parses names and addresses and tests the parsed components.

This creates a subtle but real semantic distinction:

```text
From contains "foo"
```

does not necessarily inspect the same normalized entity set as:

```text
From is "foo"
```

A future Mailchemy model must preserve the native meaning before trying to normalize these into common address capabilities.

### 3.6 Arbitrary/custom headers

**Evidence: Implementation-derived — `nsMsgSearchCore.idl`, `nsMsgSearchTerm.cpp`.**

Thunderbird supports arbitrary message-header names as filter/search attributes.

The persistence code writes the header name text rather than relying solely on a fixed numeric enum.

This gives Thunderbird a generic header-field matching path in addition to first-class built-in fields.

### 3.7 Body matching

Thunderbird supports Body as a search/filter attribute.

The implementation performs charset-aware body scanning and has special handling for content-transfer encodings such as quoted-printable.

Negative body predicates must continue scanning enough content to prove absence rather than returning after one non-match.

Exact MIME-part selection and HTML/text-normalization semantics are more complicated than this initial survey proves and remain an explicit research gap.

### 3.8 Dates

**Evidence: Implementation-derived — `nsMsgSearchTerm.cpp::MatchDate`.**

Thunderbird's date operators compare **local calendar dates**, not exact timestamps.

- `Is Before` compares calendar day before the selected date;
- `Is After` compares calendar day after;
- `Is` means same local year/month/day;
- `Isn't` means a different local calendar date.

That is semantically different from an instant/timestamp comparison.

### 3.9 Age in days

Thunderbird supports message age in days as a distinct numeric/time-relative attribute.

The implementation computes a cutoff relative to the current time.

This is a dynamic predicate whose truth can change over time even when the message itself does not.

### 3.10 Tags/keywords

**Evidence: Implementation-derived — `nsMsgSearchCore.idl`.**

The `Keywords` search attribute is explicitly documented in source as Thunderbird's internal representation of tags.

Tag presence/absence therefore participates directly in the native predicate model.

### 3.11 Message/Junk state and attachments

Thunderbird can predicate on message status, attachment status, junk/spam classification state, junk percentage/origin, priority, and related properties.

These are client/message-database state predicates, not necessarily derivable from raw RFC message text.

### 3.12 Custom terms

The search API reserves `Custom` for extension-defined `nsIMsgSearchCustomTerm` implementations.

Therefore a native Thunderbird filter can contain predicate semantics not known to Thunderbird's core fixed attribute enum.

Mailchemy must not silently reinterpret an unknown custom term as a generic text condition.

## 4. Logical composition

### 4.1 AND / OR

**Evidence: Implementation-derived — `nsMsgSearchCore.idl`; officially documented — Thunderbird Help.**

The native search-term model exposes Boolean AND and OR.

The filter UI presents this as matching all versus matching any configured conditions.

### 4.2 Match all messages

**Evidence: Implementation-derived — `nsMsgFilterList.cpp`.**

The serialized condition value `ALL` represents an unconditional match-all filter.

### 4.3 Linear term representation

The current persistence parser reads a sequence of terms separated by AND or OR markers.

The reviewed core file format does not expose a general nested arbitrary boolean-expression AST comparable to Sieve's recursively nested `allof/anyof/not`.

Negative meaning is commonly represented through negative operators such as:

- Doesn't Contain;
- Isn't;
- Isn't Empty;
- Isn't In Address Book.

The exact expressive limits of mixed AND/OR serialization/UI construction deserve confirmation before Mailchemy treats Thunderbird as supporting arbitrary boolean formulas.

## 5. Actions and state transitions

### 5.1 Core action vocabulary

**Evidence: Implementation-derived — `nsMsgFilterCore.idl`, `nsMsgFilter.cpp`.**

Current core action types include:

| Action | Native intent |
| --- | --- |
| MoveToFolder | move message to folder |
| CopyToFolder | copy message to folder |
| ChangePriority | change message priority |
| Delete | delete message under account/protocol semantics |
| MarkRead | mark read |
| MarkUnread | mark unread |
| MarkFlagged | mark/star/flag |
| KillThread | ignore thread |
| KillSubthread | ignore subthread |
| WatchThread | watch thread |
| Reply | send configured reply/template behavior |
| Forward | forward message |
| StopExecution | stop subsequent filter execution |
| DeleteFromPop3Server | POP-specific server retention action |
| LeaveOnPop3Server | POP-specific server retention action |
| JunkScore | set junk/spam score |
| FetchBodyFromPop3Server | POP-specific body retrieval |
| AddTag | add Thunderbird tag/keyword |
| Custom | extension-defined action |

The persistence code maps these to human-readable action strings such as `Move to folder`, `Copy to folder`, `Mark read`, `Forward`, and `Stop execution`.

### 5.2 Move and copy use folder URIs

**Evidence: Implementation-derived — `nsMsgFilter.cpp`; official project issue evidence — Bugzilla 1777731.**

Move/copy actions store a target folder URI.

A real persisted example from Thunderbird Bugzilla contains:

```text
action="Move to folder"
actionValue="imap://.../INBOX"
```

The URI may embed account/server identity information such as username/hostname.

This is an important representation/store detail: the semantic action is "move to this mailbox/folder identity", while the serialized URI can be profile/account-specific.

### 5.3 Tags are separate from folders

`AddTag` adds a Thunderbird tag/keyword without moving the message.

A message can have tagging metadata independently of its folder location.

This means Thunderbird, like Outlook, has at least two separate organizational dimensions:

```text
folder placement
+
tag/keyword metadata
```

No cross-system equivalence to Outlook categories or Gmail labels is asserted yet.

### 5.4 Message state actions

Read/unread, flagged/starred, priority, watch/ignore-thread state, and junk score are independent native mutations.

They should not be collapsed into one generic "label" action merely because some providers represent analogous state through labels.

### 5.5 Reply and forward

Core actions include Reply and Forward.

The exact composition behavior—headers, identity selection, templates, MIME handling, and how those actions interact with later move/delete processing—needs deeper research before claiming equivalence with Gmail forwarding, Graph forwarding/redirect, or Sieve redirect/vacation.

### 5.6 POP-specific actions

Thunderbird includes actions whose semantics only make sense for POP-style server retention/retrieval:

- delete from POP3 server;
- leave on POP3 server;
- fetch body from POP3 server.

These are good examples of genuinely system/protocol-specific semantics that should remain representable even if most other adapters cannot realize them.

### 5.7 Custom actions

Extensions can register custom action IDs with optional values.

A Thunderbird filter can therefore contain valid native behavior outside the core action list.

## 6. Container and message-state model

### 6.1 Folders

Thunderbird uses mail folders as message containers and move/copy targets.

The exact backing store may be IMAP, local mail, POP-downloaded storage, etc., but the filter semantic is expressed against Thunderbird's folder abstraction.

### 6.2 Tags/keywords

Thunderbird tags are independent message metadata represented internally as keywords.

Multiple tags can coexist on a message.

This is distinct from folder placement.

### 6.3 Read, flagged, priority, junk/spam, thread state

Thunderbird maintains several other message/client database state dimensions that filters may inspect or mutate.

These states do not all have direct RFC-message equivalents.

### 6.4 Adaptive junk/spam classification is a separate subsystem

**Evidence: Officially documented — Thunderbird Help.**

Thunderbird's adaptive spam/junk classification is not simply another ordinary message filter.

Incoming filter execution can be configured before or after that classification.

The distinction matters because a filter running after classification can predicate on state unavailable or not yet established before classification.

## 7. Representation and store boundary

### 7.1 `msgFilterRules.dat`

**Evidence: Implementation-derived — `nsMsgFilterList.*`; official project issue evidence — Bugzilla 1777731.**

Thunderbird stores ordinary account filter rules in local text files conventionally named `msgFilterRules.dat`.

Each account has its own filter file.

Current source defines:

```text
kFileVersion = 9
```

### 7.2 Persisted fields

The current parser/writer recognizes fields including:

- `version`;
- `logging`;
- `name`;
- `enabled`;
- `description`;
- `type`;
- `scriptName`;
- `action`;
- `actionValue`;
- `condition`;
- `customId`.

A simple persisted rule therefore looks structurally like:

```text
name="..."
enabled="yes"
type="..."
action="Move to folder"
actionValue="..."
condition="AND (subject,contains,...)"
```

The file is a representation/store format, not Mailchemy's desired canonical model.

### 7.3 Local profile store

`msgFilterRules.dat` belongs to Thunderbird's local profile/account state.

It is not an IMAP-standard server-side rule store and should not be assumed to synchronize merely because the account's messages use IMAP.

Conceptually:

```text
Thunderbird filter codec
    ↕
local Thunderbird profile/account filter file
```

### 7.4 Profile/account-specific folder URIs

Because persisted move/copy action values use folder URIs, copying raw rule files between accounts/profiles can encounter identity/path mismatch even when the human-visible folder names look equivalent.

That is a storage/representation portability problem distinct from the semantic ability to move a message.

## 8. Extensions and custom behavior

### 8.1 Custom search terms

Thunderbird's search system explicitly supports custom search-term IDs supplied by extensions/components.

### 8.2 Custom actions

The filter engine similarly supports custom action IDs and associated values.

### 8.3 Extension semantics must remain namespaced/unknown until understood

A future Thunderbird decoder should distinguish:

- built-in known constructs;
- known extension constructs for which Mailchemy has semantics;
- unknown custom constructs that can only be preserved/reported.

Adding a Thunderbird adapter must not require polluting Mailchemy's global semantic vocabulary with every add-on ever written.

## 9. Limits and validation

### 9.1 Attribute/operator applicability depends on scope

The underlying search system contains multiple search scopes, including offline/online mail filtering and manual contexts.

Not every search attribute/operator is valid in every context.

A future adapter must validate the concrete rule against its execution context rather than declaring blanket support based only on enum membership.

### 9.2 Action applicability is context/protocol dependent

POP-specific actions are obviously invalid or meaningless outside POP processing.

Body-dependent matching may require message content to be available locally and Thunderbird's own Help suggests running after junk classification when body filtering is problematic.

The exact applicability matrix remains implementation research for a future adapter.

### 9.3 Junk score bounds

**Evidence: Implementation-derived — `nsMsgFilter.cpp`.**

The core `JunkScore` action setter accepts values from 0 through 100.

### 9.4 File-format versioning

Current persistence version is 9, and source retains historical compatibility constants.

An adapter must not assume every existing profile file was originally authored by the current version.

### 9.5 Folder URI validity

A syntactically valid persisted folder URI can become unusable after account/server identity changes.

Bugzilla evidence shows such failures can disable affected filter behavior.

This is endpoint/profile-state validation, not a different semantic "move" operation.

## 10. Control-flow facts for later follow-up

These facts are preserved for M21 and are intentionally not fully synthesized here.

### 10.1 Filters are ordered

**Evidence: Officially documented — Thunderbird Help.**

Filters are normally executed in the order they appear in the filter list.

### 10.2 Action execution can be reordered

**Evidence: Officially documented — Thunderbird Help; implementation-derived — `nsMsgFilter.cpp::GetSortedActionList`.**

Thunderbird does not blindly execute a filter's actions in the visible/original order.

Current implementation sorts actions broadly as:

1. fetch body from POP3 server;
2. "normal" actions, preserving their relative order;
3. copy-to-folder actions;
4. move-to-folder or delete;
5. stop execution.

Thunderbird Help gives the user-facing example that a reply action may be moved ahead of a move action because replying after the message has already moved would fail.

This means:

```text
stored action list order
!= always
effective execution order
```

### 10.3 Some interleavings are deliberately unrepresentable in one rule

The source comments explicitly state that Thunderbird does not support arbitrary state/copy interleavings such as:

```text
tag A
copy
tag B
copy different state
```

within one filter; separate filters are required.

This is a semantic restriction, not just a UI inconvenience.

### 10.4 Stop execution is explicit

`StopExecution` is a core action and current action sorting places it last within a filter.

How it affects subsequent rules in each trigger context belongs to M21.

### 10.5 Move/delete and later-filter visibility

Thunderbird Help explicitly warns that moving a message can affect whether later filters can operate on it and may cause reordering where possible.

The exact cross-filter semantics need focused study in M21.

## 11. Decode/encode asymmetries

### 11.1 Unknown/unparseable filters are preserved and disabled

**Evidence: Implementation-derived — `nsMsgFilterList.cpp`.**

When Thunderbird loads a filter it cannot parse, the current implementation preserves the raw unparsed filter buffer and disables the filter because it does not know how to apply it.

This is a particularly useful precedent for Mailchemy:

```text
unknown semantics
→ preserve evidence
→ do not execute/pretend
```

rather than silently deleting or approximating the unknown construct.

### 11.2 Custom terms/actions

A file may contain extension-defined custom term/action IDs that a bare core Thunderbird installation—or Mailchemy—does not understand.

A decoder may be able to preserve those identifiers and raw values without being able to give them canonical semantics or recreate their runtime behavior elsewhere.

### 11.3 Legacy file versions

Thunderbird can encounter filter files from older versions and contains compatibility handling.

A future encoder should target an explicitly supported current representation while a decoder may need broader backward compatibility.

### 11.4 Folder URI portability

Mailchemy may semantically understand a MoveToFolder action while being unable to re-encode its original target URI in another Thunderbird account/profile until the target folder is resolved there.

### 11.5 Processing list versus persistence representation

A future codec should not assume that successfully parsing `msgFilterRules.dat` proves all referenced extension components or account resources needed for execution are available.

## 12. Unresolved questions

1. Exact attribute/operator applicability matrix for each filter execution context and account type.
2. Exact MIME/body-search semantics across plain text, HTML, multipart messages, and partially downloaded IMAP/POP content.
3. Full execution semantics of multiple ordered filters after move/copy/delete. Deferred to M21.
4. Exact StopExecution behavior in each trigger context. Deferred to M21.
5. Exact semantics of Reply: template source, identity, threading headers, recipient behavior, and MIME composition.
6. Exact semantics of Forward and how they compare with Sieve redirect, Gmail forward, and Graph forward/redirect.
7. Delete behavior across IMAP, POP, local folders, and account deletion settings.
8. Whether the filter UI currently exposes the Periodic execution mode defined in core source, and under which account/configuration circumstances.
9. Whether mixed AND/OR expressions beyond the UI's match-all/match-any model can exist in persisted files and, if so, their grouping semantics.
10. Exact behavior of custom/arbitrary headers with duplicates, unfolding, charset decoding, and missing fields.
11. Whether online versus offline IMAP filter/search scopes can produce observably different matches for the same apparent condition.
12. How tag identifiers/keywords behave when user-visible tag names/colors are renamed or changed.
13. Which extension-defined custom constructs are common enough to justify dedicated first-class Mailchemy semantics later.

## 13. Survey summary

Thunderbird's filter system is a client-local but semantically substantial rule system.

Its native surface includes:

- per-account ordered filter lists;
- several execution contexts;
- AND/OR and match-all conditions;
- subject, sender, recipient, body, date, age, size, state, tag, attachment, junk/spam, arbitrary-header, and custom predicates;
- distinct case-insensitive string operators for contains/equality/prefix/suffix and their negatives;
- operator-dependent structured-address behavior;
- folder move/copy;
- independent multi-tag metadata;
- read/unread, flag, priority, thread, and junk-score mutations;
- reply and forward;
- POP-specific retention/retrieval actions;
- explicit stop execution;
- extension-defined custom terms/actions.

Three points are especially important for Mailchemy.

First, **Thunderbird has both folders and tags**. Those must remain distinct until later synthesis establishes which parts line up with Outlook categories, Gmail labels, Sieve mailboxes/flags, or none of them.

Second, **the effective action order is normalized by Thunderbird**, rather than being an arbitrary list executed literally in stored order. That makes control-flow/execution semantics a first-class compatibility concern.

Third, Thunderbird's own parser preserves unknown/unparseable filter text and disables it instead of pretending to understand it. That behavior strongly validates Mailchemy's architectural preference for explicit unsupported semantics and preservation over silent lossy translation.

This survey deliberately stops short of defining canonical Mailchemy capabilities or claiming equivalence to the other three systems.
