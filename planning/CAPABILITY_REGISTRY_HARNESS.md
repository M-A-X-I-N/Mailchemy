# Capability Registry & Conformance Harness implementation roadmap

## 0. Execution status

| Task | Status | Checkpoint |
| --- | --- | --- |
| CRH-01 — Select implementation runtime/toolchain | Done | TypeScript/ESM toolchain selected; temporarily pinned to TypeScript 6.0.3 until the typed-lint stack supports TypeScript 7 |
| CRH-02 — Create minimal project scaffold | Done | `@mailchemy/core` + `@mailchemy/conformance`, npm workspace, reproducible lockfile |
| CRH-03 — Establish validation commands | Done | `npm run check` covers build/typecheck, typed lint, formatting, and tests |
| CRH-04 — Add minimal CI | Done | Ubuntu + Windows GitHub Actions matrix; run `35937740003` passed both jobs |
| CRH-05 — Implement semantic capability identity | Done | Canonical branded capability IDs with arbitrary namespace depth, strict parsing, stable rendering, and versioned identity |
| CRH-06 — Define capability contract registration interface | Done | Immutable typed semantic contracts, runtime-erased registry entries, duplicate rejection, deterministic enumeration |
| CRH-07 — Define semantic specimen abstraction | Done | Validated concrete capability specimens with registry-owned semantic equality |
| CRH-08 — Add minimal canonical expression types | Done | Condition/action leaves, AND structure, and explicit rule grouping without provider-specific fields |
| CRH-09 — Add canonical semantic validation | Done | Runtime validation catches malformed parameters, unknown capabilities, role mismatches, structural errors, and cycles before target realization |
| CRH-10 — Add registry integrity tests | Done | Synthetic registry catalog proves version separation, duplicate protection, deterministic ordering, fixture coverage, and role alignment; CI run `35941623268` passed Ubuntu + Windows |
| CRH-11 — Implement preliminary realization result types | Done | Direct/Derived/Unsupported union with machine-readable Unsupported reason codes and human-readable diagnostics |
| CRH-12 — Define target direct-realization contract | Done | Common Direct-or-Unsupported target interface accepts complete canonical expressions/structures; no rewrite search |
| CRH-13 — Define codec encode/decode contracts | Done | Offline generic codec boundary supports native encode, canonical decode, opaque preservation, and explicit native-decode refusal |
| CRH-14 — Define endpoint capability-profile refinement hook | Done | Runtime-supplied endpoint profiles may narrow, but never broaden, an underlying target's direct-realization domain |
| CRH-15 — Add explicit structure-level realizability hook | Done | Structured target builder separates leaf and structure checks; synthetic tests prove Direct leaves can compose into Unsupported structure |
| CRH-16 — Define canonical fixture/specimen format in code | Done | Shared code-native fixtures carry stable IDs, exercised capability IDs, expected canonical validity, optional oracle metadata, notes, and references |
| CRH-17 — Implement capability contract test runner | Done | Provider-independent runner validates fixtures, enforces valid/invalid boundary coverage, and supports optional pure semantic oracles |
| CRH-18 — Implement target realization conformance runner | Done | Shared fixtures run against Direct-or-Unsupported targets with expected Unsupported reason classes treated as passing conformance |
| CRH-19 — Implement codec round-trip harness | Done | Encode/decode flow validates both canonical ends and requires explicit semantic-equivalence logic rather than AST/native byte equality |
| CRH-20 — Implement conformance matrix/report model | Done | Machine-readable matrix and deterministic Markdown report are generated from executable target-runner results |
| CRH-21 — Add harness self-tests with fake targets/codecs | Done | Synthetic integration tests cover Direct, known absence, refinement rejection, exactness-unproven, endpoint-profile rejection, structural rejection, and semantic codec round trip; CI run `35944361660` passed Ubuntu + Windows |
| CRH-22 — Define and register `subject.contains@1` | Done | `core.condition.subject.contains@1` defines decoded/unfolded logical Subject values, NFC + locale-independent lowercase containment, any-field behavior for repeats, missing=false, and empty-needle invalidity |
| CRH-23 — Define and register `has-attachment@1` | Done | `core.condition.has-attachment@1` uses a deliberately narrow MIME contract: explicit non-multipart `Content-Disposition: attachment`; filename/inline/provider heuristics excluded |
| CRH-24 — Define and register `mark-read@1` | Done | `core.action.mark-read@1` is the idempotent leaf transition to canonical read state; continuation/intermediate visibility remain structural semantics |
| CRH-25 — Define and register `logic.and@1` | Done | `core.logic.and@1` requires at least two valid condition operands, preserves operand order, and does not normalize structures by sorting |
| CRH-26 — Register first rule-shaped canonical specimens | Done | Shared A/B/C rule fixtures plus NFC, whitespace-needle, and reversed-AND-order definition edges are executable against the accumulated core registry; CI run `35945935522` passed Ubuntu + Windows |
| CRH-27 — Implement minimal Sieve decode/encode support for initial capabilities | Done | Added `@mailchemy/sieve` with narrow text parsing/encoding, exact `imap4flags` mark-read mapping, explicit Subject/AND exactness refusal, and opaque preservation of unrelated constructs |
| CRH-28 — Implement Sieve direct-realization declarations/refinements | Done | Added executable Sieve Direct/Unsupported classification: mark-read Direct at the dialect layer, Subject exactness unproven, attachment absent, and structure dependent on child realizability |

