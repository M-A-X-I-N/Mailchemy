# Sieve control-flow investigation

## 1. Scope and execution context

This investigation covers standardized Sieve execution semantics relevant to Mailchemy, with Purelymail-specific behavior called out separately where evidence exists.

The baseline is RFC 5228 plus the Variables, Copy, Include, Imap4flags, Editheader, and Reject extensions where those extensions materially affect observable execution.

Sieve is primarily a delivery-time scripting language. Its native unit is one executing script, potentially including other scripts when the `include` extension is available.

Purelymail does **not** currently advertise `include` or `editheader`, so those semantics belong to the general Sieve dialect but not the current Purelymail endpoint profile.

## 2. Evidence baseline

Primary sources:

- **Normative:** RFC 5228 — https://www.rfc-editor.org/rfc/rfc5228.html
- **Normative:** RFC 5229 (Variables) — https://www.rfc-editor.org/rfc/rfc5229.html
- **Normative:** RFC 3894 (Copy) — https://www.rfc-editor.org/rfc/rfc3894.html
- **Normative:** RFC 6609 (Include/Return) — https://www.rfc-editor.org/rfc/rfc6609.html
- **Normative:** RFC 5232 (Imap4flags) — https://www.rfc-editor.org/rfc/rfc5232.html
- **Normative:** RFC 5293 (Editheader) — https://www.rfc-editor.org/rfc/rfc5293.html
- **Normative:** RFC 5429 (Reject/Ereject) — https://www.rfc-editor.org/rfc/rfc5429.html
- **Observed/provider issue evidence:** Purelymail public issue tracker.

## 3. Rule ordering and continuation

### 3.1 One script is an ordered control program

Base Sieve executes commands through ordinary script/control structure: sequential commands plus `if` / `elsif` / `else` blocks.

There is no separate unordered collection of independent rules inside the base language. A GUI may present filters as rows, but once represented as Sieve their control relationship is whatever script structure the generator emits.

### 3.2 `stop` ends the whole Sieve execution

RFC 5228 defines `stop` as ending **all processing**. If implicit keep remains uncancelled, that keep is then taken.

Conceptually:

```text
action A
stop
action B

=> A may already matter
=> B is never processed
=> implicit keep happens only if still uncancelled
```

`stop` therefore has script-wide scope, not merely 'stop this rule row'.

### 3.3 `return` is narrower than `stop`

With RFC 6609 `include`, `return` stops only the **immediately included script** and returns control to the including script.

When `return` appears in the main script it has the same effect as `stop`.

This proves that future Mailchemy control-flow semantics cannot model every stop-like construct as one undifferentiated terminal node.

### 3.4 Purelymail does not currently advertise `include`

The current Purelymail ManageSieve capability profile does not advertise `include`, so `return`/nested-script semantics are part of general Sieve decoding but not a direct current Purelymail target capability.

## 4. Condition evaluation and short-circuiting

### 4.1 Base boolean truth is structural

`allof`, `anyof`, and `not` determine which branch executes.

### 4.2 Variables make evaluation order observable

RFC 5229 requires interpreters using the Variables extension to:

- short-circuit tests;
- evaluate test lists left-to-right;
- avoid evaluating tests once the result is already known.

This matters because successful match operations can populate match variables such as `${1}`.

Therefore:

```text
anyof(match A, match B)
```

is not semantically interchangeable with an implementation that freely evaluates B before A when match-variable state is later observed.

Purelymail currently advertises `variables`, so this is relevant to the concrete initial endpoint.

## 5. Action ordering

### 5.1 Source order does not imply transactional execution order

Sieve scripts are written sequentially, but RFC 5228 deliberately allows implementation strategies ranging from:

- parse/evaluate first and then perform actions, potentially atomically;
- through parse-and-run execution where earlier actions may already have happened when a later runtime error occurs.

So Mailchemy must distinguish:

```text
semantic sequence / state changes
from
physical commit timing of delivery side effects
```

### 5.2 Action compatibility is part of each action contract

RFC 5228 requires extensions defining actions to specify how they interact with existing actions and with implicit keep.

Thus action combination semantics are not a generic 'execute list in order' rule.

### 5.3 Discard is not an immediate stop

Base `discard` cancels implicit keep but is compatible with other base actions. RFC 5228 explicitly says other actions still happen; `fileinto + discard` is equivalent to `fileinto`.

That means:

```text
discard;
fileinto "Archive";
```

is **not** semantically 'drop message and never perform the fileinto'.

