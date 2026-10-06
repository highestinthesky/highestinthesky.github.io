const assert = require("node:assert/strict");
const { test } = require("node:test");
const { chromium, webkit } = require("playwright");

const url = process.env.PORTFOLIO_URL || "http://127.0.0.1:8765";
const repos = ["zeta", "alpha", "beta"].map((name, index) => ({
  id: index + 1, name, owner: { login: "highestinthesky" },
  html_url: `https://github.com/highestinthesky/${name}`,
  description: `A real project called ${name}.`, language: "JavaScript",
  pushed_at: `2026-10-0${6 - index}T12:00:00Z`, created_at: "2026-01-01T12:00:00Z",
  stargazers_count: index, fork: false, archived: false, topics: [], has_pages: false,
}));

async function fixture(engine, options = {}) {
  const browser = await engine.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...options });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("https://fonts.googleapis.com/**", route => route.fulfill({ contentType: "text/css", body: "" }));
  await page.route("https://api.github.com/**", route => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname === "/users/highestinthesky" ? {
      login: "highestinthesky", name: "Haolun", bio: "Student, I make stuff",
      html_url: "https://github.com/highestinthesky",
    } : pathname === "/users/highestinthesky/repos" ? repos : { tree: [] };
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.route("**/config.json?*", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ sections: ["all"], featured: [] }) }));
  return { page, errors, close: () => browser.close() };
}

async function openIndex(page, { effects = true } = {}) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator("#repo-grid .card").first().waitFor();
  if (effects) await page.locator("#motion-toggle").waitFor();
  await page.locator("#rail-all").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector("[data-flair-moving]"));
}

for (const [name, engine] of [["Chromium", chromium], ["WebKit", webkit]]) {
  test(`${name}: sorting moves existing cards and settles without losing focused controls`, async () => {
    const h = await fixture(engine);
    try {
      await openIndex(h.page);
      await h.page.evaluate(() => {
        window.originalCard = document.querySelector('#repo-grid [data-name="alpha"]');
        originalCard.querySelector(".repo-title").focus();
        renderAll();
      });
      assert.equal(await h.page.evaluate(() => document.activeElement === originalCard.querySelector(".repo-title")), true);
      await h.page.locator("#sort").selectOption("name");
      assert.ok(await h.page.locator("#repo-grid [data-flair-moving]").count() > 0, "Changed slots should animate");
      await h.page.waitForFunction(() => !document.querySelector("[data-flair-moving]"));
      assert.deepEqual(await h.page.locator("#repo-grid .repo-title").allTextContents(), ["alpha", "beta", "zeta"]);
      assert.equal(await h.page.evaluate(() => originalCard === document.querySelector('#repo-grid [data-name="alpha"]')), true);
      assert.equal(await h.page.evaluate(() => originalCard.style.transform), "");
      await h.page.evaluate(() => {
        window.focusedCard = document.querySelector('#repo-grid [data-name="zeta"]');
        focusedCard.querySelector(".repo-title").focus();
        document.querySelector("#sort").value = "updated";
        renderAll();
      });
      assert.equal(await h.page.evaluate(() => document.activeElement === focusedCard.querySelector(".repo-title")), true, "Moving a focused card should keep its focus");
      assert.deepEqual(h.errors, []);
    } finally { await h.close(); }
  });

  test(`${name}: cursor ink expires and pause cancels motion and persists`, async () => {
    const h = await fixture(engine);
    try {
      await h.page.goto(url, { waitUntil: "domcontentloaded" });
      await h.page.locator("#repo-grid .card").first().waitFor();
      await h.page.locator("#motion-toggle").waitFor();
      await h.page.mouse.move(70, 230);
      await h.page.mouse.move(420, 255, { steps: 28 });
      assert.ok(await h.page.evaluate(() => [...document.querySelectorAll(".cursor-ink__stroke")].some(el => parseFloat(getComputedStyle(el).opacity) > 0)), "Mouse motion should leave colored ink");
      assert.ok(await h.page.locator(".cursor-ink__stroke").count() <= 18, "Ink must have a bounded pool");
      await h.page.waitForFunction(() => [...document.querySelectorAll(".cursor-ink__stroke")].every(el => parseFloat(getComputedStyle(el).opacity) === 0));
      await openIndex(h.page);
      await h.page.locator("#sort").selectOption("name");
      await h.page.locator("#motion-toggle").click();
      assert.equal(await h.page.locator("#motion-toggle").getAttribute("aria-pressed"), "false");
      assert.equal(await h.page.locator("[data-flair-moving]").count(), 0);
      await h.page.reload({ waitUntil: "domcontentloaded" });
      await h.page.locator("#motion-toggle").waitFor();
      assert.equal(await h.page.locator("#motion-toggle").getAttribute("aria-pressed"), "false");
      await h.page.mouse.move(70, 230);
      await h.page.mouse.move(420, 255, { steps: 16 });
      assert.equal(await h.page.evaluate(() => [...document.querySelectorAll(".cursor-ink__stroke")].some(el => parseFloat(getComputedStyle(el).opacity) > 0)), false);
      assert.deepEqual(h.errors, []);
    } finally { await h.close(); }
  });

  test(`${name}: reduced motion cancels active effects and keeps every project readable`, async () => {
    const h = await fixture(engine);
    try {
      await openIndex(h.page);
      await h.page.locator("#sort").selectOption("name");
      await h.page.emulateMedia({ reducedMotion: "reduce" });
      await h.page.waitForFunction(() => document.querySelector("#motion-toggle")?.disabled);
      assert.equal(await h.page.locator("[data-flair-moving]").count(), 0);
      assert.equal(await h.page.locator("#repo-grid .card").count(), 3);
      assert.equal(await h.page.evaluate(() => [...document.querySelectorAll("#repo-grid .card")].every(el => getComputedStyle(el).opacity === "1" && !el.style.transform)), true);
      await h.page.reload({ waitUntil: "domcontentloaded" });
      await openIndex(h.page);
      assert.equal(await h.page.locator("[data-flair-moving]").count(), 0);
      assert.deepEqual(h.errors, []);
    } finally { await h.close(); }
  });
}

