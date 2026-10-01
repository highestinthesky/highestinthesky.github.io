/* Run with `node tests/mobile.browser.cjs`; requires Playwright browsers.
   PORTFOLIO_URL overrides the local preview URL. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const { chromium, webkit } = require("playwright");

const url = process.env.PORTFOLIO_URL || "http://127.0.0.1:8765";
const live = "https://highestinthesky.github.io/example-project/";
const repo = {
  id: 1, name: "example-project", owner: { login: "highestinthesky" },
  homepage: live, has_pages: true, html_url: "https://github.com/highestinthesky/example-project",
  language: "JavaScript", description: "An interactive project.", default_branch: "main",
  pushed_at: "2026-09-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z",
  stargazers_count: 0, fork: false, archived: false, topics: [],
};

async function fixture(engine, width = 375, { holdFonts = false } = {}) {
  const browser = await engine.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height: 812 }, isMobile: true, hasTouch: true });
  let releaseFonts;
  const fonts = new Promise(resolve => { releaseFonts = resolve; });
  const documents = [];
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", req => {
    if (req.resourceType() === "document" && req.url() === live) documents.push(req.url());
  });
  await page.route("https://fonts.googleapis.com/**", async route => {
    if (holdFonts) await fonts;
    await route.fulfill({ contentType: "text/css", body: "" }).catch(() => {});
  });
  await page.route("https://api.github.com/**", route => {
    const requestUrl = new URL(route.request().url());
    let body;
    if (requestUrl.pathname === "/users/highestinthesky") {
      body = { login: "highestinthesky", name: "Haolun", bio: "Building interactive projects.", html_url: "https://github.com/highestinthesky" };
    } else if (requestUrl.pathname === "/users/highestinthesky/repos") body = [repo];
    else if (requestUrl.pathname.includes("/git/trees/")) body = { tree: [] };
    else body = {};
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.route("**/config.json?*", route => route.fulfill({ contentType: "application/json", body: "{}" }));
  await page.route(live, route => route.fulfill({ contentType: "text/html", body: `
    <input id="late-focus" aria-label="Embedded autofocus">
    <script>setTimeout(() => document.getElementById('late-focus').focus(), 4200);</script>` }));
  await page.route("https://opengraph.githubassets.com/**", route => route.fulfill({
    contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"><rect width="1200" height="600" fill="#ddd"/></svg>',
  }));
  await page.addInitScript(() => {
    if (window !== top) return;
    window.scriptScrolls = [];
    const scroll = window.scrollTo;
    window.scrollTo = function(...args) { scriptScrolls.push(args); return scroll.apply(this, args); };
  });
  return { page, documents, errors, releaseFonts, async close() { releaseFonts(); await browser.close(); } };
}

for (const [name, engine] of [["Chromium", chromium], ["WebKit", webkit]]) {
  test(`${name}: controls work while the font stylesheet is stalled`, async () => {
    const h = await fixture(engine, 375, { holdFonts: true });
    try {
      await h.page.goto(url, { waitUntil: "commit" });
      await h.page.waitForFunction(() => document.querySelector("#theme-toggle svg"), null, { timeout: 1500 });
      await h.page.locator("#theme-toggle").click();
      assert.equal(await h.page.locator("html").getAttribute("data-theme"), "light");
      assert.deepEqual(h.errors, []);
    } finally { await h.close(); }
  });

  for (const width of [320, 375, 414, 768]) {
    test(`${name} ${width}px: cards stay passive until a visitor opens a preview`, async () => {
      const h = await fixture(engine, width);
      try {
        await h.page.goto(url, { waitUntil: "domcontentloaded" });
        await h.page.locator("#featured-grid .card").waitFor();
        assert.deepEqual(await h.page.evaluate(() => scriptScrolls), [], "Startup must not override the visitor's scroll position");
        await h.page.locator("#featured-grid").scrollIntoViewIfNeeded();
        // Keep the slow embedded autofocus beyond the old three-second polling window.
        await h.page.waitForTimeout(5000);
        assert.equal(h.documents.length, 0, "Browsing cards must not execute an embedded website");
        const layout = await h.page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
        assert.ok(layout.scrollWidth <= layout.width, "Page must fit its viewport");
        const start = await h.page.evaluate(() => scrollY);
        await h.page.locator("#featured-grid .repo-title").click();
        await h.page.locator("#preview[open] iframe").waitFor();
        await h.page.waitForFunction(() => document.querySelector("#preview iframe")?.contentWindow);
        assert.equal(await h.page.locator("#preview iframe").getAttribute("src"), live);
        await h.page.locator("#preview-close").click();
        await h.page.locator("#preview iframe").waitFor({ state: "detached" });
        assert.equal(await h.page.locator("#preview iframe").count(), 0, "Closing removes the embedded app");
        assert.ok(Math.abs((await h.page.evaluate(() => scrollY)) - start) <= 1, "Preview returns to the same page position");
        assert.deepEqual(h.errors, []);
      } finally { await h.close(); }
    });
  }
}
