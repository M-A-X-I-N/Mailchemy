# Purelymail Sieve capability profile

## 1. Purpose

This document narrows the broad standardized Sieve survey to the **actual Sieve extension profile currently advertised by Purelymail**.

The authoritative current evidence is Purelymail's public ManageSieve capability greeting, queried without authentication on **2026-09-24**.

## 2. Live capability snapshot

**Evidence: Observed — unauthenticated ManageSieve greeting from `mailserver.purelymail.com:4190`, 2026-09-24.**

```text
"VERSION" "1.0"
"SIEVE" "body envelope reject fileinto vacation comparator-i;ascii-numeric variables subaddress imap4flags mailbox copy vacation-seconds spamtest relational date"
"SASL" "PLAIN"
"IMPLEMENTATION" "Apache ManageSieve v1.0"
"STARTTLS"
OK
```

The advertised optional Sieve capabilities are:

- `body`
- `envelope`
- `reject`
- `fileinto`
- `vacation`
- `comparator-i;ascii-numeric`
- `variables`
- `subaddress`
- `imap4flags`
- `mailbox`
- `copy`
- `vacation-seconds`
- `spamtest`
- `relational`
- `date`

Base Sieve language features are not repeated in the `SIEVE` capability string merely because they are supported; this list is the optional extension profile advertised by the endpoint.

## 3. What this means

Purelymail supports a meaningful but clearly **partial** subset of the broader standardized Sieve ecosystem.

The live advertisement confirms support for body and envelope testing, mailbox filing, variables, subaddress handling, IMAP flags/keywords, copy semantics, mailbox-related operations, vacation replies, spam testing, relational/count comparisons, date matching, and numeric comparison.

For Mailchemy, these should be treated as the current direct extension surface of the Purelymail endpoint, still subject to instance-level and runtime constraints.

## 4. Important omissions

The current capability list does **not** advertise several extensions covered by the broader Sieve survey, including:

- `editheader`
- `extlists`
- `include`
- `special-use`
- `mailboxid`
- `enotify`
- `duplicate`
- regex-related support

Absence from the ManageSieve capability list means Mailchemy must not assume those semantics are directly realizable on Purelymail.

## 5. Corroborating provider evidence

Purelymail's public issue tracker corroborates several points:

- A 2026 issue reports `Unsupported extension "editheader"`, while also stating that `variables` and `subaddress` work.
- Public feature requests exist for regex support; regex is still absent from the live capability list.
- A public feature request exists for `extlists`; it is still absent from the live capability list.
- Older requests asked for `imap4flags`, but the live 2026 server now advertises it and newer issues discuss its runtime behavior.
- A request for `vacation-seconds` exists historically, but the live 2026 endpoint now advertises it.

This shows why historical issue status is useful evidence but should not replace live endpoint capability discovery.

## 6. Runtime caveats

Advertising an extension proves the server claims support for that capability. It does **not** prove every edge case or interaction is bug-free.

Purelymail's issue tracker includes a 2026 report about IMAP flags not propagating as expected across account-level and user-level Sieve processing when `fileinto` is involved.

That does not make `imap4flags` unsupported; rather, it demonstrates the distinction between:

```text
extension advertised
vs
particular semantic instance proven to behave exactly as required
```

This fits Mailchemy's existing capability-refinement model.

## 7. Account-level versus user-level Sieve

Purelymail exposes both account-level and user-level Sieve concepts. Historical and current issue reports show that interactions between those layers can have provider-specific execution effects.

Those interactions are not generic Sieve semantics and should remain endpoint-specific. Detailed ordering/state interaction belongs in the later control-flow work.

## 8. Mailchemy implication

This is a concrete validation of the architecture already documented in Mailchemy:

```text
Sieve semantic universe
    broader standardized vocabulary

Purelymail Sieve profile
    concrete advertised subset
```

A future planner should be able to report that a rule is representable in Sieve generally but not realizable on the currently connected Purelymail endpoint.

Likewise, another Sieve provider may advertise a different extension set without requiring a different global Sieve semantic vocabulary.

## 9. Current profile summary

As observed on 2026-09-24:

```text
Purelymail Sieve
├── base Sieve language
└── advertised optional capabilities
    ├── body
    ├── envelope
    ├── reject
    ├── fileinto
    ├── vacation
    ├── comparator-i;ascii-numeric
    ├── variables
    ├── subaddress
    ├── imap4flags
    ├── mailbox
    ├── copy
    ├── vacation-seconds
    ├── spamtest
    ├── relational
    └── date
```

The exact profile is **runtime-discoverable and time-varying**. Future Mailchemy code should query endpoint capabilities rather than permanently hard-code this 2026 snapshot as the definition of Purelymail.