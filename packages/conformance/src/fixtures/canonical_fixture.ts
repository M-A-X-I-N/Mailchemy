/**
 * Defines normalized canonical conformance-fixture envelopes used as reusable
 * semantic evidence across contract, target, codec, and cross-IO tests.
 *
 * @remarks
 * A fixture records a canonical expression plus expected validation/evaluation
 * evidence. Merely naming a capability in a fixture does not claim that any
 * native target can realize that semantic.
 *
 * @packageDocumentation
 */

import type { CapabilityId } from "@mailchemy/core";

/**
 * Expected outcome of validating a fixture expression against the canonical
 * semantic model.
 */
export type ExpectedCanonicalValidation = "valid" | "invalid";

/**
 * Caller-owned authoring shape for one canonical conformance fixture.
 *
 * @typeParam TExpression Expression/value shape retained by the fixture.
 */
export interface CanonicalFixtureDefinition<TExpression = unknown> {
    /** Stable human-readable identity of the evidence case. */
    readonly id: string;

    /**
     * Semantic capability contracts intentionally exercised by this fixture.
     *
     * @remarks
     * This drives contract coverage accounting; it is not a target-support list.
     */
    readonly capabilities: readonly CapabilityId[];

    /** Canonical expression candidate or deliberately malformed value under test. */
    readonly expression: TExpression;

    /** Validation outcome the canonical semantic model is expected to produce. */
    readonly expectedValidation: ExpectedCanonicalValidation;

    /**
     * Optional oracle metadata whose top-level record is snapshotted/frozen by
     * fixture construction; nested values remain the fixture author's responsibility.
     */
    readonly oracle?: Readonly<Record<string, unknown>>;

    /** Optional explanatory note describing the boundary exercised by the case. */
    readonly notes?: string;

    /** Durable semantic/research references supporting the fixture expectation. */
    readonly references?: readonly string[];
}

/**
 * Immutable normalized representation of one canonical conformance fixture.
 *
 * @typeParam TExpression Expression/value shape retained by the fixture.
 */
export interface CanonicalFixture<TExpression = unknown> {
    /** Stable normalized fixture identity. */
    readonly id: string;

    /** Frozen set of distinct semantic contracts this fixture exercises. */
    readonly capabilities: readonly CapabilityId[];

    /**
     * Canonical expression candidate or deliberately malformed evidence value,
     * retained as supplied rather than recursively frozen by the fixture wrapper.
     */
    readonly expression: TExpression;

    /** Canonical validation outcome expected for the expression. */
    readonly expectedValidation: ExpectedCanonicalValidation;

    /** Optional frozen semantic-oracle metadata. */
    readonly oracle?: Readonly<Record<string, unknown>>;

    /** Optional normalized explanatory note. */
    readonly notes?: string;

    /** Frozen durable references supporting the case. */
    readonly references: readonly string[];
}

/**
 * Reports ambiguous or invalid metadata while defining canonical fixture
 * evidence.
 */
export class InvalidCanonicalFixtureError extends Error {
    /**
     * Creates a fixture-definition diagnostic.
     *
     * @param message Human-readable fixture metadata failure.
     */
    public constructor(message: string) {
        super(message);
        this.name = "InvalidCanonicalFixtureError";
    }
}

/**
 * Validates fixture metadata and snapshots mutable caller-owned collections.
 *
 * @typeParam TExpression Expression/value shape retained by the fixture.
 * @param definition Fixture evidence definition to normalize.
 * @returns Frozen fixture with snapshotted capability/reference/oracle metadata.
 * @throws InvalidCanonicalFixtureError When identity/capability/reference/note
 * metadata would make the evidence ambiguous.
 */
export function defineCanonicalFixture<TExpression>(
    definition: CanonicalFixtureDefinition<TExpression>,
): CanonicalFixture<TExpression> {
    /** Whitespace-normalized stable fixture identity. */
    const id = definition.id.trim();

    if (id.length === 0)
        throw new InvalidCanonicalFixtureError("Fixture ID must not be empty.");

    if (definition.capabilities.length === 0) {
        throw new InvalidCanonicalFixtureError(
            "Fixture must identify at least one exercised capability.",
        );
    }

    /** Deduplication view used to reject inflated/ambiguous coverage metadata. */
    const uniqueCapabilities = new Set(definition.capabilities);

    if (uniqueCapabilities.size !== definition.capabilities.length) {
        throw new InvalidCanonicalFixtureError(
            "Fixture capability list must not contain duplicates.",
        );
    }

    /** Normalized optional human-facing fixture note. */
    const notes = definition.notes?.trim();

    if (definition.notes !== undefined && notes?.length === 0) {
        throw new InvalidCanonicalFixtureError(
            "Fixture notes must not be empty when provided.",
        );
    }

    /** Snapshot of durable reference strings supplied by the caller. */
    const references = [...(definition.references ?? [])];

    if (references.some((reference) => reference.trim().length === 0)) {
        throw new InvalidCanonicalFixtureError(
            "Fixture references must not contain empty entries.",
        );
    }

    /** Normalized immutable fixture returned to every harness layer. */
    const fixture = {
        id,
        capabilities: Object.freeze([...definition.capabilities]),
        expression: definition.expression,
        expectedValidation: definition.expectedValidation,
        ...(definition.oracle === undefined
            ? {}
            : { oracle: Object.freeze({ ...definition.oracle }) }),
        ...(notes === undefined ? {} : { notes }),
        references: Object.freeze(references),
    } satisfies CanonicalFixture<TExpression>;

    return Object.freeze(fixture);
}
