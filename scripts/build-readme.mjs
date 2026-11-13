import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const promptsRoot = path.join(root, "liro-prompts");
const repoUrl = "https://github.com/SarhanCoderOfTheCentury/motionsites-free-prompt-library/blob/main";

const clean = (value = "") => String(value).replace(/\s+/g, " ").trim();
const escapeCell = (value = "") => clean(value).replace(/\|/g, "\\|");

function formatFor(record) {
  const source = `${record.category} ${record.page_type} ${record.title}`.toLowerCase();
  if (/landing|website/.test(source)) return "Landing page";
  if (/presentation|deck/.test(source)) return "Presentation";
  if (/dashboard/.test(source)) return "Dashboard";
  if (/sign.?in|sign.?up|\bform\b|contact/.test(source)) return "Form / account UI";
  if (/footer/.test(source)) return "Footer";
  if (/pricing|offer|package/.test(source)) return "Pricing / offer";
  if (/testimonial|feedback|case stud|social proof/.test(source)) return "Social proof";
  if (/feature|benefit|why us|use case|process|services|about|stats|info|technical/.test(source)) return "Content section";
  if (/cta|waitlist/.test(source)) return "CTA section";
  if (/card|tab|slider|carousal|carousel|accordion|marquee|component|interactive|404|loader/.test(source)) return "Interactive component";
  if (/portfolio|projects/.test(source)) return "Portfolio section";
  return record.page_type === "landing" ? "Landing page" : "Hero section";
}

const nicheRules = [
  ["Finance, Fintech & Web3", /\b(finance|fintech|financial|wealth|payment|crypto|web3|nft|defi|invest|bank|usd|nickel|finlytic|finflow|vault)\b/i],
  ["Cybersecurity & IT", /\b(security|cyber|guardnet|securify|akor|shield|it solutions|network)\b/i],
  ["E-commerce, Retail & Beauty", /\b(e-?commerce|shop|store|product|nike|beauty|daisy|collection|retail)\b/i],
  ["Agency, Studio & Marketing", /\b(agency|studio|creative|marketing|brand|media|social|video|vanguard|ember|prisma|velorah|buzzentic|framelix|logoisum)\b/i],
  ["Portfolio & Personal Brand", /\b(portfolio|designer|developer|viktor|max reed|xportfolio|projects catalog)\b/i],
  ["Travel, Luxury & Real Estate", /\b(travel|voyage|yacht|jet|real estate|realty|property|interior|luxury|wander|skyelite|zenith)\b/i],
  ["Climate, Agriculture & Nature", /\b(solar|energy|eco|climate|farming|acreage|botanical|nature|garden|urban jungle|green)\b/i],
  ["Education, Careers & Community", /\b(learn|academy|education|talent|career|coding|community|course|duolingo|codenest|speakup)\b/i],
  ["Science, Space & Future Tech", /\b(space|planet|orbit|aero|bio|prosthetic|science|future|cybernetic|digital reality|celestia|nova|wisa)\b/i],
  ["Logistics, Automotive & Industry", /\b(logistic|automotive|railroad|machine|industrial|targo|haul|vehicle|transport)\b/i],
  ["Sports, Gaming & Entertainment", /\b(sport|basketball|slam dunk|game|clubx|mythic|museum|art|cinematic)\b/i],
  ["AI, SaaS & Productivity", /\b(ai|saas|software|automation|workflow|task|data|analytics|invoice|booking|email|no-code|platform|dashboard|nimbus|nexacore|flowmate|cognitra|prioritize|datacore|intelligentx|digitwist|mindloop|neural|vertex|stellar|focus)\b/i],
];

function nicheFor(record, prompt, isReconstructed) {
  const identity = `${record.title} ${record.category}`;
  for (const [niche, pattern] of nicheRules) if (pattern.test(identity)) return niche;
  if (!isReconstructed) {
    const promptExcerpt = prompt.slice(0, 2400);
    for (const [niche, pattern] of nicheRules) if (pattern.test(promptExcerpt)) return niche;
  }
  return "General Business & Experimental UI";
}

