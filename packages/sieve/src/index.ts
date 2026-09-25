/**
 * Exposes the public `@mailchemy/sieve` codec, dialect target, endpoint-profile,
 * and dated Purelymail profile APIs.
 *
 * @remarks
 * The barrel intentionally exports both dialect-level and endpoint-level
 * surfaces; their separate module contracts remain authoritative.
 *
 * @packageDocumentation
 */

export { sieveCodec, type SieveScriptNative } from "./codec.js";
export {
    sieveDirectRealizationTarget,
    type SieveDirectRealizationTarget,
} from "./realization_target.js";
export {
    InvalidSieveEndpointProfileError,
    createSieveEndpointRealizationTarget,
    defineSieveEndpointProfile,
    type SieveEndpointProfile,
    type SieveEndpointProfileData,
    type SieveEndpointRealizationTarget,
} from "./endpoint_profile.js";
export {
    purelymailSieveExtensions20260924,
    purelymailSieveProfile20260924,
    purelymailSieveTarget20260924,
} from "./purelymail_profile.js";