**Milestone R1 is complete.** Mailchemy now has its first real, documented, executable canonical semantic contracts and shared rule-shaped fixtures.

CRH-27 and CRH-28 are complete: the first deliberately narrow Sieve codec and executable direct-realization target now exist. The remaining active Sieve/Purelymail block is CRH-29–30: round-trip conformance and the Purelymail endpoint refinement.

## 1. Purpose

This is the first implementation roadmap for Mailchemy after the architecture/research bootstrap.

The goal is **not** to implement a complete provider adapter first.

The goal is to build the reusable semantic spine that lets Mailchemy implement and test capabilities incrementally across IO variants:

```text
semantic capability contract
        │
        ├── canonical semantic specimens / fixtures
        │
        ├── contract tests
        │
        ├── target realization checks
        │
        ├── encode/decode round-trip tests
        │
        └── conformance matrix
             ├── Sieve
             ├── Purelymail endpoint profile
             ├── Gmail
             ├── Outlook / Graph
             └── Thunderbird
```

A future contributor should be able to add a capability once, add canonical specimens for its meaning, and then implement support for each IO variant independently while the same harness reports what is:

- directly realizable;
- exactly derivable through registered rewrites;
- unsupported;
- blocked because exact semantics are not yet proven.

This roadmap is an **active implementation plan**, not architecture authority. Durable meanings remain owned by `docs/`.

## 2. Architectural constraints carried into implementation

Every task in this plan must preserve these existing project rules:

1. Semantic capabilities define canonical meaning; adapters do not redefine them.
2. Capability support is instance-sensitive and may also be structure-sensitive.
3. The canonical IR is not limited to the global intersection of adapters.
4. Codec semantics and endpoint/store behavior remain separate.
5. Endpoint capability profiles may further restrict a codec's realizability.
6. Exact translation is the normal mode; no silent approximation.
7. Ordered/stateful structures may require execution-trace equivalence.
8. Rule/action grouping, continuation, terminality, trigger context, and intermediate-state visibility may be semantic.
9. A target supporting every leaf operation does not prove it supports every composition of those leaves.
10. Test success means semantic exactness for the claimed subset, not native byte identity.

See:

