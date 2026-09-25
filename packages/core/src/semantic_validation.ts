/**
 * Validates unknown runtime values against the registered canonical semantic
 * expression model, including capability roles, parameter contracts, structure,
 * arity, paths, and cycle safety.
 *
 * @remarks
 * This module proves canonical well-formedness before realization/codec logic
 * consumes an expression. It does not decide whether a target can realize the
 * valid semantics.
 *
 * @packageDocumentation
 */

import { parseCapabilityId } from "./capability_id.js";
import type { CapabilityRole } from "./capability_contract.js";
import type { CapabilityRegistry } from "./capability_registry.js";
import type {
    ActionExpression,
    CanonicalExpression,
    ConditionExpression,
    RuleExpression,
} from "./expression.js";
import type { CapabilityInstance } from "./capability_instance.js";
import {
    invalid,
    valid,
    validationIssue,
    type ValidationIssue,
    type ValidationPathSegment,
    type ValidationResult,
} from "./validation.js";

/**
 * Object shape accepted by structural validators before individual fields are
 * narrowed to canonical expression contracts.
 */
type UnknownRecord = Record<string, unknown>;

/**
 * Narrows an unknown value to a non-null, non-array object record.
 *
 * @param value Runtime candidate to inspect.
 * @returns Whether the value can be traversed as an object-shaped semantic node.
 */
function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Prefixes nested validation issues with the structural path used to reach the
 * nested validator.
 *
 * @param prefix Path segments preceding the nested validation boundary.
 * @param issues Issues whose existing paths are relative to that boundary.
 * @returns Fresh issues with immutable prefixed paths.
 */
function prefixedIssues(
    prefix: readonly ValidationPathSegment[],
    issues: readonly ValidationIssue[],
): ValidationIssue[] {
    return issues.map((issue) =>
        validationIssue(issue.code, issue.message, [...prefix, ...issue.path]),
    );
}

/**
 * Constructs a structural-shape validation issue using the shared canonical
 * semantic error code.
 *
 * @param path Location of the malformed structure.
 * @param message Human-readable explanation of the expected shape.
 * @returns Structured semantic.invalid-shape issue.
 */
function shapeIssue(
    path: readonly ValidationPathSegment[],
    message: string,
): ValidationIssue {
    return validationIssue("semantic.invalid-shape", message, path);
}

/**
 * Collects validation issues for one capability instance and optionally proves
 * that its registered capability role matches the surrounding expression role.
 *
 * @param registry Registry that owns capability metadata and parameter
 * validation.
 * @param value Unknown candidate instance.
 * @param expectedRole Required structural role, or undefined when validating a
 * instance independently of an enclosing expression.
 * @param path Structural path to the candidate instance.
 * @returns All identity, registration, role, and parameter issues found.
 */
function collectCapabilityInstanceIssues(
    registry: CapabilityRegistry,
    value: unknown,
    expectedRole: CapabilityRole | undefined,
    path: readonly ValidationPathSegment[],
): ValidationIssue[] {
    if (!isRecord(value) || value.kind !== "capability") {
        return [
            shapeIssue(
                path,
                'Expected a capability instance with kind "capability".',
            ),
        ];
    }

    if (typeof value.capabilityId !== "string") {
        return [
            shapeIssue(
                [...path, "capabilityId"],
                "Expected capabilityId to be a string.",
            ),
        ];
    }

    /** Canonical capability identity parsed from the untrusted instance field. */
    let capabilityId;

    try {
        capabilityId = parseCapabilityId(value.capabilityId);
    } catch {
        return [
            validationIssue(
                "capability.invalid-id",
                "Capability ID is not canonical.",
                [...path, "capabilityId"],
            ),
        ];
    }

    /** Registered semantic contract that gives this identity runtime meaning. */
    const contract = registry.get(capabilityId);

    if (contract === undefined) {
        return [
            validationIssue(
                "capability.unregistered",
                `Capability "${capabilityId}" is not registered.`,
                [...path, "capabilityId"],
            ),
        ];
    }

    /** Accumulated non-fatal issues so role and parameter failures can coexist. */
    const issues: ValidationIssue[] = [];

    if (expectedRole !== undefined && contract.role !== expectedRole) {
        issues.push(
            validationIssue(
                "capability.role-mismatch",
                `Expected a ${expectedRole} capability but "${capabilityId}" is registered as ${contract.role}.`,
                [...path, "capabilityId"],
            ),
        );
    }

    if (!("parameters" in value)) {
        issues.push(
            shapeIssue(
                [...path, "parameters"],
                "Capability instance is missing parameters.",
            ),
        );
        return issues;
    }

    /** Contract-owned validation/canonicalization result for instance parameters. */
    const parameterValidation = contract.validateParameters(value.parameters);

    if (!parameterValidation.ok) {
        issues.push(
            ...prefixedIssues(
                [...path, "parameters"],
                parameterValidation.issues,
            ),
        );
    }

    return issues;
}

