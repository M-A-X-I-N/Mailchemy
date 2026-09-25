/**
 * Exposes the public `@mailchemy/gmail` codec/native-representation and direct
 * realization-target APIs.
 *
 * @packageDocumentation
 */

export {
    gmailFilterCodec,
    type GmailFilterActionNative,
    type GmailFilterCriteriaNative,
    type GmailFilterNative,
} from "./filter_codec.js";
export {
    gmailDirectRealizationTarget,
    type GmailDirectRealizationTarget,
} from "./realization_target.js";
