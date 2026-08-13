import { spotLabel } from "@/lib/sponsor-spots";

/**
 * Branded transactional emails. `emailLayout` is the shared shell (brand
 * header, ink-bordered card, footer); each concrete email composes its
 * body from the small helpers below and returns {subject, html, text}.
 * Email HTML is its own museum of constraints: tables and inline styles
 * only, no external images so nothing is blocked or tracked.
 */

const INK = "#1c1917";
const STONE = "#78716c";
const EMERALD = "#059669";
const EMERALD_BRIGHT = "#10b981";
const CREAM = "#fef3c7";
const BG = "#f5f5f4";
const SITE = "https://doesaipickyou.com";

/** User-supplied strings go through this before touching HTML. */
export function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function paragraph(html: string): string {
  return `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${INK};">${html}</p>`;
}

export function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px 0;"><tr>
    <td style="border:2px solid ${INK};border-radius:12px;background:${EMERALD_BRIGHT};">
      <a href="${href}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">${label}</a>
    </td>
  </tr></table>`;
}

/** Two-column receipt-style rows. */
export function kvTable(rows: [string, string][]): string {
  const tr = rows
    .map(([key, value], i) => {
      const border = i === 0 ? "" : "border-top:1px solid #e7e5e4;";
      return `<tr>
        <td style="padding:9px 14px;font-size:13px;color:${STONE};${border}">${key}</td>
        <td align="right" style="padding:9px 14px;font-size:13px;font-weight:bold;color:${INK};${border}font-family:Consolas,Menlo,monospace;">${value}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;border:2px solid ${INK};border-radius:12px;border-collapse:separate;overflow:hidden;background:#fafaf9;">
    ${tr}
  </table>`;
}

export function emailLayout({ preheader, content }: { preheader: string; content: string }): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:${BG};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <!-- brand header -->
        <tr><td style="padding:0 4px 14px 4px;font-family:Verdana,Geneva,sans-serif;font-size:18px;font-weight:bold;color:${INK};">
          does<span style="background:${EMERALD_BRIGHT};color:#ffffff;border-radius:5px;padding:1px 5px;">AI</span>pick<span style="background:#a7f3d0;border-radius:3px;padding:0 2px;">you</span><span style="color:${EMERALD};">?</span>
        </td></tr>
        <!-- card -->
        <tr><td style="background:#ffffff;border:2px solid ${INK};border-radius:16px;padding:28px;font-family:Verdana,Geneva,sans-serif;">
          ${content}
        </td></tr>
        <!-- footer -->
        <tr><td style="padding:16px 4px;font-family:Verdana,Geneva,sans-serif;font-size:12px;line-height:1.6;color:${STONE};">
          Sent by <a href="${SITE}" style="color:${EMERALD};text-decoration:none;">doesaipickyou.com</a>, the monthly leaderboards of what AI models actually recommend.<br>
          Questions? Just reply to this email.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// --- Concrete emails ------------------------------------------------------

export interface SubmissionNotificationInput {
  name: string;
  toolId: string;
  url: string;
  price: string;
  aliases: string[];
  categories: string[];
  submitterEmail: string | null;
}

/** To the site owner when a founder submits a tool on /submission. */
export function submissionNotificationEmail(input: SubmissionNotificationInput): {
  subject: string;
  html: string;
  text: string;
} {
  const name = esc(input.name);

  const content = [
    `<h1 style="margin:0 0 6px 0;font-size:22px;color:${INK};">New tool submission 📥</h1>`,
    `<p style="margin:0 0 20px 0;font-size:13px;color:${STONE};">Pending your review on /admin</p>`,
    paragraph(`<strong>${name}</strong> wants on the leaderboards.`),
    kvTable([
      ["Tool", name],
      ["Id", esc(input.toolId)],
      ["URL", esc(input.url)],
      ["Price", esc(input.price)],
      ["Categories", esc(input.categories.join(", ") || "none")],
      ["Aliases", esc(input.aliases.join(", "))],
      ["Submitted by", esc(input.submitterEmail ?? "unknown")],
    ]),
    button("Review in admin", `${SITE}/admin`),
    `<p style="margin:0;font-size:12px;color:${STONE};">Approve to add it to the catalog claimed by the submitter, then run its category to rank it.</p>`,
  ].join("\n");

  const text = [
    "New tool submission 📥",
    "",
    `Tool:       ${input.name}`,
    `Id:         ${input.toolId}`,
    `URL:        ${input.url}`,
    `Price:      ${input.price}`,
    `Categories: ${input.categories.join(", ") || "none"}`,
    `Aliases:    ${input.aliases.join(", ")}`,
    `By:         ${input.submitterEmail ?? "unknown"}`,
    "",
    `Review: ${SITE}/admin`,
  ].join("\n");

  return {
    subject: `📥 New tool submission: ${input.name}`,
    html: emailLayout({
      preheader: `${input.name} wants on the leaderboards. Pending review.`,
      content,
    }),
    text,
  };
}

export interface SponsorReceiptInput {
  productName: string;
  tagline: string;
  spot: string;
  amountUsd: number;
  /** Unix seconds, from the Stripe session. */
  paidAt: number;
  /** Stripe checkout session id, shown as the payment reference. */
  sessionId: string;
}

export function sponsorReceiptEmail(input: SponsorReceiptInput): {
  subject: string;
  html: string;
  text: string;
} {
  const name = esc(input.productName);
  const spot = spotLabel(input.spot);
  const date = new Date(input.paidAt * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const content = [
    `<h1 style="margin:0 0 6px 0;font-size:22px;color:${INK};">Payment received 🎉</h1>`,
    `<p style="margin:0 0 20px 0;font-size:13px;color:${STONE};">Sponsorship receipt · ${date}</p>`,
    paragraph(`Hey, thanks for sponsoring! <strong>${name}</strong> is queued for the ${spot.toLowerCase()}.`),
    paragraph(
      `A human (Brian) reviews the card and puts it live, usually the same day. Your <strong>30 days start at go-live</strong>, not at payment, so review time never costs you exposure.`,
    ),
    kvTable([
      ["Product", name],
      ["Spot", spot],
      ["Duration", "30 days from go-live"],
      ["Paid", `$${input.amountUsd}`],
      ["Date", date],
      ["Reference", input.sessionId.slice(0, 24) + "…"],
    ]),
    paragraph(
      `Every click on your card is tagged <span style="font-family:Consolas,Menlo,monospace;background:${CREAM};border-radius:4px;padding:1px 5px;font-size:13px;">utm_source=doesaipickyou</span>, so you can verify the traffic in your own analytics.`,
    ),
    button("See the leaderboards", SITE),
    `<p style="margin:0;font-size:12px;color:${STONE};">Stripe may send its own receipt separately. Sponsorship never affects rankings, that would defeat the whole site.</p>`,
  ].join("\n");

  const text = [
    "Payment received 🎉",
    "",
    `Thanks for sponsoring! ${input.productName} is queued for the ${spot.toLowerCase()}.`,
    "A human reviews the card and puts it live, usually the same day.",
    "Your 30 days start at go-live, not at payment.",
    "",
    `Product:   ${input.productName}`,
    `Spot:      ${spot}`,
    `Duration:  30 days from go-live`,
    `Paid:      $${input.amountUsd}`,
    `Date:      ${date}`,
    `Reference: ${input.sessionId}`,
    "",
    "Clicks on your card are tagged utm_source=doesaipickyou, verify them in your own analytics.",
    "",
    `${SITE} · questions? just reply.`,
  ].join("\n");

  return {
    subject: `Your sponsor spot on doesaipickyou.com is confirmed 🎉`,
    html: emailLayout({
      preheader: `${input.productName} is queued for the ${spot.toLowerCase()}. 30 days start at go-live.`,
      content,
    }),
    text,
  };
}
