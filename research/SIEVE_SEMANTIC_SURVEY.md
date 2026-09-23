# Sieve semantic-surface survey

## 1. Scope

This survey describes the standardized Sieve rule-language semantics relevant to Mailchemy's first interoperability research pass.

The baseline is [RFC 5228, *Sieve: An Email Filtering Language*](https://www.rfc-editor.org/rfc/rfc5228.html), plus standards-track extensions that materially broaden matching, message state, or delivery semantics.

This document intentionally separates:

- **Sieve the rule language/dialect** from **ManageSieve the remote script-management protocol**;
- standardized Sieve semantics from implementation/provider-specific extensions;
- native Sieve facts from any future Mailchemy capability vocabulary.

Purelymail is an initial motivating Sieve endpoint, but its exact advertised extension set and provider behavior are **not** treated here as definitions of Sieve.

### 1.1 Evidence baseline

Primary sources:

- **Normative:** [RFC 5228 — Sieve: An Email Filtering Language](https://www.rfc-editor.org/rfc/rfc5228.html)
- **Normative:** [IANA Sieve Extensions registry](https://www.iana.org/assignments/sieve-extensions/sieve-extensions.xhtml)
- **Normative:** [RFC 3894 — Copying Without Side Effects](https://www.rfc-editor.org/rfc/rfc3894.html)
- **Normative:** [RFC 5173 — Body Extension](https://www.rfc-editor.org/rfc/rfc5173.html)
- **Normative:** [RFC 5229 — Variables Extension](https://www.rfc-editor.org/rfc/rfc5229.html)
- **Normative:** [RFC 5230 — Vacation Extension](https://www.rfc-editor.org/rfc/rfc5230.html)
- **Normative:** [RFC 5231 — Relational Extension](https://www.rfc-editor.org/rfc/rfc5231.html)
- **Normative:** [RFC 5232 — Imap4flags Extension](https://www.rfc-editor.org/rfc/rfc5232.html)
- **Normative:** [RFC 5233 — Subaddress Extension](https://www.rfc-editor.org/rfc/rfc5233.html)
- **Normative:** [RFC 5260 — Date and Index Extensions](https://www.rfc-editor.org/rfc/rfc5260.html)
- **Normative:** [RFC 5293 — Editheader Extension](https://www.rfc-editor.org/rfc/rfc5293.html)
- **Normative:** [RFC 5429 — Reject and Extended Reject](https://www.rfc-editor.org/rfc/rfc5429.html)
- **Normative:** [RFC 5490 — Mailbox Status and Metadata](https://www.rfc-editor.org/rfc/rfc5490.html)
- **Normative:** [RFC 6134 — Externally Stored Lists](https://www.rfc-editor.org/rfc/rfc6134.html)
- **Normative:** [RFC 6609 — Include Extension](https://www.rfc-editor.org/rfc/rfc6609.html)
- **Normative:** [RFC 8579 — Delivering to Special-Use Mailboxes](https://www.rfc-editor.org/rfc/rfc8579.html)
- **Normative:** [RFC 9042 — Delivery by MAILBOXID](https://www.rfc-editor.org/rfc/rfc9042.html)
- **Normative registry:** [RFC 9122 / IANA Sieve Actions registry](https://www.iana.org/assignments/sieve-extensions/sieve-extensions.xhtml#sieve-actions)

The IANA registry was last updated 2024-10-15 at the time of this survey. Its extension list is broader than the subset examined deeply here.

## 2. Native rule model

### 2.1 Script-oriented language

**Evidence: Normative — RFC 5228.**

Sieve is a scripting language normally executed during final message delivery. The base language is intentionally constrained: it has conditionals and actions but no general loops or arbitrary external program execution.

A Sieve script is not naturally equivalent to a flat list of UI "filters". It may contain:

- sequential commands;
- nested conditional blocks;
- tests composed with logical operators;
- several actions along an executed path;
- optional extensions enabled through `require`.

This matters for Mailchemy because translating a Sieve script may require representing an expression/control structure rather than merely one independent rule row at a time.

### 2.2 Extension capability model

**Evidence: Normative — RFC 5228; IANA Sieve Extensions registry.**

Optional functionality is identified by capability strings and enabled with `require`.

The standardized extension namespace is open-ended. IANA separately registers vendor-controlled namespaces such as `vnd.cyrus.*`, `vnd.dovecot.*`, and `vnd.stalwart.*`.

Therefore "supports Sieve" is not one fixed semantic surface. A future Sieve codec/store combination must know the extension capabilities of the concrete implementation it is targeting.

### 2.3 No provider-global feature assumption

The semantic surface is naturally capability-negotiated already:

```text
base Sieve
+ implementation's supported extensions
+ site policy / implementation limits
= concrete usable Sieve surface
```

That is conceptually aligned with Mailchemy's adapter-refinement direction, but this survey does not define how the mapping will be represented.

## 3. Conditions and matching semantics

### 3.1 Base match types

**Evidence: Normative — RFC 5228 §2.7.1.**

The base language defines three match types:

| Native match type | Semantic effect |
| --- | --- |
| `:is` | whole-value equality |
| `:contains` | substring containment |
| `:matches` | whole-value wildcard/glob match using `*` and `?` |

If omitted, the default match type is `:is`.

This is an important semantic distinction. Sieve's `:matches` is not simply another spelling of "contains": the entire tested value must satisfy the glob pattern.

For the base comparators `i;octet` and `i;ascii-casemap`, `?` matches one octet. A different comparator may define character boundaries differently.

### 3.2 Comparators

**Evidence: Normative — RFC 5228 §2.7.3.**

All implementations must support:

- `i;octet` — octet-sensitive comparison;
- `i;ascii-casemap` — US-ASCII case-insensitive comparison.

The default is `i;ascii-casemap`.

Comparators and match types are separate dimensions. A comparator may support equality but not substring-style operations.

This means a future semantic model must avoid flattening "case insensitive", "contains", and "glob" into one provider-shaped text-search operation.

### 3.3 String-list behavior

**Evidence: Normative — RFC 5228 §2.4.2.1.**

Many tests accept lists on both the inspected-field side and key side. For matching tests, a successful combination generally makes the test true.

For example, a header test across `To` and `Cc` against two address strings is true if any tested header value matches any key.

This native any-combination behavior is semantically relevant when translating to APIs that model lists differently.

### 3.4 `header`

**Evidence: Normative — RFC 5228 §5.7.**

`header` compares the values of named message header fields.

Notable semantics:

- header field names are compared case-insensitively;
- leading/trailing whitespace in the field value is ignored for the test;
- any named header/key combination can satisfy the test;
- the selected comparator and match type apply to the header value.

This is fundamentally a field-value test, not an address parser.

### 3.5 `address`

**Evidence: Normative — RFC 5228 §5.1.**

`address` parses structured address-bearing header fields and compares address components rather than display text.

It supports address-part selection:

- `:localpart`;
- `:domain`;
- `:all` (default whole address).

The base specification requires support for address matching over at least `From`, `To`, `Cc`, `Bcc`, `Sender`, `Resent-From`, and `Resent-To`.

It does **not** match display phrases, comments, or group names.

This gives Sieve two semantically different ways to inspect e.g. `From`:

```text
header "From" ...
address "From" ...
```

A Mailchemy survey/synthesis must preserve that distinction.

### 3.6 `envelope`

**Evidence: Normative — RFC 5228 §5.4.**

The optional `envelope` test operates on transport-envelope data rather than message headers.

The base extension defines:

- `from` — SMTP MAIL FROM / equivalent transport sender;
- `to` — the relevant SMTP RCPT TO / equivalent recipient that resulted in delivery to this user.

Only the recipient relevant to the current delivery is exposed.

Transport-envelope identity is therefore a separate semantic input from visible RFC message headers.

### 3.7 `exists`

**Evidence: Normative — RFC 5228.**

`exists` tests whether specified header fields exist.

This is distinct from testing a present header for an empty or non-empty value.

### 3.8 `size`

**Evidence: Normative — RFC 5228.**

The `size` test compares message size using `:over` or `:under` against a numeric threshold.

It is a size/threshold semantic, not a generic relational text test.

### 3.9 `true` / `false`

**Evidence: Normative — RFC 5228.**

Literal boolean tests are built in and are useful in conditional composition and generated scripts.

### 3.10 Body matching

**Evidence: Normative — RFC 5173.**

The `body` extension applies the normal comparator/match-type machinery to message-body-derived data and adds three transforms:

- `:raw` — entire undecoded body as one item, including MIME structural text;
- `:content <types>` — decoded matching against MIME parts of selected content types;
- `:text` — implementation best-effort UTF-8 text extraction; this is the default.

The `:text` semantics intentionally allow implementation variation: sophisticated implementations may remove markup or derive text from non-text media, while simpler ones may effectively treat it as textual MIME content.

Therefore "Sieve body contains X" is **not always one fully implementation-independent semantic** unless the chosen transform and implementation guarantees are known.

### 3.11 Relational matching

**Evidence: Normative — RFC 5231.**

The `relational` extension adds:

- `:value "gt|ge|lt|le|eq|ne"` — relational comparison between message-derived values and keys;
- `:count "gt|ge|lt|le|eq|ne"` — comparison based on the number of entities.

The comparator determines ordering semantics; numeric comparisons commonly use `i;ascii-numeric`.

Counting can apply to entities such as header occurrences or parsed addresses. It is not equivalent to testing a raw string length.

### 3.12 Date/time and index selection

**Evidence: Normative — RFC 5260.**

The `date` extension exposes structured date/time parts from header fields and `currentdate` exposes the current execution date/time.

The `index` extension permits header/address/date tests to select a particular occurrence, with optional last-occurrence semantics.

These are significantly richer than ordinary header text matching.

### 3.13 Subaddress matching

**Evidence: Normative — RFC 5233.**

The `subaddress` extension adds `:user` and `:detail` address parts to `address` and `envelope`.

This permits systems that support detailed/subaddressed recipients (for example `user+detail@example.org`) to test the base user and detail separately.

Exactly how the local part is divided is implementation/environment-dependent.

### 3.14 Variables and string tests

**Evidence: Normative — RFC 5229.**

The `variables` extension adds:

- named string variables;
- `set`;
- variable interpolation into strings;
- a `string` test;
- match variables such as `${1}` where applicable.

Variable names are case-insensitive. Unknown variable references expand to the empty string.

The extension changes how strings are evaluated, so it is more than a standalone "set variable" action.

## 4. Logical composition

### 4.1 AND / OR / NOT

**Evidence: Normative — RFC 5228.**

The base language provides:

- `allof(...)` — logical AND;
- `anyof(...)` — logical OR;
- `not <test>` — logical negation.

Tests can be nested in conditionals.

### 4.2 Short-circuiting with variables

**Evidence: Normative — RFC 5229.**

When the Variables extension is active, test evaluation is explicitly short-circuited left-to-right where needed because matching can set match variables.

That is a control-flow-adjacent semantic fact and should be revisited in M18, but it is preserved here because it can affect observable variable state.

## 5. Actions and state transitions

### 5.1 Base actions

**Evidence: Normative — RFC 5228.**

Base Sieve supplies four message-disposition actions:

| Action | Semantic effect | Baseline requirement |
| --- | --- | --- |
| `keep` | deliver to the user's default/main mailbox | MUST support |
| `fileinto` | deliver into a named mailbox | SHOULD support |
| `redirect` | redirect/forward the message to another envelope recipient | MUST support |
| `discard` | silently discard the message | MUST support |

`redirect` is not MUA-style forwarding that wraps the old message in a newly composed message; it resubmits the processed message for delivery.

### 5.2 Implicit keep

**Evidence: Normative — RFC 5228 §2.10.2.**

If no executed action cancels it, Sieve performs an **implicit keep**.

Base `keep`, `fileinto`, `redirect`, and `discard` cancel the implicit keep.

This means absence of a disposition action is itself semantically meaningful. A future translation that ignores implicit keep could easily duplicate or lose delivery.

Full action interaction belongs to M18, but the concept cannot be omitted from the semantic surface.

### 5.3 Copy semantics

**Evidence: Normative — RFC 3894.**

The `copy` extension adds `:copy` to `fileinto` and `redirect`.

With `:copy`, that action does **not** cancel implicit keep. It files/redirects an additional copy while leaving the eventual default disposition available for later processing.

This is not equivalent to an unconditional explicit `keep`, because later actions can still affect what would otherwise have been the implicit keep.

### 5.4 IMAP flag manipulation

**Evidence: Normative — RFC 5232.**

The `imap4flags` extension provides:

- `setflag`;
- `addflag`;
- `removeflag`;
- `hasflag`;
- `:flags` on `keep` and `fileinto`.

It can operate on IMAP system flags and keywords and maintains a default internal flag set that affects later delivery when explicit `:flags` are omitted.

Therefore "mark read", "flag", "keyword", and "deliver with these flags" are related but not identical native concepts.

### 5.5 Edit headers

**Evidence: Normative — RFC 5293.**

The `editheader` extension adds:

- `addheader`;
- `deleteheader`.

These mutate the message being processed. Subsequent tests/actions can observe the altered message according to the extension's interaction rules.

Header mutation is therefore stateful transformation, not merely a terminal delivery action.

### 5.6 Vacation auto-response

**Evidence: Normative — RFC 5230.**

The `vacation` extension generates an automatic response with standardized suppression/tracking behavior intended to avoid repeated replies and loops.

It accepts parameters controlling aspects such as response interval, subject, sender address, recognized recipient addresses, MIME treatment, and response handle.

It is semantically richer than a generic "send reply" action.

### 5.7 Reject / extended reject

**Evidence: Normative — RFC 5429.**

`reject` and `ereject` refuse delivery and cancel implicit keep.

`ereject` favors protocol-level rejection whenever possible; `reject` may need to express refusal after message acceptance.

These are not equivalent to silently discarding a message.

### 5.8 Notification and other standardized actions

**Evidence: Normative registry — IANA Sieve Extensions / Actions.**

The standardized extension registry also includes action families such as:

- external notifications (`enotify`);
- MIME conversion, enclosure, extraction, replacement, and per-part iteration;
- calendar processing;
- FCC copies of generated messages;
- external-list redirection.

They demonstrate that standardized Sieve extends well beyond common consumer-filter UI concepts.

This initial survey records their existence but does not deeply model every extension.

## 6. Container and message-state model

### 6.1 Mailboxes are delivery targets

**Evidence: Normative — RFC 5228.**

`fileinto` identifies a mailbox delivery target.

Base Sieve allows implementation-specific behavior when the named mailbox is invalid or absent: the implementation may error, create it, or use an implementation-defined fallback depending on environment and extensions.

Therefore a mailbox string is not automatically a portable identity.

### 6.2 Mailbox existence / creation

**Evidence: Normative — RFC 5490.**

The `mailbox` extension adds mailbox-existence testing and `:create` behavior for `fileinto`.

This separates two concepts that many filter UIs blur:

- choosing an existing container;
- permitting creation of a missing one.

### 6.3 Stable mailbox identity

**Evidence: Normative — RFC 9042.**

The `mailboxid` extension allows mailbox selection/existence checks using IMAP OBJECTID-style stable identifiers that survive mailbox rename.

This is representation/store-aware identity and should not be confused with the semantic idea of a named folder.

### 6.4 Special-use roles

**Evidence: Normative — RFC 8579.**

The `special-use` extension can target or test mailboxes by IMAP special-use role rather than literal mailbox name.

This adds an important semantic distinction:

```text
"deliver to mailbox named X"
vs
"deliver to whichever mailbox represents role \Trash / \Archive / etc."
```

The latter can potentially interoperate more naturally with providers whose system containers are semantically identified rather than user-path identified.

### 6.5 Labels are not a base Sieve concept

Standard Sieve's primary organizational target is a mailbox, plus IMAP flags/keywords through extensions.

A multi-label model such as Gmail's is therefore not natively identical to `fileinto`.

That is a cross-system comparison point for M16, not an equivalence conclusion here.

## 7. Representation and store boundary

### 7.1 Sieve text is the dialect representation

Sieve is a textual language with commands, tests, blocks, strings, tags, and extension declarations.

Its syntax is part of the dialect representation; the semantic survey should not assume Mailchemy's internal IR will resemble that syntax.

### 7.2 ManageSieve is separate

ManageSieve ([RFC 5804](https://www.rfc-editor.org/rfc/rfc5804.html)) is a protocol for remotely managing Sieve scripts.

A ManageSieve server advertises a `SIEVE` capability containing supported Sieve extensions.

Conceptually:

```text
Sieve
  dialect / codec concern

ManageSieve
  remote script store / endpoint concern
```

A local `.sieve` file and a ManageSieve endpoint can therefore share the same Sieve dialect codec while differing completely in persistence/transport.

## 8. Extensions and provider-specific behavior

### 8.1 Standardized extension breadth

**Evidence: Normative registry — IANA.**

The IANA registry includes standardized capabilities for body, copy, date, duplicate, editheader, notifications, envelope extensions, environment, external lists, fileinto variants, IMAP events/flags, include, mailbox metadata/identity, MIME processing, relational comparisons, spam/virus scoring, special-use mailboxes, subaddresses, vacation, variables, and more.

No adapter should infer that a remote Sieve implementation supports all registered extensions.

### 8.2 Vendor namespaces

**Evidence: Normative registry — IANA.**

IANA registers vendor-controlled extension name prefixes including Cyrus, Dovecot, and Stalwart families.

These must remain distinct from core standardized semantics during research.

### 8.3 Purelymail

Purelymail is deliberately **not** characterized here beyond being a motivating Sieve/ManageSieve endpoint.

Its exact runtime capabilities should be established from its advertised ManageSieve capabilities and/or provider documentation in endpoint-specific research.

## 9. Limits and validation

### 9.1 Base numeric minimum

**Evidence: Normative — RFC 5228.**

Implementations must support non-negative integer values at least through 2^31−1 and may support larger values.

### 9.2 Action/site-policy limits

**Evidence: Normative — RFC 5228.**

Implementations may impose site-policy limits on action counts and action combinations.

Therefore a syntactically/semantically valid Sieve script can still exceed a concrete implementation's accepted domain.

### 9.3 Mailbox names

**Evidence: Normative — RFC 5228.**

Implementations may restrict mailbox naming and differ in behavior for missing/invalid mailboxes.

This is a natural future adapter refinement rather than a universal Sieve semantic restriction.

### 9.4 Variables minimums

**Evidence: Normative — RFC 5229.**

Implementations of `variables` must support at least:

- 128 distinct variables;
- variable names at least 32 characters;
- variable values at least 4000 characters;
- match variables `${1}` through `${9}`.

Larger implementation limits may vary.

### 9.5 Body implementation variation

**Evidence: Normative — RFC 5173.**

The `:text` transform intentionally permits variation in best-effort text extraction.

This creates a semantic portability hazard even when both systems nominally support the same Sieve extension.

## 10. Control-flow facts for later follow-up

These facts are preserved here but should be investigated systematically in M18.

### 10.1 Sequential execution and `stop`

**Evidence: Normative — RFC 5228.**

`stop` terminates all script processing. If implicit keep remains uncancelled, it is performed.

### 10.2 Conditional structure

Sieve uses `if` / `elsif` / `else` blocks and nested tests rather than an inherently unordered set of filters.

### 10.3 Action interaction

The base specification defines implicit-keep cancellation, while extensions must specify their interactions with existing actions.

The IANA Sieve Actions registry now records interaction metadata for standardized actions.

### 10.4 Included scripts

**Evidence: Normative — RFC 6609.**

The `include` extension adds execution of other scripts, `return`, and global variable sharing.

This expands the control-flow graph beyond one physical script.

### 10.5 IMAP-triggered Sieve

**Evidence: Normative — RFC 6785 / IANA registry.**

The `imapsieve` extension permits Sieve execution for certain IMAP events, not just final delivery.

That changes execution context and applicability of some actions.

These topics are intentionally not synthesized here.

## 11. Decode/encode asymmetries

Potential asymmetries that a future Sieve adapter must account for include:

1. **Unsupported extensions on the target.** A decoder may understand a standardized construct that a selected Sieve server does not advertise for encoding/execution.
2. **Vendor extensions.** A parser may preserve or understand them without Mailchemy having canonical semantics for them.
3. **Implementation limits.** Mailbox names, variable sizes, action counts, or body extraction behavior may constrain encoding.
4. **Store capability.** ManageSieve exposes the target's extension set; a local file alone does not identify what eventual interpreter will execute it.
5. **Normalization/formatting.** Semantic round-trip equality should not depend on reproducing source whitespace/comments/text formatting.

No concrete adapter policy is selected in this survey.

## 12. Unresolved questions

1. Which exact extension set does the initial Purelymail endpoint advertise today?
2. Which standardized extensions should be considered part of Mailchemy's **first implementation scope**, as opposed to merely representable future semantics?
3. How should implementation-dependent `body :text` extraction be classified for exact cross-system equivalence?
4. What mailbox naming, creation, special-use, and flag behaviors are actually available on initial Sieve targets?
5. How should Sieve script-level control structures map to rule systems whose API model is a flat ordered list? Deferred to M18/M22.
6. How should vendor extension syntax be preserved when Mailchemy can decode the script structurally but lacks a semantic contract for the extension?
7. How should variables and stateful message mutation interact with a canonical semantic expression model? This needs synthesis after the other native systems are surveyed.

## 13. Survey summary

The standardized Sieve ecosystem exposes several distinct semantic families:

- raw header field tests;
- structured address tests;
- SMTP/equivalent transport-envelope tests;
- exact, substring, and whole-value glob matching with configurable comparators;
- header existence and message-size tests;
- nested boolean composition;
- mailbox delivery, default keep, forwarding, and silent discard;
- implicit-delivery state;
- copy-without-cancelling-default-delivery semantics;
- MIME/body matching;
- relational/count/date/index matching;
- subaddress semantics;
- variables and string evaluation;
- IMAP flags/keywords;
- mailbox existence/creation/stable identity/special-use roles;
- message mutation;
- vacation, rejection, notification, and numerous other standardized extension actions.

The central research conclusion is **not** that Mailchemy should reproduce Sieve's AST.

It is that Sieve itself contains many semantically separate operations that superficially similar consumer-filter UIs often collapse together. Any cross-system comparison must preserve those distinctions until exact equivalence is actually demonstrated.
