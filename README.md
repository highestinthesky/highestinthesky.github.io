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
| `config.json` | The published, global content overrides. Edited by the site editor, not by hand. |

## 1. Set your username (required)

Open `app.js` and change the top of the `CONFIG` object:

```js
const CONFIG = {
  username: "YOUR_GITHUB_USERNAME",   //  <-- your GitHub handle
  repo: null,               // "owner/name" to publish to — defaults to `${username}.github.io`
  hideForks: false,
  hideArchived: false,
  cacheMinutes: 10,
};
```

That's the only edit needed to go live.

## 2. Deploy to GitHub Pages

1. Create a repo named exactly **`USERNAME.github.io`** (use your own handle).
2. Add `index.html`, `styles.css`, `app.js`, `config.json`, and this `README.md` to it.
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

Leave a field empty/absent to use defaults.
