# Semantic capability contracts

This document owns the durable meaning of Mailchemy's implemented core semantic capability versions.

A capability version describes **Mailchemy semantics**, not the behavior of any one provider. Native codecs/targets may report a concrete instance or structure as Direct only when they can prove that their native behavior is exact under the contract here. Otherwise they must use an appropriate Unsupported classification.

Research evidence about external systems remains under [`../research/`](../research/README.md). This document records the semantic choices Mailchemy has made after considering that evidence.

## `core.condition.subject.contains@1`

**Role:** condition.

**Parameters:**

```text
{ needle: string }
```

The `needle` must be non-empty. Whitespace-only and otherwise unusual non-empty strings are valid. No other parameter fields exist in version 1.

### Message projection

The condition evaluates the logical values of all `Subject` header fields exposed for the message.

Each field value is understood as already:

1. unfolded from RFC-style header folding;
2. decoded from any encoded-word representation into Unicode text.

The MIME/header decoder that produces this logical view is outside this leaf capability. If a source cannot establish such a view reliably, that source must not pretend that this capability's semantics were proven.

A missing Subject is represented by zero logical Subject values.

Although standards normally permit at most one Subject field, malformed messages may contain repeats. Version 1 defines repeated-field behavior explicitly: **the condition matches when any logical Subject value matches**.

### Comparison

For both each Subject value and the `needle`:

1. normalize Unicode to NFC;
2. apply locale-independent Unicode lowercase conversion;
3. test ordinary contiguous substring containment.

This is intentionally **not full Unicode case folding**. For example, `Straße` does not contain `STRASSE` under this version's contract.

The parameter itself is canonicalized to NFC when the semantic specimen is created. Case is retained in the stored parameter; comparison lowercases only for evaluation.

### Truth conditions

- no Subject field → false;
- one or more Subject fields → true if any normalized/lowercased field contains the normalized/lowercased needle;
- empty needle → invalid canonical semantics rather than vacuous truth.

### Why this contract is independent of provider behavior

The initial cross-system research found a broad subject-containment family but did **not** establish identical provider comparison/normalization behavior.

Mailchemy therefore defines one precise canonical meaning here. A provider whose case handling, Unicode normalization, repeated-header behavior, or logical Subject projection is not proven equivalent may later be classified as `Unsupported(exactness-unproven)` for this capability or for affected instances.

### Evidence

See:

- [First cross-system semantic comparison §4.3](../research/FIRST_CROSS_SYSTEM_SEMANTIC_COMPARISON.md#43-subject-contains-is-broadly-shared-but-not-yet-universally-exact)
- the individual Sieve, Gmail, Outlook, and Thunderbird semantic-surface surveys under [`../research/`](../research/README.md)


## `core.condition.has-attachment@1`

**Role:** condition.

**Parameters:** none. The canonical parameter value is `null`.

### Message projection

Version 1 evaluates the parsed MIME entity tree for the message. The projection supplied to this leaf semantic must expose, for each MIME entity:

- whether the entity is a multipart container;
- the parsed `Content-Disposition` disposition type, or no disposition when absent/unparseable.

MIME parsing itself is outside this leaf capability. A source that cannot establish this projection reliably must not claim exact semantic decoding.

### Attachment definition

The condition is true if and only if **at least one non-multipart MIME entity has an explicit disposition type of `attachment`**.

Disposition type tokens are compared case-insensitively.

Version 1 intentionally does **not** infer attachment status from:

- a filename parameter alone;
- a `name` parameter on `Content-Type`;
- an `inline` disposition;
- media type;
- message size;
- provider UI/API attachment heuristics.

A multipart container does not count as an attachment merely because it carries an abnormal `Content-Disposition: attachment`; a qualifying non-multipart entity must exist.

### Why the initial contract is narrow

The initial research found explicit attachment predicates in Gmail, Outlook, and Thunderbird but did not establish that their provider/client heuristics identify the same MIME structures. Base Sieve/Purelymail did not expose a comparably direct primitive.

Mailchemy therefore starts with a deliberately narrow structural meaning that can be reasoned about exactly. Later semantic versions or separate capabilities may model broader attachment concepts if evidence justifies them.

A native `has attachment` feature is not automatically Direct for this capability. Its native classification must be shown to coincide with this exact MIME-disposition definition.

### Evidence

See:

- [First cross-system semantic comparison §4.6](../research/FIRST_CROSS_SYSTEM_SEMANTIC_COMPARISON.md#46-attachment-presence-is-a-three-system-overlap)
- the individual Gmail, Outlook, Thunderbird, and Sieve semantic-surface surveys under [`../research/`](../research/README.md)


## `core.action.mark-read@1`

**Role:** action.

**Parameters:** none. The canonical parameter value is `null`.

### State transition

The action's leaf semantic is:

```text
message.readState := read
```

The prior read state does not affect the result:

- unread → read;
- read → read.

The action is therefore idempotent with respect to this canonical state property.

### Deliberately excluded from the leaf contract

Version 1 does **not** by itself define:

- whether later predicates/rules observe the new read state;
- whether executing the action stops or continues rule processing;
- when the state mutation is committed relative to other actions;
- what trigger contexts permit the action;
- provider failure/rollback behavior;
- how provider-specific read/unread storage is represented.

Those are execution-structure, target, endpoint, or failure semantics. They must not be smuggled into the meaning of the leaf action.

A target may therefore directly support the leaf `mark-read@1` operation while a larger structure such as “mark read, then later test unread” remains structurally Unsupported or exactness-unproven.

### Evidence

The initial comparison identified read/unread state as one of the strongest cross-system semantic candidates, with native representations in Sieve/IMAP flags, Gmail, Outlook, and Thunderbird.

Control-flow research separately established that intermediate-state visibility and continuation vary across systems, which is why this leaf contract does not claim those behaviors.

See:

- [First cross-system semantic comparison §7.1](../research/FIRST_CROSS_SYSTEM_SEMANTIC_COMPARISON.md#71-readunread-is-one-of-the-strongest-candidates)
- [Cross-system control-flow synthesis](../research/CROSS_SYSTEM_CONTROL_FLOW_SYNTHESIS.md)


## `core.logic.and@1`

**Role:** logic.

**Parameters:** none. The canonical parameter value is `null`.

### Operand domain

Version 1 requires **at least two canonical condition operands**.

Therefore:

- zero operands → invalid canonical semantics;
- one operand → invalid canonical semantics;
- two or more operands → valid when every child condition is itself valid.

Mailchemy does not use an empty conjunction as an implicit constant-true expression, and it does not retain a redundant single-child AND node.

### Truth semantics

For valid operands:

```text
AND(C1, C2, ..., Cn)
```

is true exactly when every child condition is true.

This initial truth contract is ordinary logical conjunction.

### Ordering and canonical representation

The truth value of pure condition operands is mathematically independent of order. However, version 1 **preserves the supplied operand order in canonical structure** and does not authorize generic canonical reordering or sorting.

This is deliberate. Mailchemy's wider execution model treats order/state visibility as potentially observable semantics, and future condition families may introduce evaluation behavior for which casually normalizing structure is unsafe.

A later equivalence/rewrite layer may prove two differently ordered structures equivalent in a specific semantic domain. The base canonical constructor does not assume that proof.

### Child validity

An AND structure is not valid merely because the operator specimen is valid. Every child must independently pass canonical condition validation.

This keeps structural validity separate from target realizability: a valid AND may still be Unsupported by a target even when every child leaf is Direct.

### Evidence

The initial cross-system comparison identified conjunction as the strongest common logical primitive across Sieve, Gmail, Outlook, and Thunderbird.

Control-flow research later reinforced that composed structures require their own realizability checks and must not be inferred from leaf support.

See:

- [First cross-system semantic comparison §5.1](../research/FIRST_CROSS_SYSTEM_SEMANTIC_COMPARISON.md#51-and-is-the-strongest-common-logical-primitive)
- [Cross-system control-flow synthesis](../research/CROSS_SYSTEM_CONTROL_FLOW_SYNTHESIS.md)
