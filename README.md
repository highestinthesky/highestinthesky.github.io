# Auto-updating GitHub Portfolio

A self-updating showcase of your GitHub work. It reads your profile and **all public repos live from the GitHub API in the browser**, so the moment you create a new repo or publish a new GitHub Pages site, it appears here automatically — no rebuild, no redeploy.

- **Live from the source** — a hero panel shows the actual `GET /users/you` request and its real response numbers (repos, followers, stars, live sites).
- **Three discovery rails** — Featured & live, By language, and All projects (search, filter, sort) — each of which you can show, hide, and reorder from inside the site.
- **Site editor** (owner-only) — edit your profile text, arrange page sections, and show/hide/feature/reorder projects, all previewed live in your own browser.
- **One-click publish** — connect a GitHub token once and the editor commits `config.json` straight to this repo. No copying JSON, no visiting github.com.

## Files

| File | Purpose |
|---|---|
| `index.html` | Markup only. |
| `styles.css` | All visual design (colours, type, layout, motion). |
| `app.js` | All behaviour — GitHub API calls, rendering, the site editor, publishing. |
| `site-settings.js` | GitHub account settings and shared live URL / snapshot rules. |
| `config.json` | The published, global content overrides. Edited by the site editor, not by hand. |
| `snapshots/` | Saved JPEG screenshots of the public live pages. |
| `scripts/capture-snapshots.cjs` | Captures screenshots with Chromium and updates the settings. |

## 1. Set your username (required)

Open `site-settings.js` and change the `CONFIG` object:

```js
const CONFIG = {
  username: "YOUR_GITHUB_USERNAME",   //  <-- your GitHub handle
  email: "you@example.com",  // shown in the hero as a mailto: link
  repo: null,               // "owner/name" to publish to — defaults to `${username}.github.io`
  hideForks: false,
  hideArchived: false,
  cacheMinutes: 10,
};
```

That's the only edit needed to go live.

## 2. Deploy to GitHub Pages

1. Create a repo named exactly **`USERNAME.github.io`** (use your own handle).
2. Add this project's files, including `site-settings.js`, `tokens.css`, `snapshots/`, and `.github/workflows/refresh-snapshots.yml`.
3. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / root**.
4. Wait about a minute, then visit `https://USERNAME.github.io`.

