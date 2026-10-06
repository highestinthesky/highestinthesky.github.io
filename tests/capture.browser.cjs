const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright");

test("capture saves a real rendered page, skips fresh images, and retains successes through an outage", async () => {
  const { refreshSnapshots } = require("../scripts/capture-snapshots.cjs");
  let status = 200, requests = 0;
  const server = http.createServer((req, res) => {
    requests++;
    res.writeHead(status, { "Content-Type": "text/html" });
    res.end('<body style="background:#2f6fed"><h1>Actual live page</h1><script>document.body.append("Rendered with JavaScript")</script>');
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const outputDir = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-capture-"));
  let browser;
  const repo = { name: "demo", owner: { login: "example" }, homepage: `http://127.0.0.1:${server.address().port}/demo`, has_pages: true };
  try {
    browser = await chromium.launch({ headless: true });
    const options = { repos: [repo], outputDir, browser, now: new Date("2026-10-06T12:00:00Z"), config: { username: "example" }, log: { info() {}, warn() {} } };
    const first = await refreshSnapshots({ ...options, settings: { name: "Keep this", snapshotRefreshHours: 168 } });
    const saved = first.settings.snapshots["example/demo"];
    assert.equal(saved.url, repo.homepage);
    assert.equal(saved.capturedAt, "2026-10-06T12:00:00.000Z");
    assert.equal(first.settings.name, "Keep this");
    const image = await fs.readFile(path.join(outputDir, saved.image));
    assert.equal(image.subarray(0, 2).toString("hex"), "ffd8", "Saves an actual JPEG");
    assert.ok(image.length > 1000);
    const before = requests;
    const fresh = await refreshSnapshots({ ...options, settings: first.settings });
    assert.equal(requests, before, "Fresh captures do not load the page again");
    assert.equal(fresh.updated, 0);
    status = 404;
    const failed = await refreshSnapshots({ ...options, settings: first.settings, force: true });
    assert.equal(failed.failed, 1);
    assert.deepEqual(failed.settings.snapshots["example/demo"], saved);
    assert.deepEqual(await fs.readFile(path.join(outputDir, saved.image)), image);
    const absent = await refreshSnapshots({ ...options, repos: [{ ...repo, name: "gone" }], settings: {} });
    assert.equal(absent.failed, 0, "An absent site without a previous capture is skipped rather than failing every daily run");
    assert.deepEqual(absent.settings.snapshots, {});
    status = 200;
    const moved = { ...repo, homepage: repo.homepage + "/new" };
    const changed = await refreshSnapshots({ ...options, repos: [moved], settings: first.settings });
    assert.equal(changed.updated, 1, "Changing a live URL captures immediately despite a fresh timestamp");
    assert.equal(changed.settings.snapshots["example/demo"].url, moved.homepage);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(outputDir, { recursive: true, force: true });
  }
});
