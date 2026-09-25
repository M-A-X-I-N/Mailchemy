/**
 * Records the dated Purelymail ManageSieve extension snapshot observed on
 * 2026-09-24 and derives an endpoint-refined Sieve target from that snapshot.
 *
 * @remarks
 * This file is endpoint evidence, not a definition of Sieve or a timeless
 * definition of Purelymail. The advertised extension set is runtime-discoverable
 * and may change; future live integrations should rediscover it.
 *
 * @see research/PURELYMAIL_SIEVE_CAPABILITY_PROFILE.md
 * @packageDocumentation
 */

import {
    createSieveEndpointRealizationTarget,
    defineSieveEndpointProfile,
} from "./endpoint-profile.js";

/**
 * Optional Sieve extensions advertised by Purelymail's unauthenticated
 * ManageSieve greeting on 2026-09-24.
 */
export const purelymailSieveExtensions20260924 = Object.freeze([
    "body",
    "comparator-i;ascii-numeric",
    "copy",
    "date",
    "envelope",
    "fileinto",
    "imap4flags",
    "mailbox",
    "reject",
    "relational",
    "spamtest",
    "subaddress",
    "vacation",
    "vacation-seconds",
    "variables",
]);

/**
 * Normalized endpoint profile preserving the provenance/date of the observed
 * Purelymail capability snapshot.
 */
export const purelymailSieveProfile20260924 = defineSieveEndpointProfile(
    "purelymail.managesieve.2026-09-24",
    purelymailSieveExtensions20260924,
);

/**
 * Sieve dialect target narrowed by the dated Purelymail extension snapshot.
 *
 * @remarks
 * A Direct result here means the expression is Direct at the base Sieve target
 * and the required extension names are present in this snapshot. It does not
 * prove every provider-specific runtime interaction beyond that profile model.
 */
export const purelymailSieveTarget20260924 =
    createSieveEndpointRealizationTarget(purelymailSieveProfile20260924);