test("Touch: no cursor emitter or overflow at the mobile floor", async () => {
  const h = await fixture(webkit, { viewport: { width: 320, height: 812 }, isMobile: true, hasTouch: true });
  try {
    await openIndex(h.page);
    assert.equal(await h.page.locator(".cursor-ink").count(), 0);
    assert.equal(await h.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(h.errors, []);
  } finally { await h.close(); }
});

test("Missing animation library: the portfolio still loads, filters, and opens previews", async () => {
  const h = await fixture(chromium);
  await h.page.route("**/vendor/anime*.js", route => route.abort());
  try {
    await openIndex(h.page, { effects: false });
    await h.page.locator("#search").fill("alpha");
    assert.deepEqual(await h.page.locator("#repo-grid .repo-title").allTextContents(), ["alpha"]);
    await h.page.locator("#repo-grid .repo-title").click();
    await h.page.locator("#preview[open]").waitFor();
    assert.equal(await h.page.locator("#motion-toggle").isVisible(), false);
    assert.deepEqual(h.errors, []);
  } finally { await h.close(); }
});

test("Stalled animation library: the portfolio loads and controls work before effects arrive", async () => {
  const h = await fixture(chromium);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await h.page.route("**/vendor/anime*.js", async route => {
    await gate;
    await route.continue().catch(() => {});
  });
  try {
    await h.page.goto(url, { waitUntil: "commit" });
    await h.page.locator("#repo-grid .card").first().waitFor({ timeout: 1500 });
    await h.page.locator("#theme-toggle").click();
    assert.equal(await h.page.locator("html").getAttribute("data-theme"), "light");
    await h.page.locator("#search").fill("alpha");
    assert.deepEqual(await h.page.locator("#repo-grid .repo-title").allTextContents(), ["alpha"]);
    release();
    await h.page.locator("#motion-toggle").waitFor();
    assert.deepEqual(h.errors, []);
  } finally { release(); await h.close(); }
});
