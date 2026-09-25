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
} from "./inbox_rule_codec.js";
export {
    outlookDirectRealizationTarget,
    type OutlookDirectRealizationTarget,
} from "./realization_target.js";
