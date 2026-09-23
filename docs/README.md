# Documentation

This directory contains Mailchemy's durable human-facing architecture and design documentation.

## Current documents

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — canonical architecture, semantic IR, capability refinements, rewrite planning, codecs, stores/endpoints, and exactness rules.
- [`INITIAL_TARGETS.md`](INITIAL_TARGETS.md) — motivating rule systems/endpoints and why each matters to the design.

## Reading order

For a fresh reader:

1. root [`../README.md`](../README.md);
2. [`ARCHITECTURE.md`](ARCHITECTURE.md);
3. [`INITIAL_TARGETS.md`](INITIAL_TARGETS.md) when concrete system examples are useful.

## Documentation policy

This directory owns durable project architecture and terminology.

Do not turn implementation examples into settled implementation choices unless the project has explicitly made that decision. Current architecture intentionally does **not** choose a programming language, package layout, CLI surface, portable serialization format, or concrete public API.
