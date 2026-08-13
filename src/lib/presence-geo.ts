/**
 * Client-side geo hint for the presence feature, without Cloudflare and
 * without any lookup service: the browser's own IANA timezone
 * ("Europe/Paris") yields a city and, via the map below, a country. It is
 * a self-reported, timezone-resolution guess, which is exactly as precise
 * as a privacy-friendly "who's here" widget should be. If the site later
 * sits behind Cloudflare, the server prefers cf-ipcountry anyway.
 */

const TZ_COUNTRY: Record<string, string> = {
  // Americas
  "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US",
  "America/Los_Angeles": "US", "America/Phoenix": "US", "America/Anchorage": "US",
  "America/Detroit": "US", "America/Indiana/Indianapolis": "US", "Pacific/Honolulu": "US",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Edmonton": "CA",
  "America/Winnipeg": "CA", "America/Halifax": "CA", "America/Mexico_City": "MX",
  "America/Tijuana": "MX", "America/Monterrey": "MX", "America/Sao_Paulo": "BR",
  "America/Fortaleza": "BR", "America/Manaus": "BR", "America/Argentina/Buenos_Aires": "AR",
  "America/Santiago": "CL", "America/Bogota": "CO", "America/Lima": "PE",
  "America/Caracas": "VE", "America/Montevideo": "UY", "America/Guayaquil": "EC",
  "America/La_Paz": "BO", "America/Asuncion": "PY", "America/Panama": "PA",
  "America/Costa_Rica": "CR", "America/Guatemala": "GT", "America/Santo_Domingo": "DO",
  "America/Havana": "CU", "America/Jamaica": "JM", "America/Puerto_Rico": "PR",
  // Europe
  "Europe/London": "GB", "Europe/Dublin": "IE", "Europe/Paris": "FR",
  "Europe/Berlin": "DE", "Europe/Madrid": "ES", "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL", "Europe/Brussels": "BE", "Europe/Luxembourg": "LU",
  "Europe/Zurich": "CH", "Europe/Vienna": "AT", "Europe/Lisbon": "PT",
  "Europe/Stockholm": "SE", "Europe/Oslo": "NO", "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI", "Atlantic/Reykjavik": "IS", "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ", "Europe/Bratislava": "SK", "Europe/Budapest": "HU",
  "Europe/Bucharest": "RO", "Europe/Sofia": "BG", "Europe/Athens": "GR",
  "Europe/Istanbul": "TR", "Europe/Kyiv": "UA", "Europe/Kiev": "UA",
  "Europe/Moscow": "RU", "Europe/Belgrade": "RS", "Europe/Zagreb": "HR",
  "Europe/Ljubljana": "SI", "Europe/Sarajevo": "BA", "Europe/Skopje": "MK",
  "Europe/Tirane": "AL", "Europe/Vilnius": "LT", "Europe/Riga": "LV",
  "Europe/Tallinn": "EE", "Europe/Minsk": "BY", "Europe/Chisinau": "MD",
  "Europe/Malta": "MT", "Atlantic/Canary": "ES",
  // Middle East & Africa
  "Asia/Jerusalem": "IL", "Asia/Riyadh": "SA", "Asia/Dubai": "AE",
  "Asia/Qatar": "QA", "Asia/Kuwait": "KW", "Asia/Bahrain": "BH",
  "Asia/Amman": "JO", "Asia/Beirut": "LB", "Asia/Baghdad": "IQ",
  "Asia/Tehran": "IR", "Africa/Cairo": "EG", "Africa/Casablanca": "MA",
  "Africa/Algiers": "DZ", "Africa/Tunis": "TN", "Africa/Lagos": "NG",
  "Africa/Accra": "GH", "Africa/Nairobi": "KE", "Africa/Johannesburg": "ZA",
  "Africa/Addis_Ababa": "ET", "Africa/Dar_es_Salaam": "TZ", "Africa/Kampala": "UG",
  // Asia & Oceania
  "Asia/Kolkata": "IN", "Asia/Calcutta": "IN", "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD", "Asia/Colombo": "LK", "Asia/Kathmandu": "NP",
  "Asia/Shanghai": "CN", "Asia/Hong_Kong": "HK", "Asia/Taipei": "TW",
  "Asia/Tokyo": "JP", "Asia/Seoul": "KR", "Asia/Singapore": "SG",
  "Asia/Kuala_Lumpur": "MY", "Asia/Bangkok": "TH", "Asia/Ho_Chi_Minh": "VN",
  "Asia/Saigon": "VN", "Asia/Manila": "PH", "Asia/Jakarta": "ID",
  "Asia/Makassar": "ID", "Asia/Almaty": "KZ", "Asia/Tashkent": "UZ",
  "Asia/Baku": "AZ", "Asia/Tbilisi": "GE", "Asia/Yerevan": "AM",
  "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Brisbane": "AU",
  "Australia/Perth": "AU", "Australia/Adelaide": "AU", "Pacific/Auckland": "NZ",
};

export interface GeoHint {
  country: string;
  city: string;
}

export function getGeoHint(): GeoHint {
  let tz = "";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    // no Intl: no hint
  }

  // "America/Argentina/Buenos_Aires" → "Buenos Aires"
  const city = (tz.split("/").pop() ?? "").replaceAll("_", " ");

  let country = TZ_COUNTRY[tz] ?? "";
  if (!country) {
    // Fallback: the region in the browser locale ("fr-FR" → FR).
    try {
      const region = new Intl.Locale(navigator.language).region ?? "";
      if (/^[A-Z]{2}$/.test(region)) country = region;
    } catch {
      // no locale region either: flagless is fine
    }
  }
  return { country, city };
}

export function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "🌍";
  return String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0)));
}

export function countryName(code: string): string {
  if (!code) return "somewhere on Earth";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** "/buffer" → "Buffer's scorecard", "/category/crm" → "the crm leaderboard". */
export function pathLabel(path: string): string {
  if (!path || path === "/") return "the big board";
  const fixed: Record<string, string> = {
    "/models": "the model face-off",
    "/stats": "the stats page",
    "/categories": "the category index",
    "/methodology": "the methodology",
    "/sponsor": "the sponsor page",
    "/submission": "the submission page",
    "/signin": "the sign-in page",
    "/terms": "the fine print",
    "/privacy": "the fine print",
  };
  if (fixed[path]) return fixed[path];
  const categoryMatch = path.match(/^\/category\/([a-z0-9-]+)/);
  if (categoryMatch) return `the ${categoryMatch[1].replaceAll("-", " ")} leaderboard`;
  const productMatch = path.match(/^\/([a-z0-9-]+)$/);
  if (productMatch) {
    const name = productMatch[1].replaceAll("-", " ");
    return `${name[0].toUpperCase()}${name.slice(1)}'s scorecard`;
  }
  return path;
}
