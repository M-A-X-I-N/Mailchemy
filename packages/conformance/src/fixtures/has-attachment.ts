import {
  createCapabilitySpecimen,
  createConditionExpression,
  hasAttachmentCapability,
} from "@mailchemy/core";

import { defineCanonicalFixture } from "../fixture.js";

function validFixture(
  id: string,
  entities: readonly {
    readonly dispositionType: string | null;
    readonly isMultipart: boolean;
  }[],
  expectedMatch: boolean,
  notes: string,
) {
  return defineCanonicalFixture({
    id,
    capabilities: [hasAttachmentCapability.id],
    expression: createConditionExpression(
      createCapabilitySpecimen(hasAttachmentCapability, null),
    ),
    expectedValidation: "valid",
    oracle: Object.freeze({
      entities: Object.freeze(
        entities.map((entity) => Object.freeze({ ...entity })),
      ),
      expectedMatch,
    }),
    notes,
    references: ["docs/SEMANTIC_CAPABILITIES.md#coreconditionhas-attachment1"],
  });
}

export const hasAttachmentFixtures = Object.freeze([
  validFixture(
    "has-attachment.explicit-attachment",
    [{ dispositionType: "attachment", isMultipart: false }],
    true,
    'Explicit non-multipart disposition "attachment" matches.',
  ),
  validFixture(
    "has-attachment.case-insensitive-disposition-token",
    [{ dispositionType: "ATTACHMENT", isMultipart: false }],
    true,
    "Disposition type tokens compare case-insensitively.",
  ),
  validFixture(
    "has-attachment.inline-does-not-count",
    [{ dispositionType: "inline", isMultipart: false }],
    false,
    "Inline content is not an attachment in version 1.",
  ),
  validFixture(
    "has-attachment.missing-disposition-does-not-count",
    [{ dispositionType: null, isMultipart: false }],
    false,
    "Filename/content-type heuristics are intentionally excluded.",
  ),
  validFixture(
    "has-attachment.multipart-container-does-not-count",
    [{ dispositionType: "attachment", isMultipart: true }],
    false,
    "A multipart container itself does not count as an attachment.",
  ),
  validFixture(
    "has-attachment.any-entity",
    [
      { dispositionType: "inline", isMultipart: false },
      { dispositionType: null, isMultipart: false },
      { dispositionType: "attachment", isMultipart: false },
    ],
    true,
    "Any qualifying MIME entity is sufficient.",
  ),
  defineCanonicalFixture({
    id: "has-attachment.invalid-parameters",
    capabilities: [hasAttachmentCapability.id],
    expression: {
      kind: "condition",
      specimen: {
        kind: "capability",
        capabilityId: hasAttachmentCapability.id,
        parameters: {},
      },
    },
    expectedValidation: "invalid",
  }),
]);
