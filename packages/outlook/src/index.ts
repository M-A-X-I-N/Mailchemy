/**
 * Exposes the public `@mailchemy/outlook` Graph Inbox Rule codec/native
 * representation and direct realization-target APIs.
 *
 * @packageDocumentation
 */

export {
    outlookInboxRuleCodec,
    type OutlookMessageRuleActionsNative,
    type OutlookMessageRuleNative,
    type OutlookMessageRulePredicatesNative,
} from "./outlook-inbox-rule-codec.js";
export {
    outlookDirectRealizationTarget,
    type OutlookDirectRealizationTarget,
} from "./outlook-target.js";