/**
 * Recursively validates a canonical condition expression while preserving issue
 * paths and detecting cycles on the active traversal branch.
 *
 * @remarks
 * The recursion stack tracks only objects currently being traversed. Removing a
 * node in finally means shared object references in separate completed branches
 * are not incorrectly reported as cycles.
 *
 * @param registry Registry that owns capability validation and role metadata.
 * @param value Unknown condition candidate.
 * @param path Structural path to this condition node.
 * @param stack Objects currently active in the recursive traversal.
 * @returns All issues found in this condition subtree.
 */
function collectConditionIssues(
    registry: CapabilityRegistry,
    value: unknown,
    path: readonly ValidationPathSegment[],
    stack: Set<object>,
): ValidationIssue[] {
    if (!isRecord(value))
        return [shapeIssue(path, "Expected a condition expression object.")];

    if (stack.has(value)) {
        return [
            validationIssue(
                "semantic.cycle",
                "Canonical expression contains a cycle.",
                path,
            ),
        ];
    }

    stack.add(value);

    try {
        if (value.kind === "condition") {
            return collectCapabilityInstanceIssues(
                registry,
                value.instance,
                "condition",
                [...path, "instance"],
            );
        }

        if (value.kind === "and") {
            /** Issues contributed by the conjunction operator and its operands. */
            const issues = collectCapabilityInstanceIssues(
                registry,
                value.operator,
                "logic",
                [...path, "operator"],
            );

            if (!Array.isArray(value.operands)) {
                issues.push(
                    shapeIssue(
                        [...path, "operands"],
                        "Expected AND operands to be an array.",
                    ),
                );
                return issues;
            }

            if (value.operands.length < 2) {
                issues.push(
                    validationIssue(
                        "semantic.and.arity",
                        "AND expressions require at least two condition operands.",
                        [...path, "operands"],
                    ),
                );
            }

            for (const [index, operand] of value.operands.entries()) {
                issues.push(
                    ...collectConditionIssues(
                        registry,
                        operand,
                        [...path, "operands", index],
                        stack,
                    ),
                );
            }

            return issues;
        }

        return [
            validationIssue(
                "semantic.invalid-kind",
                "Expected a condition or AND expression.",
                [...path, "kind"],
            ),
        ];
    } finally {
        stack.delete(value);
    }
}

/**
 * Recursively validates one canonical action expression with role-aware
 * capability validation and active-branch cycle detection.
 *
 * @param registry Registry that owns capability validation and role metadata.
 * @param value Unknown action candidate.
 * @param path Structural path to this action node.
 * @param stack Objects currently active in the recursive traversal.
 * @returns All issues found in this action subtree.
 */
function collectActionIssues(
    registry: CapabilityRegistry,
    value: unknown,
    path: readonly ValidationPathSegment[],
    stack: Set<object>,
): ValidationIssue[] {
    if (!isRecord(value))
        return [shapeIssue(path, "Expected an action expression object.")];

    if (stack.has(value)) {
        return [
            validationIssue(
                "semantic.cycle",
                "Canonical expression contains a cycle.",
                path,
            ),
        ];
    }

    stack.add(value);

    try {
        if (value.kind !== "action") {
            return [
                validationIssue(
                    "semantic.invalid-kind",
                    "Expected an action expression.",
                    [...path, "kind"],
                ),
            ];
        }

        return collectCapabilityInstanceIssues(registry, value.instance, "action", [
            ...path,
            "instance",
        ]);
    } finally {
        stack.delete(value);
    }
}

