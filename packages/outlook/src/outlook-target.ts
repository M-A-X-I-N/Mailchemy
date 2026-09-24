import {
  directRealization,
  hasAttachmentCapability,
  logicalAndCapability,
  markReadCapability,
  subjectContainsCapability,
  unsupportedRealization,
  unsupportedReason,
  type CanonicalExpression,
  type DirectRealizationResult,
} from "@mailchemy/core";

export interface OutlookDirectRealizationTarget {
  readonly id: "outlook.graph.inbox-rule.direct@1";
  readonly checkDirectRealization: (
    expression: CanonicalExpression,
  ) => DirectRealizationResult;
}

export const outlookDirectRealizationTarget: OutlookDirectRealizationTarget =
  Object.freeze({
    id: "outlook.graph.inbox-rule.direct@1",
    checkDirectRealization: checkOutlookDirectRealization,
  });

function checkOutlookDirectRealization(
  expression: CanonicalExpression,
): DirectRealizationResult {
  switch (expression.kind) {
    case "condition":
    case "action":
      return checkLeaf(expression);
    case "and":
      return checkAnd(expression);
    case "rule":
      return checkRule(expression);
  }
}

function checkLeaf(
  expression: Extract<
    CanonicalExpression,
    { readonly kind: "condition" | "action" }
  >,
): DirectRealizationResult {
  const capabilityId = expression.specimen.capabilityId;

  if (capabilityId === markReadCapability.id) {
    return directRealization();
  }

  if (capabilityId === subjectContainsCapability.id) {
    return unsupportedRealization(
      unsupportedReason(
        "exactness-unproven",
        "Microsoft Graph does not document subjectContains comparison, Unicode normalization, and case behavior precisely enough to prove core.condition.subject.contains@1.",
      ),
    );
  }

  if (capabilityId === hasAttachmentCapability.id) {
    return unsupportedRealization(
      unsupportedReason(
        "exactness-unproven",
        "Microsoft Graph hasAttachments does not document the MIME-level explicit Content-Disposition attachment definition required by core.condition.has-attachment@1.",
      ),
    );
  }

  return unsupportedRealization(
    unsupportedReason(
      "capability-absent",
      "The initial Outlook Inbox Rule target has no direct realization for this semantic capability.",
    ),
  );
}

function checkAnd(
  expression: Extract<CanonicalExpression, { readonly kind: "and" }>,
): DirectRealizationResult {
  if (expression.operator.capabilityId !== logicalAndCapability.id) {
    return unsupportedRealization(
      unsupportedReason(
        "structure-unsupported",
        "The initial Outlook target only recognizes core.logic.and@1 as conjunction structure.",
      ),
    );
  }

  for (const operand of expression.operands) {
    const operandResult = checkOutlookDirectRealization(operand);

    if (operandResult.kind === "unsupported") {
      return operandResult;
    }
  }

  return directRealization();
}

function checkRule(
  expression: Extract<CanonicalExpression, { readonly kind: "rule" }>,
): DirectRealizationResult {
  const conditionResult = checkOutlookDirectRealization(expression.condition);

  if (conditionResult.kind === "unsupported") {
    return conditionResult;
  }

  if (expression.actions.length !== 1) {
    return unsupportedRealization(
      unsupportedReason(
        "structure-unsupported",
        "The initial Outlook rule slice only proves exact structure for one action per rule.",
      ),
    );
  }

  const action = expression.actions[0];

  if (action === undefined) {
    return unsupportedRealization(
      unsupportedReason(
        "structure-unsupported",
        "The initial Outlook rule slice requires exactly one action.",
      ),
    );
  }

  return checkOutlookDirectRealization(action);
}
