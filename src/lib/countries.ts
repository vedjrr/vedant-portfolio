const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

// Cloudflare reports XX when it can't tell and T1 for Tor.
const known = (code: string) => /^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1";

/** Flag emoji for an ISO country code, e.g. IE to 🇮🇪. */
export function flagEmoji(code: string) {
  if (!known(code)) return "🌐";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

export function countryName(code: string) {
  if (!known(code)) return "Somewhere";
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}
