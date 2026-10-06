const fs = require("node:fs/promises");
const path = require("node:path");
const { CONFIG, repoKey, pagesUrl, snapshotFor, refreshHours } = require("../site-settings.js");

async function gatherRepos(config = CONFIG, request = fetch, log = console) {
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  async function json(url) {
    const response = await request(url, { headers, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`GitHub discovery failed: HTTP ${response.status}`);
    return response.json();
  }
  async function paged(url) {
    const repos = [];
    for (let page = 1; page <= 5; page++) {
      const batch = await json(`${url}?per_page=100&sort=updated&page=${page}`);
      if (!Array.isArray(batch)) throw new Error("GitHub returned an invalid repository list");
      repos.push(...batch);
      if (batch.length < 100) break;
    }
    return repos;
  }
  const repos = await paged(`https://api.github.com/users/${config.username}/repos`);
  for (const org of config.orgs || []) {
    try { repos.push(...await paged(`https://api.github.com/orgs/${org}/repos`)); }
    catch (error) { log.warn(`Skipping optional organization ${org}: ${error.message}`); }
  }
  for (const full of config.extraRepos || []) {
    try { repos.push(await json(`https://api.github.com/repos/${full}`)); }
    catch (error) { log.warn(`Skipping optional repository ${full}: ${error.message}`); }
  }
  return [...new Map(repos.filter(repo => repo.id).map(repo => [repo.id, repo])).values()];
}

async function refreshSnapshots({ repos, settings, outputDir, config = CONFIG, force = false, now = new Date(), browser, log = console }) {
  const snapshots = { ...settings.snapshots };
  let updated = 0, failed = 0;
  let ownedBrowser;
  try {
    for (const repo of repos) {
      const key = repoKey(repo, config);
      const url = pagesUrl(repo, config);
      const portfolio = (config.repo || `${config.username}/${config.username}.github.io`).toLowerCase();
      if (!url || key === portfolio || settings.hidden?.includes(repo.name)) continue;
      if (config.hideForks && repo.fork || config.hideArchived && repo.archived) continue;
      if (config.images?.[repo.name]) continue;
      // GitHub names make deterministic, local paths; reject unexpected discovery input.
      if (!/^[a-z0-9-]+\/[a-z0-9_.-]+$/i.test(key) || [".", ".."].includes(repo.name)) continue;
      const image = `snapshots/${key}.jpg`;
      const current = snapshotFor(repo, settings, config);
      const imageExists = await fs.access(path.join(outputDir, image)).then(() => true, () => false);
      if (!force && current && imageExists && now - new Date(current.capturedAt) < refreshHours(settings) * 3600000) continue;
      let context, temporary;
      try {
        if (!browser) {
          ownedBrowser ||= await require("playwright").chromium.launch({ headless: true });
          browser = ownedBrowser;
        }
        // A fresh, anonymous context per project. GitHub credentials never enter page requests.
        context = await browser.newContext({ viewport: { width: 1200, height: 750 }, deviceScaleFactor: 1, colorScheme: "light", reducedMotion: "reduce" });
        const page = await context.newPage();
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        if (response?.status() === 404 && !snapshots[key]) {
          log.info(`Skipped ${key}: no public page (HTTP 404)`);
          continue;
        }
        if (!response?.ok()) throw new Error(`Page returned HTTP ${response?.status() || "unknown"}`);
        await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
        await page.evaluate(() => Promise.race([
          Promise.all([document.fonts.ready, ...Array.from(document.images, img => img.complete ? Promise.resolve() : new Promise(resolve => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          }))]),
          new Promise(resolve => setTimeout(resolve, 3000)),
        ]));
        await page.waitForTimeout(1500);
        await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
        const destination = path.join(outputDir, image);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        temporary = destination + ".tmp";
        await page.screenshot({ path: temporary, type: "jpeg", quality: 82, animations: "disabled", timeout: 15000 });
        await fs.rename(temporary, destination);
        snapshots[key] = { url, image, capturedAt: now.toISOString() };
        updated++;
        log.info(`Captured ${key}`);
      } catch (error) {
        failed++;
        log.warn(`Kept previous snapshot for ${key}: ${error.message}`);
      } finally {
        if (temporary) await fs.rm(temporary, { force: true });
        await context?.close();
      }
    }
  } finally {
    await ownedBrowser?.close();
  }
  return { settings: { ...settings, snapshots }, updated, failed };
}

async function main() {
  const outputDir = path.resolve(__dirname, "..");
  const configPath = path.join(outputDir, "config.json");
  const settings = JSON.parse(await fs.readFile(configPath, "utf8"));
  const repos = await gatherRepos();
  const result = await refreshSnapshots({ repos, settings, outputDir, force: process.argv.includes("--force") });
  if (result.updated) {
    await fs.writeFile(configPath + ".tmp", JSON.stringify(result.settings, null, 2) + "\n");
    await fs.rename(configPath + ".tmp", configPath);
  }
  console.info(`${result.updated} refreshed; ${result.failed} failed (previous images retained).`);
  if (result.failed) process.exitCode = 1;
}

module.exports = { gatherRepos, refreshSnapshots };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
