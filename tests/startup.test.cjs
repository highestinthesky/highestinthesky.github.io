const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

function startupHarness() {
  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const start = source.lastIndexOf("async function boot() {");
  const end = source.indexOf("\nboot();", start);
  assert.ok(start >= 0 && end > start, "boot function exists");

  const config = deferred();
  const profile = deferred();
  const repos = deferred();
  const validation = deferred();
  const calls = [];
  const context = {
    CONFIG: { username: "example" },
    PUBLISHED: {}, PROFILE: null, REPOS: [],
    loadDraft() { calls.push("draft"); },
    fetch() { calls.push("config"); return config.promise; },
    cachedJSON() { calls.push("profile"); return profile.promise; },
    gatherRepos() { calls.push("repos"); return repos.promise; },
    validateGithubPages() { calls.push("validation"); return validation.promise; },
    populateLangFilter() { calls.push("filter"); },
    renderAllSections() { calls.push("render"); },
    $() { throw new Error("Unexpected error UI"); },
    esc: String,
  };
  vm.runInNewContext(source.slice(start, end), context);
  return { context, calls, config, profile, repos, validation };
}

test("starts independent startup requests without waiting for config", async () => {
  const h = startupHarness();
  const running = h.context.boot();
  assert.deepEqual(h.calls, ["draft", "config", "profile", "repos"]);
  h.config.resolve({ ok: true, json: async () => ({ name: "Published" }) });
  h.profile.resolve({ login: "example" });
  h.repos.resolve([]);
  h.validation.resolve();
  await running;
  assert.equal(h.context.PUBLISHED.name, "Published");
});

test("renders GitHub data while live-site checks are still pending", async () => {
  const h = startupHarness();
  const running = h.context.boot();
  h.config.resolve({ ok: true, json: async () => ({}) });
  h.profile.resolve({ login: "example" });
  h.repos.resolve([{ id: 1, name: "sample" }]);
  await new Promise(setImmediate);
  assert.equal(h.context.REPOS.length, 1);
  assert.equal(h.calls.filter(call => call === "render").length, 1);
  h.validation.resolve();
  await running;
});

test("refreshes missing-page labels without dropping loaded previews", async () => {
  const h = startupHarness();
  h.context.loadedLivePreviews = new Set(["example/sample"]);
  const running = h.context.boot();
  h.config.resolve({ ok: true, json: async () => ({}) });
  h.profile.resolve({ login: "example" });
  h.repos.resolve([{ id: 1, name: "sample" }]);
  await running;
  h.validation.resolve(true);
  await new Promise(setImmediate);
  assert.equal(h.calls.filter(call => call === "render").length, 2);
  assert.equal(h.context.loadedLivePreviews.size, 0);
});