This is an important counterexample to treating destructive actions as automatically terminal.

### 5.4 Explicit keep cannot be undone like implicit keep

RFC 3894 explains why `fileinto; keep; ... discard` differs from copy semantics: once the explicit `keep` has been requested, a later `discard` cannot retroactively remove that explicit delivery.

The implicit-keep state is therefore its own piece of execution state.

## 6. State mutation visibility

### 6.1 Variables are immediately visible

`set` and match-variable effects are available to later commands according to RFC 5229.

### 6.2 IMAP flag variables are stateful within a script

RFC 5232 defines an internal flag variable initially empty for each script execution.

`setflag`, `addflag`, and `removeflag` mutate that flag-set state, and later `hasflag`, `keep`, `fileinto`, or implicit keep use the current value.

Multiple flag mutations therefore have observable order.

### 6.3 Header mutation is immediately visible when `editheader` exists

RFC 5293 requires later header tests/actions to see headers as modified by earlier `addheader`/`deleteheader` actions.

This creates a strong trace-sensitive semantic:

```text
addheader X-Hello: World
if header X-Hello contains World -> true
```

even if the original message did not contain the header.

Purelymail currently does not advertise `editheader`, but a general Sieve codec may encounter it from other endpoints/files.

### 6.4 Included scripts share message mutations

RFC 6609 says an included script sees header mutations made before inclusion, and the including script sees mutations made by the included script after return.

## 7. Move/file/copy semantics

### 7.1 `fileinto` cancels implicit keep

A normal `fileinto` requests delivery to the selected mailbox and cancels the default implicit Inbox keep.

It does not itself behave like `stop`; later script commands may still execute.

### 7.2 `:copy` deliberately preserves implicit keep

RFC 3894 adds `:copy` to `fileinto` and `redirect` so the action produces an extra copy/redirect without cancelling implicit keep.

This is observably different from adding an explicit `keep`, because later processing may still cancel the implicit keep.

Therefore:

```text
fileinto :copy "Archive";
...later discard...
```

can produce only the archived copy, whereas:

```text
fileinto "Archive";
keep;
...later discard...
```

still retains the explicit keep.

### 7.3 Duplicate delivery suppression can affect flags

RFC 5232 says that when duplicate mailbox delivery is suppressed for repeated `keep`/`fileinto`, the **last** applicable flag-list value wins.

Thus seemingly redundant delivery actions can still influence final state.

## 8. Reject, discard, and delivery refusal

### 8.1 `discard` accepts then silently drops

`discard` cancels implicit keep but is compatible with other actions and produces no non-delivery notification.

### 8.2 `reject` / `ereject` refuse delivery

RFC 5429 defines rejection as cancelling implicit keep and refusing delivery.

At most one reject may execute in a script. Reject is incompatible with vacation, and combining reject with ordinary delivery actions is explicitly not recommended because it can both deliver and tell the sender delivery failed.

### 8.3 Reject does not equal script stop

The rejection action controls delivery result, but the RFC models compatibility separately from `stop`.

A generator should not assume 'reject' and 'stop' are synonymous control-flow nodes.

## 9. Redirect and external side effects

### 9.1 Redirect cancels implicit keep unless `:copy` is used

Base `redirect` requests redelivery to another envelope recipient and cancels implicit keep.

`redirect :copy` preserves implicit keep.

### 9.2 Multiple redirects may be combined by the implementation

RFC 5228 permits an implementation to combine separate redirects for one message into one submission with multiple envelope recipients.

The resulting forwarding transport mechanics are therefore not guaranteed to mirror source-statement granularity.

### 9.3 Redirect is not MUA-style forward

Sieve redirect resubmits the message rather than composing a new wrapper message.

## 10. Default / implicit delivery

Implicit keep is central execution state, not merely a fallback UI behavior.

It occurs when no action has cancelled it.

Base actions that cancel implicit keep include:

- `keep`;
- `fileinto`;
- `redirect`;
- `discard`.

Extensions may define actions that do not cancel it.

`stop` does not itself cancel implicit keep; stopping with no cancelling action still results in implicit keep.

On error, RFC 5228 also requires an implicit keep after notifying the user and reporting which actions, if any, already occurred.

## 11. Errors and partial execution

### 11.1 All processing stops on error

RFC 5228 requires Sieve processing to stop when an error occurs.

### 11.2 Atomicity is explicitly implementation-dependent

The RFC permits both:

- implementations that evaluate then commit actions atomically;
- implementations where some actions occur before a later failure.

