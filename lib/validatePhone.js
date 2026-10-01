// Nigerian phone numbers only:
// - 11 digits starting with 0 (e.g. 08012345678)
// - +234 followed by 10 digits (e.g. +2348012345678)
// Spaces and dashes are ignored (e.g. "0803 123 4567" is accepted).
const NG_PHONE_RE = /^(?:0\d{10}|\+234\d{10})$/;

export function isValidNigerianPhone(phone) {
  if (typeof phone !== "string") return false;
  return NG_PHONE_RE.test(phone.replace(/[\s-]/g, ""));
}

export const NIGERIAN_PHONE_ERROR =
  "Enter a valid Nigerian number: 11 digits starting with 0 (e.g. 08012345678) or +234 followed by 10 digits (e.g. +2348012345678).";
