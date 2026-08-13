/**
 * Submits every URL in the live sitemap to IndexNow (Bing, Yandex, Seznam
 * and friends; Google does not use IndexNow). The key is public by
 * design: search engines verify ownership by fetching the key file this
 * repo serves at /<key>.txt, so committing it here is the protocol
 * working as intended.
 *
 *   npx tsx scripts/submit-indexnow.ts
 *
 * Run after each deploy that adds pages and after each monthly snapshot,
 * so the refreshed leaderboards get recrawled promptly.
 */

const HOST = "doesaipickyou.com";
const KEY = "2dc097da7edd409ba972e4eba149ebf6";
const SITEMAP = `https://${HOST}/sitemap.xml`;

async function main() {
  const response = await fetch(SITEMAP);
  if (!response.ok) {
    throw new Error(`Could not fetch ${SITEMAP}: HTTP ${response.status}. Is the site deployed?`);
  }
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) throw new Error("Sitemap contained no URLs.");
  console.log(`Submitting ${urls.length} URLs from ${SITEMAP}`);

  const submit = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls,
    }),
  });

  // 200 = submitted, 202 = accepted (key validation pending). Both are
  // success; anything else needs eyes.
  console.log(`IndexNow responded: HTTP ${submit.status}`);
  if (submit.status !== 200 && submit.status !== 202) {
    console.error(await submit.text());
    process.exit(1);
  }
  console.log("Done. Bing Webmaster Tools shows submissions within a day or so.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
