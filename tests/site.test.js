/**
 * Ensemble Website Test Suite
 *
 * Tests: HTML structure, internal links, security basics,
 * accessibility, cross-page consistency, and content integrity.
 *
 * Run: node tests/site.test.js
 */

const fs = require("fs");
const path = require("path");
const { load } = require("cheerio");

const DOCS = path.join(__dirname, "..", "docs");
// The site is a single page. PAGES holds the real, fully-built pages that the
// structure/nav/footer/security checks apply to.
//
// REDIRECT_STUBS are the old multi-page URLs, kept only so existing external
// links do not 404. They are bare meta-refresh documents with no CSS, JS, nav,
// or footer, so the PAGES checks deliberately do not apply to them.
//
// ambassadors.html is excluded from both — it is unlinked from site navigation
// and reachable by direct URL only, so nav-consistency checks do not apply to
// it. Its Notion form links are covered separately below.
const PAGES = ["index.html"];
const REDIRECT_STUBS = ["about.html", "research.html", "events.html"];

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  \x1b[32mPASS\x1b[0m ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`  \x1b[31mFAIL\x1b[0m ${name}`);
    console.log(`       ${e.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

function loadPage(filename) {
  const html = fs.readFileSync(path.join(DOCS, filename), "utf-8");
  return load(html);
}

// ─── File existence ──────────────────────────────────────────

console.log("\n--- File existence ---");

for (const page of PAGES) {
  test(`${page} exists`, () => {
    assert(fs.existsSync(path.join(DOCS, page)), `${page} not found`);
  });
}

test("style.css exists", () => {
  assert(fs.existsSync(path.join(DOCS, "style.css")), "style.css not found");
});

test("script.js exists", () => {
  assert(fs.existsSync(path.join(DOCS, "script.js")), "script.js not found");
});

test("CNAME exists", () => {
  assert(fs.existsSync(path.join(DOCS, "CNAME")), "CNAME not found");
});

test("CNAME contains correct domain", () => {
  const cname = fs.readFileSync(path.join(DOCS, "CNAME"), "utf-8").trim();
  assert(cname === "ensemblelondon.org", `Expected ensemblelondon.org, got "${cname}"`);
});

// ─── HTML structure & validity ───────────────────────────────

console.log("\n--- HTML structure ---");

for (const page of PAGES) {
  const $ = loadPage(page);

  test(`${page}: has DOCTYPE`, () => {
    const html = fs.readFileSync(path.join(DOCS, page), "utf-8");
    assert(html.trimStart().startsWith("<!DOCTYPE html>"), "Missing DOCTYPE");
  });

  test(`${page}: has lang attribute`, () => {
    assert($("html").attr("lang") === "en", 'Missing lang="en" on <html>');
  });

  test(`${page}: has charset meta`, () => {
    assert($('meta[charset="UTF-8"]').length > 0, "Missing charset meta");
  });

  test(`${page}: has viewport meta`, () => {
    assert($('meta[name="viewport"]').length > 0, "Missing viewport meta");
  });

  test(`${page}: has title`, () => {
    const title = $("title").text();
    assert(title && title.length > 0, "Missing or empty title");
    assert(title.includes("Ensemble"), `Title should include "Ensemble", got "${title}"`);
  });

  test(`${page}: has meta description`, () => {
    const desc = $('meta[name="description"]').attr("content");
    assert(desc && desc.length > 20, "Missing or too short meta description");
  });

  test(`${page}: links style.css`, () => {
    assert($('link[href="style.css"]').length > 0, "Missing style.css link");
  });

  test(`${page}: loads script.js`, () => {
    assert($('script[src="script.js"]').length > 0, "Missing script.js");
  });

  test(`${page}: script.js is at end of body`, () => {
    const html = fs.readFileSync(path.join(DOCS, page), "utf-8");
    const scriptPos = html.lastIndexOf('src="script.js"');
    const bodyClosePos = html.lastIndexOf("</body>");
    assert(scriptPos < bodyClosePos, "script.js should be before </body>");
  });
}

// ─── Navigation consistency ──────────────────────────────────

console.log("\n--- Navigation consistency ---");

for (const page of PAGES) {
  const $ = loadPage(page);

  test(`${page}: has site header`, () => {
    assert($(".site-header").length > 0, "Missing .site-header");
  });

  test(`${page}: has logo linking to /`, () => {
    const logo = $(".logo");
    assert(logo.length > 0, "Missing .logo");
    assert(logo.attr("href") === "/", "Logo should link to /");
  });

  test(`${page}: has desktop nav`, () => {
    assert($(".nav-desktop").length > 0, "Missing .nav-desktop");
  });

  test(`${page}: desktop nav is the single Connect item`, () => {
    const navText = $(".nav-desktop").text();
    assert(navText.includes("Connect"), "Nav missing Connect");
    assert($(".nav-desktop .nav-item").length === 1, `Expected 1 nav item, found ${$(".nav-desktop .nav-item").length}`);
  });

  test(`${page}: has Connect CTA in nav`, () => {
    assert($(".nav-cta").length > 0, "Missing .nav-cta");
  });
}

// ─── Internal link validation ────────────────────────────────

console.log("\n--- Internal links ---");

for (const page of PAGES) {
  const $ = loadPage(page);

  test(`${page}: all internal links resolve to existing files`, () => {
    const broken = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto:") || href === "/" || href === "#") return;
      const file = href.split("#")[0];
      if (file && !fs.existsSync(path.join(DOCS, file))) {
        broken.push(href);
      }
    });
    assert(broken.length === 0, `Broken internal links: ${broken.join(", ")}`);
  });

  test(`${page}: no empty href="#" on important buttons`, () => {
    const placeholders = [];
    $('a.btn[href="#"]').each((_, el) => {
      const text = $(el).text().trim();
      // Allow "Register interest" as known placeholder
      if (!text.includes("Register interest")) {
        placeholders.push(text);
      }
    });
    assert(placeholders.length === 0, `Buttons still pointing to #: ${placeholders.join(", ")}`);
  });
}

