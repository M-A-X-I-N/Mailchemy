import {
    createCoreCapabilityRegistry,
    type CanonicalExpression,
    type DirectRealizationTarget,
} from "@mailchemy/core";
import {
    buildConformanceMatrix,
    hasAttachmentFixtures,
    initialRuleFixtures,
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

const registry = createCoreCapabilityRegistry();

const INITIAL_FIXTURES: readonly CanonicalFixture[] = Object.freeze([
    ...subjectContainsFixtures,
    ...hasAttachmentFixtures,
    ...markReadFixtures,
    ...logicalAndFixtures,
    ...initialRuleFixtures,
]);

const INITIAL_TARGETS: readonly DirectRealizationTarget[] = Object.freeze([
    sieveDirectRealizationTarget,
    purelymailSieveTarget20260924,
    gmailDirectRealizationTarget,
    outlookDirectRealizationTarget,
    thunderbirdDirectRealizationTarget,
]);

export function buildInitialCrossIoConformanceMatrix() {
    const fixtures = INITIAL_FIXTURES.filter(isCanonicallyValidFixture);
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

export function renderInitialCrossIoConformanceMatrixMarkdown(): string {
    return renderConformanceMatrixMarkdown(
        buildInitialCrossIoConformanceMatrix(),
    );
}

function observeExpectation(
    target: DirectRealizationTarget,
    expression: CanonicalExpression,
): TargetRealizationExpectation {
    const result = target.checkDirectRealization(expression);

    if (result.kind === "direct")
        return { kind: "direct" };

    return {
        kind: "unsupported",
        reasonCode: result.reason.code,
    };
}

function isCanonicallyValidFixture(
    fixture: CanonicalFixture,
): fixture is CanonicalFixture<CanonicalExpression> {
    return fixture.expectedValidation === "valid";
}