(You can also drop these files into any existing repo and enable Pages on it; the site will live at `https://USERNAME.github.io/that-repo/`. If you do, set `CONFIG.repo` to that repo's `"owner/name"` so publishing targets the right place.)

## 3. How "auto-update" works

Every time someone opens the page, it calls the GitHub API and rebuilds the list from your current repos. New repo → it shows up. New Pages site → it moves into **Featured & live**. Results are cached in the browser for `cacheMinutes` (default 10) to stay under GitHub's unauthenticated rate limit (60 requests/hour per visitor).

---

## 4. The site editor

**Open it:**
- Add `?dev=1` to the URL (e.g. `https://USERNAME.github.io/?dev=1`), **or**
- Press `Ctrl/Cmd + Shift + D`.

A small square button appears bottom-right. It opens a panel where you can:

- Override your **display name, tagline, and accent colour**.
- **Show, hide, and reorder** the page's three sections (Featured & live, By language, All projects) — this is the "redefine how the parts are arranged" part: it changes the actual page structure, not just content.
- **Show/hide**, **feature** (★), and **reorder** individual projects.

Everything previews live, instantly, in your own browser (saved as a local draft).

### Publishing — for everyone, without leaving the site

The site is static (GitHub Pages), so a change only becomes visible to *other* visitors once it's committed to `config.json` in the repo. The editor's **Connect GitHub** step does that commit for you, automatically:

1. In the editor, under **Publish**, paste a GitHub personal access token.
   - Use a **fine-grained token** (github.com → Settings → Developer settings → Fine-grained tokens), scoped to **only this one repository**, with **Contents: Read and write** permission and nothing else.
   - It's stored only in this browser's `localStorage` and is sent only to `api.github.com` — never anywhere else, and never visible to ordinary visitors (the editor itself is hidden unless you unlock it with `?dev=1` or the keyboard shortcut).
2. Click **Publish**. The editor commits the updated `config.json` straight to your repo.
3. GitHub Pages rebuilds automatically — changes are live for everyone in about a minute.

Click **Disconnect** at any time to remove the stored token from this browser. If you'd rather not store a token at all, clicking **Publish** while disconnected copies the JSON to your clipboard instead, so you can still paste it into `config.json` on github.com by hand.

**Tip:** turn editor access off again with `?dev=0` or another `Ctrl/Cmd + Shift + D`.

---

## `config.json` reference

You normally never edit this by hand — the site editor writes it. For reference:

| Field | Type | Effect |
|---|---|---|
| `name` | string | Override the display name (else your GitHub name). |
| `tagline` | string | Override the bio line. |
| `accent` | string | Hex accent colour, e.g. `#2f6fed`. |
| `hidden` | string[] | Repo names to hide from the site. |
| `featured` | string[] | Repo names to force into Featured (live sites auto-feature). |
| `unfeatured` | string[] | Repo names to force out of Featured, even if live. |
| `order` | string[] | Repo names in the order they should appear in Featured. |
| `sections` | string[] | Which of `featured`, `languages`, `all` are shown, and in what order. Omit to show all three in that order. |
| `snapshotRefreshHours` | number | Screenshot refresh interval: 24, 168 (default), or 720 hours. |
| `snapshots` | object | Managed captures keyed by lowercase `owner/repo`, each containing `url`, `image`, and `capturedAt`. |

Leave a field empty/absent to use defaults.

## Mobile loading and verification

Live project cards use lazy screenshots of the public website. Tap a project card or its title to
open the live website in a preview; closing the preview removes the embedded app.
Fonts load without blocking the page's controls, and slow connections can keep
the system font for that visit to avoid a late font swap.

Run `npm ci` and `npm test` for startup and snapshot regression tests.
For browser regression tests, run `npx playwright install chromium webkit`,
serve this folder locally, then run `npm run test:browser`.
The default preview URL is `http://127.0.0.1:8765`; set `PORTFOLIO_URL` to use
another URL. The tests stub external requests and check a stalled font stylesheet,
passive project cards, preview cleanup, and layout at 320, 375, 414, and 768 px.

## Saved live page snapshots

Screenshots are captured outside visitors' browsers, so cards show the real page
without embedded apps loading, stealing focus, or shifting the portfolio's scroll.
The initial screenshots ship in `snapshots/`; their source URLs, file paths, and
capture times are saved in `config.json`. The portfolio itself still shows a source
preview to avoid recursively capturing its own cards. Projects without live pages
continue to show source previews.

The **Refresh live page snapshots** GitHub Actions workflow checks daily at
09:17 UTC. It discovers the same repositories as the site and refreshes missing,
moved, or expired screenshots. The default expiry is one week. In the editor,
choose daily, weekly, or every 30 days and publish the setting. To refresh
immediately, use **Refresh now on GitHub → Run workflow** (leave `force` enabled).
GitHub schedules can be delayed, and GitHub may disable scheduled workflows in
public repositories after 60 days without repository activity.

Capture uses an anonymous 1200 × 750 Chromium viewport and stores a compressed
JPEG. Failed loads keep the last successful image and its capture date. A 404
page with no previous capture is skipped, as it has no live preview to save. A changed
URL without a matching capture shows “Snapshot pending”; a missing image shows a
placeholder instead of substituting a GitHub repository image. Publishing site
settings preserves newer snapshot metadata produced by the workflow.

The workflow needs its declared **Contents: write** and **Pages: write**
permissions. It commits successful captures to `main` and explicitly requests a
Pages rebuild when the saved revision has not deployed, because a commit made
with `GITHUB_TOKEN` does not trigger a branch-based Pages build. A rerun retries
a failed rebuild request even when no screenshots are due. This repository's
Pages source stays `main` / root.
Concurrent edits cause the push to fail rather than overwrite those edits; rerun
the workflow to retry. Individual capture failures also mark the run as failed,
after saving any successful captures.

To refresh locally: `npm run snapshots` (only due captures), or
`npm run snapshots -- --force` (all eligible pages). These commands update image
files and `config.json`; commit both together. An optional `GITHUB_TOKEN` is used
only for repository discovery at `api.github.com`, never by the browser that
visits the public pages.
