# Mailchemy architecture

## 1. Purpose

Mailchemy is a semantics-first interoperability layer for message-filter and rule systems.

Its core question is not:

> Does target system B have the same named feature as source system A?

It is:

> Can the meaning of this concrete rule be represented exactly by the target, either directly or through a proven semantics-preserving realization?

The architecture therefore separates:

1. semantic meaning;
2. native rule-system syntax/representation;
3. storage/transport/endpoints;
4. adapter-specific limitations;
5. exact equivalence rewrites.

### 1.1 Working terminology

These terms are intentionally distinct:

- **semantic capability** — a versioned meaning contract in the canonical vocabulary, such as a sender-match or move action;
- **constraint/refinement** — an adapter-local restriction over which concrete instances of a semantic capability can be represented directly;
- **rewrite** — a proven semantics-preserving transformation from one IR expression to another equivalent expression;
- **dialect** — a native rule language/model with its own syntax or representation and semantics;
- **codec** — the logic that decodes a dialect into canonical IR and/or encodes canonical IR into that dialect;
- **store** — a persistence mechanism for a native representation, such as a file or profile;
- **endpoint** — a remotely accessed store/transport surface such as ManageSieve, Gmail API, or Microsoft Graph;
- **adapter** — a convenient umbrella term for the integration package around one or more related codecs/stores/endpoints. It must not erase the architectural distinction between them.

An implementation may choose different type/module names, but project documentation should preserve these conceptual boundaries.

## 2. Canonical semantic IR

Mailchemy uses a canonical semantic intermediate representation (IR).

The IR is an **internal semantic model**, not necessarily a user-facing language. It does not need a textual syntax or file format.

The IR is intentionally **not restricted to the global intersection of every supported input/output system**. It may represent semantics that only some adapters can encode.

This prevents adding a weak adapter from reducing the expressiveness available between stronger adapters.

A rule can therefore be portable across one selected adapter set and non-portable across another.

Example:

```text
Sieve ↔ Outlook
    may share semantics X, Y, Z

Gmail ↔ Outlook
    may share only X, Y

Sieve ↔ Thunderbird
    may additionally share Q
```

"Universal" compatibility is contextual, not a single global bit.

Research also establishes that the IR cannot be reduced to an unordered bag of leaf conditions and actions. For stateful or ordered rule systems, **execution structure can itself carry meaning**.

The canonical model must therefore be capable, in some implementation-defined form, of preserving enough information about:

- execution/trigger context when it affects semantics;
- ordering or absence of ordering guarantees;
- rule/action grouping when boundaries are observable;
- continuation barriers such as "do not evaluate later rules";
- intermediate-state visibility between mutations and later predicates;
- default/local-delivery behavior;
- action terminality as distinct from the action's primary state/lifecycle effect;
- target action-order constraints where arbitrary interleavings are not realizable.

This requirement does **not** settle the concrete IR type hierarchy. It only establishes that representations with the same leaf operations are not necessarily semantically equivalent when they produce different observable execution traces.

## 3. Semantic capability registry

Semantic primitives use stable, versioned identifiers.

Conceptual examples:

```text
core.condition.sender.equals@1
core.condition.sender.glob@1
core.condition.subject.contains@1
core.logic.and@1
core.action.move@1
```

The version is part of the semantic identifier because it versions the **meaning contract**.

A new version is required when the semantic contract itself changes incompatibly. Adapter quirks or newly discovered implementation restrictions do not create new semantic versions by themselves.

The registry defines what an operation means. Adapters do not redefine those semantics.

The registry should be extensible. Core semantics may use a project-controlled namespace while future adapters/extensions may use independent namespaces without requiring every specialized semantic concept to become part of the core vocabulary.

### 3.1 Independent version domains

Mailchemy should not use one version number to mean several unrelated things.

At minimum, the architecture should permit independent versioning for:

- **semantic operation contracts**, carried in identifiers such as `core.condition.sender.glob@1`;
- **rewrite contracts**, whose identity/version describes one exact semantic transformation and its preconditions;
- **capability/refinement declaration schema**, which versions the structure used by adapters to describe direct support and constraints;
- **external serialization schemas**, if/when portable file formats are added;
- **adapter/integration implementations**, when their own release/version identity is useful.

Changing an adapter limitation or adding a new exact rewrite does not automatically require a new semantic-capability version. Likewise, evolving the capability-declaration schema must not silently change the meaning of existing semantic IDs.

## 4. Capability refinement and constraints

An adapter does not merely declare a boolean such as:

```text
supports sender.glob = true
```

Instead, it may implement only a **refined subset** of a semantic capability's valid instances.

Conceptually:

```text
core.condition.sender.glob@1
    all valid glob instances

Adapter A supports:
    the subset with no leading wildcard

Adapter B supports:
    the subset with at most one wildcard
```

