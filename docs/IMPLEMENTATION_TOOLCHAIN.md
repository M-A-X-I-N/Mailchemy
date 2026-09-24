# Implementation toolchain

## Status

This document records the initial implementation-toolchain decision for Mailchemy.

The decision is intentionally narrower than the project architecture. It may evolve as implementation evidence accumulates, but changes must preserve the semantic/platform boundaries in [ARCHITECTURE.md](ARCHITECTURE.md).

Decision date: 2026-09-24.

## Language and emitted runtime

Mailchemy implementation source uses **TypeScript 6**, initially pinned to **TypeScript 6.0.3**.

The library emits **ECMAScript modules (ESM)** targeting **ES2022**.

The semantic/core implementation is **host-platform neutral**. It must not depend on Node.js, browser DOM APIs, WebExtension APIs, Thunderbird APIs, filesystem APIs, or other host-specific globals merely because the development toolchain happens to run on Node.

Conceptually:

```text
TypeScript source
      ↓
ES2022 ESM JavaScript
      ↓
host-independent semantic/core library
      ↓
host-specific adapters/integrations around the boundary
```

### TypeScript 7 adoption

TypeScript 7 is already stable, but the current type-aware linting stack used by Mailchemy does not yet declare compatibility with it.

The project therefore remains on the latest TypeScript 6 patch while `typescript-eslint` officially supports TypeScript only below 6.1. This is a tooling-compatibility pin, not an architectural dependency on the JavaScript-based TypeScript compiler.

Upgrade to TypeScript 7 should be treated as routine maintenance once the lint/type-analysis stack declares support and the normal validation suite passes.

## Development and CI host

**Node.js 24 LTS** is the development/test/CI host, initially pinned to **24.21.0**.

Node is a tooling environment, not a required Mailchemy runtime.

Core code should therefore compile without ambient Node or DOM globals. Host-specific packages may opt into their required type/runtime surfaces later.

## Workspace and package management

Use **npm workspaces** initially.

The first implementation scaffold should contain only the packages required by R0. The expected initial split is:

- `@mailchemy/core` — semantic contracts, registry, specimens, realization types/interfaces;
- `@mailchemy/conformance` — synthetic targets/codecs, fixture runners, conformance/reporting tests.

Do not create provider/IO packages until the roadmap reaches work that actually needs them.

Package-registry publishing and public distribution are explicitly out of scope for the foreseeable roadmap. Cloning the repository and building/testing from source is sufficient.

## Build and validation tools

Initial tool choices:

- TypeScript compiler (`tsc`) for type checking/build output;
- Vitest for tests;
- ESLint + typescript-eslint for lint/static policy;
- Prettier for formatting.

Do not introduce a bundler during R0 unless a concrete R0 requirement proves one necessary.

Do not introduce a runtime validation/schema library merely to model capability contracts. Prefer code-native strongly typed contracts first; add external validation tooling only when an actual runtime boundary requires it.

## TypeScript policy

Use aggressive compiler strictness appropriate for a semantic model.

At minimum, the core configuration should enable or preserve the equivalent of:

- `strict`;
- `noUncheckedIndexedAccess`;
- `exactOptionalPropertyTypes`;
- `noImplicitOverride`;
- `noFallthroughCasesInSwitch`;
- explicit empty ambient `types` for host-neutral packages.

Discriminated unions and exhaustive handling should be preferred for semantic states such as realization outcomes and diagnostics.

Do not use `any` as a shortcut around semantic modeling problems.

## Host-neutrality rule

`@mailchemy/core` must not casually acquire host/runtime dependencies.

Examples that must not be available merely by ambient typing inside core:

```text
process
Buffer
node:fs
document
window
browser.*
chrome.*
messenger.*
```

If a semantic operation genuinely requires a host service, expose that requirement through an explicit boundary rather than importing the host into the semantic core.

## Deferred choices

This decision does not choose:

- final package/distribution shape;
- npm publishing;
- release automation;
- browser-extension bundling;
- Thunderbird extension packaging;
- provider SDKs;
- plugin discovery;
- public API stability/versioning;
- a WASM implementation.

Rust/WASM remains a possible future internal implementation technique if profiling or another concrete requirement justifies it. It should not be part of the initial integration model.

## Rationale

The intended long-term consumers include Thunderbird and browser extensions as well as possible console/server tools.

TypeScript/ESM allows Mailchemy to be consumed natively by JavaScript-hosted extension environments without imposing a WebAssembly boundary, while still providing strong enough type modeling for the preliminary semantic registry and conformance harness.

The platform-neutral core rule prevents choosing TypeScript from degenerating into choosing Node.js or one specific extension host as the project architecture.
