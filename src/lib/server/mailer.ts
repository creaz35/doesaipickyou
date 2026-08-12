import nodemailer from "nodemailer";

/**
 * Transactional email over Gmail SMTP with an app password. Fine for the
 * volumes this site sends (receipts, the occasional notification); if it
 * ever outgrows Gmail's ~500/day limit, swap the transport here and
 * nothing else changes.
 */

export function isMailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** CC the configured sender (so a copy lands in Brian's inbox). */
  ccSender?: boolean;
}

export async function sendMail({ to, subject, html, text, ccSender }: MailInput): Promise<void> {
  const user = process.env.GMAIL_USER!;
  const transport = nodemailer.createTransport({
    service: "gmail",
    // Google displays app passwords with spaces; SMTP wants them without.
    auth: { user, pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s+/g, "") },
  });

  await transport.sendMail({
    from: `doesaipickyou.com <${user}>`,
    to,
    cc: ccSender ? user : undefined,
    subject,
    html,
    text,
  });
}
