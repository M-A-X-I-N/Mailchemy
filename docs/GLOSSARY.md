# Mailchemy glossary

This glossary defines Mailchemy's current durable project vocabulary.

It is intentionally conceptual rather than tied to implementation names, classes, schemas, or a programming language. If implementation type names later differ, project documentation should preserve these meanings.

Research-specific native-system terminology belongs in `research/`; this document owns Mailchemy terminology.

## Adapter

An integration package around one or more related codecs, stores, endpoints, capability/refinement declarations, and provider-specific behavior.

`adapter` is a convenient umbrella term. It must **not** erase the distinction between semantic representation and persistence/transport.

Example:

```text
Purelymail adapter
    may contain
    Sieve codec
    + ManageSieve endpoint support
    + Purelymail-specific endpoint refinements
```

## Capability / semantic capability

A stable, versioned contract describing one canonical semantic meaning that Mailchemy can represent.

A semantic capability describes **meaning**, not whether every adapter supports every instance.

Conceptual examples include:

- subject containment;
- parsed sender-address equality;
- mark-read;
- mailbox/container placement;
- logical conjunction.

Capability identifiers are expected to be versioned because incompatible changes to the meaning contract require a new version.

Provider quirks and endpoint restrictions do **not** create new global capabilities by themselves.

## Capability refinement

See **constraint / refinement**.

## Canonical IR

Mailchemy's internal semantic intermediate representation.

The IR represents canonical meaning rather than any one provider's syntax, API, UI, or persistence format.

It is not restricted to the intersection of all supported systems and does not need to have a human-authored textual syntax.

Research now indicates that the IR will need to preserve enough execution structure to distinguish rules that contain the same leaf conditions/actions but have different observable traces. The concrete IR shape remains undecided.

## Codec

The component that maps between a native dialect/representation and canonical Mailchemy semantics.

Conceptually:

```text
native representation
    ↕ codec
canonical IR
```

Decode and encode support need not be symmetric.

## Constraint / refinement

An adapter-local restriction over which concrete instances or structures of a semantic capability can be represented or realized.

Example:

```text
semantic capability:
    sender glob

target refinement:
    supports only patterns with at most one wildcard
```

Refinements prevent endpoint/provider limitations from exploding into global pseudo-capabilities.

Research also shows that refinements may apply to **composed execution structures**, not only single leaf nodes. A target may support both `mark read` and `test unread` individually while lacking a proven exact realization of an ordered `mark read → later test unread` trace.

## Continuation / continuation barrier

Continuation describes whether later processing units are still evaluated after some action or control construct.

A **continuation barrier** suppresses some later processing scope.

The scope must be explicit. Examples include:

- remaining commands in a script;
- later rules in a rule list;
- the remainder of an included/nested script;
- later filters for one message.

Sieve `stop`, Outlook `stopProcessingRules`, and Thunderbird StopExecution are related but not universally equivalent continuation barriers.

## Derived realization

A target realization reached through one or more proven exact rewrites rather than direct encoding of the original semantic expression.

A derived realization remains exact. Its rewrite/derivation path should be retainable for diagnostics and explanation.

See also **Direct realization**, **Rewrite**, and **Unsupported**.

## Dialect

A native rule language/model and its semantics.

Examples:

- Sieve;
- Gmail Filters/search model;
- Microsoft Outlook Inbox Rules;
- Thunderbird message filters.

A dialect is not the same thing as where rules are stored or how they are transported.

## Direct realization

A realization in which the target can encode the concrete semantic expression/structure without first transforming it through an exact rewrite.

`Direct` does not mean universally supported for every instance of the capability; adapter refinements still apply.

## Endpoint

A remotely accessed store/transport surface.

Examples:

- ManageSieve server;
- Gmail API;
- Microsoft Graph.

An endpoint can impose restrictions beyond the dialect/codec itself.

For example, a general Sieve codec may understand an extension that a connected Sieve endpoint does not advertise.

## Endpoint capability profile

The concrete capabilities and restrictions currently exposed by a particular endpoint.

This may be runtime-discoverable and time-varying.

Purelymail's advertised ManageSieve extension list is the project's first concrete example.

An endpoint capability profile refines realizability; it does not redefine the underlying dialect semantics.

## Exact / exact interoperability

A translation or realization that preserves the relevant source semantics without broadening, narrowing, dropping, or approximating them.

For stateful/ordered rules, exactness may require **execution-trace equivalence**, not merely matching final leaf actions.

Exact interoperability is Mailchemy's normal operating mode.

## Execution context / trigger

The event or lifecycle stage in which rule processing occurs.

Examples include:

- incoming delivery;
- incoming processing before or after junk classification;
- manual execution over existing messages;
- post-send;
- archive.

The same condition/action expression may not have identical semantics under every execution context.

## Execution trace

The observable sequence of condition evaluations, state changes, deliveries, continuation decisions, and external side effects produced by a rule/ruleset for a given input and execution context.

