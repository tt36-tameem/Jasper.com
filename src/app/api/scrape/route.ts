import { promises as dns } from "dns";
import { NextRequest, NextResponse } from "next/server";
import puppeteer, { type Browser } from "puppeteer-core";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 120;

/* ─── Types ───────────────────────────────────────────────────────────── */
interface ExtractedPerson {
  firstName: string;
  lastName: string;
  title: string;
  linkedin: string;
  confidence: "high" | "medium" | "low";
}

/* ─── Email permutations ───────────────────────────────────────────────── */
function emailPermutations(first: string, last: string, domain: string): string[] {
  const f  = first.toLowerCase().replace(/[^a-z]/g, "");
  const l  = last.toLowerCase().replace(/[^a-z]/g, "");
  const fi = f[0] ?? "";
  const li = l[0] ?? "";
  return [
    `${f}.${l}@${domain}`,
    `${fi}${l}@${domain}`,
    `${f}@${domain}`,
    `${fi}.${l}@${domain}`,
    `${f}${l}@${domain}`,
    `${l}.${f}@${domain}`,
    `${l}${fi}@${domain}`,
    `${f}${li}@${domain}`,
  ].filter((e, i, arr) => arr.indexOf(e) === i && e.includes("@") && !e.startsWith("@") && f.length > 0);
}

/* ─── MX record check ─────────────────────────────────────────────────── */
async function hasMxRecord(domain: string): Promise<boolean> {
  try {
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

/* ─── Normalize a raw domain string ──────────────────────────────────── */
function cleanDomainStr(raw: string): string {
  return raw
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .toLowerCase()
    .trim();
}

/* ─── Resolve a Chrome/Chromium executable ───────────────────────────── */
function chromeExecutablePath(): string {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  switch (process.platform) {
    case "darwin":
      return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    case "win32":
      return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    default:
      return "/usr/bin/google-chrome";
  }
}

/* ─── Rendered page result ───────────────────────────────────────────── */
interface RenderedPage {
  text: string;
  title: string;
  siteName: string;
}

/* ─── Render one URL with JS executed ────────────────────────────────── */
async function renderPage(browser: Browser, url: string): Promise<RenderedPage | null> {
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    // Skip heavy assets so renders stay fast.
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (type === "image" || type === "media" || type === "font" || type === "stylesheet") req.abort();
      else req.continue();
    });

    const res = await page.goto(url, { waitUntil: "networkidle2", timeout: 20_000 });
    if (!res || !res.ok()) return null;

    const data = await page.evaluate(() => {
      const meta = document.querySelector('meta[property="og:site_name"]');
      return {
        text: document.body?.innerText ?? "",
        title: document.title ?? "",
        siteName: meta?.getAttribute("content") ?? "",
      };
    });

    if (!data.text || data.text.trim().length < 200) return null;
    return { text: data.text.slice(0, 20_000), title: data.title, siteName: data.siteName };
  } catch {
    return null;
  } finally {
    await page.close().catch(() => {});
  }
}

/* ─── Render the likely "people" pages for a domain ──────────────────── */
async function renderCompanySite(
  browser: Browser,
  domain: string,
): Promise<{ text: string; companyName: string }> {
  const paths = ["/about", "/team", "/about-us", "/leadership", "/our-team", "/people", "/"];

  const settled = await Promise.allSettled(
    paths.map((p) => renderPage(browser, `https://${domain}${p}`)),
  );
  const pages = settled
    .filter((s): s is PromiseFulfilledResult<RenderedPage | null> => s.status === "fulfilled")
    .map((s) => s.value)
    .filter((p): p is RenderedPage => p !== null);

  if (pages.length === 0) return { text: "", companyName: "" };

  const companyName =
    pages.find((p) => p.siteName)?.siteName ||
    (pages[0].title ? pages[0].title.replace(/\s*[|–—-].*$/, "").trim() : "") ||
    domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);

  // Concatenate distinct page texts, capped for the model.
  const combined = pages.map((p) => p.text).join("\n\n----\n\n").slice(0, 24_000);
  return { text: combined, companyName };
}

