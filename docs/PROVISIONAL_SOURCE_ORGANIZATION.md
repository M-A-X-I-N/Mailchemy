# Provisional source organization

This document records the CRH-44D1 naming and repository-organization design.

The goal is **browseability now**, not a claim that Mailchemy's current source
tree is the project's final architecture. Mailchemy is still growing, so this
organization should expose the concepts already proven by the implementation
without trying to predict every future subsystem.

No source file was moved or renamed by CRH-44D1. CRH-44D2 subsequently standardized authored TypeScript filenames on `lower_snake_case` in place. CRH-44D3 applied the approved semantic naming cleanup—including capability-instance vocabulary, leaf-expression names, capability-contract conformance naming, shared-rule naming, Sieve native-script naming, helper cleanup, and scaffold removal. CRH-44D4 applied the approved Core conceptual folder organization and mirrored useful Core test boundaries. CRH-44D5 applied the approved Conformance fixture/test grouping, descriptive conformance module names, and intentionally flat Cross-IO layout. CRH-44D6 applied the approved flat adapter layouts and provider-context-aware local filenames while preserving Sieve's distinct endpoint/profile layer. CRH-44D7 has now reconciled imports, root barrels/exports, and current-facing durable documentation, while preserving the old → new maps below as intentional historical design evidence.

## 1. Design rules

### 1.1 Authored TypeScript filenames use lower_snake_case

Authored TypeScript modules use lowercase words separated by underscores:

```text
capability_registry.ts
semantic_codec.ts
direct_target.ts
filter_codec.test.ts
```

Structural suffixes remain suffixes:

```text
foo.test.ts
index.ts
```

Generated declaration output under `packages/*/dist/**/*.d.ts` is derived
build output and is never hand-renamed or hand-documented.

This convention is intentionally limited to filenames. TypeScript identifiers
continue to follow normal TypeScript ecosystem casing:

```ts
class CapabilityRegistry {}
const gmailFilterCodec = ...;
function validateCanonicalExpression(...) {}
```

The repository does **not** alias third-party APIs merely to obtain a preferred
identifier casing style.

### 1.2 Exact filename casing becomes an enforced invariant

The current resolved TypeScript configuration does not explicitly enable
`forceConsistentCasingInFileNames`. The filename migration should enable it in
the shared compiler configuration so Windows and Linux agree on import casing.

### 1.3 Folder context may remove redundant filename prefixes

A filename should be understandable together with its package/folder path.
Provider names do not need to be repeated inside provider-specific packages.

Prefer:

```text
packages/gmail/src/filter_codec.ts
packages/outlook/src/inbox_rule_codec.ts
packages/thunderbird/src/realization_target.ts
```

over:

```text
packages/gmail/src/gmail_filter_codec.ts
packages/outlook/src/outlook_inbox_rule_codec.ts
packages/thunderbird/src/thunderbird_target.ts
```

Public TypeScript symbols may retain provider prefixes because imported symbols
can coexist outside their package context.

### 1.4 Subfolders exist only when they expose a real conceptual boundary

Do not create a folder merely to reduce the number of entries in a directory.

A folder is useful when a newcomer can infer a meaningful relationship from it,
for example:

- capability infrastructure vs concrete built-in capabilities;
- canonical expression model vs canonical validation;
- realization results/targets/endpoint refinement;
- conformance fixture families.

Small adapter packages remain flat because their package boundary already
provides sufficient context.

### 1.5 Prefer durable concept names over milestone/history names

Names such as `scaffold`, `R0`, or vague `target` filenames are useful during
construction but age badly as navigation.

Historical names may remain when they identify an intentionally frozen baseline
or milestone artifact. They should not remain merely because the file happened
to be created during that milestone.

### 1.6 Organization must not redefine architecture

Moving/renaming code must preserve the distinctions already established by the
glossary and architecture:

