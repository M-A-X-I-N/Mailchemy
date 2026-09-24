export type ValidationPathSegment = string | number;

export interface ValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly path: readonly ValidationPathSegment[];
}

export type ValidationResult<T> =
  | {
      readonly ok: true;
      readonly value: T;
    }
  | {
      readonly ok: false;
      readonly issues: readonly ValidationIssue[];
    };

export function validationIssue(
  code: string,
  message: string,
  path: readonly ValidationPathSegment[] = [],
): ValidationIssue {
  return Object.freeze({
    code,
    message,
    path: Object.freeze([...path]),
  });
}

export function valid<T>(value: T): ValidationResult<T> {
  return Object.freeze({
    ok: true,
    value,
  });
}

export function invalid(
  ...issues: ValidationIssue[]
): ValidationResult<never> {
  if (issues.length === 0) {
    throw new Error("An invalid validation result must contain an issue.");
  }

  return Object.freeze({
    ok: false,
    issues: Object.freeze([...issues]),
  });
}
