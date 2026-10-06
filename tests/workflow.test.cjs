const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const test = require("node:test");

test("a fresh capture run retries an undeployed or failed Pages build", async () => {
  const root = path.join(__dirname, "..");
  const workflow = await fs.readFile(path.join(root, ".github/workflows/refresh-snapshots.yml"), "utf8");
  const step = workflow.match(/- name: Rebuild Pages[^\n]*\n[\s\S]*?run: \|\n((?: {10}[^\n]*\n)+)/);
  assert.ok(step, "Workflow has a deployment recovery step independent of new captures");
  const script = step[1].replace(/^ {10}/gm, "");
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-workflow-"));
  const requestLog = path.join(directory, "requests");
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  try {
    // Substitute only the external API; execute the real workflow shell logic.
    await fs.writeFile(path.join(directory, "gh"), `#!/bin/sh
if [ "$2" = "--method" ]; then
  printf '%s\\n' "$*" >> "$REQUEST_LOG"
else
  printf '%s\\t%s\\n' "$DEPLOYED_COMMIT" "$DEPLOYED_STATUS"
fi
`, { mode: 0o755 });
    for (const [commit, status, expected] of [["old-revision", "built", 1], [head, "errored", 1], [head, "built", 0], [head, "building", 0]]) {
      await fs.writeFile(requestLog, "");
      execFileSync("bash", ["-e", "-c", script], {
        cwd: root,
        env: { ...process.env, PATH: directory + path.delimiter + process.env.PATH, GITHUB_REPOSITORY: "example/portfolio", REQUEST_LOG: requestLog, DEPLOYED_COMMIT: commit, DEPLOYED_STATUS: status },
      });
      const calls = (await fs.readFile(requestLog, "utf8")).trim().split("\n").filter(Boolean);
      assert.equal(calls.length, expected, `${commit}/${status}`);
      if (expected) assert.equal(calls[0], "api --method POST repos/example/portfolio/pages/builds");
    }
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