- capability contract vs concrete capability instance;
- canonical IR vs native representation;
- codec vs realization target;
- dialect/target vs endpoint profile;
- Direct/Derived/Unsupported;
- opaque preservation vs semantic decoding;
- adapter-local evidence vs cross-IO aggregation.

Package names, semantic capability IDs, codec IDs, realization-target IDs, and
dated endpoint-profile IDs are not filesystem cosmetics and are not renamed by
this cleanup without a separate semantic reason.

## 2. Semantic naming decisions

CRH-44D1 reviewed significant public/internal names in addition to filenames.
Most existing TypeScript identifiers are already descriptive and should remain.

### 2.1 Replace “specimen” with “capability instance”

`specimen` is implementation/planning vocabulary but is not a durable glossary
term. The glossary and semantic documentation already describe a concrete
parameterized occurrence as a **concrete instance** of a semantic capability.

Proposed rename:

| Current | Proposed |
| --- | --- |
| `CapabilitySpecimen` | `CapabilityInstance` |
| `createCapabilitySpecimen` | `createCapabilityInstance` |
| `areCapabilitySpecimensEqual` | `areCapabilityInstancesEqual` |
| expression property `specimen` | `instance` |
| `validateCapabilitySpecimen` | `validateCapabilityInstance` |
| internal `collectSpecimenIssues` | `collectCapabilityInstanceIssues` |
| `semantic-specimen.ts` | final path `capabilities/instance.ts` |

This is a terminology cleanup only. The represented semantics do not change.

### 2.2 Use “leaf” for capability-backed leaf expression types

The current names `ConditionCapabilityExpression` and
`ActionCapabilityExpression` are mechanically accurate but awkward. The
glossary already owns **leaf semantic / leaf capability**.

Proposed rename:

| Current | Proposed |
| --- | --- |
| `ConditionCapabilityExpression` | `ConditionLeafExpression` |
| `ActionCapabilityExpression` | `ActionLeafExpression` |

`ConditionExpression`, `ActionExpression`, `AndExpression`,
`RuleExpression`, and `CanonicalExpression` remain unchanged.

### 2.3 Make conformance APIs describe conformance rather than “tests”

The conformance package is executable library machinery, not a Vitest wrapper.

Proposed rename:

| Current | Proposed |
| --- | --- |
| `runCapabilityContractTests` | `runCapabilityContractConformance` |
| `CapabilityContractRunnerOptions` | `CapabilityContractConformanceOptions` |
| `CapabilityContractRun` | `CapabilityContractConformanceRun` |

The remaining fixture/oracle result types are already sufficiently specific.

### 2.4 Replace historical shared-rule naming

The A/B/C rule fixtures are now reusable cross-target evidence rather than merely
“initial” construction artifacts.

| Current | Proposed |
| --- | --- |
| `initialRuleFixtures` | `sharedRuleFixtures` |
| `fixtures/initial-rules.ts` | final path `fixtures/shared_rules.ts` |

The cross-IO **initial matrix** names remain unchanged semantically because they
identify the intentionally frozen first cross-IO baseline.

### 2.5 Remove obsolete conformance scaffold sentinel

`mailchemyConformanceScaffold` exists only to prove the early workspace
scaffold. CRH-44D proposes deliberately removing that test-only export and
replacing `scaffold.test.ts` with a package-export/linkage test using real
conformance exports.

This is an intentional cleanup of historical scaffolding, not an accidental
public-surface break.

### 2.6 Clarify Sieve native representation

`SieveNative` is less descriptive than the native types in the other adapters.

Proposed:

| Current | Proposed |
| --- | --- |
| `SieveNative` | `SieveScriptNative` |

The public `sieveCodec` name remains appropriate.

### 2.7 Remove “initial” from adapter-local helper names when it means only “first implementation”

Internal helpers such as:

- `containsInitialGmailCriterion`;
- `containsInitialOutlookPredicate`;
- `containsInitialThunderbirdCondition`;

exist to detect currently recognized-but-unproven semantic families, not to
identify a durable milestone.