// ─── Footer consistency ──────────────────────────────────────

console.log("\n--- Footer ---");

for (const page of PAGES) {
  const $ = loadPage(page);

  test(`${page}: has footer`, () => {
    assert($(".site-footer").length > 0, "Missing .site-footer");
  });

  test(`${page}: footer has copyright`, () => {
    const footerText = $(".footer-bottom__copy").text();
    assert(footerText.includes("2026"), "Copyright should include 2026");
    assert(footerText.includes("Ensemble"), "Copyright should include Ensemble");
  });

  // The hello@ mailbox is not published for now. Contact routes go to
  // LinkedIn instead, so no mailto: should appear anywhere on the site.
  test(`${page}: exposes no email address`, () => {
    const html = fs.readFileSync(path.join(DOCS, page), "utf-8");
    assert(!html.includes("mailto:"), "Found a mailto: link");
    assert(!/[\w.+-]+@[\w-]+\.[\w.]+/.test($("body").text()), "Found an email address in page text");
  });

  test(`${page}: footer has LinkedIn link`, () => {
    const linkedin = $('a[href="https://www.linkedin.com/company/ensemble-london/"]');
    assert(linkedin.length > 0, "Missing LinkedIn link");
    assert(linkedin.attr("target") === "_blank", "LinkedIn should open in new tab");
  });

  // Instagram is hidden for now. The markup is commented out rather than
  // deleted, so this guards against it being uncommented by accident.
  test(`${page}: Instagram icon stays hidden`, () => {
    const ig = $('a[href*="instagram.com"]');
    assert(ig.length === 0, `Instagram link is live again (${ig.length} found)`);
  });

  test(`${page}: no placeholder social links (href="#")`, () => {
    const placeholders = [];
    $(".footer-social a").each((_, el) => {
      if ($(el).attr("href") === "#") placeholders.push($(el).text().trim());
    });
    assert(placeholders.length === 0, `Placeholder social links: ${placeholders.join(", ")}`);
  });
}

// ─── Security checks ────────────────────────────────────────

console.log("\n--- Security ---");

