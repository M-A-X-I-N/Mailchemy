# Package map

This directory contains Mailchemy's executable TypeScript packages. The package
boundaries reflect implementation responsibilities; they do not create separate
semantic authorities. Durable semantic and architectural decisions still live
in [`../docs/`](../docs/).

## Where to start

| Package | Responsibility | Useful first files |
| --- | --- | --- |
| [`core/`](core/) | Provider-neutral semantic kernel: capability contracts/instances, canonical expressions, validation, exact-realization results/targets, endpoint refinement, and codec contracts | `src/index.ts`, `src/capabilities/`, `src/canonical/`, `src/realization/` |
| [`conformance/`](conformance/) | Reusable canonical fixtures and executable conformance machinery for capability contracts, target realization, codecs, and matrix aggregation | `src/index.ts`, `src/fixtures/`, `src/capability_contract_conformance.ts`, `src/target_realization_conformance.ts` |
| [`cross-io/`](cross-io/) | Cross-adapter aggregation: the frozen initial target matrix and canonical-routed cross-codec checks | `src/index.ts`, `src/initial_conformance_matrix.ts`, `src/cross_codec_round_trip.ts` |
| [`gmail/`](gmail/) | Initial Gmail Filter native codec and direct-realization target | `src/filter_codec.ts`, `src/realization_target.ts` |
| [`outlook/`](outlook/) | Initial Microsoft Graph Inbox Rule native codec and direct-realization target | `src/inbox_rule_codec.ts`, `src/realization_target.ts` |
| [`sieve/`](sieve/) | Initial Sieve text codec, dialect-level realization target, endpoint-profile refinement, and dated Purelymail endpoint evidence | `src/codec.ts`, `src/realization_target.ts`, `src/endpoint_profile.ts`, `src/purelymail_profile.ts` |
| [`thunderbird/`](thunderbird/) | Initial Thunderbird `msgFilterRules.dat` codec and direct-realization target | `src/filter_codec.ts`, `src/realization_target.ts` |

## How the packages relate

`core` defines Mailchemy's provider-neutral implementation contracts.
`conformance` supplies shared executable evidence and runners against those
contracts. Adapter packages implement native codecs and target-local exactness
classification. `cross-io` composes those already-established truths; it does
not redefine adapter or core semantics.

Dependency direction (`A -> B` means A depends on B):

```text
conformance -> core

gmail       -> core
outlook     -> core
sieve       -> core
thunderbird -> core

adapter conformance tests -> conformance

cross-io -> core + conformance + gmail + outlook + sieve + thunderbird
```

## Common adapter shape

Gmail, Outlook, Sieve, and Thunderbird stay intentionally flat because the
package name already supplies provider/dialect context. Equivalent concepts use
equivalent local names where that helps navigation:

- `*_codec.ts` or `codec.ts` owns native encode/decode behavior;
- `realization_target.ts` owns direct exact-realizability classification;
- `test/conformance.test.ts` connects shared canonical evidence to that adapter;
- `test/fixtures/native_*.ts` contains representative native decode evidence.

Sieve has additional `endpoint_profile.ts` and `purelymail_profile.ts` modules
because endpoint refinement is a real extra layer. The other adapters should not
gain matching files merely for visual symmetry.

## Core landmarks

`core/src/` has three meaningful grouped boundaries:

- `capabilities/` — capability identity, contracts, concrete instances, registry,
  and currently implemented built-ins;
- `canonical/` — canonical expression shapes and recursive validation;
- `realization/` — exact-realization results, direct/structured target contracts,
  and endpoint-profile refinement.

`semantic_codec.ts` and `validation_result.ts` remain at the Core source root
because each is one coherent shared primitive; one-file folders would add
nesting without adding navigational meaning.

## Import boundary

Workspace consumers import from package roots such as `@mailchemy/core` and
`@mailchemy/sieve`. Internal source folders are organization details, not public
consumer subpath APIs. Each package's `src/index.ts` is the public TypeScript
barrel.

For the rationale behind this provisional layout and its historical rename map,
see [`../docs/PROVISIONAL_SOURCE_ORGANIZATION.md`](../docs/PROVISIONAL_SOURCE_ORGANIZATION.md).