/**
 * Recursively validates a rule-shaped canonical structure by validating its
 * condition and every action under one shared active-branch cycle stack.
 *
 * @param registry Registry that owns capability validation and role metadata.
 * @param value Object-shaped rule candidate.
 * @param path Structural path to this rule node.
 * @param stack Objects currently active in the recursive traversal.
 * @returns All structural/capability issues found in the rule.
 */
function collectRuleIssues(
    registry: CapabilityRegistry,
    value: UnknownRecord,
    path: readonly ValidationPathSegment[],
    stack: Set<object>,
): ValidationIssue[] {
    if (stack.has(value)) {
        return [
            validationIssue(
                "semantic.cycle",
                "Canonical expression contains a cycle.",
                path,
            ),
        ];
    }

    stack.add(value);

    try {
        /** Issues from the rule condition plus any subsequently visited actions. */
        const issues = collectConditionIssues(
            registry,
            value.condition,
            [...path, "condition"],
            stack,
        );

        if (!Array.isArray(value.actions)) {
            issues.push(
                shapeIssue(
                    [...path, "actions"],
                    "Expected rule actions to be an array.",
                ),
            );
            return issues;
        }

        for (const [index, action] of value.actions.entries()) {
            issues.push(
                ...collectActionIssues(
                    registry,
                    action,
                    [...path, "actions", index],
                    stack,
                ),
            );
        }

        return issues;
    } finally {
        stack.delete(value);
    }
}

/**
 * Validates an unknown capability instance against registry identity,
 * registration, role, and parameter contracts.
 *
 * @param registry Registry containing the semantic contract vocabulary.
 * @param value Unknown instance candidate.
 * @param expectedRole Optional structural role required by the caller.
 * @returns The original instance value typed as canonical when no issues are
 * found, otherwise structured validation issues.
 */
export function validateCapabilityInstance(
    registry: CapabilityRegistry,
    value: unknown,
    expectedRole?: CapabilityRole,
): ValidationResult<CapabilityInstance> {
    /** Complete issue set produced by instance validation at the root path. */
    const issues = collectCapabilityInstanceIssues(registry, value, expectedRole, []);

    if (issues.length > 0)
        return invalid(...issues);

    return valid(value as CapabilityInstance);
}

/**
 * Validates an unknown canonical expression recursively before it crosses into
 * realization, codec, or conformance logic.
 *
 * @remarks
 * Validation proves shape, registered capability meaning, role placement,
 * parameter validity, conjunction arity, and acyclic structure. It does not
 * establish target support or native exactness.
 *
 * @param registry Registry containing the canonical semantic vocabulary.
 * @param value Unknown canonical-expression candidate.
 * @returns The original expression typed as canonical when every invariant
 * holds, otherwise all discovered structured validation issues.
 */
export function validateCanonicalExpression(
    registry: CapabilityRegistry,
    value: unknown,
): ValidationResult<CanonicalExpression> {
    /**
     * Original unknown reference retained so successful validation returns the
     * caller's expression rather than rebuilding/canonicalizing structure.
     */
    const originalValue: unknown = value;

    if (!isRecord(value)) {
        return invalid(
            shapeIssue([], "Expected a canonical expression object."),
        );
    }

    /** Active recursion stack used solely for cycle detection. */
    const stack = new Set<object>();

    /** Root issue collection selected by the expression discriminator. */
    let issues: ValidationIssue[];

    if (value.kind === "condition" || value.kind === "and")
        issues = collectConditionIssues(registry, value, [], stack);
    else if (value.kind === "action")
        issues = collectActionIssues(registry, value, [], stack);
    else if (value.kind === "rule")
        issues = collectRuleIssues(registry, value, [], stack);
    else {
        issues = [
            validationIssue(
                "semantic.invalid-kind",
                "Unknown canonical expression kind.",
                ["kind"],
            ),
        ];
    }

    if (issues.length > 0)
        return invalid(...issues);

    return valid(originalValue as CanonicalExpression);
}

/**
 * Re-exports canonical expression subtypes commonly consumed alongside the
 * validation entry points.
 */
export type { ActionExpression, ConditionExpression, RuleExpression };
