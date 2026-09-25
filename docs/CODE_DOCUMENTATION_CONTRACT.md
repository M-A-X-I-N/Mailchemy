# TypeScript documentation contract

## 1. Purpose and authority

This document defines the documentation methodology for Mailchemy's TypeScript implementation.

It is the normative style contract for the CRH-44C documentation pass and for later TypeScript added to the repository unless the project deliberately revises the contract. The goal is not merely to make declarations visible to editor hover tooling. The goal is to make the implementation's **meaning, responsibility, invariants, evidence boundaries, and exactness assumptions** understandable without forcing a reader to reconstruct intent from control flow.

All documentation covered by this contract uses `/** ... */` documentation comments. Ordinary `//` or `/* ... */` comments may still explain a local algorithmic detail, but they do not substitute for required documentation comments.

This document governs **how implementation facts are documented**. It does not supersede architecture or semantic authority:

1. [`GLOSSARY.md`](GLOSSARY.md) owns durable project vocabulary.
2. [`ARCHITECTURE.md`](ARCHITECTURE.md) owns durable Mailchemy architecture.
3. [`SEMANTIC_CAPABILITIES.md`](SEMANTIC_CAPABILITIES.md) owns the implemented core semantic-capability contracts.
4. [`../research/`](../research/) owns native-system evidence and investigation lineage.
5. TypeScript comments describe how the current implementation realizes, validates, preserves, refuses, or tests those facts.

If implementation behavior and an authoritative document appear to disagree, the comment must not silently choose a winner. Treat the discrepancy as a separate finding.

## 2. What "everything documented" means

Documentation coverage is exhaustive at the **meaningful code-entity level**.

Every TypeScript file must have a module-level documentation comment, and every declaration or construct that carries independent semantic, structural, behavioral, or evidentiary meaning must have its own documentation comment.

### 2.1 Required module documentation

Every `.ts` file, including source files, barrel files, test files, and fixture files, begins with a module documentation block before imports:

```typescript
/**
 * Defines the canonical capability-contract types and construction helpers.
 *
 * @packageDocumentation
 */
```

The module comment explains the file's responsibility and important boundary. It must not merely turn the filename into a sentence.

For test files, describe the evidence surface being proved. For fixture files, describe the semantic/native cases represented. For `index.ts` barrel files, describe the public re-export surface rather than pretending the barrel contains business logic.

### 2.2 Required declaration documentation

Document all exported and internal declarations that carry independent meaning, including:

- functions and named function-valued constants;
- classes, constructors, methods, accessors, and meaningful fields;
- interfaces, type aliases, enums, and their members;
- error types;
- semantic or structural constants;
- codec, target, endpoint-profile, fixture, registry, and matrix declarations;
- parser/tokenizer structures and helpers;
- test helpers and setup/teardown hooks;
- test suites and individual test cases;
- semantically meaningful anonymous callbacks when their purpose is not already completely captured by the documented enclosing construct.

An internal helper is not exempt merely because it is private or unexported. Internal boundaries often need the most explanation because their names alone do not expose the invariants that make them safe.

### 2.3 Members and object-shape fields

Every interface/class member or meaningful object-shape field must be documented when it represents a distinct concept.

A parent interface comment does not replace member comments. For example, documenting a capability contract as a whole does not make `role`, `references`, or `areParametersEqual` self-documenting; each member has a different semantic purpose.

For anonymous object literals that instantiate an already documented type, do not repeat the type's member documentation at every use site. Document the declaration/fixture instance itself when the concrete values have independent meaning.

### 2.4 Local declarations

Use documentation comments for local constants or variables when they encode a semantic distinction, invariant, preserved native value, normalization rule, parser state, or other fact a reader would reasonably need to understand.

Do **not** manufacture ceremonial documentation for transient mechanics such as:

- loop indexes;
- obvious one-use intermediates;
- destructuring aliases with no independent meaning;
- temporary arrays whose purpose is completely obvious from the documented enclosing algorithm;
- import declarations or syntax punctuation.

"Everything documented" means no meaningful code entity is undocumented. It does not mean writing `/** The index. */` above `let index = 0`.

### 2.5 Control flow and expressions

Individual `if`, `for`, `return`, and assertion statements do not need documentation merely because they exist.

Add a documentation or ordinary explanatory comment when a control-flow region embodies a non-obvious invariant or semantic boundary that cannot be made clear by documenting the enclosing function alone. Prefer documenting the responsible abstraction over narrating each line.

## 3. What a useful documentation comment contains