A constraint therefore acts like a restricted domain over a semantic capability.

This is similar to a "reverse subclass" intuition: instead of adding semantics to a parent capability, the adapter states which portion of the parent's semantic domain it can realize.

The restriction remains adapter-local. It does **not** require minting global pseudo-capabilities such as:

```text
sender.glob.no-leading
sender.glob.max-one-wildcard
sender.glob.no-leading.max-one-wildcard
```

That avoids combinatorial capability-taxonomy growth and allows new adapters to describe their own limitations without modifying the global semantic registry.

### 4.1 Instance- and structure-level support

Compatibility must be evaluated for the **concrete IR node or semantic/execution structure**, not only for the capability identifier.

For example, an adapter may directly support:

```text
sender.glob("foo*@example.com")
```

while rejecting:

```text
sender.glob("*@example.com")
```

even though both use the same semantic capability ID.

Common simple constraints may eventually have reusable identifiers or declarative schemas, but the architecture must also permit an adapter-specific predicate when a real system's limitations are too irregular to model elegantly.

Control-flow research adds an important case: a target may support two leaf operations independently while lacking a proven exact realization of their composition.

For example:

```text
mark-read action      → directly supported
unread predicate      → directly supported

mark-read
then later test unread
                      → unsupported or unproven as a structure
```

Support checking must therefore be able to reject a larger execution region even when every leaf node is individually recognized.

The adapter's concrete support check remains authoritative.

## 5. Exact semantic rewrites

Failure of direct encoding does not necessarily mean incompatibility.

Mailchemy maintains a registry/graph of **exact semantics-preserving rewrites**.

Example:

```text
sender.glob("foo*")
    ≡
sender.startsWith("foo")
```

when the semantic preconditions for that equivalence are satisfied.

A rewrite:

- may be conditional on the concrete expression;
- may have a stable/versioned rewrite identity;
- may transform one expression into another expression;
- may expand one node into many nodes or an arbitrary expression tree;
- may transform a larger execution region when rule boundaries, ordering, or continuation are semantically relevant;
- may have multiple alternative exact realizations.

Example:

```text
X
├── rewrite A → C
├── rewrite B → AND(D, E)
└── rewrite C → OR(F, AND(G, H))
```

All three paths may be exact representations of the same meaning.

### 5.1 Rewrites operate on semantic expressions

Rewrites are not limited to one capability ID replacing another.

They may transform AST patterns, for example:

```text
NOT(sender.contains("foo"))
    ≡
sender.notContains("foo")
```

or, when semantics permit:

```text
NOT(AND(A, B))
    ≡
OR(NOT(A), NOT(B))
```

Therefore the rewrite system should be understood as expression transformation rather than a flat feature-alias table.

### 5.2 Rewrite planning

For a target adapter, conceptual realization is:

```text
1. Can the target encode this semantic expression/structure directly?
   ├── yes → encode it
   └── no
       ↓
2. Search exact rewrite alternatives.
       ↓
3. Find a semantically equivalent expression/structure
   that satisfies target and endpoint execution constraints.
   ├── found → encode that realization
   └── none → report incompatibility
```

Because equivalences may be bidirectional or cyclic and may have several realization paths, a real planner must not assume a tree.

Future implementation should be prepared for:

- canonicalized semantic states;
- visited-state/cycle protection;
- bounded search;
- realization cost/preference;
- choosing direct realization over unnecessary expansion when both are exact.

The exact planning algorithm is not yet selected.

## 6. Direct, derived, and unsupported realization

A useful conceptual support model is:

```text
Direct
Derived
Unsupported
```

- **Direct** — the adapter can encode the concrete semantic expression/structure directly.
- **Derived** — the expression/structure cannot be encoded directly, but an exact rewrite path reaches a realizable equivalent.
- **Unsupported** — no proven exact realization is available for the requested expression/structure and target context.

A derived realization should retain its derivation path for diagnostics and explainability.

The traditional "capability matrix" is therefore a **derived view** of the registry, constraints, and rewrite graph rather than the architectural source of truth.

## 7. Exactness and loss

Normal Mailchemy interoperability is exact.

For simple stateless predicates/actions, exactness may be established locally. For ordered or stateful rules, exactness can require **execution-trace equivalence**: relevant evaluations, state transitions, delivery outcomes, continuation decisions, and external side effects must remain semantically equivalent.

The system must not silently:

- drop unsupported conditions/actions;
- broaden a match;
- narrow a match;
- convert an unsupported semantic into a merely similar provider feature;
- approximate a rule because the target has no exact equivalent.

When an imported native rule contains semantics that cannot be represented in the canonical IR, or an IR expression cannot be realized by a requested target, Mailchemy should preserve/report as much diagnostic information as practical and refuse to claim exact conversion.

A future explicitly requested lossy/approximate mode may be useful, but it must be a separate policy and visibly report the semantic loss.