function useCasesFor(format, niche, title) {
  const map = {
    "Landing page": "campaign launches, product marketing sites, and conversion-focused homepages",
    "Hero section": "homepage openings, launch pages, and high-impact first impressions",
    Presentation: "investor pitches, product narratives, and stakeholder presentations",
    Dashboard: "admin portals, analytics products, and operational software",
    "Form / account UI": "onboarding, lead capture, authentication, and account flows",
    Footer: "site-wide navigation, trust links, and final conversion touchpoints",
    "Pricing / offer": "plan comparison, package selection, and purchase decisions",
    "Social proof": "testimonials, reviews, case studies, and credibility building",
    "Content section": "feature explanation, service pages, product education, and storytelling",
    "CTA section": "waitlists, lead generation, demos, and conversion campaigns",
    "Interactive component": "interactive storytelling, reusable UI blocks, and motion prototypes",
    "Portfolio section": "creative portfolios, project galleries, and personal branding",
  };
  const special = /404/i.test(title) ? "branded error pages and playful recovery flows" : map[format];
  return `${special}; adaptable to ${niche.toLowerCase()}`;
}

function descriptionFor(record, prompt, format, niche, isReconstructed) {
  if (isReconstructed) {
    return `A production-focused ${format.toLowerCase()} brief for “${record.title},” translating its public visual concept into responsive layout, styling, motion, and implementation guidance.`;
  }
  const fenced = prompt.match(/```\s*\n([\s\S]*?)\n```/);
  const body = fenced?.[1] || prompt;
  const first = body
    .split(/(?<=[.!?])\s+/)
    .map(clean)
    .find((sentence) => /^(build|create|design|develop)\b/i.test(sentence) && sentence.length >= 35 && sentence.length <= 230);

  if (first) return first.replace(/\*\*/g, "").replace(/`/g, "");
  return `A polished ${format.toLowerCase()} concept for ${niche.toLowerCase()}, with responsive layout, deliberate visual hierarchy, and production-oriented interaction guidance.`;
}

const entries = fs
  .readdirSync(promptsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const folder = entry.name;
    const metadata = JSON.parse(fs.readFileSync(path.join(promptsRoot, folder, "metadata.json"), "utf8"));
    const prompt = fs.readFileSync(path.join(promptsRoot, folder, "working-prompt.md"), "utf8");
    const record = metadata.record;
    const format = formatFor(record);
    const isReconstructed = metadata.workingPrompt?.mode === "reconstructed";
    const niche = nicheFor(record, prompt, isReconstructed);
    return {
      title: record.title,
      sortOrder: Number(record.sort_order) || 999,
      sourceCategory: record.category || "Uncategorized",
      format,
      niche,
      description: descriptionFor(record, prompt, format, niche, isReconstructed),
      useCases: useCasesFor(format, niche, record.title),
      sourceMode: isReconstructed ? "Reconstructed" : "Original",
      path: `liro-prompts/${folder}/working-prompt.md`,
    };
  })
  .sort((a, b) => a.niche.localeCompare(b.niche) || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

const nicheOrder = [
  "AI, SaaS & Productivity",
  "Finance, Fintech & Web3",
  "Cybersecurity & IT",
  "Agency, Studio & Marketing",
  "Portfolio & Personal Brand",
  "E-commerce, Retail & Beauty",
  "Travel, Luxury & Real Estate",
  "Climate, Agriculture & Nature",
  "Education, Careers & Community",
  "Science, Space & Future Tech",
  "Logistics, Automotive & Industry",
  "Sports, Gaming & Entertainment",
  "General Business & Experimental UI",
];

const originalCount = entries.filter((entry) => entry.sourceMode === "Original").length;
const reconstructedCount = entries.length - originalCount;
const toc = nicheOrder
  .filter((niche) => entries.some((entry) => entry.niche === niche))
  .map((niche) => `- [${niche}](#${niche.toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}) (${entries.filter((entry) => entry.niche === niche).length})`)
  .join("\n");

const catalog = nicheOrder
  .filter((niche) => entries.some((entry) => entry.niche === niche))
  .map((niche) => {
    const rows = entries
      .filter((entry) => entry.niche === niche)
      .map(
        (entry) =>
          `| [${escapeCell(entry.title)}](${repoUrl}/${entry.path}) | ${escapeCell(entry.description)} | ${escapeCell(entry.format)} | ${escapeCell(entry.useCases)} | ${escapeCell(entry.sourceMode)} |`,
      )
      .join("\n");
    return `## ${niche}\n\n| Prompt | Brief description | Format | Best-fit use cases and niches | Source |\n| --- | --- | --- | --- | --- |\n${rows}`;
  })
  .join("\n\n");

const readme = `# MotionSites Free Prompt Library\n\nA searchable, developer-friendly collection of **${entries.length} website and UI generation prompts**. This README organizes every prompt by its best-fit business niche while retaining the prompt's functional format, practical use cases, and a direct link to the usable prompt file.\n\n> [!IMPORTANT]\n> The archive contains **${originalCount} original prompts** captured from the source endpoint and **${reconstructedCount} clearly labeled reconstructions** created from public metadata and preview references. A reconstruction is useful as a working build brief, but it is not the original paid prompt text.\n\n## What is included\n\n- ${entries.length} ready-to-inspect prompt briefs\n- Direct GitHub links to every \`working-prompt.md\` file\n- Business-niche categories for faster discovery\n- Format labels such as hero, landing page, pricing, dashboard, CTA, and content section\n- Use-case guidance for adapting each design to a real client or product\n- A React/Vite catalog app with search, filters, previews, and copy actions\n\n## How to use the library\n\n1. Choose a niche below.\n2. Select a prompt based on its description, format, and use cases.\n3. Open the linked prompt file and copy the content under **Prompt** or **Reconstructed Working Prompt**.\n4. Replace the sample brand, copy, colors, media, and metrics with verified project content.\n5. Paste the adapted prompt into your coding agent or AI website builder, then review responsiveness, accessibility, asset rights, and production behavior.\n\n## Category index\n\n${toc}\n\n## Prompt source labels\n\n| Label | Meaning |\n| --- | --- |\n| Original | Full prompt text fetched from the source endpoint during the captured research session. |\n| Reconstructed | Practical recreation based on public title, category, metadata, and preview media; not original paid text. |\n\n## Prompt catalog\n\n${catalog}\n\n## Run the visual catalog locally\n\n\`\`\`bash\nnpm install\nnpm run generate:catalog\nnpm run dev\n\`\`\`\n\nOpen [http://127.0.0.1:5173](http://127.0.0.1:5173).\n\n### Useful commands\n\n\`\`\`bash\nnpm run build\nnpm run lint\nnpm run test -- --run\nnpm run test:e2e\nnpm run generate:catalog\nnode scripts/build-readme.mjs\n\`\`\`\n\nThe catalog generator reads \`liro-prompts/*/metadata.json\` and \`working-prompt.md\`, then updates the app data. The README generator rebuilds this categorized directory from those same source files.\n\n## Repository structure\n\n| Path | Purpose |\n| --- | --- |\n| [\`liro-prompts/\`](./liro-prompts/) | Prompt metadata, source records, and working prompt files. |\n| [\`liro-prompts/INDEX.md\`](./liro-prompts/INDEX.md) | Extraction-oriented index with source status and original categories. |\n| [\`src/\`](./src/) | React catalog application. |\n| [\`scripts/build-catalog.mjs\`](./scripts/build-catalog.mjs) | Generates application catalog data. |\n| [\`scripts/build-readme.mjs\`](./scripts/build-readme.mjs) | Generates this niche-based README directory. |\n| [\`tests/\`](./tests/) | Unit and end-to-end coverage. |\n\n## Provenance and responsible use\n\nOriginal prompt records were fetched from the MotionSites \`get-prompt\` endpoint during the captured research session. Locked records preserve their endpoint status and use clearly marked working reconstructions based on public information. This independent repository does not claim affiliation with MotionSites. Review source terms and third-party asset licenses before redistribution or commercial use.\n`;

fs.writeFileSync(path.join(root, "README.md"), readme);
console.log(`Wrote README.md with ${entries.length} prompts across ${nicheOrder.length} categories.`);
