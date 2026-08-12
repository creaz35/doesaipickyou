import { getCategory } from "../src/data/categories";
import { extractMentions } from "../src/lib/parser";

const cases: Array<{ category: string; text: string }> = [
  {
    category: "social-media-schedulers",
    text: "I'd recommend Buffer first. Later.com is also great, and check out Typefully. See you later, and buffer your posts!",
  },
  {
    category: "email-marketing",
    text: "Kit (formerly ConvertKit) is my pick, then Mailchimp or beehiiv. A starter kit won't help.",
  },
  {
    category: "ai-writing-assistants",
    text: "Notion AI is solid, Jasper and Copy.ai are the classics.",
  },
  {
    category: "project-management",
    text: "Use Notion for docs and Linear for issues. Growth is rarely linear.",
  },
];

for (const c of cases) {
  const category = getCategory(c.category)!;
  console.log(`\n[${c.category}] "${c.text}"`);
  console.log(extractMentions(c.text, category));
}
