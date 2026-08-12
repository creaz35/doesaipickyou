/**
 * Tags outbound links so sponsors and tool makers see this site named in
 * their own analytics (Plausible, GA, etc.), which is the proof that a
 * sponsor spot or a good rank actually sends people.
 */
export type UtmCampaign = "sponsor_card" | "sponsor_ticker" | "tool_page";

export function withUtm(url: string, campaign: UtmCampaign): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_source", "doesaipickyou");
    parsed.searchParams.set("utm_medium", "referral");
    parsed.searchParams.set("utm_campaign", campaign);
    return parsed.toString();
  } catch {
    // Not a parseable absolute URL: link out unchanged rather than break it.
    return url;
  }
}