The first sentence should state the construct's **responsibility or meaning** in terms useful to a reader.

Where relevant, continue with the facts that are not obvious from the TypeScript signature:

- semantic meaning;
- invariants and preconditions;
- preservation guarantees;
- exactness limits;
- ordering or mutation assumptions;
- validation boundaries;
- distinction from nearby concepts;
- why the abstraction exists;
- evidence status or provisional nature.

Prefer durable explanations over implementation narration.

Good:

```typescript
/**
 * Erases a typed capability contract for heterogeneous registry storage while
 * preserving parameter validation before semantic equality is attempted.
 */
```

Bad:

```typescript
/**
 * Erases the capability contract.
 */
```

Worse:

```typescript
/**
 * This function takes a contract and returns a registered contract.
 */
```

The TypeScript signature already says the latter.

## 4. Tag rules

Tags are used consistently so later sections do not invent package-local conventions.

### 4.1 `@packageDocumentation`

Required exactly once per TypeScript module in its leading module comment.

### 4.2 `@typeParam`

Use for each generic type parameter when the parameter has semantic significance beyond its identifier.

If a generic parameter is obvious only to the author but not to a caller, document it. Do not repeat TypeScript constraints mechanically.

### 4.3 `@param`

Use for every named parameter of a documented function, method, or constructor unless the declaration has no meaningful parameter contract beyond a framework-mandated callback signature.

Describe the parameter's semantic role, accepted interpretation, ownership, or invariant. Do not restate only its TypeScript type.

### 4.4 `@returns`

Use for every function or method with a meaningful return value.

Explain what the result represents, especially for validation results, realization results, decoded values, frozen snapshots, or values whose shape is obvious but interpretation is not.

Omit `@returns` for constructors and genuinely `void` procedures unless there is an unusual reason to explain completion semantics.

### 4.5 `@throws`

Document deliberate exceptions that are part of the function's observable behavior.

Describe the condition that triggers the exception. Do not attempt to enumerate impossible implementation bugs or every transitive exception that could theoretically escape a dependency.

If failure is represented as a `ValidationResult`, realization result, or native-decode result rather than an exception, document that result model instead of claiming the function throws.

### 4.6 `@remarks`

Use when the summary would become overloaded by longer invariants, exactness caveats, preservation rules, or architectural distinctions.

`@remarks` is especially appropriate when the reader needs to understand **why** the code deliberately refuses an apparently plausible mapping.

### 4.7 `@example`

Use when a concise example materially clarifies shape, semantics, or a non-obvious boundary.

Do not add examples merely to increase comment size. Existing tests/fixtures are preferable evidence when they already demonstrate the case clearly.

### 4.8 `@see`

Use to connect a comment to authoritative project documentation or especially relevant evidence when the relationship is not obvious.

Prefer repository-relative paths or stable semantic identifiers. Do not turn every declaration into a bibliography.

### 4.9 Semantic tags with tooling effects

Use tags such as `@deprecated` only when they are actually true. Do not use `@internal`, visibility tags, or other tool-significant annotations merely as prose decoration.

The documentation pass must not accidentally change generated declaration behavior, editor semantics, or future API extraction policy.

## 5. Claim authority and exactness language

Mailchemy's comments must preserve the same distinctions as the architecture.

### 5.1 Semantic-contract facts

A comment may state a canonical semantic fact when it is established by the applicable semantic contract.

Example:

> `mark-read@1` makes canonical read state `true` idempotently.

Do not let an adapter comment redefine that meaning.

### 5.2 Implementation mechanics

Implementation comments may state what the current code does:

> Validates both erased parameter values before invoking typed semantic equality.

This is an implementation fact, not a new architecture rule.

### 5.3 Target/direct-realization claims

A target comment may describe the target's current executable classification, but must not broaden it.

Prefer:

> Classifies the initial mark-read action as Direct for the Sieve dialect target.

Avoid:

> Sieve supports mark read.

The shorter claim erases the difference between a concrete semantic instance, a dialect implementation, endpoint availability, and broader Sieve capability.

### 5.4 Exactness-unproven vs capability absence

Never collapse:

- known capability absence;
- current implementation absence;
- exactness not yet proven;
- endpoint-profile rejection.

These are different evidence classes and should be named accordingly.

If the code returns `exactness-unproven`, the comment must not say the target "cannot" express the semantic unless separate evidence proves that stronger statement.

### 5.5 Codec vs endpoint

Codec comments describe native representation and semantic mapping.

