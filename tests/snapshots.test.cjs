const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function appHarness(published = {}) {
  const element = { addEventListener() {}, setAttribute() {}, classList: { toggle() {} }, style: {}, dataset: {} };
  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const shared = path.join(__dirname, "..", "site-settings.js");
  const context = vm.createContext({
    SiteSettings: fs.existsSync(shared) ? require(shared) : {},
    document: { querySelector: () => element, querySelectorAll: () => [], addEventListener() {}, documentElement: element },
    localStorage: { getItem: () => null, setItem() {} },
    location: { search: "" },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    IntersectionObserver: class { observe() {} },
    URL, URLSearchParams, Map, Set, setTimeout, clearTimeout,
    published,
  });
  vm.runInContext(source.replace(/\nboot\(\);\s*$/, ""), context);
  vm.runInContext("PUBLISHED = published; computeOverrides();", context);
  return context;
}

const repo = { id: 1, name: "demo", owner: { login: "highestinthesky" }, homepage: "https://example.com/demo/", has_pages: true };
const snapshot = { url: repo.homepage, image: "snapshots/highestinthesky/demo.jpg", capturedAt: "2026-10-06T12:00:00.000Z" };

test("live cards display the saved page screenshot instead of the GitHub image", () => {
  const h = appHarness({ snapshots: { "highestinthesky/demo": snapshot } });
  h.repo = repo;
  const markup = vm.runInContext("projectMedia(repo)", h);
  assert.match(markup, /src="snapshots\/highestinthesky\/demo.jpg\?v=/);
  assert.doesNotMatch(markup, /opengraph\.githubassets\.com|<iframe/);
});

test("an uncaptured or moved live page gets an honest placeholder", () => {
  const h = appHarness({ snapshots: { "highestinthesky/demo": { ...snapshot, url: "https://old.example.com/" } } });
  h.repo = repo;
  const markup = vm.runInContext("projectMedia(repo)", h);
  assert.doesNotMatch(markup, /<img|<iframe|opengraph\.githubassets\.com/);
  assert.match(markup, /Snapshot pending/);
});

test("publishing a stale browser draft preserves newer automated snapshots", () => {
  const h = appHarness({ featured: ["demo"], snapshotRefreshHours: 24, snapshots: { "highestinthesky/demo": snapshot } });
  h.latest = { snapshots: { "highestinthesky/demo": { ...snapshot, capturedAt: "2026-10-07T12:00:00.000Z" } } };
  const config = JSON.parse(vm.runInContext("JSON.stringify(buildConfigObject(latest))", h));
  assert.equal(config.snapshots?.["highestinthesky/demo"].capturedAt, "2026-10-07T12:00:00.000Z");
  assert.equal(config.snapshotRefreshHours, 24);
  assert.deepEqual(config.featured, ["demo"]);
});

test("snapshot keys distinguish repositories with the same name", () => {
  const h = appHarness({ snapshots: { "other/demo": snapshot } });
  h.repo = repo;
  assert.doesNotMatch(vm.runInContext("projectMedia(repo)", h), /<img/);
});

test("a temporary page outage retains the saved visual", () => {
  const h = appHarness({ snapshots: { "highestinthesky/demo": snapshot } });
  h.repo = repo;
  vm.runInContext("pageAvailability.set(repo.homepage, false)", h);
  assert.match(vm.runInContext("projectMedia(repo)", h), /snapshots\/highestinthesky\/demo.jpg/);
});
