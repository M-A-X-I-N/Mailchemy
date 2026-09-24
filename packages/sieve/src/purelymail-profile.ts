import {
  createSieveEndpointRealizationTarget,
  defineSieveEndpointProfile,
} from "./endpoint-profile.js";

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

export const purelymailSieveProfile20260924 = defineSieveEndpointProfile(
  "purelymail.managesieve.2026-09-24",
  purelymailSieveExtensions20260924,
);

export const purelymailSieveTarget20260924 =
  createSieveEndpointRealizationTarget(purelymailSieveProfile20260924);
