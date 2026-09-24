import { parseCapabilityId } from "./capability-id.js";
import type { CapabilityRole } from "./capability-contract.js";
import type { CapabilityRegistry } from "./capability-registry.js";
import type {
  ActionExpression,
  CanonicalExpression,
  ConditionExpression,
  RuleExpression,
} from "./expression.js";
import type { CapabilitySpecimen } from "./semantic-specimen.js";
import {
  invalid,
  valid,
  validationIssue,
  type ValidationIssue,
  type ValidationPathSegment,
  type ValidationResult,
} from "./validation.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function prefixedIssues(
  prefix: readonly ValidationPathSegment[],
  issues: readonly ValidationIssue[],
): ValidationIssue[] {
  return issues.map((issue) =>
    validationIssue(issue.code, issue.message, [...prefix, ...issue.path]),
  );
}

function shapeIssue(
  path: readonly ValidationPathSegment[],
  message: string,
): ValidationIssue {
  return validationIssue("semantic.invalid-shape", message, path);
}

function collectSpecimenIssues(
  registry: CapabilityRegistry,
  value: unknown,
  expectedRole: CapabilityRole | undefined,
  path: readonly ValidationPathSegment[],
): ValidationIssue[] {
  if (!isRecord(value) || value.kind !== "capability") {
    return [
      shapeIssue(
        path,
        'Expected a capability specimen with kind "capability".',
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
        "Capability specimen is missing parameters.",
      ),
    );
    return issues;
  }

  const parameterValidation = contract.validateParameters(value.parameters);

  if (!parameterValidation.ok) {
    issues.push(
      ...prefixedIssues([...path, "parameters"], parameterValidation.issues),
    );
  }

  return issues;
}

function collectConditionIssues(
  registry: CapabilityRegistry,
  value: unknown,
  path: readonly ValidationPathSegment[],
  stack: Set<object>,
): ValidationIssue[] {
  if (!isRecord(value)) {
    return [shapeIssue(path, "Expected a condition expression object.")];
  }

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
      return collectSpecimenIssues(registry, value.specimen, "condition", [
        ...path,
        "specimen",
      ]);
    }

    if (value.kind === "and") {
      const issues = collectSpecimenIssues(registry, value.operator, "logic", [
        ...path,
        "operator",
      ]);

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

function collectActionIssues(
  registry: CapabilityRegistry,
  value: unknown,
  path: readonly ValidationPathSegment[],
  stack: Set<object>,
): ValidationIssue[] {
  if (!isRecord(value)) {
    return [shapeIssue(path, "Expected an action expression object.")];
  }

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

    return collectSpecimenIssues(registry, value.specimen, "action", [
      ...path,
      "specimen",
    ]);
  } finally {
    stack.delete(value);
  }
}

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

export function validateCapabilitySpecimen(
  registry: CapabilityRegistry,
  value: unknown,
  expectedRole?: CapabilityRole,
): ValidationResult<CapabilitySpecimen> {
  const issues = collectSpecimenIssues(registry, value, expectedRole, []);

  if (issues.length > 0) {
    return invalid(...issues);
  }

  return valid(value as CapabilitySpecimen);
}

export function validateCanonicalExpression(
  registry: CapabilityRegistry,
  value: unknown,
): ValidationResult<CanonicalExpression> {
  const originalValue: unknown = value;

  if (!isRecord(value)) {
    return invalid(shapeIssue([], "Expected a canonical expression object."));
  }

  const stack = new Set<object>();
  let issues: ValidationIssue[];

  if (value.kind === "condition" || value.kind === "and") {
    issues = collectConditionIssues(registry, value, [], stack);
  } else if (value.kind === "action") {
    issues = collectActionIssues(registry, value, [], stack);
  } else if (value.kind === "rule") {
    issues = collectRuleIssues(registry, value, [], stack);
  } else {
    issues = [
      validationIssue(
        "semantic.invalid-kind",
        "Unknown canonical expression kind.",
        ["kind"],
      ),
    ];
  }

  if (issues.length > 0) {
    return invalid(...issues);
  }

  return valid(originalValue as CanonicalExpression);
}

export type { ActionExpression, ConditionExpression, RuleExpression };