Proposed:

- `containsUnprovenGmailCriterion`;
- `containsUnprovenOutlookPredicate`;
- `containsUnprovenThunderbirdCondition`.

### 2.8 Names reviewed and intentionally retained

The following central terms already align with the glossary/architecture and
should not be churned merely for aesthetics:

- `SemanticCapabilityContract`;
- `CapabilityRegistry`;
- `RegisteredCapabilityContract`;
- `SemanticCodec`;
- `DirectRealizationTarget`;
- `StructuredDirectRealizationTarget`;
- `EndpointCapabilityProfile`;
- `RealizationResult`;
- `ValidationResult`;
- provider-prefixed public adapter symbols such as `gmailFilterCodec`,
  `outlookInboxRuleCodec`, and `thunderbirdFilterCodec`.

## 3. Proposed package trees

### 3.1 @mailchemy/core

Core benefits from real conceptual grouping because it contains the shared
semantic kernel.

```text
packages/core/
├── src/
│   ├── capabilities/
│   │   ├── builtins/
│   │   │   ├── has_attachment.ts
│   │   │   ├── logical_and.ts
│   │   │   ├── mark_read.ts
│   │   │   └── subject_contains.ts
│   │   ├── contract.ts
│   │   ├── core_registry.ts
│   │   ├── id.ts
│   │   ├── instance.ts
│   │   └── registry.ts
│   ├── canonical/
│   │   ├── expression.ts
│   │   └── validation.ts
│   ├── realization/
│   │   ├── direct_target.ts
│   │   ├── endpoint_profile.ts
│   │   ├── result.ts
│   │   └── structured_target.ts
│   ├── semantic_codec.ts
│   ├── validation_result.ts
│   └── index.ts
└── test/
    ├── capabilities/
    │   ├── id.test.ts
    │   ├── instance.test.ts
    │   ├── registry.test.ts
    │   └── registry_integrity.test.ts
    ├── canonical/
    │   ├── expression.test.ts
    │   └── validation.test.ts
    ├── realization/
    │   ├── direct_target.test.ts
    │   ├── endpoint_profile.test.ts
    │   ├── result.test.ts
    │   └── structured_target.test.ts
    └── semantic_codec.test.ts
```

`semantic_codec.ts` and `validation_result.ts` remain at the package root
because each is currently a single coherent shared primitive; creating a
single-file folder would not improve navigation.

### 3.2 @mailchemy/conformance

The existing fixture folder is useful and should become the main structural
grouping. Runner/reporting files remain flat after receiving descriptive names;
there are too few of them to justify another folder layer.

```text
packages/conformance/
├── src/
│   ├── fixtures/
│   │   ├── canonical_fixture.ts
│   │   ├── has_attachment.ts
│   │   ├── logical_and.ts
│   │   ├── mark_read.ts
│   │   ├── shared_rules.ts
│   │   └── subject_contains.ts
│   ├── capability_contract_conformance.ts
│   ├── codec_round_trip.ts
│   ├── conformance_matrix.ts
│   ├── target_realization_conformance.ts
│   └── index.ts
└── test/
    ├── fixtures/
    │   ├── canonical_fixture.test.ts
    │   ├── has_attachment.test.ts
    │   ├── logical_and.test.ts
    │   ├── mark_read.test.ts
    │   ├── shared_rules.test.ts
    │   └── subject_contains.test.ts
    ├── capability_contract_conformance.test.ts
    ├── codec_round_trip.test.ts
    ├── conformance_matrix.test.ts
    ├── harness_integration.test.ts
    ├── package_exports.test.ts
    └── target_realization_conformance.test.ts
```

### 3.3 @mailchemy/cross-io

This package is already small enough that subfolders would obscure more than
they clarify.

