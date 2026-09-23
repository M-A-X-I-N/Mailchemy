# Initial rule systems and endpoints

This document records the first concrete systems motivating Mailchemy's architecture. They are examples and likely early targets, **not** a closed supported-provider list.

## 1. Sieve

Sieve is important because it is a standardized server-side mail-filtering language and demonstrates why Mailchemy must distinguish semantics from transport/storage.

Potential stores/endpoints include:

- local `.sieve` files;
- ManageSieve servers;
- provider-specific Sieve implementations/extensions.

Purelymail is the immediate motivating real endpoint because it exposes ManageSieve and server-side Sieve filtering.

Mailchemy should avoid treating "Purelymail" and "Sieve" as the same abstraction: Purelymail is an endpoint/provider; Sieve is the rule language/dialect.

## 2. Gmail Filters

Gmail has a provider-specific server-side filter model exposed through Gmail settings/API surfaces.

Relevant architectural characteristics include:

- Gmail search/filter semantics differ from Sieve matching semantics;
- labels are not traditional single-location folders;
- provider-specific limits/normalization may constrain concrete operations;
- direct capability support may therefore be instance-specific rather than boolean.

Mailchemy should model only proven semantic equivalences. Similar-looking Gmail searches must not automatically be treated as equivalent to Sieve globs or other matchers.

## 3. Microsoft Outlook / Hotmail Inbox Rules

Microsoft's server-side Inbox Rules are exposed through Microsoft Graph for applicable accounts, including the motivating personal Outlook/Hotmail case.

This system is useful because its condition/action vocabulary overlaps with other systems while its folder/rule semantics are not identical.

It reinforces the need for:

- a semantic IR rather than provider syntax as the pivot;
- exact capability refinements;
- alternate exact realizations;
- separate API/store logic from semantic codecs.

## 4. Thunderbird message filters

Thunderbird is deliberately included despite not being an email provider.

Its local/client rule system is a first-class candidate input/output because Mailchemy cares about **rule systems**, not only hosted services.

Potential uses include:

- importing existing Thunderbird filters;
- exporting portable semantics into Thunderbird's native rules;
- comparing Thunderbird rules with server-side provider rules;
- eventually using Thunderbird-related tooling as an authoring/frontend path without making Thunderbird's format the canonical model.

Exact implementation and persistence details should be researched before any codec/store contract is frozen.

## 5. Portable file formats

A human-editable or archival portable format may be useful later.

It should not be treated as the canonical IR itself. Instead, define a versioned external schema and implement it as another codec/store pair.

Possible future examples include JSON, YAML, or another purpose-built representation, but no format is selected.

## 6. Why these initial systems matter

Together these targets deliberately exercise different architectural dimensions:

```text
Sieve
  standardized language semantics

Purelymail / ManageSieve
  remote transport/store for Sieve

Gmail
  proprietary server-side filter/search/label model

Outlook / Microsoft Graph
  proprietary server-side rule/folder model

Thunderbird
  local client-side rule format

portable file
  explicit serialization without provider semantics
```

If the architecture handles these cleanly without privileging one of them as "the real model", it is likely on a sound path for additional rule systems.