Approximate transformations do not belong in the normal exact-equivalence rewrite graph.

## 8. Codecs/dialects vs stores/endpoints

Mailchemy separates **rule semantics/representation** from **where rules are stored or transported**.

Conceptually:

```text
Dialect / codec
    parses/decodes native rules ↔ canonical semantic IR

Store / endpoint
    reads/writes the native representation
```

Examples:

```text
Sieve codec
    ↕
local .sieve file

Sieve codec
    ↕
ManageSieve endpoint

Thunderbird codec
    ↕
Thunderbird profile/filter storage

Gmail codec
    ↕
Gmail API

Microsoft Inbox Rules codec
    ↕
Microsoft Graph
```

Some systems fuse these concerns operationally, but the architecture should not.

### 8.1 Endpoint capability profiles

A codec's semantic reach and a concrete endpoint's usable capability set are separate questions.

The initial Purelymail investigation demonstrates:

```text
canonical semantic operation
        ↓
Sieve codec can represent it
        ↓
connected endpoint advertises/accepts it
```

A general Sieve codec may understand a standardized extension that a particular ManageSieve endpoint does not advertise. Runtime-discovered, account-specific, or provider-specific endpoint constraints must therefore participate in realization planning without redefining the dialect's semantic contracts.

This separation permits unusual but useful combinations such as:

```text
local Sieve file → IR → Thunderbird rule storage
Purelymail ManageSieve → Sieve codec → IR → Gmail
Microsoft Graph → IR → portable file codec
```

## 9. Codec contract

Each supported native rule system conceptually has two semantic directions:

```text
native → decode → canonical IR
canonical IR → encode → native
```

Decode and encode support need not be identical.

An adapter may be able to understand a native construct but be unable to generate it safely, or vice versa.

Provider-to-provider conversion then requires no pairwise converter:

```text
source native
    ↓ decode
canonical IR
    ↓ exact realization planning for target
target native
```

For N rule systems, this scales around each system's relationship with the canonical semantics rather than N×(N-1) hand-written pairwise translators.

## 10. Round-trip invariants

For semantics inside the supported exact subset, the important invariant is **semantic equivalence**, not byte-for-byte reproduction.

Conceptually:

```text
native rule
    ↓ decode
IR
    ↓ encode
native rule'
```

should preserve meaning even if formatting, generated IDs, or provider-normalized representation changes.

Ordering/grouping may change only when that change is proven semantically irrelevant or an exact rewrite proves the resulting execution trace equivalent. Research has shown that rule boundaries and action order can be observable semantics, so ordering is not generally cosmetic.

Cross-system round trips should also be testable through normalized semantic IR:

```text
Sieve
  ↓
IR-A
  ↓
Gmail
  ↓
IR-B

IR-A ≡ IR-B
```

where all involved semantics are supported exactly.

## 11. Serialization is just another codec

The canonical IR does not require an export format.

If a portable format becomes useful, it should be implemented like any other supported representation:

```text
Portable JSON/YAML/etc.
    ↕ codec
canonical IR
```

with an explicit versioned schema.

This prevents a persistence format from accidentally becoming the domain model.

The internal semantic representation may evolve independently while codecs handle stable external schema versions.

## 12. Initial scope vs future extension

The initial motivating ecosystem is Sieve/Purelymail, Gmail, Microsoft Outlook/Hotmail, and Thunderbird.

The architecture intentionally allows future:

- hosted providers;
- standardized protocols;
- client-local rule formats;
- file formats;
- third-party extension semantics;
- additional stores/transports.

An adapter should primarily need to:

1. decode native semantics into the canonical model where possible;
2. encode canonical semantics it can realize;
3. describe/refine its direct-support domain;
4. rely on shared exact rewrites for alternate realizations;
5. add genuinely new semantic operations/rewrite rules only when necessary.

It should not need knowledge of every other adapter's limitations.

## 13. Explicitly open questions

The architecture above is the current design direction, but these implementation choices remain intentionally open:

- implementation language/runtime;
- concrete IR type representation;
- plugin/discovery mechanism for adapters;
- concrete capability/constraint registration API;
- rewrite-planner algorithm and cost model;
- whether common constraints receive globally versioned identifiers or primarily reusable implementation types;
- concrete IR representation for ordering, grouping, continuation, trigger context, intermediate-state visibility, default delivery, and terminality;
- schema and existence of any portable serialization format;
- CLI/UI shape;
- synchronization policy and conflict handling;
- initial exact capability vocabulary;
- targeted experiments for currently underdocumented provider execution behavior, including Gmail multi-filter state visibility, Outlook intermediate-state visibility, Thunderbird automatic-vs-manual execution parity, and Purelymail's account/user Sieve handoff.

These should be decided from evidence and implementation needs rather than inferred from pseudocode examples in design discussion.