```text
packages/cross-io/
├── src/
│   ├── cross_codec_round_trip.ts
│   ├── initial_conformance_matrix.ts
│   └── index.ts
└── test/
    ├── fixtures/
    │   └── expected_initial_conformance_matrix.ts
    ├── cross_codec_round_trip.test.ts
    ├── exactness_refusal.test.ts
    └── initial_conformance_matrix.test.ts
```

The npm package identity `@mailchemy/cross-io` and package directory
`packages/cross-io` remain unchanged; package naming is a separate concern from
authored TypeScript filenames.

### 3.4 Adapter packages

The adapter packages are intentionally flat. Their package names already provide
the provider/dialect context.

```text
packages/gmail/
├── src/
│   ├── filter_codec.ts
│   ├── realization_target.ts
│   └── index.ts
└── test/
    ├── fixtures/native_filters.ts
    ├── conformance.test.ts
    ├── filter_codec.test.ts
    └── realization_target.test.ts

packages/outlook/
├── src/
│   ├── inbox_rule_codec.ts
│   ├── realization_target.ts
│   └── index.ts
└── test/
    ├── fixtures/native_rules.ts
    ├── conformance.test.ts
    ├── inbox_rule_codec.test.ts
    └── realization_target.test.ts

packages/sieve/
├── src/
│   ├── codec.ts
│   ├── endpoint_profile.ts
│   ├── purelymail_profile.ts
│   ├── realization_target.ts
│   └── index.ts
└── test/
    ├── fixtures/native_scripts.ts
    ├── codec.test.ts
    ├── conformance.test.ts
    ├── endpoint_profile.test.ts
    └── realization_target.test.ts

packages/thunderbird/
├── src/
│   ├── filter_codec.ts
│   ├── realization_target.ts
│   └── index.ts
└── test/
    ├── fixtures/native_filters.ts
    ├── conformance.test.ts
    ├── filter_codec.test.ts
    └── realization_target.test.ts
```

The similar adapter layouts are deliberate where the concepts are truly
equivalent. Sieve remains different because endpoint-profile refinement is a
real additional layer, not something to fake in the other adapters for visual
symmetry.

## 4. Complete current → proposed TypeScript path map

### 4.1 Core source

| Current | Proposed |
| --- | --- |
| `packages/core/src/capabilities/has-attachment.ts` | `packages/core/src/capabilities/builtins/has_attachment.ts` |
| `packages/core/src/capabilities/logical-and.ts` | `packages/core/src/capabilities/builtins/logical_and.ts` |
| `packages/core/src/capabilities/mark-read.ts` | `packages/core/src/capabilities/builtins/mark_read.ts` |
| `packages/core/src/capabilities/subject-contains.ts` | `packages/core/src/capabilities/builtins/subject_contains.ts` |
| `packages/core/src/capability-contract.ts` | `packages/core/src/capabilities/contract.ts` |
| `packages/core/src/capability-id.ts` | `packages/core/src/capabilities/id.ts` |
| `packages/core/src/capability-registry.ts` | `packages/core/src/capabilities/registry.ts` |
| `packages/core/src/core-capability-registry.ts` | `packages/core/src/capabilities/core_registry.ts` |
| `packages/core/src/semantic-specimen.ts` | `packages/core/src/capabilities/instance.ts` |
| `packages/core/src/expression.ts` | `packages/core/src/canonical/expression.ts` |
| `packages/core/src/semantic-validation.ts` | `packages/core/src/canonical/validation.ts` |
| `packages/core/src/realization.ts` | `packages/core/src/realization/result.ts` |
| `packages/core/src/realization-target.ts` | `packages/core/src/realization/direct_target.ts` |
| `packages/core/src/structured-realization-target.ts` | `packages/core/src/realization/structured_target.ts` |
| `packages/core/src/endpoint-profile.ts` | `packages/core/src/realization/endpoint_profile.ts` |
| `packages/core/src/codec.ts` | `packages/core/src/semantic_codec.ts` |
| `packages/core/src/validation.ts` | `packages/core/src/validation_result.ts` |
| `packages/core/src/index.ts` | unchanged |

### 4.2 Core tests

