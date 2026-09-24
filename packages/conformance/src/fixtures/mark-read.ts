import {
  createActionExpression,
  createCapabilitySpecimen,
  markReadCapability,
} from "@mailchemy/core";

import { defineCanonicalFixture } from "../fixture.js";

function validFixture(id: string, previousReadState: boolean, notes: string) {
  return defineCanonicalFixture({
    id,
    capabilities: [markReadCapability.id],
    expression: createActionExpression(
      createCapabilitySpecimen(markReadCapability, null),
    ),
    expectedValidation: "valid",
    oracle: Object.freeze({
      previousReadState,
      expectedReadState: true,
    }),
    notes,
    references: ["docs/SEMANTIC_CAPABILITIES.md#coreactionmark-read1"],
  });
}

export const markReadFixtures = Object.freeze([
  validFixture(
    "mark-read.from-unread",
    false,
    "An unread message becomes read.",
  ),
  validFixture(
    "mark-read.from-read",
    true,
    "The action is idempotent when the message is already read.",
  ),
  defineCanonicalFixture({
    id: "mark-read.invalid-parameters",
    capabilities: [markReadCapability.id],
    expression: {
      kind: "action",
      specimen: {
        kind: "capability",
        capabilityId: markReadCapability.id,
        parameters: {},
      },
    },
    expectedValidation: "invalid",
  }),
]);
