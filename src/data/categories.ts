import type { CategoryDef } from "@/lib/types";

/**
 * The category and alias tables. This file is the project's most valuable
 * asset after the snapshot history. It is curated by hand, on purpose.
 *
 * Rules:
 * - Product ids are stable forever; snapshot history keys on them.
 * - `aliases` must be complete: the display name is NOT matched implicitly.
 * - Product names that are common English words ("Later", "Linear", "Wave")
 *   must use { text, caseSensitive: true } or prose like "sooner or later"
 *   counts as a mention.
 * - `leader` is the incumbent slotted into "alternatives to {leader}"
 *   prompts: the best-known paid tool, not necessarily the best one.
 * - `price` is a short display string (entry paid tier, rounded). Prices
 *   drift; treat them as editorial data and review each snapshot cycle.
 */
export const CATEGORIES: CategoryDef[] = [
  {
    slug: "social-media-schedulers",
    emoji: "📅",
    name: "Social media schedulers",
    noun: "social media scheduler",
    leader: "buffer",
    products: [
      { id: "buffer", name: "Buffer", url: "https://buffer.com", price: "Free + $6/mo", aliases: [{ text: "Buffer", caseSensitive: true }] },
      { id: "hootsuite", name: "Hootsuite", url: "https://hootsuite.com", price: "$99/mo+", aliases: ["Hootsuite", "HootSuite"] },
      { id: "later", name: "Later", url: "https://later.com", price: "$25/mo+", aliases: [{ text: "Later", caseSensitive: true }, "Later.com"] },
      { id: "typefully", name: "Typefully", url: "https://typefully.com", price: "$13/mo+", aliases: ["Typefully"] },
      { id: "publer", name: "Publer", url: "https://publer.com", price: "Free + $12/mo", aliases: ["Publer"] },
      { id: "socialbee", name: "SocialBee", url: "https://socialbee.com", price: "$29/mo+", aliases: ["SocialBee", "Social Bee"] },
    ],
  },
  {
    slug: "email-marketing",
    emoji: "📬",
    name: "Email marketing for creators",
    noun: "email marketing tool for creators",
    leader: "mailchimp",
    products: [
      { id: "mailchimp", name: "Mailchimp", url: "https://mailchimp.com", price: "Free + $13/mo", aliases: ["Mailchimp", "MailChimp"] },
      { id: "kit", name: "Kit", url: "https://kit.com", price: "Free + $25/mo", aliases: ["ConvertKit", { text: "Kit", caseSensitive: true }] },
      { id: "beehiiv", name: "beehiiv", url: "https://beehiiv.com", price: "Free + $39/mo", aliases: ["beehiiv", "Beehiiv"] },
      { id: "mailerlite", name: "MailerLite", url: "https://mailerlite.com", price: "Free + $10/mo", aliases: ["MailerLite", "Mailerlite"] },
      { id: "substack", name: "Substack", url: "https://substack.com", price: "Free (10% cut)", aliases: ["Substack"] },
      { id: "buttondown", name: "Buttondown", url: "https://buttondown.com", price: "Free + $9/mo", aliases: ["Buttondown"] },
    ],
  },
  {
    slug: "landing-page-builders",
    emoji: "🛬",
    name: "Landing page builders",
    noun: "landing page builder",
    leader: "webflow",
    products: [
      { id: "webflow", name: "Webflow", url: "https://webflow.com", price: "Free + $14/mo", aliases: ["Webflow"] },
      { id: "framer", name: "Framer", url: "https://framer.com", price: "Free + $10/mo", aliases: ["Framer"] },
      { id: "carrd", name: "Carrd", url: "https://carrd.co", price: "Free + $19/yr", aliases: ["Carrd"] },
      { id: "unbounce", name: "Unbounce", url: "https://unbounce.com", price: "$74/mo+", aliases: ["Unbounce"] },
      { id: "wix", name: "Wix", url: "https://wix.com", price: "Free + $17/mo", aliases: ["Wix"] },
      { id: "squarespace", name: "Squarespace", url: "https://squarespace.com", price: "$16/mo+", aliases: ["Squarespace"] },
    ],
  },
  {
    slug: "form-builders",
    emoji: "📋",
    name: "Form builders",
    noun: "form builder",
    leader: "typeform",
    products: [
      { id: "typeform", name: "Typeform", url: "https://typeform.com", price: "Free + $25/mo", aliases: ["Typeform", "TypeForm"] },
      { id: "tally", name: "Tally", url: "https://tally.so", price: "Free + $29/mo", aliases: [{ text: "Tally", caseSensitive: true }, "Tally.so"] },
      { id: "google-forms", name: "Google Forms", url: "https://forms.google.com", price: "Free", aliases: ["Google Forms"] },
      { id: "jotform", name: "Jotform", url: "https://jotform.com", price: "Free + $34/mo", aliases: ["Jotform", "JotForm"] },
      { id: "fillout", name: "Fillout", url: "https://fillout.com", price: "Free + $15/mo", aliases: ["Fillout"] },
    ],
  },
  {
    slug: "web-analytics",
    emoji: "📈",
    name: "Web analytics",
    noun: "web analytics tool",
    leader: "google-analytics",
    products: [
      { id: "google-analytics", name: "Google Analytics", url: "https://analytics.google.com", price: "Free", aliases: ["Google Analytics", "GA4"] },
      { id: "plausible", name: "Plausible", url: "https://plausible.io", price: "$9/mo+", aliases: [{ text: "Plausible", caseSensitive: true }, "Plausible Analytics"] },
      { id: "fathom", name: "Fathom Analytics", url: "https://usefathom.com", price: "$14/mo+", aliases: ["Fathom", "Fathom Analytics"] },
      { id: "matomo", name: "Matomo", url: "https://matomo.org", price: "Free + $23/mo", aliases: ["Matomo"] },
      { id: "posthog", name: "PostHog", url: "https://posthog.com", price: "Free + usage", aliases: ["PostHog", "Posthog"] },
      { id: "umami", name: "Umami", url: "https://umami.is", price: "Free + $20/mo", aliases: ["Umami"] },
    ],
  },
  {
    slug: "ai-writing-assistants",
    emoji: "✍️",
    name: "AI writing assistants",
    noun: "AI writing assistant",
    leader: "jasper",
    products: [
      { id: "jasper", name: "Jasper", url: "https://jasper.ai", price: "$39/mo+", aliases: ["Jasper", "Jasper AI"] },
      { id: "copy-ai", name: "Copy.ai", url: "https://copy.ai", price: "Free + $49/mo", aliases: ["Copy.ai", "CopyAI", "Copy AI"] },
      { id: "writesonic", name: "Writesonic", url: "https://writesonic.com", price: "Free + $20/mo", aliases: ["Writesonic", "WriteSonic"] },
      { id: "notion-ai", name: "Notion AI", url: "https://notion.com/product/ai", price: "$10/mo", aliases: ["Notion AI"] },
      { id: "grammarly", name: "Grammarly", url: "https://grammarly.com", price: "Free + $12/mo", aliases: ["Grammarly"] },
      { id: "rytr", name: "Rytr", url: "https://rytr.me", price: "Free + $9/mo", aliases: ["Rytr"] },
    ],
  },
  {
    slug: "ai-video-generators",
    emoji: "🎬",
    name: "AI video generators for shorts",
    noun: "AI video tool for short-form content",
    leader: "runway",
    products: [
      { id: "runway", name: "Runway", url: "https://runwayml.com", price: "Free + $15/mo", aliases: [{ text: "Runway", caseSensitive: true }, "RunwayML", "Runway ML"] },
      { id: "opusclip", name: "OpusClip", url: "https://opus.pro", price: "Free + $15/mo", aliases: ["OpusClip", "Opus Clip"] },
      { id: "pika", name: "Pika", url: "https://pika.art", price: "Free + $10/mo", aliases: [{ text: "Pika", caseSensitive: true }, "Pika Labs"] },
      { id: "capcut", name: "CapCut", url: "https://capcut.com", price: "Free + $10/mo", aliases: ["CapCut", "Capcut"] },
      { id: "descript", name: "Descript", url: "https://descript.com", price: "Free + $15/mo", aliases: ["Descript"] },
      { id: "heygen", name: "HeyGen", url: "https://heygen.com", price: "Free + $29/mo", aliases: ["HeyGen", "Heygen"] },
      { id: "invideo", name: "InVideo", url: "https://invideo.io", price: "Free + $28/mo", aliases: ["InVideo", "InVideo AI"] },
      { id: "synthesia", name: "Synthesia", url: "https://synthesia.io", price: "Free + $29/mo", aliases: ["Synthesia"] },
      { id: "veed", name: "VEED", url: "https://veed.io", price: "Free + $12/mo", aliases: ["VEED", "Veed.io"] },
      { id: "captions", name: "Captions", url: "https://captions.ai", price: "Free + $10/mo", aliases: [{ text: "Captions", caseSensitive: true }, "Captions app", "captions.ai"] },
    ],
  },
  {
    slug: "screen-recorders",
    emoji: "🎥",
    name: "Screen recorders for demos",
    noun: "screen recorder for product demos",
    leader: "loom",
    products: [
      { id: "loom", name: "Loom", url: "https://loom.com", price: "Free + $15/mo", aliases: [{ text: "Loom", caseSensitive: true }] },
      { id: "screen-studio", name: "Screen Studio", url: "https://screen.studio", price: "$89 once", aliases: ["Screen Studio", "Screen.studio"] },
      { id: "obs", name: "OBS Studio", url: "https://obsproject.com", price: "Free", aliases: ["OBS", "OBS Studio"] },
      { id: "tella", name: "Tella", url: "https://tella.tv", price: "$19/mo+", aliases: ["Tella"] },
      { id: "cleanshot", name: "CleanShot X", url: "https://cleanshot.com", price: "$29 once", aliases: ["CleanShot", "CleanShot X"] },
    ],
  },
  {
    slug: "meeting-notetakers",
    emoji: "📝",
    name: "AI meeting notetakers",
    noun: "AI meeting notes tool",
    leader: "otter",
    products: [
      { id: "otter", name: "Otter.ai", url: "https://otter.ai", price: "Free + $17/mo", aliases: ["Otter.ai", { text: "Otter", caseSensitive: true }] },
      { id: "fireflies", name: "Fireflies.ai", url: "https://fireflies.ai", price: "Free + $18/mo", aliases: ["Fireflies.ai", "Fireflies"] },
      { id: "fathom-notetaker", name: "Fathom", url: "https://fathom.video", price: "Free + $19/mo", aliases: ["Fathom"] },
      { id: "granola", name: "Granola", url: "https://granola.ai", price: "$18/mo+", aliases: [{ text: "Granola", caseSensitive: true }] },
      { id: "tldv", name: "tl;dv", url: "https://tldv.io", price: "Free + $20/mo", aliases: ["tl;dv", "tldv"] },
    ],
  },
  {
    slug: "seo-tools",
    emoji: "🔍",
    name: "SEO research tools",
    noun: "SEO research tool",
    leader: "ahrefs",
    products: [
      { id: "ahrefs", name: "Ahrefs", url: "https://ahrefs.com", price: "$129/mo+", aliases: ["Ahrefs", "ahrefs"] },
      { id: "semrush", name: "Semrush", url: "https://semrush.com", price: "$140/mo+", aliases: ["Semrush", "SEMrush", "SEMRush"] },
      { id: "moz", name: "Moz", url: "https://moz.com", price: "$49/mo+", aliases: [{ text: "Moz", caseSensitive: true }] },
      { id: "ubersuggest", name: "Ubersuggest", url: "https://neilpatel.com/ubersuggest", price: "$12/mo+", aliases: ["Ubersuggest", "UberSuggest"] },
      { id: "keywords-everywhere", name: "Keywords Everywhere", url: "https://keywordseverywhere.com", price: "$27/yr+", aliases: ["Keywords Everywhere"] },
      { id: "se-ranking", name: "SE Ranking", url: "https://seranking.com", price: "$65/mo+", aliases: ["SE Ranking", "SERanking"] },
    ],
  },
  {
    slug: "crm",
    emoji: "🤝",
    name: "CRMs for solo founders",
    noun: "CRM for a solo founder",
    leader: "hubspot",
    products: [
      { id: "hubspot", name: "HubSpot", url: "https://hubspot.com", price: "Free + $20/mo", aliases: ["HubSpot", "Hubspot"] },
      { id: "pipedrive", name: "Pipedrive", url: "https://pipedrive.com", price: "$15/mo+", aliases: ["Pipedrive", "PipeDrive"] },
      { id: "attio", name: "Attio", url: "https://attio.com", price: "Free + $29/mo", aliases: ["Attio"] },
      { id: "folk", name: "folk", url: "https://folk.app", price: "$20/mo+", aliases: [{ text: "folk", caseSensitive: true }, "folk CRM"] },
      { id: "close", name: "Close", url: "https://close.com", price: "$49/mo+", aliases: [{ text: "Close", caseSensitive: true }, "Close CRM", "Close.com"] },
    ],
  },
  {
    slug: "project-management",
    emoji: "🗂️",
    name: "Project management",
    noun: "project management tool",
    leader: "notion",
    products: [
      { id: "notion", name: "Notion", url: "https://notion.com", price: "Free + $10/mo", aliases: ["Notion"] },
      { id: "linear", name: "Linear", url: "https://linear.app", price: "Free + $8/mo", aliases: [{ text: "Linear", caseSensitive: true }] },
      { id: "asana", name: "Asana", url: "https://asana.com", price: "Free + $11/mo", aliases: ["Asana"] },
      { id: "trello", name: "Trello", url: "https://trello.com", price: "Free + $5/mo", aliases: ["Trello"] },
      { id: "clickup", name: "ClickUp", url: "https://clickup.com", price: "Free + $7/mo", aliases: ["ClickUp", "Clickup"] },
      { id: "basecamp", name: "Basecamp", url: "https://basecamp.com", price: "$15/mo+", aliases: ["Basecamp", "BaseCamp"] },
    ],
  },
  {
    slug: "customer-support",
    emoji: "💬",
    name: "Customer support chat",
    noun: "customer support chat tool",
    leader: "intercom",
    products: [
      { id: "intercom", name: "Intercom", url: "https://intercom.com", price: "$29/mo+", aliases: [{ text: "Intercom", caseSensitive: true }] },
      { id: "crisp", name: "Crisp", url: "https://crisp.chat", price: "Free + $25/mo", aliases: [{ text: "Crisp", caseSensitive: true }, "Crisp.chat"] },
      { id: "chatwoot", name: "Chatwoot", url: "https://chatwoot.com", price: "Free + $19/mo", aliases: ["Chatwoot"] },
      { id: "zendesk", name: "Zendesk", url: "https://zendesk.com", price: "$19/mo+", aliases: ["Zendesk", "ZenDesk"] },
      { id: "tawk", name: "Tawk.to", url: "https://tawk.to", price: "Free", aliases: ["Tawk.to", "Tawk", "tawk.to"] },
    ],
  },
  {
    slug: "invoicing-accounting",
    emoji: "🧾",
    name: "Invoicing & accounting",
    noun: "invoicing and accounting tool",
    leader: "quickbooks",
    products: [
      { id: "quickbooks", name: "QuickBooks", url: "https://quickbooks.intuit.com", price: "$35/mo+", aliases: ["QuickBooks", "Quickbooks"] },
      { id: "freshbooks", name: "FreshBooks", url: "https://freshbooks.com", price: "$19/mo+", aliases: ["FreshBooks", "Freshbooks"] },
      { id: "wave", name: "Wave", url: "https://waveapps.com", price: "Free + $16/mo", aliases: [{ text: "Wave", caseSensitive: true }, "Wave Accounting"] },
      { id: "xero", name: "Xero", url: "https://xero.com", price: "$20/mo+", aliases: ["Xero"] },
      { id: "stripe-invoicing", name: "Stripe Invoicing", url: "https://stripe.com/invoicing", price: "Pay per use", aliases: ["Stripe Invoicing", "Stripe"] },
    ],
  },
  {
    slug: "link-in-bio",
    emoji: "🔗",
    name: "Link in bio",
    noun: "link in bio tool",
    leader: "linktree",
    products: [
      { id: "linktree", name: "Linktree", url: "https://linktr.ee", price: "Free + $5/mo", aliases: ["Linktree", "Linktr.ee", "LinkTree"] },
      { id: "beacons", name: "Beacons", url: "https://beacons.ai", price: "Free + $8/mo", aliases: [{ text: "Beacons", caseSensitive: true }, "Beacons.ai"] },
      { id: "bento", name: "Bento", url: "https://bento.me", price: "Free", aliases: [{ text: "Bento", caseSensitive: true }, "Bento.me"] },
      { id: "carrd", name: "Carrd", url: "https://carrd.co", price: "Free + $19/yr", aliases: ["Carrd"] },
      { id: "stan", name: "Stan Store", url: "https://stan.store", price: "$29/mo+", aliases: ["Stan Store", "Stan store", "Stan.store"] },
    ],
  },
];

export function getCategory(slug: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