| Current | Proposed |
| --- | --- |
| `packages/core/test/capability-id.test.ts` | `packages/core/test/capabilities/id.test.ts` |
| `packages/core/test/capability-registry.test.ts` | `packages/core/test/capabilities/registry.test.ts` |
| `packages/core/test/registry-integrity.test.ts` | `packages/core/test/capabilities/registry_integrity.test.ts` |
| `packages/core/test/semantic-specimen.test.ts` | `packages/core/test/capabilities/instance.test.ts` |
| `packages/core/test/expression.test.ts` | `packages/core/test/canonical/expression.test.ts` |
| `packages/core/test/semantic-validation.test.ts` | `packages/core/test/canonical/validation.test.ts` |
| `packages/core/test/realization.test.ts` | `packages/core/test/realization/result.test.ts` |
| `packages/core/test/realization-target.test.ts` | `packages/core/test/realization/direct_target.test.ts` |
| `packages/core/test/structured-realization-target.test.ts` | `packages/core/test/realization/structured_target.test.ts` |
| `packages/core/test/endpoint-profile.test.ts` | `packages/core/test/realization/endpoint_profile.test.ts` |
| `packages/core/test/codec.test.ts` | `packages/core/test/semantic_codec.test.ts` |

### 4.3 Conformance source

| Current | Proposed |
| --- | --- |
| `packages/conformance/src/fixture.ts` | `packages/conformance/src/fixtures/canonical_fixture.ts` |
| `packages/conformance/src/fixtures/has-attachment.ts` | `packages/conformance/src/fixtures/has_attachment.ts` |
| `packages/conformance/src/fixtures/logical-and.ts` | `packages/conformance/src/fixtures/logical_and.ts` |
| `packages/conformance/src/fixtures/mark-read.ts` | `packages/conformance/src/fixtures/mark_read.ts` |
| `packages/conformance/src/fixtures/initial-rules.ts` | `packages/conformance/src/fixtures/shared_rules.ts` |
| `packages/conformance/src/fixtures/subject-contains.ts` | `packages/conformance/src/fixtures/subject_contains.ts` |
| `packages/conformance/src/contract-runner.ts` | `packages/conformance/src/capability_contract_conformance.ts` |
| `packages/conformance/src/round-trip.ts` | `packages/conformance/src/codec_round_trip.ts` |
| `packages/conformance/src/matrix.ts` | `packages/conformance/src/conformance_matrix.ts` |
| `packages/conformance/src/target-runner.ts` | `packages/conformance/src/target_realization_conformance.ts` |
| `packages/conformance/src/index.ts` | unchanged |

### 4.4 Conformance tests

| Current | Proposed |
| --- | --- |
| `packages/conformance/test/fixture.test.ts` | `packages/conformance/test/fixtures/canonical_fixture.test.ts` |
| `packages/conformance/test/has-attachment.test.ts` | `packages/conformance/test/fixtures/has_attachment.test.ts` |
| `packages/conformance/test/logical-and.test.ts` | `packages/conformance/test/fixtures/logical_and.test.ts` |
| `packages/conformance/test/mark-read.test.ts` | `packages/conformance/test/fixtures/mark_read.test.ts` |
| `packages/conformance/test/initial-rules.test.ts` | `packages/conformance/test/fixtures/shared_rules.test.ts` |
| `packages/conformance/test/subject-contains.test.ts` | `packages/conformance/test/fixtures/subject_contains.test.ts` |
| `packages/conformance/test/contract-runner.test.ts` | `packages/conformance/test/capability_contract_conformance.test.ts` |
| `packages/conformance/test/round-trip.test.ts` | `packages/conformance/test/codec_round_trip.test.ts` |
| `packages/conformance/test/matrix.test.ts` | `packages/conformance/test/conformance_matrix.test.ts` |
| `packages/conformance/test/target-runner.test.ts` | `packages/conformance/test/target_realization_conformance.test.ts` |
| `packages/conformance/test/harness-self.test.ts` | `packages/conformance/test/harness_integration.test.ts` |
| `packages/conformance/test/scaffold.test.ts` | `packages/conformance/test/package_exports.test.ts` |