For ordered/stateful rule systems, semantic equivalence often means that the source and target produce equivalent relevant traces, not merely that they contain the same named conditions and actions.

## Intermediate-state visibility

Whether a later predicate/action can observe mutations produced earlier in the same execution trace.

Example question:

```text
Rule 1 marks the message read.
Rule 2 tests whether it is unread.

Does Rule 2 see the original state or the mutated state?
```

Visibility can be guaranteed, unavailable, context-specific, or unknown.

## Leaf semantic / leaf capability

An individual semantic operation or predicate considered without its surrounding execution structure.

Examples:

- mark read;
- test unread;
- subject contains X.

Leaf support does not prove support for every composition of those leaves.

## Lossy / approximate conversion

A translation that intentionally changes, broadens, narrows, drops, or approximates source meaning.

Lossy conversion is **not** normal Mailchemy interoperability.

If ever implemented, it must be explicitly requested and must report the semantic loss.

Approximate transforms do not belong in the exact rewrite graph.

## Native representation

The concrete syntax/data structure used by a rule system.

Examples include:

- Sieve text;
- Gmail Filter JSON resources;
- Microsoft Graph `messageRule` JSON;
- Thunderbird `msgFilterRules.dat`.

Native representation is distinct from canonical semantics.

## Opaque preservation

Preserving native data/constructs that Mailchemy can carry or reproduce without claiming to understand their canonical semantics.

This is useful for unknown extensions or native constructs.

Opaque preservation must never be presented as exact semantic translation to another system unless their meaning is actually known.

Thunderbird's own preservation of unparseable disabled filters is a useful conceptual precedent.

## Realization

A concrete target expression/structure that represents a canonical semantic expression for a selected target.

Realization may be:

- **Direct** — target encodes it as-is semantically;
- **Derived** — exact rewrites transform it into a target-realizable equivalent;
- **Unsupported** — no proven exact realization exists.

Control-flow research shows that realization checks sometimes need to cover a whole execution region rather than independent leaf nodes.

## Realization planner

The conceptual component that determines whether and how a canonical semantic expression can be represented exactly by a target.

Conceptually it may:

1. test direct realization;
2. search exact rewrite alternatives;
3. validate target refinements and endpoint constraints;
4. choose an exact realizable expression/structure;
5. report unsupported when no proven path exists.

The concrete planning/search algorithm is not yet selected.

## Refinement

See **constraint / refinement**.

## Rewrite

A proven semantics-preserving transformation from one canonical semantic expression/structure to another equivalent expression/structure.

A rewrite may:

- be conditional on concrete values or shape;
- expand one node into several nodes;
- operate over an expression tree or execution region;
- have multiple alternative exact realizations;
- require semantic preconditions.

A rewrite is not merely an alias between capability names.

Approximate transformations are not exact rewrites.

## Rule boundary / action grouping

The boundary that determines which conditions/actions belong to one native or canonical processing unit.

Research shows that boundaries can be semantically observable.

For example, Thunderbird may reorder actions after several filters are merged into one filter, changing the copied message state.

Therefore rule/action grouping must not be discarded as cosmetic structure unless equivalence is proven.

## Semantic operation

A canonical operation with a defined meaning contract.

In current project usage this is closely related to **semantic capability**; a capability identifies/version-controls the contract, while an operation is an occurrence/use of that meaning in an expression.

## Store

A persistence mechanism for a native representation.

Examples:

- local `.sieve` file;
- Thunderbird profile/filter file;
- a remote rule collection when considered as persistence rather than transport.

A store is distinct from the codec that understands the stored semantics.

## Structural support / structural realizability

Whether the target can realize a composed semantic/control-flow structure exactly, beyond supporting its individual leaves.

Example:

```text
target supports: mark-read
target supports: unread predicate

but target does not expose/prove:
mark-read -> later re-test unread
```

This is an important refinement of a leaf-only capability model.

## Terminality

The effect that an action or control construct has on subsequent processing.

Terminality is independent from the action's lifecycle/state effect.

For example:

- Sieve `fileinto` changes delivery placement but is non-terminal;
- Outlook move is non-terminal unless stop-processing is separately requested;
- Thunderbird MoveToFolder is terminal in the proven manual/after-the-fact path;
- Sieve `discard` is destructive-looking but does not simply terminate compatible actions.

Mailchemy must therefore not bake one universal terminality assumption into actions such as move or delete.

## Unsupported

A result meaning that no proven exact target realization is available for the requested semantic expression/structure under the relevant target refinements and endpoint context.

`Unsupported` is preferable to silently approximating.

Unknown or undocumented native semantics may also force an exact transformation to remain unsupported/unproven until evidence exists.

## Versioned semantic contract

The stable meaning associated with a semantic capability identifier/version.

An incompatible change to the meaning contract requires a new semantic version.

Changes to endpoint restrictions, adapter bugs, rewrite availability, or declaration schemas do not by themselves change the semantic version.