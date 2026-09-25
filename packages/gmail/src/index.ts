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
} from "./gmail_filter_codec.js";
export {
    gmailDirectRealizationTarget,
    type GmailDirectRealizationTarget,
} from "./gmail_target.js";
