# Semantic-surface survey method

## 1. Purpose

Mailchemy needs a comparable, evidence-backed understanding of each native rule system **before** defining its first concrete semantic capability vocabulary.

The initial surveys cover Sieve, Gmail Filters, Microsoft Outlook/Hotmail Inbox Rules, and Thunderbird message filters.

Each survey should answer:

> What meanings can this rule system express, under what concrete restrictions, and how are those meanings represented?

The surveys are descriptive inputs to later synthesis. They are **not** adapter specifications and must not force Mailchemy's IR to resemble any one native system.

## 2. Scope boundary

This research block inventories each system's semantic surface.

It should cover conditions, actions, logical composition, message/container state, representation, limits, extensions, and execution semantics that are inseparable from understanding a construct.

It should **not** attempt a complete cross-system control-flow model yet. Rule ordering, first/all-match behavior, stop-processing behavior, interactions between moves and later rules, and similar execution questions will receive a dedicated investigation later.

When a survey encounters a control-flow fact:

1. record enough to avoid losing the evidence;
2. label it as a control-flow concern;
3. avoid expanding the survey into an exhaustive execution study unless the fact is required to explain the construct itself.

## 3. Non-goals

The individual surveys must not yet:

- define final `core.*` semantic capability IDs;
- design concrete IR types or APIs;
- decide implementation language or package structure;
- write pairwise provider converters;
- declare two native constructs equivalent merely because they appear similar;
- design lossy fallback behavior;
- turn provider-specific limitations into global semantic concepts;
- settle the rewrite planner or capability-registration API.

Those belong to later synthesis/design work.

## 4. Evidence discipline

### 4.1 Source preference

Prefer sources in this order when available and applicable:

1. **normative specifications/standards** for standardized semantics;
2. **official vendor or upstream documentation** for product behavior, API contracts, supported constructs, and documented limits;
3. **authoritative upstream source code or schemas**, especially where a client/local format is defined by implementation;
4. **official issue trackers/release notes** for version-specific behavior or acknowledged ambiguity;
5. **high-quality secondary material** only to fill gaps or locate primary evidence;
6. **experiments/observations** when documentation is silent, clearly labeled with environment/version and method.

A secondary source must not silently override a normative or official primary source.

### 4.2 Evidence labels

For important claims, make the evidence status obvious in prose or tables. Useful labels include:

- **Normative** — directly defined by a standard/specification.
- **Officially documented** — stated by the responsible vendor/upstream project.
- **Implementation-derived** — established from authoritative source/schema/implementation.
- **Observed** — established by a described reproducible test.
- **Secondary** — supported only by non-authoritative material.
- **Unresolved** — evidence is missing, conflicting, ambiguous, or scope-dependent.

These are provenance classes, not numerical confidence scores.

### 4.3 Source precision

Where practical, record:

- source title;
- direct URL;
- specification section, API field, or source symbol;
- relevant product, protocol, account, or extension scope;
- version/date when behavior may vary;
- whether the source describes syntax, API representation, or actual execution semantics.

Do not cite a broad landing page for a narrow semantic claim when a precise section is available.

### 4.4 Conflicting evidence

When sources conflict:

1. preserve both claims;
2. identify their scope/version if possible;
3. prefer the source with stronger authority for the relevant scope;
4. mark the result unresolved when the conflict cannot be reconciled;
5. do not manufacture a single answer for comparison convenience.

## 5. Survey dimensions

Each investigation should cover the dimensions below when applicable.

### 5.1 System identity and scope

Record:

- exact rule system/dialect being surveyed;
- whether it is standardized, provider-specific, or client-local;
- relevant protocol/API/file representation;
- version or extension scope;
- deliberately excluded provider-specific behavior.

Standardized semantics and one provider's extensions should not be blended into an undifferentiated feature list.

### 5.2 Native rule model

Describe:

- what constitutes a rule/filter/script;
- whether rules have names, IDs, or enabled state;
- whether one rule may contain multiple conditions/actions;
- how logical composition is represented;
- whether nested expressions are possible;
- important structural limits.

### 5.3 Conditions and match semantics

For each condition family, determine as far as evidence permits:

- message field/data examined;
- equality, contains, prefix, suffix, glob, regex, or search semantics;
- address-aware parsing versus raw-text matching;
- case sensitivity and normalization;
- Unicode/internationalization behavior where material;
- treatment of missing fields;
- multiple header/address occurrences;
- negation support;
- value-list behavior;
- wildcard/pattern grammar and escaping;
- parameter or size/count restrictions.

Do not collapse different match operators into one generic "text match" merely for convenience.

