/**
 * Aggregates the initial shared canonical fixture corpus across all initial
 * direct-realization targets into one deterministic conformance matrix.
 *
 * @remarks
 * This module does not define adapter semantics. Each target remains
 * authoritative for its own executable Direct/Unsupported classification. The
 * aggregation layer observes those classifications, routes them through the
 * generic conformance runner, and renders the resulting evidence side by side.
 *
 * @packageDocumentation
 */

import {
    createCoreCapabilityRegistry,
    type CanonicalExpression,
    type DirectRealizationTarget,
} from "@mailchemy/core";
import {
    buildConformanceMatrix,
    hasAttachmentFixtures,
    sharedRuleFixtures,
    logicalAndFixtures,
    markReadFixtures,
    renderConformanceMatrixMarkdown,
    subjectContainsFixtures,
    type CanonicalFixture,
    type TargetRealizationExpectation,
} from "@mailchemy/conformance";
import { gmailDirectRealizationTarget } from "@mailchemy/gmail";
import { outlookDirectRealizationTarget } from "@mailchemy/outlook";
import {
    purelymailSieveTarget20260924,
    sieveDirectRealizationTarget,
} from "@mailchemy/sieve";
import { thunderbirdDirectRealizationTarget } from "@mailchemy/thunderbird";
import { runTargetRealizationConformance } from "@mailchemy/conformance";

/**
 * Canonical registry used to validate the shared fixture corpus before target
 * aggregation.
 */
const registry = createCoreCapabilityRegistry();

/**
 * Shared canonical fixtures included in the initial cross-target matrix.
 *
 * @remarks
 * Invalid fixtures remain useful to package-local contract tests but are
 * filtered out before target realization because direct targets operate on
 * canonically valid semantics.
 */
const INITIAL_FIXTURES: readonly CanonicalFixture[] = Object.freeze([
    ...subjectContainsFixtures,
    ...hasAttachmentFixtures,
    ...markReadFixtures,
    ...logicalAndFixtures,
    ...sharedRuleFixtures,
]);

/**
 * Initial realization targets whose existing executable classifications are
 * presented together by the matrix.
 *
 * @remarks
 * The dated Purelymail target is intentionally a separate endpoint-refined
 * column from the base Sieve dialect target.
 */
const INITIAL_TARGETS: readonly DirectRealizationTarget[] = Object.freeze([
    sieveDirectRealizationTarget,
    purelymailSieveTarget20260924,
    gmailDirectRealizationTarget,
    outlookDirectRealizationTarget,
    thunderbirdDirectRealizationTarget,
]);

/**
 * Builds the initial deterministic cross-target conformance matrix.
 *
 * @remarks
 * Expected outcomes supplied to the generic runner are observed from each
 * target's current executable result; they are not an independent semantic
 * oracle. Regression independence is provided by the frozen matrix baseline in
 * the cross-IO tests.
 *
 * @returns Machine-readable matrix over all canonically valid shared fixtures
 * and initial targets.
 */
export function buildInitialCrossIoConformanceMatrix() {
    /** Canonically valid shared fixtures eligible for target classification. */
    const fixtures = INITIAL_FIXTURES.filter(isCanonicallyValidFixture);
    /**
     * Per-target conformance runs preserving each target's own executable
     * evidence class.
     */
    const runs = INITIAL_TARGETS.map((target) =>
        runTargetRealizationConformance(
            registry,
            target,
            fixtures.map((fixture) => ({
                fixture,
                expected: observeExpectation(target, fixture.expression),
            })),
        ),
    );

    return buildConformanceMatrix(runs);
}

/**
 * Renders the initial machine-readable cross-target matrix as deterministic
 * Markdown.
 *
 * @returns Markdown presentation derived from the current aggregate matrix.
 */
export function renderInitialCrossIoConformanceMatrixMarkdown(): string {
    return renderConformanceMatrixMarkdown(
        buildInitialCrossIoConformanceMatrix(),
    );
}

/**
 * Converts one target's current executable realization result into the
 * expectation shape consumed by the generic conformance runner.
 *
 * @remarks
 * This is observation/aggregation plumbing, not independent semantic evidence.
 * The target result remains the source of truth for this call.
 *
 * @param target Direct-realization target being aggregated.
 * @param expression Canonical expression whose current classification is read.
 * @returns Matching Direct or reason-specific Unsupported expectation.
 */
function observeExpectation(
    target: DirectRealizationTarget,
    expression: CanonicalExpression,
): TargetRealizationExpectation {
    /** Current executable realization evidence emitted by the adapter target. */
    const result = target.checkDirectRealization(expression);

    if (result.kind === "direct")
        return { kind: "direct" };

    return {
        kind: "unsupported",
        reasonCode: result.reason.code,
    };
}

/**
 * Narrows the shared fixture union to target-eligible canonical expressions.
 *
 * @param fixture Shared conformance fixture.
 * @returns Whether the fixture is declared canonically valid.
 */
function isCanonicallyValidFixture(
    fixture: CanonicalFixture,
): fixture is CanonicalFixture<CanonicalExpression> {
    return fixture.expectedValidation === "valid";
}