On error, the implementation must notify the user which actions, if any, occurred and perform implicit keep.

Therefore Mailchemy cannot promise rollback semantics merely because the source is Sieve.

### 11.3 Runtime checks may be path-dependent

Implementations must perform syntax/semantic/runtime checks on code actually executed, but may or may not check unreachable code.

Thus a script can contain a runtime-invalid path that does not fail until that path is reached.

## 12. Purelymail-specific execution caveats

### 12.1 Two provider processing layers exist

Purelymail exposes account-level and user-level Sieve processing.

Public issue reports show behavior that cannot be inferred from generic Sieve alone.

### 12.2 Account/user layers do not share the Imap4flags internal variable

A 2026 Purelymail issue reports that a flag set in the account-level script is not visible through `hasflag` in the user script and is lost when the user script performs its own `fileinto`.

That is consistent with each script execution having a fresh RFC 5232 internal flag variable, but Purelymail can still carry a previously set flag through implicit delivery in ways that make the boundary externally visible.

### 12.3 Historical duplicate-delivery report

A public Purelymail issue reported account-level and user-level scripts producing both the user `fileinto` result and an Inbox copy, suggesting provider-layer interaction around implicit keep.

This issue evidence is not strong enough to define a permanent Purelymail contract, but it proves the two-layer pipeline must be investigated/tested rather than modeled as simple textual concatenation.

### 12.4 Spam-header timing can differ from script timing

A 2026 Purelymail issue notes that SpamAssassin headers may not yet be available when a Sieve script runs.

That means trigger stage/provider preprocessing can affect which apparent message state predicates are valid.

## 13. Manual / alternate trigger behavior

Base Sieve is delivery-time execution.

Other extensions such as IMAPSieve can create alternate triggers, but Purelymail did not advertise such capabilities in the current profile.

The initial Purelymail path should therefore not assume Thunderbird-style manual reruns or post-delivery re-filtering semantics.

## 14. Transformation and equivalence hazards

### 14.1 Splitting one Sieve block into independent rules can change semantics

Unsafe when:

- variables or match variables carry state;
- header edits affect later tests;
- implicit keep cancellation depends on later actions;
- `stop` scope changes;
- the target re-evaluates conditions after state mutation.

### 14.2 Replacing `:copy` with explicit keep is not generally exact

RFC 3894 provides a direct counterexample: later discard can cancel implicit keep preserved by `:copy`, but cannot cancel an already explicit `keep`.

### 14.3 Treating discard/delete as terminal is wrong

`discard` cancels implicit keep but compatible actions still happen.

### 14.4 Treating source action order as rollback order is wrong

Sieve allows partial side effects on runtime failure.

## 15. Minimal scenario results

| Scenario | Sieve result |
| --- | --- |
| Two matching `if` blocks | both may execute sequentially unless control flow prevents it |
| `stop` after first block | all remaining script processing ends |
| `return` inside included script | only included script ends; caller continues |
| set flag then later `hasflag` | later test sees mutated internal flag state |
| `fileinto` then later command | later command still executes unless stopped/error |
| `fileinto :copy` then discard | copy remains; implicit keep can be cancelled |
| explicit keep then later discard | explicit keep remains |
| discard plus fileinto | fileinto still occurs |
| runtime error after prior action | prior action may or may not already have committed; implementation-dependent |
| edit header then test header | later test sees edited header when extension supported |

## 16. Unresolved questions

1. Exact Purelymail account-level → user-level processing contract and implicit-keep handoff.
2. Whether Purelymail performs Sieve delivery actions atomically or can expose partial side effects on runtime failures.
3. Exact ordering of Purelymail spam classification/header injection relative to account-level and user-level Sieve.
4. Site-policy action compatibility and redirect limits on Purelymail.
5. Whether any provider-specific Sieve actions/extensions alter the generic control-flow model.

## 17. Control-flow summary

Sieve is a genuinely stateful sequential scripting model, but not a naïve 'run each action immediately in source order' machine.

Key semantics are:

- script-wide `stop`;
- included-script-local `return`;
- observable left-to-right short-circuiting when variables are enabled;
- mutable script state (variables, flags, and with extensions message headers);
- independent implicit-keep state;
- delivery actions that cancel or deliberately preserve implicit keep;
- non-terminal `discard` interaction with other actions;
- implementation-dependent atomicity on failure.

For Mailchemy, the largest consequence is that converting Sieve into a flat collection of independent provider rules can be exact only for a restricted subset whose state and control dependencies are proven absent.