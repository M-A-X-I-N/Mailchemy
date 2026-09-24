import type { CapabilityId } from "@mailchemy/core";

export type ExpectedCanonicalValidation = "valid" | "invalid";

export interface CanonicalFixtureDefinition<TExpression = unknown> {
    readonly id: string;
    readonly capabilities: readonly CapabilityId[];
    readonly expression: TExpression;
    readonly expectedValidation: ExpectedCanonicalValidation;
    readonly oracle?: Readonly<Record<string, unknown>>;
    readonly notes?: string;
    readonly references?: readonly string[];
}

export interface CanonicalFixture<TExpression = unknown> {
    readonly id: string;
    readonly capabilities: readonly CapabilityId[];
    readonly expression: TExpression;
    readonly expectedValidation: ExpectedCanonicalValidation;
    readonly oracle?: Readonly<Record<string, unknown>>;
    readonly notes?: string;
    readonly references: readonly string[];
}

export class InvalidCanonicalFixtureError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = "InvalidCanonicalFixtureError";
    }
}

export function defineCanonicalFixture<TExpression>(
    definition: CanonicalFixtureDefinition<TExpression>,
): CanonicalFixture<TExpression> {
    const id = definition.id.trim();

    if (id.length === 0) {
        throw new InvalidCanonicalFixtureError("Fixture ID must not be empty.");
    }

    if (definition.capabilities.length === 0) {
        throw new InvalidCanonicalFixtureError(
            "Fixture must identify at least one exercised capability.",
        );
    }

    const uniqueCapabilities = new Set(definition.capabilities);

    if (uniqueCapabilities.size !== definition.capabilities.length) {
        throw new InvalidCanonicalFixtureError(
            "Fixture capability list must not contain duplicates.",
        );
    }

    const notes = definition.notes?.trim();

    if (definition.notes !== undefined && notes?.length === 0) {
        throw new InvalidCanonicalFixtureError(
            "Fixture notes must not be empty when provided.",
        );
    }

    const references = [...(definition.references ?? [])];

    if (references.some((reference) => reference.trim().length === 0)) {
        throw new InvalidCanonicalFixtureError(
            "Fixture references must not contain empty entries.",
        );
    }

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