Endpoint/profile comments describe what a concrete endpoint advertises or permits.

For Sieve/Purelymail in particular, never phrase a Purelymail profile observation as a property of the Sieve language or vice versa.

### 5.6 Opaque preservation

"Opaque preservation" means the implementation retains native material without claiming a canonical semantic interpretation.

Do not describe opaque preservation as semantic support or exact semantic round-trip coverage.

### 5.7 Provisional implementation choices

When a comment describes a choice that is intentionally narrower than durable architecture, say so explicitly with wording such as:

> The initial codec deliberately accepts only...

or:

> This implementation currently...

Do not promote a temporary first-slice restriction into a timeless architectural statement.

## 6. Tests and fixtures are evidence

Tests and fixtures must be documented as evidence, not as filler around assertions.

### 6.1 Test suites

Place a documentation comment immediately before each `describe(...)` or equivalent suite.

Explain the contract/evidence boundary covered by the suite.

### 6.2 Individual test cases

Place a documentation comment immediately before each `it(...)`/`test(...)`.

The comment should explain **what invariant or semantic claim the case proves and why the case matters**, not restate the natural-language test title.

Assertions within a well-documented test do not each need separate documentation comments unless one assertion establishes a non-obvious independent fact.

### 6.3 Fixtures

Document fixture collections and semantically distinct fixture declarations.

Explain what boundary the fixture exercises: valid semantics, invalid parameter domain, normalization edge, provider/native preservation case, refusal case, and so on.

Fixture metadata such as `notes` and `references` remains data consumed by the harness; it does not replace source documentation.

### 6.4 Synthetic evidence

Synthetic harness tests must say that they are synthetic.

A fake target or codec can prove harness behavior. It cannot prove a real provider's semantics.

## 7. Anti-patterns

Avoid these patterns throughout CRH-44C:

### 7.1 Name restatement

```typescript
/** Returns the validation result. */
```

when the important fact is what is validated and what invalidity means.

### 7.2 Type restatement

```typescript
/** The capability ID. */
readonly id: CapabilityId;
```

Prefer the semantic role:

```typescript
/** Stable, versioned identity whose version belongs to the semantic contract. */
readonly id: CapabilityId;
```

### 7.3 Unsupported overclaim

Do not replace "Mailchemy has not proven this exact mapping" with "the provider does not support it."

### 7.4 Architecture invention

Do not write comments that turn a first-slice implementation shape into a project-wide architectural rule unless `docs/` already establishes that rule.

### 7.5 History narration

Avoid comments such as "Added in CRH-31" or "Previously this used..." unless historical behavior is itself required to understand compatibility.

Git owns implementation history. Comments describe the current contract.

### 7.6 Comment/code duplication

Do not translate every branch into prose. Documentation should add information a reader cannot obtain by simply reading the next line.

## 8. Representative exemplars

These examples are normative for **method**, not copy-and-paste templates. Later comments should match their level of semantic specificity without forcing unrelated constructs into identical prose shapes.

### 8.1 Semantic type/contract exemplar

Representative form for `SemanticCapabilityContract<TParameters>`:

```typescript
/**
 * Defines the immutable runtime contract for one versioned semantic capability.
 *
 * @typeParam TParameters Canonical parameter shape whose meaning is owned by
 * the capability version identified by `id`.
 */
export interface SemanticCapabilityContract<TParameters> {
    /**
     * Stable, versioned identity for the semantic meaning represented by this
     * contract.
     */
    readonly id: CapabilityId;

    /**
     * Structural role that determines where specimens of this capability may
     * appear in canonical expressions.
     */
    readonly role: CapabilityRole;

    /**
     * Human-readable summary of the capability's semantic contract.
     */
    readonly description: string;

    /**
     * Durable references supporting or defining the registered semantics.
     */
    readonly references: readonly string[];

    /**
     * Validates unknown parameters before they enter canonical semantics.
     *
     * @param value Candidate parameter value supplied at the runtime boundary.
     * @returns The typed parameter value on success or structured validation
     * issues on failure.
     */
    readonly validateParameters: (
        value: unknown,
    ) => ValidationResult<TParameters>;

    /**
     * Compares two already-valid parameter values for semantic equality under
     * this capability version.
     *
     * @param left First validated parameter value.
     * @param right Second validated parameter value.
     * @returns Whether both values denote the same capability parameters.
     */
    readonly areParametersEqual: (
        left: TParameters,
        right: TParameters,
    ) => boolean;
}
```

