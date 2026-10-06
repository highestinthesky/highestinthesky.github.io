const assert = require("node:assert/strict");
const test = require("node:test");
const { gatherRepos } = require("../scripts/capture-snapshots.cjs");

test("a failed optional repository does not stop healthy owner pages refreshing", async () => {
  const repo = { id: 1, name: "demo", owner: { login: "example" }, homepage: "https://example.github.io/demo/", has_pages: true };
  const repos = await gatherRepos({ username: "example", extraRepos: ["missing/repo"] }, async url => {
    if (url.includes("/users/example/repos")) return { ok: true, json: async () => [repo] };
    return { ok: false, status: 404 };
  }, { warn() {} });
  assert.deepEqual(repos, [repo]);
});

test("a failed owner lookup aborts rather than publishing an incomplete configuration", async () => {
  await assert.rejects(gatherRepos({ username: "example" }, async () => ({ ok: false, status: 403 })), /HTTP 403/);
});
