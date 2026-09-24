import {
  createActionExpression,
  createAndExpression,
  createCapabilitySpecimen,
  createConditionExpression,
  createRuleExpression,
  hasAttachmentCapability,
  logicalAndCapability,
  markReadCapability,
  subjectContainsCapability,
} from "@mailchemy/core";

import { defineCanonicalFixture } from "../fixture.js";

function subjectContains(needle: string) {
  return createConditionExpression(
    createCapabilitySpecimen(subjectContainsCapability, { needle }),
  );
}

function hasAttachment() {
  return createConditionExpression(
    createCapabilitySpecimen(hasAttachmentCapability, null),
  );
}

function markRead() {
  return createActionExpression(createCapabilitySpecimen(markReadCapability, null));
}

export const initialRuleFixtures = Object.freeze([
  defineCanonicalFixture({
    id: "rule.a.subject-invoice-mark-read",
    capabilities: [subjectContainsCapability.id, markReadCapability.id],
    expression: createRuleExpression(subjectContains("invoice"), [markRead()]),
    expectedValidation: "valid",
    notes: 'A: IF subject contains "invoice" THEN mark read.',
    references: ["planning/CAPABILITY_REGISTRY_HARNESS.md#45-initial-rule-shaped-specimens"],
  }),
  defineCanonicalFixture({
    id: "rule.b.has-attachment-mark-read",
    capabilities: [hasAttachmentCapability.id, markReadCapability.id],
    expression: createRuleExpression(hasAttachment(), [markRead()]),
    expectedValidation: "valid",
    notes: "B: IF has attachment THEN mark read.",
    references: ["planning/CAPABILITY_REGISTRY_HARNESS.md#45-initial-rule-shaped-specimens"],
  }),
  defineCanonicalFixture({
    id: "rule.c.subject-invoice-and-attachment-mark-read",
    capabilities: [
      subjectContainsCapability.id,
      hasAttachmentCapability.id,
      logicalAndCapability.id,
      markReadCapability.id,
    ],
    expression: createRuleExpression(
      createAndExpression(
        createCapabilitySpecimen(logicalAndCapability, null),
        [subjectContains("invoice"), hasAttachment()],
      ),
      [markRead()],
    ),
    expectedValidation: "valid",
    notes:
      'C: IF subject contains "invoice" AND has attachment THEN mark read.',
    references: ["planning/CAPABILITY_REGISTRY_HARNESS.md#45-initial-rule-shaped-specimens"],
  }),
  defineCanonicalFixture({
    id: "rule.edge.subject-nfc-canonicalization",
    capabilities: [subjectContainsCapability.id, markReadCapability.id],
    expression: createRuleExpression(subjectContains("Cafe\u0301"), [markRead()]),
    expectedValidation: "valid",
    notes:
      "Definition edge: decomposed Unicode subject needle is canonicalized to NFC.",
  }),
  defineCanonicalFixture({
    id: "rule.edge.subject-whitespace-needle",
    capabilities: [subjectContainsCapability.id, markReadCapability.id],
    expression: createRuleExpression(subjectContains(" "), [markRead()]),
    expectedValidation: "valid",
    notes: "Definition edge: a non-empty whitespace needle remains valid.",
  }),
  defineCanonicalFixture({
    id: "rule.edge.and-reversed-operands",
    capabilities: [
      subjectContainsCapability.id,
      hasAttachmentCapability.id,
      logicalAndCapability.id,
      markReadCapability.id,
    ],
    expression: createRuleExpression(
      createAndExpression(
        createCapabilitySpecimen(logicalAndCapability, null),
        [hasAttachment(), subjectContains("invoice")],
      ),
      [markRead()],
    ),
    expectedValidation: "valid",
    notes:
      "Structural edge: reversed conjunction operand order is retained as supplied.",
  }),
]);