- [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
- [`../docs/GLOSSARY.md`](../docs/GLOSSARY.md)
- [`../research/FIRST_CROSS_SYSTEM_SEMANTIC_COMPARISON.md`](../research/FIRST_CROSS_SYSTEM_SEMANTIC_COMPARISON.md)
- [`../research/CROSS_SYSTEM_CONTROL_FLOW_SYNTHESIS.md`](../research/CROSS_SYSTEM_CONTROL_FLOW_SYNTHESIS.md)

## 3. Scope of the first implementation slice

The first slice should prove that Mailchemy can:

1. define stable semantic capability contracts;
2. instantiate canonical semantic specimens;
3. validate those specimens;
4. ask a target IO variant whether a concrete specimen/structure is directly realizable;
5. encode supported specimens into a native representation;
6. decode those native representations back into canonical semantics;
7. compare canonical meaning after round trip;
8. distinguish a known incompatibility from a case whose exactness is merely unproven;
9. apply endpoint capability refinement separately from dialect/codec support;
10. generate a useful conformance report across the initial IO variants.

The first slice does **not** need:

- a production CLI/UI;
- synchronization;
- provider authentication;
- full Gmail/Graph live API integration;
- a sophisticated rewrite-search planner;
- plugin discovery;
- every capability found in research;
- lossy conversion;
- a portable interchange format;
- package-registry publishing or consumer distribution. For the foreseeable roadmap, users/developers may clone the repository and build it themselves.

## 4. First semantic specimen set

The first implementation should intentionally use a **small but asymmetric** semantic set rather than choosing only capabilities every system trivially supports.

Candidate initial capabilities:

### 4.1 Subject contains

Conceptual identity:

```text
core.condition.subject.contains@1
```

Purpose:

- exercises a parameterized text predicate;
- forces the semantic contract to define comparison/normalization precisely;
- exposes adapter refinements and cases where vendor behavior is underdocumented;
- is representable in some form across all initial dialects, but exact support may differ.

The implementation task must define the exact `@1` contract before claiming target support. The roadmap intentionally does **not** pre-decide Unicode/case/normalization behavior here.

### 4.2 Has attachment

Conceptual identity:

```text
core.condition.has-attachment@1
```

Purpose:

- exercises a simple boolean predicate;
- is directly exposed by Gmail, Outlook, and Thunderbird;
- does not have a proven simple direct Purelymail/Sieve realization;
- verifies that the harness treats an expected Unsupported result as success rather than a failed test.

### 4.3 Mark read

Conceptual identity:

```text
core.action.mark-read@1
```

Purpose:

- exercises an action/state mutation;
- is represented very differently by each native system;
- gives the Purelymail endpoint profile something meaningful to refine because Sieve realization depends on IMAP flag support;
- should produce useful round-trip tests without needing a complicated multi-rule execution trace.

### 4.4 Logical AND

Conceptual identity:

```text
core.logic.and@1
```

Purpose:

- proves the harness can test semantic **structures**, not only leaf capability IDs;
- composes the initial predicates;
- tests target-specific structural realizability.

### 4.5 Initial rule-shaped specimens

At minimum, the harness should eventually exercise canonical structures equivalent to:

```text
A:
IF subject contains "invoice"
THEN mark read
```

```text
B:
IF has attachment
THEN mark read
```

```text
C:
IF subject contains "invoice"
AND has attachment
THEN mark read
```

These are test specimens, not a promise that the final IR will have exactly this syntax or object shape.

## 5. Result semantics for the harness

The durable architecture currently uses:

```text
Direct
Derived
Unsupported
```

The harness must preserve that conceptual model.

However, diagnostics must distinguish at least:

```text
Unsupported / known impossible or outside target domain

Unsupported / exactness not proven
```

The implementation may represent this as reason codes/details under `Unsupported` rather than creating a fourth global realization class.

Why this matters:

```text
"Target cannot express this"
```

is materially different evidence from:

```text
"Target may express this, but Mailchemy does not yet have enough evidence
to claim exact semantics"
```

The latter should point naturally toward a research/test prerequisite rather than masquerading as a permanent incompatibility.

## 6. Testing tiers

The implementation should separate several kinds of evidence.

### Tier 0 — Registry integrity

Pure code/data invariants:

- unique stable capability IDs;
- valid version syntax;
- no accidental duplicate registrations;
- parameter validation;
- deterministic specimen identity where required;
- registration metadata completeness.

### Tier 1 — Canonical semantic contract tests

Provider-independent tests for what a capability means.

Examples:

- valid and invalid parameter domains;
- truth/effect fixtures where a canonical evaluator/oracle is practical;
- edge cases that establish the contract boundary;
- normalization/comparison cases.

A capability must not be considered implementation-ready merely because it has a name.

### Tier 2 — Target realization conformance

For each target:

```text
semantic specimen
        ↓
target direct-support check
        ↓
Direct / Unsupported (+ diagnostic)
```

Expected Unsupported results are valid passing tests.

### Tier 3 — Codec round trip

For directly supported semantics:

```text
canonical IR
        ↓ encode
native representation
        ↓ decode
canonical IR'
        ↓
semantic equivalence assertion
```

Native formatting, generated identifiers, or provider normalization need not round-trip byte-for-byte.

### Tier 4 — Cross-codec semantic round trip

Where both sides support the exact subset:

```text
IR-A
  ↓ encode target X
native X
  ↓ decode
IR-B

assert IR-A ≡ IR-B
```

Later:

```text
source native
  ↓ decode
IR-A
  ↓ realize target
target native
  ↓ decode
IR-B

assert IR-A ≡ IR-B
```

### Tier 5 — Live endpoint conformance

Deferred until useful.

Examples:

- Purelymail live ManageSieve capability discovery;
- Gmail API validation;
- Microsoft Graph validation.

The first registry/harness slice should **not** require live credentials to run its normal test suite.

## 7. Task execution conventions

- Every task below should be a coherent, independently recoverable checkpoint when practical.
- Task IDs are roadmap-local and intentionally unrelated to the completed bootstrap `Mxx` sequence.
- Do not implement later-phase abstractions early just because their future shape is imaginable.
- Add only the abstractions required by current tests.
- If a task discovers a durable architectural conflict, stop that task, document the conflict, and reconcile `docs/` before building around it.
- A test proving Unsupported is a successful implementation result when Unsupported is the correct exactness outcome.
- IO-specific tests should consume shared canonical specimens rather than copy/paste provider-specific versions of the same semantic test.

---

# Phase A — Implementation foundation

## CRH-01 — Select the implementation runtime/toolchain

**Goal:** choose the language/runtime and basic build/test toolchain for the first implementation slice.

Evaluate candidates against:

- strong type modeling for semantic contracts/IR;
- parser/text-processing ergonomics;
- JSON/API integration ergonomics;
- test-framework quality and parameterized/conformance testing;
- cross-platform support on Windows/Linux;
- contributor/setup friction;
- package ecosystem maturity;
- ability to keep core semantics independent from provider SDKs;
- long-term plugin/extension plausibility without prematurely designing plugin discovery.

**Deliverable:**

- a short durable decision record under `docs/` or another appropriate design-decision location;
- chosen runtime/toolchain;
- explicit reasons and rejected alternatives at a useful level.

**Acceptance:**

- choice is justified by Mailchemy's requirements rather than personal familiarity alone;
- no broader architecture is frozen unnecessarily.

**Depends on:** none.

---

## CRH-02 — Create the minimal project scaffold

**Goal:** establish the smallest source/test layout that supports the registry/harness work.

The scaffold should distinguish at least conceptually:

- canonical semantic/core code;
- testing/conformance utilities;
- IO implementations;
- tests/fixtures.

Do **not** build plugin discovery, CLI structure, or deployment packaging yet.

**Acceptance:**

- clean install/bootstrap on supported development environments;
- one trivial test proves the test runner works;
- no provider SDK is required merely to test core semantics.

**Depends on:** CRH-01.

---

## CRH-03 — Establish formatting, linting/type-checking, and the canonical test command

**Goal:** make the repository's executable validation unambiguous.

Define:

- one normal test command;
- one static/type validation command if distinct;
- formatting/lint command as appropriate;
- deterministic behavior suitable for CI.

Update agent workflow documentation with the actual commands.

**Acceptance:**

- a fresh checkout can discover the commands from repository docs;
- commands fail clearly on violations;
- no ceremonial checks with no real value.

**Depends on:** CRH-02.

---

## CRH-04 — Add minimal CI for the implementation spine

**Goal:** run the normal static/test validation on supported CI environments.

Prefer a small matrix sufficient to catch portability problems without multiplying cost.

**Acceptance:**

- pull/push validation exercises the same commands contributors run locally;
- CI has no provider credentials;
- all tests are deterministic/offline at this stage.

**Depends on:** CRH-03.

---

# Phase B — Registry and canonical specimen kernel

## CRH-05 — Implement semantic capability identity

**Goal:** represent and validate stable versioned semantic IDs.

Must support identities equivalent to:

```text
namespace.category.name@version
```

without assuming the conceptual example above is the only valid future namespace depth.

Required behavior:

- parse/construct;
- equality/hash/key behavior;
- canonical string rendering;
- reject malformed identifiers;
- preserve semantic version as part of identity.

**Tests:**

- valid core IDs;
- extension namespace examples;
- malformed/missing version;
- equality/version distinction.

**Depends on:** CRH-02.

---

## CRH-06 — Define the capability contract registration interface

**Goal:** register the canonical definition of a semantic capability.

A preliminary registry entry should be able to provide at least:

- stable capability ID;
- human-readable description;
- expected semantic specimen/parameter type;
- specimen validation hook;
- references/metadata useful to tests and diagnostics.

Do not design a giant declarative schema.

Code-native executable registration is preferred initially.

**Acceptance:**

- duplicate IDs are rejected;
- adapters cannot mutate/redefine a registered contract;
- registry can enumerate registered capabilities deterministically.

**Depends on:** CRH-05.

---

## CRH-07 — Define the semantic specimen abstraction

**Goal:** give the harness a generic thing to test.

A specimen must represent a **concrete semantic instance**, not merely a capability ID.

Examples:

```text
subject.contains("invoice")
mark-read
has-attachment
```

The abstraction must be extensible enough that a later specimen can represent a composed semantic structure.

Avoid an API whose fundamental assumption is:

```text
testCapability(capabilityId)
```

because the architecture already knows structural realizability matters.

**Acceptance:**

- specimen carries/identifies its semantic contract;
- concrete values are strongly represented/validated;
- equality/canonicalization requirements are explicit enough for tests.

**Depends on:** CRH-06.

---

## CRH-08 — Add minimal canonical expression types

**Goal:** represent only the expression shapes required by the initial specimen set.

At minimum, expect to need concepts equivalent to:

- condition leaf;
- action leaf;
- boolean AND;
- a minimal rule-shaped condition → action grouping.

Do not model every researched execution feature yet.

**Acceptance:**

- initial specimens A/B/C from §4.5 are representable;
- no provider-specific fields leak into canonical types;
- rule/action grouping is retained rather than flattened.

**Depends on:** CRH-07.

---

## CRH-09 — Add canonical semantic validation

**Goal:** distinguish a malformed/invalid semantic specimen from a valid specimen that a target cannot realize.

Examples:

- invalid capability parameters;
- structurally invalid expression;
- capability contract mismatch.

**Acceptance:**

- invalid canonical semantics fail before target support is queried;
- target Unsupported is never used to hide malformed IR.

**Depends on:** CRH-07, CRH-08.

---

## CRH-10 — Add registry integrity tests

**Goal:** make registry correctness self-policing.

Test at least:

- duplicate ID rejection;
- deterministic enumeration;
- semantic version distinction;
- specimen type/contract alignment;
- every registered initial capability has contract tests/fixtures.

**Depends on:** CRH-06–CRH-09.

---

# Phase C — Realization result and target conformance interfaces

## CRH-11 — Implement preliminary realization result types

**Goal:** represent realization outcomes consistently.

Architectural result classes:

- Direct;
- Derived;
- Unsupported.

For the first slice, Derived may exist structurally even if no rewrite engine uses it yet.

Unsupported diagnostics should distinguish reasons such as:

- capability absent;
- concrete instance violates target refinement;
- structure unsupported;
- endpoint profile lacks required feature;
- exactness unproven;
- native construct known non-equivalent.

**Acceptance:**

- diagnostics are machine-readable enough for matrix/reporting tests;
- human-readable explanation is available;
- no exception/control-flow abuse for ordinary Unsupported results.

**Depends on:** CRH-07–CRH-09.

---

## CRH-12 — Define the target direct-realization contract

**Goal:** give each IO implementation one common interface for answering:

> Can you directly realize this concrete semantic specimen/structure exactly?

The target should return a realization result, not a boolean.

**Acceptance:**

- leaf and composed specimens can be queried;
- target can inspect concrete values;
- target can reject structure even when all leaves are individually supported;
- no rewrite search occurs yet.

**Depends on:** CRH-11.

---

## CRH-13 — Define codec encode/decode contracts

**Goal:** define the minimum interfaces for:

```text
native → canonical
canonical → native
```

Keep codec semantics separate from endpoint/store operations.

**Acceptance:**

- codecs can be tested entirely offline;
- encode may return Unsupported/diagnostic rather than silently degrade;
- decode may report unsupported/opaque native semantics explicitly;
- no live Gmail/Graph/ManageSieve dependency in the core codec interface.

**Depends on:** CRH-08, CRH-11.

---

## CRH-14 — Define endpoint capability-profile refinement hook

**Goal:** allow a concrete endpoint profile to narrow a codec's direct realization domain.

First motivating case:

```text
Sieve codec understands imap4flags
        +
Purelymail profile advertises imap4flags
        =
mark-read realization available
```

The same Sieve codec paired with an endpoint lacking `imap4flags` should reject that realization.

**Acceptance:**

- codec semantics remain reusable without an endpoint;
- profile can be synthetic in offline tests;
- runtime-discovered profile can be plugged in later.

**Depends on:** CRH-12, CRH-13.

---

## CRH-15 — Add explicit structure-level realizability hook

**Goal:** prevent the implementation from assuming leaf support implies composition support.

Provide a way for targets to reject or refine a whole rule/execution region.

Initial tests should include a synthetic target demonstrating:

```text
leaf A = Direct
leaf B = Direct
A composed with B = Unsupported(structure)
```

**Depends on:** CRH-12.

---

# Phase D — Conformance harness core

## CRH-16 — Define canonical fixture/specimen format in code

**Goal:** make reusable semantic cases easy to register once and consume across targets.

Each fixture should have:

- stable test name/ID;
- canonical specimen/expression;
- expected canonical validation result;
- optional semantic oracle/expected behavior metadata;
- notes/source references where valuable.

Keep fixtures code-native initially unless a real need for external serialization emerges.

**Depends on:** CRH-07–CRH-10.

---

## CRH-17 — Implement capability contract test runner

**Goal:** execute provider-independent contract tests for registered capabilities.

The runner should ensure that each capability's fixtures establish its meaning boundary.

Where a pure evaluator is practical, test truth/effect semantics.

Where evaluation depends on external mail-system state, use canonical validity/equivalence fixtures rather than pretending a universal runtime exists.

**Depends on:** CRH-16.

---

## CRH-18 — Implement target realization conformance runner

**Goal:** run the same canonical fixtures against one target IO implementation.

Expected results are part of conformance:

```text
Direct
Unsupported(reason)
```

A target returning expected Unsupported must pass.

**Depends on:** CRH-12, CRH-16.

---

## CRH-19 — Implement codec round-trip harness

**Goal:** prove semantic preservation for directly supported specimens.

Flow:

```text
canonical specimen/expression
→ encode
→ native
→ decode
→ canonical'
→ semantic equivalence assertion
```

The equivalence assertion must not require native byte equality.

**Depends on:** CRH-13, CRH-16.

---

## CRH-20 — Implement conformance matrix/report model

**Goal:** produce a machine-readable and human-readable summary such as:

| Capability/specimen | Sieve | Purelymail | Gmail | Outlook | Thunderbird |
|---|---|---|---|---|---|
| mark-read | Direct | Direct | Direct | Direct | Direct |
| has-attachment | Unsupported | Unsupported | Direct | Direct | Direct |
| subject.contains fixture X | Direct | Direct | Direct | Unproven | Direct |

Do not hand-maintain the matrix. Generate it from executable conformance results.

**Depends on:** CRH-18.

---

## CRH-21 — Add harness self-tests with fake targets/codecs

**Goal:** prove the harness itself handles:

- Direct;
- Unsupported known absence;
- Unsupported refinement failure;
- Unsupported exactness-unproven;
- endpoint-profile rejection;
- structural rejection;
- encode/decode semantic round trip.

Use synthetic targets before relying on provider implementations.

**Depends on:** CRH-14–CRH-20.

---

# Phase E — Define the first canonical capabilities

Each capability task must update durable semantic documentation if its implemented contract becomes more precise than current architecture examples.

## CRH-22 — Define and register `subject.contains@1`

**Goal:** establish the exact semantic contract, parameter domain, and canonical fixtures.

The task must explicitly decide:

- what subject representation is tested;
- case semantics;
- Unicode/normalization semantics;
- missing subject behavior;
- empty needle behavior;
- repeated/abnormal Subject handling if relevant.

Do not choose semantics merely to maximize provider support.

**Acceptance:**

- stable capability ID;
- contract documentation;
- canonical fixtures;
- contract tests;
- no target support claimed yet.

**Depends on:** Phase B/D harness spine.

---

## CRH-23 — Define and register `has-attachment@1`

**Goal:** define exactly what Mailchemy means by "has attachment."

This is deceptively semantic: MIME part disposition/name/content-type edge cases may matter.

If research is insufficient to define a robust universal attachment concept, narrow the initial contract explicitly rather than guessing.

**Acceptance:** same pattern as CRH-22.

---

## CRH-24 — Define and register `mark-read@1`

**Goal:** define the canonical state transition "message is read after this action."

Clarify whether the contract says anything about:

- prior state;
- idempotence;
- timing/visibility to later predicates;
- trigger context.

Prefer keeping the leaf action contract separate from continuation/intermediate-state semantics.

**Acceptance:** stable contract + fixtures/tests.

---

## CRH-25 — Define and register `logic.and@1`

**Goal:** define canonical conjunction for the initial expression model.

Clarify:

- child validity;
- ordering significance or lack thereof for pure predicates;
- empty/single-child behavior;
- whether canonical normalization reorders children.

Do not normalize away ordering if future stateful predicates could make it observable; the initial contract should be explicit about its domain.

**Acceptance:** conjunction can represent specimen C without provider assumptions.

---

## CRH-26 — Register the first rule-shaped canonical specimens

**Goal:** create shared fixtures A/B/C from §4.5 plus edge cases.

Every target implementation in later phases must consume these shared specimens.

**Depends on:** CRH-22–CRH-25.

---

# Phase F — Sieve codec and Purelymail profile

## CRH-27 — Implement minimal Sieve decode/encode support for initial capabilities

Target only the syntax/semantics required by the initial slice.

Expected areas include:

- Subject contains;
- logical AND;
- mark-read through the appropriate IMAP flag semantics;
- minimal rule/conditional structure.

Do not implement unrelated Sieve extensions just because a parser encounters them.

Unknown constructs must fail/preserve explicitly according to the codec policy established by CRH-13.

**Depends on:** Phase E.

---

## CRH-28 — Implement Sieve direct-realization declarations/refinements

**Goal:** make Sieve report Direct/Unsupported for the initial specimens based on the actual semantic contracts.

Examples:

- `mark-read` requires relevant IMAP flag capability in endpoint-aware mode;
- `has-attachment` should remain Unsupported unless an exact direct construct is proven.

**Depends on:** CRH-27.

---

## CRH-29 — Add Sieve round-trip conformance fixtures

**Goal:** prove semantic encode/decode round trips for every initial Direct case.

Include native fixture tests for parsing representative Sieve text, not only generated output.

**Depends on:** CRH-27, CRH-28.

---

## CRH-30 — Implement Purelymail endpoint-profile overlay

**Goal:** represent the currently known Purelymail ManageSieve extension profile separately from Sieve codec semantics.

Tests should cover at least:

- capability present → realization remains available;
- required extension removed from synthetic profile → exact realization becomes Unsupported;
- profile data itself is replaceable/runtime-supplied rather than hard-coded as timeless truth.

A static 2026 fixture may exist for regression/documentation, but the architecture should expect live discovery later.

**Depends on:** CRH-14, CRH-28.

---

# Phase G — Gmail filter codec

## CRH-31 — Implement minimal Gmail Filter representation codec

Support only the native fields required for the initial specimens.

Likely initial surface:

- subject criterion/query form chosen by exact semantics;
- has-attachment;
- remove `UNREAD` for mark-read;
- conjunction where representable by one Filter criteria object/query.

Keep this offline: use native JSON/data structures without API calls.

**Depends on:** Phase E.

---

## CRH-32 — Implement Gmail direct-realization/refinement checks

Pay special attention to where Gmail's documented normalization/search semantics do **not** prove exact equivalence to the canonical contract.

If exactness is underdocumented, return Unsupported with an `unproven`-style diagnostic rather than guessing.

**Depends on:** CRH-31.

---

## CRH-33 — Add Gmail round-trip and native-fixture conformance

Use the shared canonical specimens plus representative native Filter JSON fixtures.

Verify that system-label implementation details do not leak into canonical `mark-read` semantics after decode.

**Depends on:** CRH-31, CRH-32.

---

# Phase H — Outlook / Microsoft Graph rule codec

## CRH-34 — Implement minimal Outlook Inbox Rule codec

Support the initial semantic subset using offline Graph-style rule objects.

Likely native fields:

- `subjectContains` if exact contract permits;
- `hasAttachments`;
- `markAsRead`;
- conjunctive conditions.

No live Graph authentication/API is required.

**Depends on:** Phase E.

---

## CRH-35 — Implement Outlook direct-realization/refinement checks

Use the research gaps honestly.

If the canonical `subject.contains@1` contract requires comparison behavior Microsoft does not document strongly enough, report exactness as unproven rather than marking Direct.

This task is intentionally allowed to produce less support than the UI superficially suggests.

**Depends on:** CRH-34.

---

## CRH-36 — Add Outlook round-trip and native-fixture conformance

Consume shared canonical specimens and representative Graph JSON fixtures.

Verify exceptions/sequence/stop fields not involved in the first slice are not accidentally invented or discarded in ways that claim broader round-trip support than implemented.

**Depends on:** CRH-34, CRH-35.

---

# Phase I — Thunderbird filter codec

## CRH-37 — Implement minimal Thunderbird rule codec

Support only the initial semantic subset of `msgFilterRules.dat` required by the first fixtures.

Likely surface:

- Subject Contains;
- attachment predicate if representable by current core format;
- Mark read;
- match-all/AND;
- minimal filter identity/enabled metadata needed to form valid native rules.

**Depends on:** Phase E.

---

## CRH-38 — Implement Thunderbird direct-realization/refinement checks

Keep trigger/action-order semantics scoped correctly.

The first specimens should avoid claiming unsupported automatic/manual parity where the research has not proven it.

**Depends on:** CRH-37.

---

## CRH-39 — Add Thunderbird round-trip and native-fixture conformance

Include existing/native text fixture parsing, generated rule round trips, and semantic equivalence checks.

Do not require byte-for-byte preservation of formatting/order when semantically irrelevant, but preserve unknown constructs according to the codec policy.

**Depends on:** CRH-37, CRH-38.

---

# Phase J — Cross-IO conformance milestone

## CRH-40 — Generate the first real conformance matrix

Run all initial canonical specimens across:

- Sieve codec;
- Sieve + Purelymail profile;
- Gmail;
- Outlook;
- Thunderbird.

The output must be generated from test/conformance data, not maintained manually.

**Acceptance:**

- Direct/Unsupported and reason diagnostics are visible;
- known-unproven support is distinguishable from known-impossible support;
- matrix output is deterministic.

**Depends on:** Phases F–I.

---

## CRH-41 — Add cross-codec semantic round-trip tests

For every pair where the initial specimen is Direct on both sides:

```text
canonical
→ target A native
→ canonical A
→ target B native
→ canonical B
```

Assert semantic equivalence at each canonical boundary.

Do not build pairwise conversion functions; route through canonical semantics.

**Depends on:** CRH-40.

---

## CRH-42 — Add negative cross-IO exactness tests

Prove the system refuses unsafe conversions.

Examples:

- has-attachment to Sieve when no exact realization is registered;
- an Outlook text match whose exact comparison semantics are marked unproven;
- a Sieve mark-read realization when a synthetic endpoint profile lacks `imap4flags`.

The test suite should celebrate these refusals as correct behavior.

**Depends on:** CRH-40.

---

## CRH-43 — Make the conformance suite a CI gate

The first implementation milestone is not complete until CI prevents regressions in:

- capability contracts;
- target realization classifications;
- codec semantic round trips;
- endpoint-profile refinements;
- generated conformance matrix expectations.

**Depends on:** CRH-40–CRH-42.

---

# Phase K — Implementation hygiene and code documentation

This phase deliberately waits until the first cross-IO implementation milestone exists. The purpose is to clean up the implementation after enough real pressure has accumulated to reveal useful boundaries, but before exact-rewrite support adds another architectural layer.

## CRH-44 — Document, prettify, and reorganize the implementation

**Goal:** perform a deliberate implementation-hygiene pass over the codebase once R2 is complete.

The exact scope of this task is intentionally **not frozen yet**. The human will provide the desired documentation, presentation, organization, and cleanup requirements when this task is reached.

Expected areas may include:

- code/file/module organization;
- naming and readability;
- public/internal API presentation;
- comments and implementation documentation;
- removal or consolidation of temporary scaffolding;
- formatting/presentation conventions beyond automated Prettier output;
- making important architecture boundaries easier for a human reader to discover in the code;
- related cleanup that is easier to judge after several real IO implementations exist.

This task must not become an excuse for architecture churn or behavior changes disguised as cleanup. Any semantic/architectural change discovered during the pass should be separated and justified explicitly.

**Acceptance:**

- do not begin until the human supplies the detailed requirements for this pass;
- all existing semantic/conformance behavior remains green unless an explicitly approved change says otherwise;
- cleanup materially improves the human readability/maintainability of the implemented slice;
- durable documentation is updated where appropriate;
- no provider support claim or exactness classification changes silently as part of reorganization.

**Depends on:** CRH-43.

---

# Phase L — First exact rewrite support

This phase begins only after the direct-support harness is stable.

## CRH-45 — Define minimal rewrite identity/registration contract

A rewrite registration needs at least:

- stable/versioned rewrite identity;
- source expression/shape matcher;
- exact applicability/precondition check;
- transformation;
- diagnostic description.

No generalized graph planner yet.

---

## CRH-46 — Add rewrite contract-test harness

A rewrite must have tests proving:

- applicable positive examples;
- non-applicable boundary examples;
- semantic-equivalence oracle/fixture;
- no approximate cases accepted.

---

## CRH-47 — Implement one deliberately boring exact rewrite

Choose a rewrite whose equivalence can be proven cleanly from the defined semantic contracts.

Candidate only after the relevant text/glob contracts exist:

```text
glob("foo*") ⇔ startsWith("foo")
```

under explicit grammar/comparator preconditions.

Do **not** choose a rewrite merely because it increases the compatibility matrix.

---

## CRH-48 — Upgrade realization reporting to Derived for the first rewrite

Show:

- original specimen;
- rewrite identity/path;
- resulting target-realizable expression;
- final target classification.

Still no broad search algorithm required.

---

# Phase M — First-slice closure and expansion workflow

## CRH-49 — Document the "add a capability" contributor workflow

By this point the repository should be able to prescribe a repeatable process:

1. define semantic contract;
2. add canonical specimens;
3. pass contract tests;
4. implement target direct-support checks;
5. add encode/decode behavior;
6. pass target round trips;
7. update generated conformance matrix;
8. add exact rewrites only when proven;
9. promote any new durable architectural fact to `docs/`.

This should become the main contributor path for incremental semantic expansion.

---

## CRH-50 — Document the "add an IO variant" workflow

A new IO variant should primarily need to:

1. implement codec contracts;
2. declare/check direct realizability;
3. model endpoint profile separately where relevant;
4. consume the existing canonical specimen suite;
5. add native fixtures;
6. pass the same shared conformance harness.

It should not need pairwise knowledge of every existing adapter.

---

## CRH-51 — Reconcile implementation findings back into architecture

Perform a deliberate architecture review after the first slice.

Questions:

- Did code-native capability contracts work?
- Did the specimen abstraction survive both leaves and structures?
- Was Direct/Derived/Unsupported sufficient?
- Did Unsupported reason codes adequately distinguish unproven semantics?
- Did codec/endpoint separation remain clean?
- Did structural realizability require a different core abstraction?
- Did test fixtures expose missing semantic dimensions?
- Did any provisional implementation choice accidentally become architecture?

Update `docs/` only where evidence now supports a durable conclusion.

---

## CRH-52 — Define the next capability tranche from conformance gaps

Do **not** simply pick whichever capability is easiest.

Use the executable matrix to choose a useful next group, preferably one that exercises a new semantic dimension.

Candidate future families from existing research include:

- sender/address equality;
- size/range comparison;
- tag/category/keyword membership;
- star/flag;
- mailbox/container placement;
- copy;
- stop/continuation;
- negative predicates;
- forwarding/routing;
- deletion/trash lifecycle.

The next tranche should be planned from evidence produced by the harness rather than a hand-maintained feature wish list.

---

# 8. Milestones

## Milestone R0 — Harness spine

Complete through CRH-21.

Success means:

- registry exists;
- canonical specimens exist;
- realization results exist;
- fake targets prove Direct/Unsupported/refinement/structural behavior;
- codec round-trip harness exists;
- no provider implementation is needed to validate the harness.

## Milestone R1 — First canonical semantic tranche

Complete through CRH-26.

Success means the first four capability contracts and shared rule-shaped specimens are executable and provider-independent.

## Milestone R2 — Initial IO conformance

Complete through CRH-43.

Success means the same semantic specimen suite drives Sieve/Purelymail, Gmail, Outlook, and Thunderbird implementations, with generated Direct/Unsupported diagnostics and round-trip evidence.

This is the **first major implementation milestone**.

## Milestone R3 — First derived realization

Complete through CRH-48.

Success means one exact rewrite is registered, independently tested, and reported as Derived without introducing a sophisticated planner.

## Milestone R4 — Repeatable extension model

Complete through CRH-52.

Success means the repository can tell contributors how to add new semantics and new IO variants using the same machinery.

# 9. Explicit non-goals before R2

Unless a task above proves they are necessary, do not introduce before R2:

- general adapter plugin discovery;
- production CLI;
- web UI;
- persistent database;
- synchronization engine;
- account credential handling;
- provider polling;
- broad rewrite graph search;
- cost-based planner;
- lossy conversion;
- portable JSON/YAML rule format;
- automatic generation of semantic capability contracts from provider APIs;
- a giant provider feature matrix maintained by hand;
- npm publishing, package-registry metadata/polish, release automation, distribution bundles, or package-consumer support. Cloning and building from source is sufficient for this roadmap.

# 10. Checkpoint grouping recommendation

For chat/tool-session continuity, these groups benefit from being worked in one context while still keeping task checkpoints separate:

| Group | Tasks | Why |
|---|---|---|
| A | CRH-01–04 | runtime/tooling decisions share setup context |
| B | CRH-05–10 | registry/specimen types co-evolve |
| C | CRH-11–15 | realization interfaces must fit together |
| D | CRH-16–21 | harness runners/reporting should be built as one testing system |
| E | CRH-22–26 | first semantic contracts should be designed together for specimen coherence |
| F | CRH-27–30 | Sieve + Purelymail endpoint refinement share semantics |
| G | CRH-31–33 | Gmail codec slice |
| H | CRH-34–36 | Outlook codec slice |
| I | CRH-37–39 | Thunderbird codec slice |
| J | CRH-40–43 | cross-IO milestone and CI |
| K | CRH-44 | human-directed implementation documentation/reorganization pass after R2 |
| L | CRH-45–48 | first exact rewrite path |
| M | CRH-49–52 | consolidation and expansion workflow |

A fresh chat should stop at group boundaries when the next group would benefit materially from a clean context/recovery checkpoint.

# 11. Definition of success for this roadmap

The roadmap has succeeded when Mailchemy no longer answers:

> "Does adapter X support capability Y?"

from documentation or a hand-maintained spreadsheet.

Instead, it can answer:

> "For this concrete canonical semantic specimen/structure, what exact realization can target X prove, under this endpoint profile?"

and the answer is backed by executable shared conformance tests.

That is the foundation required for Mailchemy to grow one semantic capability and one IO implementation at a time without silently drifting away from its exactness guarantees.