### 4.5 Cross-IO

| Current | Proposed |
| --- | --- |
| `packages/cross-io/src/cross-codec-round-trip.ts` | `packages/cross-io/src/cross_codec_round_trip.ts` |
| `packages/cross-io/src/initial-conformance-matrix.ts` | `packages/cross-io/src/initial_conformance_matrix.ts` |
| `packages/cross-io/src/index.ts` | unchanged |
| `packages/cross-io/test/cross-codec-round-trip.test.ts` | `packages/cross-io/test/cross_codec_round_trip.test.ts` |
| `packages/cross-io/test/initial-conformance-matrix.test.ts` | `packages/cross-io/test/initial_conformance_matrix.test.ts` |
| `packages/cross-io/test/negative-exactness.test.ts` | `packages/cross-io/test/exactness_refusal.test.ts` |
| `packages/cross-io/test/fixtures/expected-initial-conformance-matrix.ts` | `packages/cross-io/test/fixtures/expected_initial_conformance_matrix.ts` |

### 4.6 Gmail

| Current | Proposed |
| --- | --- |
| `packages/gmail/src/gmail-filter-codec.ts` | `packages/gmail/src/filter_codec.ts` |
| `packages/gmail/src/gmail-target.ts` | `packages/gmail/src/realization_target.ts` |
| `packages/gmail/src/index.ts` | unchanged |
| `packages/gmail/test/fixtures/native-gmail.ts` | `packages/gmail/test/fixtures/native_filters.ts` |
| `packages/gmail/test/gmail-filter-codec.test.ts` | `packages/gmail/test/filter_codec.test.ts` |
| `packages/gmail/test/gmail-target.test.ts` | `packages/gmail/test/realization_target.test.ts` |
| `packages/gmail/test/gmail-conformance.test.ts` | `packages/gmail/test/conformance.test.ts` |

### 4.7 Outlook

| Current | Proposed |
| --- | --- |
| `packages/outlook/src/outlook-inbox-rule-codec.ts` | `packages/outlook/src/inbox_rule_codec.ts` |
| `packages/outlook/src/outlook-target.ts` | `packages/outlook/src/realization_target.ts` |
| `packages/outlook/src/index.ts` | unchanged |
| `packages/outlook/test/fixtures/native-outlook.ts` | `packages/outlook/test/fixtures/native_rules.ts` |
| `packages/outlook/test/outlook-inbox-rule-codec.test.ts` | `packages/outlook/test/inbox_rule_codec.test.ts` |
| `packages/outlook/test/outlook-target.test.ts` | `packages/outlook/test/realization_target.test.ts` |
| `packages/outlook/test/outlook-conformance.test.ts` | `packages/outlook/test/conformance.test.ts` |

### 4.8 Sieve

| Current | Proposed |
| --- | --- |
| `packages/sieve/src/sieve-codec.ts` | `packages/sieve/src/codec.ts` |
| `packages/sieve/src/sieve-target.ts` | `packages/sieve/src/realization_target.ts` |
| `packages/sieve/src/endpoint-profile.ts` | `packages/sieve/src/endpoint_profile.ts` |
| `packages/sieve/src/purelymail-profile.ts` | `packages/sieve/src/purelymail_profile.ts` |
| `packages/sieve/src/index.ts` | unchanged |
| `packages/sieve/test/fixtures/native-sieve.ts` | `packages/sieve/test/fixtures/native_scripts.ts` |
| `packages/sieve/test/sieve-codec.test.ts` | `packages/sieve/test/codec.test.ts` |
| `packages/sieve/test/sieve-target.test.ts` | `packages/sieve/test/realization_target.test.ts` |
| `packages/sieve/test/endpoint-profile.test.ts` | `packages/sieve/test/endpoint_profile.test.ts` |
| `packages/sieve/test/sieve-conformance.test.ts` | `packages/sieve/test/conformance.test.ts` |

