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
