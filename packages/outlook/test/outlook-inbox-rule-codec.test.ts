import { describe, expect, it } from "vitest";

import {
  createActionExpression,
  createCapabilitySpecimen,
  createConditionExpression,
  markReadCapability,
  subjectContainsCapability,
} from "@mailchemy/core";

import { outlookInboxRuleCodec } from "../src/index.js";

function markRead() {
  return createActionExpression(
    createCapabilitySpecimen(markReadCapability, null),
  );
}

describe("initial Outlook Inbox Rule codec", () => {
  it("encodes canonical mark-read as markAsRead=true", () => {
    expect(outlookInboxRuleCodec.encode(markRead())).toEqual({
      kind: "encoded",
      native: {
        actions: {
          markAsRead: true,
        },
      },
    });
  });

  it("decodes an isolated markAsRead=true action as canonical mark-read", () => {
    expect(
      outlookInboxRuleCodec.decode({
        id: "provider-id",
        displayName: "Mark it read",
        actions: {
          markAsRead: true,
        },
      }),
    ).toEqual({
      kind: "decoded",
      expression: markRead(),
    });
  });

  it("understands subjectContains but keeps exactness unproven", () => {
    expect(
      outlookInboxRuleCodec.decode({
        conditions: {
          subjectContains: ["invoice"],
        },
        actions: {
          markAsRead: true,
        },
      }),
    ).toMatchObject({
      kind: "unsupported-native",
      reason: {
        code: "exactness-unproven",
      },
    });
  });

  it("understands hasAttachments=true but keeps the canonical MIME definition unproven", () => {
    expect(
      outlookInboxRuleCodec.decode({
        conditions: {
          hasAttachments: true,
        },
      }),
    ).toMatchObject({
      kind: "unsupported-native",
      reason: {
        code: "exactness-unproven",
      },
    });
  });

  it("preserves rule ordering metadata opaquely", () => {
    expect(
      outlookInboxRuleCodec.decode({
        sequence: 3,
        actions: {
          markAsRead: true,
        },
      }),
    ).toMatchObject({
      kind: "opaque",
    });
  });

  it("preserves exceptions opaquely", () => {
    expect(
      outlookInboxRuleCodec.decode({
        exceptions: {
          subjectContains: ["ignore"],
        },
        actions: {
          markAsRead: true,
        },
      }),
    ).toMatchObject({
      kind: "opaque",
    });
  });

  it("preserves stopProcessingRules even when false instead of inventing continuation semantics", () => {
    expect(
      outlookInboxRuleCodec.decode({
        actions: {
          markAsRead: true,
          stopProcessingRules: false,
        },
      }),
    ).toMatchObject({
      kind: "opaque",
    });
  });

  it("refuses canonical Subject encoding until exact comparison semantics are proven", () => {
    const expression = createConditionExpression(
      createCapabilitySpecimen(subjectContainsCapability, {
        needle: "invoice",
      }),
    );

    expect(outlookInboxRuleCodec.encode(expression)).toMatchObject({
      kind: "unsupported",
      reason: {
        code: "exactness-unproven",
      },
    });
  });

  it("preserves unrelated action fields opaquely", () => {
    expect(
      outlookInboxRuleCodec.decode({
        actions: {
          delete: true,
        },
      }),
    ).toMatchObject({
      kind: "opaque",
    });
  });

  it("reports malformed supported native values explicitly", () => {
    expect(
      outlookInboxRuleCodec.decode({
        actions: {
          markAsRead: "yes",
        },
      } as unknown as Parameters<typeof outlookInboxRuleCodec.decode>[0]),
    ).toMatchObject({
      kind: "unsupported-native",
      reason: {
        code: "invalid-native",
      },
    });
  });
});