/* ─── Extract people from page text with Claude ──────────────────────── */
async function extractPeopleWithClaude(
  client: Anthropic,
  text: string,
  companyName: string,
): Promise<ExtractedPerson[]> {
  const prompt = `You are extracting real employees from the text of a company's website (company: "${companyName}").

From the text below, extract ONLY actual people who work at this company — founders, executives, leadership, and team/staff members.

Rules:
- Ignore customers, testimonial authors, advisors who don't work there, investors, and generic placeholder names.
- A person must have a clear first and last name.
- "title" is their role at the company (e.g. "CEO", "Head of Marketing"). Use "" if unknown.
- "linkedin" is their full LinkedIn URL if it appears in the text, otherwise "".
- "confidence": "high" if clearly listed as team/leadership with a title, "medium" if named as staff but title is unclear, "low" if uncertain they work here.

Return ONLY a JSON array, no prose, no code fences. Each item: {"firstName","lastName","title","linkedin","confidence"}. If no real employees are found, return [].

WEBSITE TEXT:
${text}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((p): ExtractedPerson | null => {
      if (typeof p !== "object" || p === null) return null;
      const o = p as Record<string, unknown>;
      const firstName = String(o.firstName ?? "").trim();
      const lastName = String(o.lastName ?? "").trim();
      if (!firstName || !lastName) return null;
      const conf = String(o.confidence ?? "medium").toLowerCase();
      return {
        firstName,
        lastName,
        title: String(o.title ?? "").trim(),
        linkedin: String(o.linkedin ?? "").trim(),
        confidence: conf === "high" || conf === "low" ? conf : "medium",
      };
    })
    .filter((p): p is ExtractedPerson => p !== null);
}

/* ─── Scrape one domain and return lead objects ───────────────────────── */
async function scrapeDomain(
  browser: Browser,
  client: Anthropic,
  domain: string,
  filters: { title?: string; location?: string; industry?: string; countPerDomain: number },
  batchIndex: number,
) {
  const [domainVerified, site] = await Promise.all([
    hasMxRecord(domain),
    renderCompanySite(browser, domain),
  ]);

  if (!site.text) return [];

  let people = await extractPeopleWithClaude(client, site.text, site.companyName);

  if (filters.title) {
    const q = filters.title.toLowerCase();
    people = people.filter((p) => p.title.toLowerCase().includes(q));
  }

  const rank = { high: 3, medium: 2, low: 1 } as const;
  people.sort((a, b) => rank[b.confidence] - rank[a.confidence]);
  people = people.slice(0, filters.countPerDomain);

  return people.map((p, i) => {
    const perms   = emailPermutations(p.firstName, p.lastName, domain);
    const primary = perms[0] ?? "";
    const name    = `${p.firstName} ${p.lastName}`.trim();
    const hue     = (name.charCodeAt(0) * 37 + (name.charCodeAt(1) ?? 0) * 17) % 360;
    return {
      id:                `live-${Date.now()}-${batchIndex}-${i}`,
      name,
      title:             p.title || "Unknown Role",
      company:           site.companyName,
      domain,
      industry:          filters.industry || "Unknown",
      companySize:       "Unknown",
      location:          filters.location || "Unknown",
      email:             primary,
      emailPermutations: perms,
      phone:             "",
      linkedin:          p.linkedin || `linkedin.com/in/${p.firstName.toLowerCase()}${p.lastName.toLowerCase()}`,
      source:            "Web Scrape",
      confidence:        p.confidence as "high" | "medium" | "low",
      domainVerified,
      isLive:            true,
      hue,
    };
  });
}

/* ─── Route handler ───────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  let body: {
    domain?: string;
    domains?: string | string[];
    title?: string;
    location?: string;
    industry?: string;
    count?: number;
    countPerDomain?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { domain, domains, title, location, industry, count, countPerDomain } = body;

  // Resolve domain list (support both single and batch)
  const rawDomains: string[] = domains
    ? Array.isArray(domains) ? domains : [domains]
    : domain
    ? [domain]
    : [];

  const cleanDomains = rawDomains
    .map(cleanDomainStr)
    .filter((d) => d.length > 3 && d.includes("."));

  if (cleanDomains.length === 0) {
    return NextResponse.json({ error: "At least one domain is required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith("your_")) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured. Add a real key to .env.local and restart." },
      { status: 500 },
    );
  }
  const client = new Anthropic({ apiKey });

  const perDomain = countPerDomain ?? Math.ceil((count ?? 25) / cleanDomains.length);

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      executablePath: chromeExecutablePath(),
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const results = await Promise.allSettled(
      cleanDomains.map((d, i) =>
        scrapeDomain(browser!, client, d, { title, location, industry, countPerDomain: perDomain }, i),
      ),
    );

    const leads = results
      .filter(
        (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof scrapeDomain>>> =>
          r.status === "fulfilled",
      )
      .flatMap((r) => r.value);

    if (leads.length === 0) {
      return NextResponse.json(
        { error: "No people found on these sites. Try companies with public team or about pages." },
        { status: 422 },
      );
    }

    return NextResponse.json({ leads, domains: cleanDomains, total: leads.length });
  } catch (err) {
    console.error("[scrape API]", err);
    return NextResponse.json(
      { error: "Scraping failed. Make sure Chrome is installed (set CHROME_PATH if needed)." },
      { status: 500 },
    );
  } finally {
    await browser?.close().catch(() => {});
  }
}
