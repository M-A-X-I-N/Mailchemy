import { describe, expect, it } from "vitest";

import {
  createActionExpression,
  createAndExpression,
  createCapabilitySpecimen,
  createConditionExpression,
  createRuleExpression,
  defineSemanticCapability,
  invalid,
  parseCapabilityId,
  valid,
  validationIssue,
} from "@mailchemy/core";

function stringCondition(id: string) {
  return defineSemanticCapability<string>({
    id: parseCapabilityId(id),
    role: "condition",
    description: "Synthetic string condition.",
    validateParameters: (value) =>
      typeof value === "string"
        ? valid(value)
        : invalid(
            validationIssue("test.string.invalid", "Expected a string value."),
          ),
    areParametersEqual: (left, right) => left === right,
  });
}

function nullCapability(
  id: string,
  role: "action" | "logic",
) {
  return defineSemanticCapability<null>({
    id: parseCapabilityId(id),
    role,
    description: "Synthetic parameterless capability.",
    validateParameters: (value) =>
      value === null
        ? valid(null)
        : invalid(
            validationIssue("test.null.invalid", "Expected a null parameter."),
          ),
    areParametersEqual: () => true,
  });
}

describe("canonical expression constructors", () => {
  it("represents the initial rule-shaped specimen patterns without provider data", () => {
    const subject = stringCondition("test.condition.subject@1");
    const attachment = stringCondition("test.condition.attachment@1");
    const mark = nullCapability("test.action.mark@1", "action");
    const and = nullCapability("test.logic.and@1", "logic");

    const subjectCondition = createConditionExpression(
      createCapabilitySpecimen(subject, "invoice"),
    );
    const attachmentCondition = createConditionExpression(
      createCapabilitySpecimen(attachment, "present"),
    );
    const markAction = createActionExpression(
      createCapabilitySpecimen(mark, null),
    );

    const ruleA = createRuleExpression(subjectCondition, [markAction]);
    const ruleB = createRuleExpression(attachmentCondition, [markAction]);
    const combined = createAndExpression(createCapabilitySpecimen(and, null), [
      subjectCondition,
      attachmentCondition,
    ]);
    const ruleC = createRuleExpression(combined, [markAction]);

    expect(ruleA.kind).toBe("rule");
    expect(ruleB.condition).toBe(attachmentCondition);
    expect(ruleC.condition).toBe(combined);
    expect(combined.operands).toEqual([
      subjectCondition,
      attachmentCondition,
    ]);
  });

  it("preserves rule/action grouping and freezes structural arrays", () => {
    const conditionContract = stringCondition("test.condition.value@1");
    const actionContract = nullCapability("test.action.noop@1", "action");

    const condition = createConditionExpression(
      createCapabilitySpecimen(conditionContract, "x"),
    );
    const action = createActionExpression(
      createCapabilitySpecimen(actionContract, null),
    );
    const sourceActions = [action];
    const rule = createRuleExpression(condition, sourceActions);

    sourceActions.length = 0;

    expect(rule.actions).toEqual([action]);
    expect(Object.isFrozen(rule)).toBe(true);
    expect(Object.isFrozen(rule.actions)).toBe(true);
  });
});