### 4.9 Thunderbird

| Current | Proposed |
| --- | --- |
| `packages/thunderbird/src/thunderbird-filter-codec.ts` | `packages/thunderbird/src/filter_codec.ts` |
| `packages/thunderbird/src/thunderbird-target.ts` | `packages/thunderbird/src/realization_target.ts` |
| `packages/thunderbird/src/index.ts` | unchanged |
| `packages/thunderbird/test/fixtures/native-thunderbird.ts` | `packages/thunderbird/test/fixtures/native_filters.ts` |
| `packages/thunderbird/test/thunderbird-filter-codec.test.ts` | `packages/thunderbird/test/filter_codec.test.ts` |
| `packages/thunderbird/test/thunderbird-target.test.ts` | `packages/thunderbird/test/realization_target.test.ts` |
| `packages/thunderbird/test/thunderbird-conformance.test.ts` | `packages/thunderbird/test/conformance.test.ts` |

## 5. Execution boundaries for CRH-44D2–D9

The path map above describes the **final provisional target**, but later tasks should
reach it in reviewable checkpoints:

1. **D2 — filename convention:** establish explicit casing enforcement and
   mechanically convert authored TypeScript filenames from kebab-case to
   lower_snake_case without semantic word changes.
2. **D3 — semantic names:** apply approved object/module terminology changes,
   including capability-instance vocabulary, shared-rule naming, conformance API
   naming, historical scaffold removal, and adapter helper cleanup.
3. **D4 — Core organization:** move Core into the proposed conceptual folders
   and mirror useful boundaries in tests.
4. **D5 — Conformance/Cross-IO organization:** apply the proposed fixture/test
   grouping and final descriptive module names.
5. **D6 — adapter organization:** remove redundant provider prefixes from
   provider-local filenames and align equivalent package layouts.
6. **D7 — imports/exports/docs:** reconcile barrels, imports, durable docs,
   links, examples, and stale old names/paths.
7. **D8 — unfamiliar-human browseability audit:** inspect the result as a new
   contributor rather than as its author.
8. **D9 — behavior-neutral proof:** verify all planned API changes are explicit,
   all other behavior/semantics remain unchanged, generated output rebuilds, and
   Linux/Windows validation is green.

Repeated rename/move checkpoints are acceptable here: recoverability and clear
review history are more important than minimizing the number of `git mv`
operations.

### 5.1 CRH-44D7 reconciliation result

The physical moves from D4–D6 remain internal implementation details rather than
new consumer import paths:

- every workspace package continues to export only its package-root entry point;
- cross-package TypeScript imports use package roots rather than internal
  subpaths;
- the D4–D6 barrel changes only repoint module specifiers to the new internal
  files; they do not add or remove exported symbols.

The deliberate public-surface changes in this organization sequence are the D3
semantic cleanup recorded in section 2: capability-instance and leaf-expression
names, capability-contract conformance names, `sharedRuleFixtures`,
`SieveScriptNative`, and removal of the obsolete
`mailchemyConformanceScaffold` sentinel.

Repository-wide stale-reference auditing found no remaining old names or paths
outside this document's intentional design history. Current-facing roadmap text
was updated from the historical "target-runner" wording to
"target-realization conformance".

## 6. D1 acceptance

CRH-44D1 is complete when:

- the filename convention is selected and justified;
- casing enforcement is identified;
- meaningful folder boundaries are selected without gratuitous nesting;
- all authored TypeScript paths have an explicit proposed destination;
- significant semantic naming problems have explicit rename/keep decisions;
- historical scaffolding slated for removal is identified;
- no source file has yet been moved or renamed;
- the repository remains fully green.

The organization remains provisional. Future functionality may justify new
folders or different boundaries; that is expected and does not make this cleanup
a failure.