The important pattern is that the interface comment explains its architectural role, while each member explains a distinct semantic responsibility.

### 8.2 Non-trivial internal-helper exemplar

Representative form for recursive condition validation:

```typescript
/**
 * Collects every canonical-validation issue reachable through a condition
 * expression while preserving the caller's structural path.
 *
 * @remarks
 * The shared recursion stack detects object cycles without treating repeated
 * references in separate completed branches as cycles. Capability leaves are
 * validated against the registry using the condition role.
 *
 * @param registry Registry that owns capability validation and role metadata.
 * @param value Unknown candidate condition expression.
 * @param path Structural path to prefix onto issues discovered below this node.
 * @param stack Objects currently active in the recursive traversal.
 * @returns All issues found in this condition subtree.
 */
function collectConditionIssues(
    registry: CapabilityRegistry,
    value: unknown,
    path: readonly ValidationPathSegment[],
    stack: Set<object>,
): ValidationIssue[] {
    // ...
}
```

This comment explains the invariant behind `stack`; "recursively validates a condition" alone would not be enough.

### 8.3 Codec/parser-helper exemplar

Representative form for the narrow Sieve Subject parser:

```typescript
class Parser {
    /**
     * Parses the initial codec's supported Sieve `header :contains` condition.
     *
     * @remarks
     * The parser deliberately accepts only one Subject header name and one search
     * key. Parsing this native construct does not prove equivalence with
     * `core.condition.subject.contains@1`; comparator/normalization exactness is
     * classified separately by the codec/target layer.
     *
     * @returns The parsed native header-containment condition.
     * @throws SieveParseError When the recognized syntax is malformed.
     * @throws SieveUnsupportedConstructError When valid Sieve syntax is outside
     * the deliberately narrow initial codec subset.
     */
    private parseHeaderContains(): ParsedCondition {
        // ...
    }
}
```

The key pattern is separating **native syntax recognition** from **canonical exactness**.

### 8.4 Fixture exemplar

Representative form for the mark-read fixture collection:

```typescript
/**
 * Exercises the valid idempotent mark-read transition from both unread and
 * already-read states plus the invalid-parameter boundary.
 *
 * @remarks
 * The oracle records canonical state-transition expectations. It does not
 * assert that any particular target can realize the action.
 */
export const markReadFixtures = Object.freeze([
    // ...
]);
```

A fixture comment explains what semantic boundary the data represents and what the fixture **does not** prove.

### 8.5 Test-case exemplar

Representative form for the canonical-fixture immutability test:

```typescript
/**
 * Proves that fixture construction snapshots caller-owned metadata so later
 * mutations cannot change the evidence consumed by the conformance harness.
 */
it("captures reusable code-native semantic evidence immutably", () => {
    // ...
});
```

The title says what happens. The documentation explains why that behavior matters to the harness.

## 9. Per-section documentation procedure

Every later CRH-44C section follows the same sequence:

1. Re-read this document.
2. Re-read the durable architecture/semantic documents relevant to the package.
3. Inventory every TypeScript file in the section.
4. Add the required module comment to every file.
5. Walk declarations top-to-bottom and document every required entity/member.
6. Document tests and fixtures as evidence using the same terminology.
7. Re-read comments specifically for overclaiming, stale terminology, or provider/core boundary confusion.
8. Run the repository's canonical `npm run check`.
9. Review the diff for comment quality, not merely syntactic coverage.
10. Mark the roadmap section complete only after source and corresponding tests/fixtures satisfy this contract.

Do not batch a later package using a remembered approximation of this procedure.

## 10. Methodology changes and drift control

If a later section reveals a case this contract handles poorly:

1. stop the package-local documentation work;
2. amend this document with the new general rule;
3. identify earlier CRH-44C sections affected by the rule;
4. reconcile those earlier comments;
5. run canonical validation;
6. then continue the current section.

A useful rule discovered in C8 is not "the Outlook style." It becomes the shared Mailchemy documentation methodology or it is not adopted.

No later CRH-44C section may weaken this contract locally.

## 11. Completion standard

A section is not complete merely because every file contains `/**`.

Completion requires:

- module coverage for every TypeScript file;
- required declaration/member/test/fixture coverage;
- useful comments that add intent or semantic information beyond the type signature;
- terminology consistent with the glossary and architecture;
- exactness/support claims no stronger than the evidence;
- no behavior changes smuggled into the documentation pass;
- green canonical validation.

CRH-44C11 performs the final repository-wide audit for both missing coverage and methodology drift.
