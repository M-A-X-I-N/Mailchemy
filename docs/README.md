# Documentation

This directory contains Mailchemy's durable human-facing architecture and design documentation.

## Current documents

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — canonical architecture, semantic IR, capability refinements, rewrite planning, codecs, stores/endpoints, exactness rules, and execution-structure implications.
- [`GLOSSARY.md`](GLOSSARY.md) — durable project vocabulary for semantic capabilities, refinements, rewrites, realization, adapters/codecs/stores/endpoints, exactness, execution context, terminality, and structural support.
- [`INITIAL_TARGETS.md`](INITIAL_TARGETS.md) — motivating rule systems/endpoints and why each matters to the design.
- [`IMPLEMENTATION_TOOLCHAIN.md`](IMPLEMENTATION_TOOLCHAIN.md) — initial TypeScript/ESM implementation toolchain and host-neutrality decision.\n- [`SEMANTIC_CAPABILITIES.md`](SEMANTIC_CAPABILITIES.md) — durable contracts for implemented core semantic capability versions.

## Reading order

For a fresh reader:

1. root [`../README.md`](../README.md);
2. [`GLOSSARY.md`](GLOSSARY.md) for project vocabulary;
3. [`ARCHITECTURE.md`](ARCHITECTURE.md);
4. [`INITIAL_TARGETS.md`](INITIAL_TARGETS.md) when concrete system examples are useful;
5. [`IMPLEMENTATION_TOOLCHAIN.md`](IMPLEMENTATION_TOOLCHAIN.md) for the current implementation toolchain.

## Documentation policy

This directory owns durable project architecture and terminology.

Do not turn implementation examples into settled implementation choices unless the project has explicitly made that decision. Current architecture intentionally does **not** choose a programming language, package layout, CLI surface, portable serialization format, or concrete public API.

## Research boundary

Native-system evidence, per-system investigations, and cross-system syntheses live under [`../research/`](../research/) rather than here. Start with [`../research/README.md`](../research/README.md).

Research documents establish what external systems do. This directory owns what Mailchemy has decided about its own architecture. When research changes an architectural conclusion, update the applicable document here instead of relying on readers to infer the change from a research report.