for (const page of PAGES) {
  const $ = loadPage(page);

  test(`${page}: external links have target="_blank"`, () => {
    const missing = [];
    $('a[href^="http"]').each((_, el) => {
      const href = $(el).attr("href");
      if (!$(el).attr("target")) {
        missing.push(href);
      }
    });
    assert(missing.length === 0, `External links missing target="_blank": ${missing.join(", ")}`);
  });

  test(`${page}: no inline event handlers (XSS surface)`, () => {
    const html = fs.readFileSync(path.join(DOCS, page), "utf-8");
    const handlers = ["onclick", "onerror", "onload", "onmouseover", "onfocus", "onblur"];
    const found = handlers.filter((h) => html.toLowerCase().includes(h + "="));
    assert(found.length === 0, `Inline handlers found: ${found.join(", ")}`);
  });

  test(`${page}: no inline scripts (only script.js)`, () => {
    const scripts = [];
    $("script").each((_, el) => {
      if (!$(el).attr("src")) {
        const content = $(el).html().trim();
        if (content.length > 0) scripts.push(content.substring(0, 50));
      }
    });
    assert(scripts.length === 0, `Inline scripts found: ${scripts.length}`);
  });

  test(`${page}: no forms with action pointing to unknown URLs`, () => {
    $("form").each((_, el) => {
      const action = $(el).attr("action");
      assert(!action || action.startsWith("/") || action.startsWith("mailto:"), `Suspicious form action: ${action}`);
    });
  });

  test(`${page}: no mixed content (http:// resources)`, () => {
    const html = fs.readFileSync(path.join(DOCS, page), "utf-8");
    const httpResources = html.match(/(?:src|href|action)=["']http:\/\//g);
    assert(!httpResources, `Mixed content found: ${httpResources}`);
  });

  test(`${page}: Google Fonts loaded over HTTPS`, () => {
    const googleLinks = $('link[href*="fonts.googleapis.com"]');
    googleLinks.each((_, el) => {
      const href = $(el).attr("href");
      assert(href.startsWith("https://"), `Google Font not over HTTPS: ${href}`);
    });
  });
}

// ─── script.js security ─────────────────────────────────────

console.log("\n--- Script security ---");

test("script.js: no use of innerHTML", () => {
  const js = fs.readFileSync(path.join(DOCS, "script.js"), "utf-8");
  assert(!js.includes("innerHTML"), "innerHTML found — use textContent or DOM methods instead");
});

test("script.js: no use of document.write", () => {
  const js = fs.readFileSync(path.join(DOCS, "script.js"), "utf-8");
  assert(!js.includes("document.write"), "document.write found — avoid this");
});

test("script.js: no use of eval", () => {
  const js = fs.readFileSync(path.join(DOCS, "script.js"), "utf-8");
  assert(!js.match(/\beval\s*\(/), "eval() found — avoid this");
});

test("script.js: no use of Function constructor", () => {
  const js = fs.readFileSync(path.join(DOCS, "script.js"), "utf-8");
  assert(!js.match(/new\s+Function\s*\(/), "new Function() found — avoid this");
});

test('script.js: uses "use strict"', () => {
  const js = fs.readFileSync(path.join(DOCS, "script.js"), "utf-8");
  assert(js.includes('"use strict"'), 'Missing "use strict"');
});

// ─── CSS checks ──────────────────────────────────────────────

console.log("\n--- CSS ---");

test("style.css: defines CSS custom properties", () => {
  const css = fs.readFileSync(path.join(DOCS, "style.css"), "utf-8");
  assert(css.includes(":root"), "Missing :root with custom properties");
  assert(css.includes("--bg"), "Missing --bg custom property");
  assert(css.includes("--text"), "Missing --text custom property");
  assert(css.includes("--green"), "Missing --green custom property");
  assert(!/var\(--ink/.test(css), "Leftover --ink reference; the accent token is --green");
});

test("style.css: font tokens are the IBM Plex Mono / Lora pairing", () => {
  const css = fs.readFileSync(path.join(DOCS, "style.css"), "utf-8");
  assert(/--font-sans:\s*"IBM Plex Mono"/.test(css), "--font-sans should lead with IBM Plex Mono");
  assert(/--font-serif:\s*"Lora"/.test(css), "--font-serif should lead with Lora");
});

test("style.css: has responsive breakpoints", () => {
  const css = fs.readFileSync(path.join(DOCS, "style.css"), "utf-8");
  assert(css.includes("@media"), "No @media queries found");
  assert(css.includes("1024px") || css.includes("768px"), "Missing common breakpoints");
});

test("style.css: no !important overuse", () => {
  const css = fs.readFileSync(path.join(DOCS, "style.css"), "utf-8");
  const count = (css.match(/!important/g) || []).length;
  assert(count <= 5, `Too many !important (${count}) — indicates specificity issues`);
});

// ─── Fonts ───────────────────────────────────────────────────

console.log("\n--- Fonts ---");

// Any page using style.css must request both families, or the mono/serif
// tokens silently fall back to system faces.
for (const page of [...PAGES, "ambassadors.html"]) {
  test(`${page}: requests both font families`, () => {
    const $ = loadPage(page);
    const hrefs = $('link[href*="fonts.googleapis.com/css2"]')
      .map((_, el) => $(el).attr("href"))
      .get()
      .join(" ");
    assert(hrefs.includes("IBM+Plex+Mono"), "Missing IBM Plex Mono");
    assert(hrefs.includes("Lora"), "Missing Lora");
  });
}

// ─── Accessibility ───────────────────────────────────────────

console.log("\n--- Accessibility ---");

for (const page of PAGES) {
  const $ = loadPage(page);

  test(`${page}: has exactly one <h1>`, () => {
    const h1Count = $("h1").length;
    assert(h1Count === 1, `Expected 1 <h1>, found ${h1Count}`);
  });

  test(`${page}: images have alt text`, () => {
    const missing = [];
    $("img").each((_, el) => {
      if (!$(el).attr("alt") && $(el).attr("alt") !== "") missing.push($(el).attr("src"));
    });
    assert(missing.length === 0, `Images missing alt: ${missing.join(", ")}`);
  });

  test(`${page}: social links have aria-labels`, () => {
    const missing = [];
    $(".footer-social a").each((_, el) => {
      if (!$(el).attr("aria-label")) missing.push($(el).text().trim());
    });
    assert(missing.length === 0, `Social links missing aria-label: ${missing.join(", ")}`);
  });

  test(`${page}: SVG icons in nav have no conflicting aria`, () => {
    $("svg.nav-chevron").each((_, el) => {
      // Decorative SVGs should not expose meaningless text to screen readers
      assert(!$(el).attr("role") || $(el).attr("role") === "presentation", "Decorative SVG has wrong role");
    });
  });
}

// ─── Content integrity ───────────────────────────────────────

console.log("\n--- Content integrity ---");

test("index.html: has hero section", () => {
  const $ = loadPage("index.html");
  assert($(".hero").length > 0, "Missing hero section");
  assert($(".hero__title").text().length > 10, "Hero title too short");
});

test("index.html: is the only real page in the site", () => {
  const realPages = fs
    .readdirSync(DOCS)
    .filter((f) => f.endsWith(".html"))
    .filter((f) => f !== "ambassadors.html")
    .filter((f) => !REDIRECT_STUBS.includes(f));
  assert(
    realPages.length === 1 && realPages[0] === "index.html",
    `Expected index.html only, found: ${realPages.join(", ")}`
  );
});

test("index.html: has no internal page links left", () => {
  const $ = loadPage("index.html");
  const internal = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href && !href.startsWith("http") && href !== "/" && !href.startsWith("#")) {
      internal.push(href);
    }
  });
  assert(internal.length === 0, `Single-page site still links to pages: ${internal.join(", ")}`);
});

test("index.html: describes the events programme", () => {
  const $ = loadPage("index.html");
  const titles = $(".focus-item__title").map((_, el) => $(el).text().trim()).get();
  assert(titles.length === 3, `Expected 3 programme items, found ${titles.length}`);
  for (const expected of ["Public Talks", "Seminars", "Roundtables"]) {
    assert(titles.includes(expected), `Missing programme item: ${expected}`);
  }
});

test("index.html: sections are numbered", () => {
  const $ = loadPage("index.html");
  const nums = $(".section__num").map((_, el) => $(el).text().trim()).get();
  assert(nums.join(",") === "01,02,03", `Expected 01,02,03 — got ${nums.join(",")}`);
});

// Stealth: the domains may be named, the research agenda may not. This guards
// against the detailed focus-area copy being pasted back in.
test("index.html: research stays vague while in stealth", () => {
  const $ = loadPage("index.html");
  const text = $("body").text();
  const tooSpecific = [
    "interpretability",
    "value specification",
    "institutional design",
    "robustness",
    "moral status",
  ].filter((t) => new RegExp(t, "i").test(text));
  assert(tooSpecific.length === 0, `Research detail is back on the page: ${tooSpecific.join(", ")}`);
});

test("index.html: has the manifesto quote", () => {
  const $ = loadPage("index.html");
  assert($(".quote-section__text").text().length > 40, "Missing or short quote");
  assert($(".quote-section__attr").text().includes("Ensemble"), "Quote missing attribution");
});

test("index.html: stays minimal", () => {
  const $ = loadPage("index.html");
  const sections = $("section").length;
  assert(sections <= 5, `Home page has grown to ${sections} sections; keep it lean`);
});

test("index.html: has OG meta tags", () => {
  const $ = loadPage("index.html");
  assert($('meta[property="og:title"]').length > 0, "Missing og:title");
  assert($('meta[property="og:description"]').length > 0, "Missing og:description");
});

test("ambassadors.html: ambassador apply links to Notion form", () => {
  const $ = loadPage("ambassadors.html");
  const applyLinks = $('a[href*="notion.site"]');
  assert(applyLinks.length >= 2, `Expected 2 Notion form links, found ${applyLinks.length}`);
});

test("ambassadors.html: is hidden from search and unlinked from nav", () => {
  const $ = loadPage("ambassadors.html");
  assert($('meta[name="robots"]').attr("content") === "noindex", "Missing noindex meta");
  for (const page of PAGES) {
    const $page = loadPage(page);
    assert(
      $page('a[href*="ambassadors.html"]').length === 0,
      `${page} still links to ambassadors.html`
    );
  }
});

// ─── Redirect stubs ──────────────────────────────────────────

console.log("\n--- Redirect stubs ---");

for (const stub of REDIRECT_STUBS) {
  test(`${stub}: exists so old links do not 404`, () => {
    assert(fs.existsSync(path.join(DOCS, stub)), `${stub} not found`);
  });

  test(`${stub}: redirects to the home page`, () => {
    const $ = loadPage(stub);
    const refresh = $('meta[http-equiv="refresh"]').attr("content");
    assert(refresh, "Missing meta refresh");
    assert(/^0;\s*url=\/$/.test(refresh), `Expected "0; url=/", got "${refresh}"`);
  });

  test(`${stub}: is noindex with a canonical pointing home`, () => {
    const $ = loadPage(stub);
    assert($('meta[name="robots"]').attr("content") === "noindex", "Missing noindex");
    assert(
      $('link[rel="canonical"]').attr("href") === "https://ensemblelondon.org/",
      "Canonical should point at the site root"
    );
  });

  test(`${stub}: has a no-JS fallback link home`, () => {
    const $ = loadPage(stub);
    assert($('a[href="/"]').length > 0, "Missing manual link to /");
  });

  test(`${stub}: carries no scripts`, () => {
    const $ = loadPage(stub);
    assert($("script").length === 0, "Redirect stub should contain no scripts");
  });
}

// ─── Cross-page link consistency ─────────────────────────────

console.log("\n--- Cross-page links ---");

test("All pages reference each other correctly in nav", () => {
  const navLinks = new Set();
  for (const page of PAGES) {
    const $ = loadPage(page);
    $(".nav-desktop a, .nav-dropdown a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && !href.startsWith("#") && !href.startsWith("mailto:") && !href.startsWith("http")) {
        navLinks.add(href.split("#")[0]);
      }
    });
  }
  const missing = [];
  for (const link of navLinks) {
    if (link && !fs.existsSync(path.join(DOCS, link))) {
      missing.push(link);
    }
  }
  assert(missing.length === 0, `Nav links to non-existent pages: ${missing.join(", ")}`);
});

test("All anchor targets exist on their pages", () => {
  const broken = [];
  for (const page of PAGES) {
    const $ = loadPage(page);
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || !href.includes("#") || href === "#" || href.startsWith("http") || href.startsWith("mailto:")) return;
      const [file, anchor] = href.split("#");
      if (!anchor) return;
      const targetFile = file || page;
      if (!fs.existsSync(path.join(DOCS, targetFile))) return; // caught by other test
      const $target = loadPage(targetFile);
      if ($target(`#${anchor}`).length === 0) {
        broken.push(`${page} -> ${href}`);
      }
    });
  }
  assert(broken.length === 0, `Broken anchor links: ${broken.join(", ")}`);
});

// ─── Summary ─────────────────────────────────────────────────

console.log("\n" + "=".repeat(50));
console.log(`\x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m`);

if (failures.length > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  - ${f.name}: ${f.error}`));
}

console.log();
process.exit(failed > 0 ? 1 : 0);