### 5.4 Logical composition

Record native support and semantics for AND, OR, NOT/negation, nesting, composition limits, and implicit composition rules in otherwise flat UIs/APIs.

### 5.5 Actions and state transitions

For each action, determine the semantic effect rather than only its native name.

Relevant families may include:

- move/file into;
- copy;
- add/remove label or category;
- keep/archive/inbox behavior;
- delete/trash/discard;
- mark read/unread;
- flag/star/importance;
- redirect/forward;
- notification/reply;
- stop/return/control-flow actions.

Record whether an action changes message membership, metadata, delivery, subsequent processing, or some combination.

### 5.6 Container and message-state model

Describe:

- folders/mailboxes versus labels/categories;
- whether one message may belong to multiple organizational containers;
- inbox/archive semantics;
- trash/deletion semantics;
- special/system containers;
- whether moving is fundamentally different from labeling;
- identifiers/path rules that are representation details rather than semantics.

### 5.7 Ordering/control-flow handoff

Record known facts that materially affect a construct, but flag deeper questions for later control-flow studies.

Examples include an explicit stop-processing action, an action that terminates a script, rule order exposed by an API, or differences between manual and automatic execution.

Do not attempt the later cross-system control-flow synthesis here.

### 5.8 Representation and store boundary

Separate:

- native semantic model;
- textual/API/file representation;
- persistence/store/transport mechanism.

A store or API limitation may constrain an adapter without changing the dialect's semantic definition.

### 5.9 Extensions and provider-local behavior

Record extensions separately from the baseline system.

For each extension/provider-local feature, identify who defines it, how support is advertised/detected, whether it changes existing semantics or adds new semantics, and whether it matters to the initial motivating endpoint.

### 5.10 Limits and validation rules

Capture documented limits that could later become capability refinements, such as maximum counts, pattern restrictions, unsupported combinations, value-length limits, API validation, and account/product-tier differences.

Do **not** prematurely convert these findings into Mailchemy constraint IDs. Preserve the native fact first.

### 5.11 Decode/encode asymmetry

Flag constructs where a future adapter may plausibly have asymmetric support, for example when a native representation contains constructs not exposed by an official write API, an API normalizes rules on creation, or a client parser accepts legacy forms it no longer emits.

Document the native asymmetry without designing the adapter contract yet.

### 5.12 Ambiguities and research gaps

Maintain an explicit section for unresolved semantics, contradictory documentation, undocumented edge cases, behavior requiring experiments, scope/version questions, and issues deliberately deferred to the control-flow block.

Unknown is a valid research result.

## 6. Construct-record format

Use tables when they improve comparison, but do not force every native system into an identical shape.

A useful default row is:

| Native construct | Semantic effect | Parameters / domain | Native constraints | Evidence | Notes / handoff |
| --- | --- | --- | --- | --- | --- |
| Example | What it actually means | Values the construct accepts | Restrictions on valid/useful instances | Source + evidence class | Ambiguity, control-flow note, extension scope |

For complicated constructs, prose subsections are preferable to unreadable mega-tables.

## 7. Suggested investigation document shape

Each individual survey should generally follow:

```text
# <System> semantic-surface survey

## 1. Scope
## 2. Source/evidence baseline
## 3. Native rule model
## 4. Conditions
## 5. Logical composition
## 6. Actions
## 7. Container/message-state model
## 8. Representation and store boundary
## 9. Extensions/provider-specific behavior
## 10. Limits and validation
## 11. Control-flow facts for later follow-up
## 12. Decode/encode asymmetries
## 13. Unresolved questions
## 14. Survey summary
```

The shape may be adapted when a native system genuinely does not fit it. Consistency is useful; falsifying the native model to preserve headings is not.

## 8. Survey summary requirements

The final summary should remain native-system-focused.

It should identify:

- semantic families clearly supported by the system;
- important refinements/restrictions observed;
- unusual state/container semantics;
- extension boundaries;
- unresolved questions;
- control-flow topics deferred for later study.

It should **not** assign final Mailchemy capability IDs or claim cross-system equivalence.

## 9. Completion criteria

A survey is ready for the first cross-system synthesis when:

- major condition/action families are inventoried;
- native matching semantics are described beyond feature names where evidence exists;
- container/state semantics are explicit;
- limits and provider/extension boundaries are separated;
- important claims have traceable evidence;
- unknowns are listed rather than hidden;
- control-flow issues discovered incidentally are preserved for follow-up;
- the document does not silently encode Mailchemy implementation decisions.

The later synthesis can then compare meanings across systems without redoing basic source archaeology.
