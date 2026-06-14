# Auto-updating GitHub Portfolio

A single-page, self-updating showcase of your GitHub work. It reads your profile and **all public repos live from the GitHub API in the browser**, so the moment you create a new repo or publish a new GitHub Pages site, it appears here automatically — no rebuild, no redeploy.

- **Modern glassmorphic** design, **auto light/dark** theme (follows the visitor's system, with a manual toggle).
- **Featured & Live** section auto-collects repos that have a published GitHub Pages site or a homepage URL.
- **All Projects** grid with live search, language filter, and sorting.
- **Developer Panel** (owner-only) to show/hide, feature, and reorder projects — with a one-click `config.json` export to publish those choices to everyone.

---

## 1. Set your username (required)

Open `index.html` and change one line near the top of the `<script>`:

```js
const CONFIG = {
  username: "YOUR_GITHUB_USERNAME",   //  <-- your GitHub handle
  hideForks: true,
  hideArchived: false,
  cacheMinutes: 10
};
```

That's the only edit needed to go live.

## 2. Deploy to GitHub Pages

The simplest setup — your portfolio lives at `https://USERNAME.github.io`:

1. Create a repo named exactly **`USERNAME.github.io`** (use your own handle).
2. Add `index.html`, `config.json`, and this `README.md` to it.
3. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / root**.
4. Wait ~1 minute, then visit `https://USERNAME.github.io`.

(You can also drop these files into any existing repo and enable Pages on it; the site will live at `https://USERNAME.github.io/that-repo/`.)

## 3. How "auto-update" works

Every time someone opens the page, it calls the GitHub API and rebuilds the list from your current repos. New repo → it shows up. New Pages site → it moves into **Featured & Live**. Results are cached in the browser for `cacheMinutes` (default 10) to stay under GitHub's unauthenticated rate limit (60 requests/hour per visitor).

---

## 4. Developer Panel (control what's shown — globally)

Because GitHub Pages is **static**, anything you toggle is normally saved only in *your* browser. To make changes apply for **every visitor**, the panel exports a small `config.json` that you commit. That committed file is the global source of truth the site loads on every visit.

**Open the panel:**
- Add `?dev=1` to the URL (e.g. `https://USERNAME.github.io/?dev=1`), **or**
- Press `Ctrl/Cmd + Shift + D`.

A gear button appears in the bottom-right. Inside you can:
- **Show / hide** any project.
- **Feature** (★) a project so it appears in *Featured & Live* (live sites are featured automatically).
- **Reorder** featured projects with ▲ / ▼.
- Override your **display name, tagline, and accent color**.

Everything previews live as you edit (saved locally as a draft).

**To publish for everyone:**
1. Click **Export config.json**.
2. **Copy** or **Download** the result.
3. Replace `config.json` in your repo with it and commit.

Done — all visitors now see your configuration. The panel is invisible to normal visitors, and even if someone opens it, they can't change your live site (that requires committing to your repo).

> Tip: turn the panel off again with `?dev=0` or another `Ctrl/Cmd + Shift + D`.

---

## config.json reference

| Field | Type | Effect |
|------|------|--------|
| `name` | string | Override the display name (else your GitHub name). |
| `tagline` | string | Override the bio line. |
| `accent` | string | Hex accent color, e.g. `#7c3aed`. |
| `hidden` | string[] | Repo names to hide from the site. |
| `featured` | string[] | Repo names to force into Featured (live sites auto-feature). |
| `order` | string[] | Repo names in the order they should appear in Featured. |

Leave a field empty/`[]` to use defaults.
