/* =====================================================================
   CONFIG — set your GitHub username here (the only required edit).
   ===================================================================== */
const CONFIG = {
  username: "highestinthesky",   //  <-- your GitHub handle
  repo: null,              // "owner/name" to publish to; defaults to `${username}.github.io`
  hideForks: false,        // show forked repos by default (toggle still available)
  hideArchived: false,     // hide archived repos
  cacheMinutes: 10,        // cache API results to respect GitHub rate limits

  // Show PUBLIC repos that live in organizations too (private repos can't be
  // shown on a static site — that would require a token).
  orgs: [],                          // e.g. ["my-team-org"] → pulls ALL public repos from each org
  extraRepos: ["Rohawklings/32863-ftc"],   // specific repos by "owner/name"

  // Each card shows a real image (GitHub's auto-generated preview by default).
  // Hard-override any card here with your own image URL:
  images: {}        // e.g. { "my-repo": "https://example.com/screenshot.png" }
};

/* ----- small helpers ----- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
let toastTimer;
function toast(msg, action) {
  const t = $("#toast");
  t.innerHTML = "";
  t.append(document.createTextNode(msg));
  if (action) {
    const b = document.createElement("button");
    b.className = "btn"; b.textContent = action.label;
    b.addEventListener("click", () => { action.run(); t.classList.remove("show"); });
    t.append(b);
  }
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), action ? 8000 : 3200);
}

/* ----- icon set (single stroke-based library, drawn inline) ----- */
const ICONS = {
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M7 7h10v10"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8l-6.2 3.2L7 14.2l-5-4.9 6.9-1Z"/></svg>',
  fork: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M6 8.2V11a3 3 0 0 0 3 3h1M18 8.2V11a3 3 0 0 1-3 3h-1M12 14v2.2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 14.5 14.5 9.5M7 17l-1.5 1.5a3.5 3.5 0 0 1-5-5L2 12M17 7l1.5-1.5a3.5 3.5 0 0 1 5 5L22 12"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5M9.9 5.2A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a13.4 13.4 0 0 1-3.1 3.9M6.1 6.1C3.6 7.8 2 10 2 10s3.5 7 10 7c1 0 1.9-.1 2.7-.4"/></svg>',
  star2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8l-6.2 3.2L7 14.2l-5-4.9 6.9-1Z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.6 18 4.9 18 4.9c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.2 2H21l-6.6 7.5L22 22h-6.2l-4.8-6.3L5.5 22H2.7l7-8L2 2h6.3l4.3 5.8L18.2 2Zm-1 18h1.6L7.2 3.7H5.4L17.2 20Z"/></svg>',
};

/* Deterministic per-repo solid monogram colour (a functional identicon, not decoration). */
function repoMono(repo, size) {
  const name = repo.name || "";
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const words = name.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  let ini = words.length >= 2 ? (words[0][0] + words[1][0]) : (words[0] || name).slice(0, 2);
  ini = (ini || "?").toUpperCase();
  return `<span class="repo-mono${size === "lg" ? " lg" : ""}" style="background:hsl(${hue} 46% 36%)">${esc(ini)}</span>`;
}
const ownerOf = (repo) => (repo.owner && repo.owner.login) || CONFIG.username;
function ogImage(repo) {
  const cb = encodeURIComponent(repo.pushed_at || String(repo.id) || "1");
  return `https://opengraph.githubassets.com/${cb}/${ownerOf(repo)}/${repo.name}`;
}
const repoImage = (repo) => (CONFIG.images && CONFIG.images[repo.name]) || ogImage(repo);
const ownerAvatar = (repo) => (repo.owner && repo.owner.avatar_url) || (PROFILE && PROFILE.avatar_url) || "";
function ownerTag(repo) {
  const o = ownerOf(repo);
  return o.toLowerCase() === CONFIG.username.toLowerCase() ? "" : `<span class="owner-tag" title="Owned by ${esc(o)}">${esc(o)}</span>`;
}
const LANG_COLORS = { JavaScript:"#f1e05a", TypeScript:"#3178c6", Python:"#3572A5", HTML:"#e34c26", CSS:"#563d7c", Java:"#b07219", "C++":"#f34b7d", C:"#8a8a8a", "C#":"#178600", Go:"#00ADD8", Rust:"#dea584", Ruby:"#701516", PHP:"#4F5D95", Swift:"#F05138", Kotlin:"#A97BFF", Dart:"#00B4AB", Shell:"#89e051", Vue:"#41b883", Jupyter:"#DA5B0B", "Jupyter Notebook":"#DA5B0B", SCSS:"#c6538c", Lua:"#000080" };
const langColor = (l) => LANG_COLORS[l] || "#9099a8";

/* ===================== REVEAL (IntersectionObserver, one-shot) ===================== */
const revealIO = REDUCED ? null : new IntersectionObserver((entries, obs) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); obs.unobserve(e.target); } });
}, { threshold: 0.1 });
function observeReveal(container) {
  if (!container) return;
  const items = [...container.children];
  items.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(i, 10) * 40}ms`;
    if (revealIO) revealIO.observe(el); else el.classList.add("is-in");
  });
}

/* ===================== STATE ===================== */
let PROFILE = null;
let REPOS = [];
let PUBLISHED = {};
let DRAFT = {};
let OVERRIDES = {};

const SECTION_DEFS = [
  { key: "featured",   label: "Featured & live" },
  { key: "languages",  label: "By language" },
  { key: "all",        label: "All projects" },
];
const DEFAULT_SECTIONS = ["featured", "languages", "all"];

const DRAFT_KEY = "devDraft:" + CONFIG.username;
const TOKEN_KEY = "ghToken:" + CONFIG.username;

function loadDraft() { try { DRAFT = JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch { DRAFT = {}; } }
function saveDraft() { localStorage.setItem(DRAFT_KEY, JSON.stringify(DRAFT)); }
function computeOverrides() {
  OVERRIDES = {
    name:     DRAFT.name     ?? PUBLISHED.name     ?? "",
    tagline:  DRAFT.tagline  ?? PUBLISHED.tagline  ?? "",
    accent:   DRAFT.accent   ?? PUBLISHED.accent   ?? "",
    hidden:     DRAFT.hidden     ?? PUBLISHED.hidden     ?? [],
    featured:   DRAFT.featured   ?? PUBLISHED.featured   ?? [],
    unfeatured: DRAFT.unfeatured ?? PUBLISHED.unfeatured ?? [],
    order:      DRAFT.order      ?? PUBLISHED.order      ?? [],
    sections:   DRAFT.sections   ?? PUBLISHED.sections   ?? DEFAULT_SECTIONS,
  };
}

/* ===================== FETCH (with cache + rate-limit fallback) ===================== */
async function cachedJSON(url, key) {
  const ck = "ghcache:" + key;
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(ck)); } catch {}
  const fresh = cached && (Date.now() - cached.t < CONFIG.cacheMinutes * 60000);
  if (fresh) return cached.d;
  try {
    const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (res.status === 403) { if (cached) return cached.d; throw new Error("rate-limited"); }
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    try { localStorage.setItem(ck, JSON.stringify({ t: Date.now(), d: data })); } catch {}
    return data;
  } catch (e) { if (cached) return cached.d; throw e; }
}
async function fetchPaged(baseUrl, key) {
  let page = 1, all = [];
  while (page <= 5) {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const batch = await cachedJSON(`${baseUrl}${sep}per_page=100&sort=updated&page=${page}`, `${key}:${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all = all.concat(batch);
    if (batch.length < 100) break;
    page++;
  }
  return all;
}
async function gatherRepos() {
  const tasks = [ fetchPaged(`https://api.github.com/users/${CONFIG.username}/repos`, `repos:${CONFIG.username}`) ];
  (CONFIG.orgs || []).forEach(org =>
    tasks.push(fetchPaged(`https://api.github.com/orgs/${org}/repos`, `orgrepos:${org}`).catch(() => [])));
  (CONFIG.extraRepos || []).forEach(full =>
    tasks.push(cachedJSON(`https://api.github.com/repos/${full}`, `repo:${full}`).then(r => r && r.id ? [r] : []).catch(() => [])));
  const groups = await Promise.all(tasks);
  const seen = new Set(), merged = [];
  for (const group of groups) for (const r of group) {
    if (r && !seen.has(r.id)) { seen.add(r.id); merged.push(r); }
  }
  return merged;
}

/* ===================== PAGES URL ===================== */
function pagesUrl(repo) {
  if (repo.homepage && /^https?:\/\//.test(repo.homepage)) return repo.homepage;
  if (repo.has_pages) {
    const owner = (repo.owner && repo.owner.login) || CONFIG.username;
    if (repo.name.toLowerCase() === (owner + ".github.io").toLowerCase()) return `https://${owner}.github.io/`;
    return `https://${owner}.github.io/${repo.name}/`;
  }
  return null;
}
const isLive = (repo) => !!pagesUrl(repo);

/* ===================== ACCENT ===================== */
function applyAccent() {
  const a = OVERRIDES.accent;
  if (a && /^#?[0-9a-fA-F]{3,8}$/.test(a)) {
    document.documentElement.style.setProperty("--color-accent", a.startsWith("#") ? a : "#" + a);
  } else {
    document.documentElement.style.removeProperty("--color-accent");
  }
}

/* ===================== HERO ===================== */
function countUp(el, target, duration = 1100) {
  if (REDUCED || !target) { el.textContent = target; return; }
  const t0 = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
async function typeIn(el, delay = 150) {
  if (REDUCED) return; // already fully rendered; reduced motion skips the reveal animation
  try { await document.fonts.ready; } catch {}
  // Measure the real rendered width (post font-swap) rather than trusting a
  // percentage/ch target, which can go stale if the mono font loads late.
  const probe = el.cloneNode(true);
  probe.style.cssText = "position:absolute; visibility:hidden; white-space:nowrap; width:auto; left:-9999px;";
  el.parentElement.appendChild(probe);
  const natural = probe.scrollWidth;
  probe.remove();
  el.style.setProperty("--chars", el.textContent.length);
  el.style.setProperty("--type-w", natural + "px");
  el.classList.add("cc-typewriter");
  el.style.animationDelay = delay + "ms";
}

function renderHero() {
  const p = PROFILE;
  const name = OVERRIDES.name || p.name || p.login;
  const bio  = OVERRIDES.tagline || p.bio || "";
  $("#brand-name").textContent = name;
  $("#footer-name").textContent = name;
  document.title = name + " · Portfolio";
  $("#gh-link").href = p.html_url;
  $("#footer-gh").href = p.html_url;
  $("#footer-src").href = `https://github.com/${CONFIG.repo || (CONFIG.username + "/" + CONFIG.username + ".github.io")}`;
  const totalStars = REPOS.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const liveCount = REPOS.filter(isLive).length;

  const social = (href, label, svg) => href ? `<a class="social" href="${esc(href)}" target="_blank" rel="noopener">${svg}${esc(label)}</a>` : "";
  const blog = p.blog ? (/^https?:\/\//.test(p.blog) ? p.blog : "https://" + p.blog) : "";

  $("#hero-text").innerHTML = `
    <div class="hero-id">
      <img class="avatar" src="${esc(p.avatar_url)}" alt="${esc(name)}" width="56" height="56" />
      <div>
        <div class="hero-name">${esc(name)}</div>
        <div class="hero-handle">@${esc(p.login)}</div>
      </div>
    </div>
    ${bio ? `<p class="hero-bio">${esc(bio)}</p>` : ""}
    <div class="hero-meta">
      ${p.location ? `<span>${ICONS.pin}${esc(p.location)}</span>` : ""}
      ${p.company ? `<span>${ICONS.building}${esc(p.company)}</span>` : ""}
      ${blog ? `<span>${ICONS.link}<a href="${esc(blog)}" target="_blank" rel="noopener">${esc(p.blog)}</a></span>` : ""}
    </div>
    <div class="socials">
      <a class="social" href="${esc(p.html_url)}" target="_blank" rel="noopener">${ICONS.github}GitHub</a>
      ${social(p.twitter_username ? "https://twitter.com/" + p.twitter_username : "", "Twitter / X", ICONS.twitter)}
      ${social(blog, "Website", ICONS.link)}
    </div>`;

  $("#hero-code").innerHTML = `
    <div class="cc-bar">
      <span class="cc-dots"><span></span><span></span><span></span></span>
      <span class="cc-file">request.http</span>
      <span class="cc-status">200 OK</span>
    </div>
    <div class="cc-body">
      <div class="cc-line" id="cc-typeline"><span class="cc-method">GET</span> api.github.com/users/${esc(CONFIG.username)}</div>
      <div class="cc-json" id="cc-json" style="${REDUCED ? "" : "opacity:0"}">
<span class="p">{</span>
  <span class="k">"public_repos"</span><span class="p">:</span> <span class="v" id="cc-repos">0</span><span class="p">,</span>
  <span class="k">"followers"</span><span class="p">:</span> <span class="v" id="cc-followers">0</span><span class="p">,</span>
  <span class="k">"stars_earned"</span><span class="p">:</span> <span class="v" id="cc-stars">0</span><span class="p">,</span>
  <span class="k">"pages_live"</span><span class="p">:</span> <span class="v" id="cc-live">0</span>
<span class="p">}</span></div>
    </div>`;

  const line = $("#cc-typeline");
  typeIn(line, 150);

  const reveal = () => {
    const j = $("#cc-json");
    j.style.transition = `opacity 300ms var(--ease-out)`;
    j.style.opacity = 1;
    countUp($("#cc-repos"), p.public_repos);
    countUp($("#cc-followers"), p.followers);
    countUp($("#cc-stars"), totalStars);
    countUp($("#cc-live"), liveCount);
  };
  if (REDUCED) reveal();
  else line.addEventListener("animationend", reveal, { once: true });
}

/* ===================== CARD TEMPLATE ===================== */
function repoCard(repo) {
  const live = pagesUrl(repo);
  const topics = (repo.topics || []).slice(0, 4);
  const customImg = (CONFIG.images && CONFIG.images[repo.name]) || "";
  const avatar = ownerAvatar(repo);
  return `
  <article class="card" data-card data-name="${esc(repo.name)}" tabindex="0" role="button" aria-label="Preview ${esc(repo.name)}">
    <div class="card-banner">
      ${repoMono(repo, "lg")}
      ${customImg
        ? `<img class="banner-cover" src="${esc(customImg)}" alt="" loading="lazy" onerror="this.remove()" />`
        : (avatar ? `<img class="banner-avatar" src="${esc(avatar)}" alt="" loading="lazy" onerror="this.remove()" />` : "")}
      <span class="hint">${ICONS.external}preview</span>
    </div>
    <div class="card-body">
      <div class="top">
        <div class="repo-name">
          <span class="rn-text">${esc(repo.name)}</span>
          ${ownerTag(repo)}
        </div>
        ${live ? '<span class="badge live">Live</span>' : repo.fork ? '<span class="badge fork">Fork</span>' : repo.archived ? '<span class="badge archived">Archived</span>' : ""}
      </div>
      <p class="desc">${esc(repo.description || "No description provided.")}</p>
      ${topics.length ? `<div class="topics">${topics.map(t => `<span class="topic">${esc(t)}</span>`).join("")}</div>` : ""}
      <div class="card-foot">
        ${repo.language ? `<span class="lang"><span class="lang-dot" style="background:${langColor(repo.language)}"></span>${esc(repo.language)}</span>` : ""}
        ${repo.stargazers_count ? `<span>${repo.stargazers_count} ★</span>` : ""}
        ${repo.forks_count ? `<span>${repo.forks_count} ⑂</span>` : ""}
      </div>
      <div class="card-actions">
        ${live ? `<a class="btn primary" href="${esc(live)}" target="_blank" rel="noopener">${ICONS.external}View live</a>` : ""}
        <a class="btn" href="${esc(repo.html_url)}" target="_blank" rel="noopener">${ICONS.github}Code</a>
      </div>
    </div>
  </article>`;
}

/* ===================== VISIBLE / FEATURED LOGIC ===================== */
function visibleRepos() {
  const hidden = new Set(OVERRIDES.hidden);
  return REPOS.filter(r => {
    if (hidden.has(r.name)) return false;
    if (CONFIG.hideArchived && r.archived) return false;
    return true;
  });
}
function isFeatured(repo) {
  if ((OVERRIDES.unfeatured || []).includes(repo.name)) return false;
  if ((OVERRIDES.featured || []).includes(repo.name)) return true;
  return isLive(repo);
}
function setFeatured(repo, want) {
  DRAFT.featured   = DRAFT.featured   ?? [...(OVERRIDES.featured   || [])];
  DRAFT.unfeatured = DRAFT.unfeatured ?? [...(OVERRIDES.unfeatured || [])];
  const put = (arr, name, add) => { const i = arr.indexOf(name); if (add && i === -1) arr.push(name); else if (!add && i !== -1) arr.splice(i, 1); };
  const auto = isLive(repo);
  if (want) { put(DRAFT.unfeatured, repo.name, false); put(DRAFT.featured, repo.name, !auto); }
  else      { put(DRAFT.featured, repo.name, false); put(DRAFT.unfeatured, repo.name, auto); }
}

/* ===================== RENDER: FEATURED ===================== */
function renderFeatured() {
  const order = OVERRIDES.order || [];
  let feats = visibleRepos().filter(isFeatured);
  feats.sort((a, b) => {
    const ia = order.indexOf(a.name), ib = order.indexOf(b.name);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at));
  });
  const sec = $("#rail-featured");
  if (!feats.length) { sec.style.display = "none"; return; }
  if ((OVERRIDES.sections || []).includes("featured")) sec.style.display = "";
  $("#featured-count").textContent = feats.length + (feats.length === 1 ? " project" : " projects");
  $("#featured-grid").innerHTML = feats.map(r => repoCard(r)).join("");
  observeReveal($("#featured-grid"));
}

/* ===================== RENDER: LANGUAGES ===================== */
function renderLanguages() {
  const list = visibleRepos();
  const counts = new Map();
  list.forEach(r => { if (r.language) counts.set(r.language, (counts.get(r.language) || 0) + 1); });
  const langs = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const sec = $("#rail-languages");
  if (!langs.length) { sec.style.display = "none"; return; }
  if ((OVERRIDES.sections || []).includes("languages")) sec.style.display = "";
  $("#lang-count").textContent = langs.length + (langs.length === 1 ? " language" : " languages");
  $("#lang-chips").innerHTML = langs.map(([lang, n]) => `
    <button class="lang-chip" type="button" data-lang="${esc(lang)}">
      <span class="lang-dot" style="background:${langColor(lang)}"></span>${esc(lang)}<span class="n">${n}</span>
    </button>`).join("");
  $$(".lang-chip", $("#lang-chips")).forEach(chip => chip.addEventListener("click", () => {
    const lang = chip.dataset.lang;
    $("#lang-filter").value = lang;
    renderAll();
    $("#rail-all").scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
  }));
}

/* ===================== RENDER: ALL ===================== */
function populateLangFilter() {
  const langs = [...new Set(REPOS.map(r => r.language).filter(Boolean))].sort();
  const sel = $("#lang-filter");
  const prev = sel.value;
  sel.innerHTML = '<option value="">All languages</option>' + langs.map(l => `<option value="${esc(l)}">${esc(l)}</option>`).join("");
  sel.value = prev;
}
function renderAll() {
  const q = $("#search").value.trim().toLowerCase();
  const lang = $("#lang-filter").value;
  const sort = $("#sort").value;
  const showForks = $("#show-forks").checked;

  let list = visibleRepos().filter(r => {
    if (!showForks && r.fork) return false;
    if (lang && r.language !== lang) return false;
    if (q) {
      const hay = [r.name, r.description, r.language, ...(r.topics || [])].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  list.sort((a, b) => {
    switch (sort) {
      case "stars":   return b.stargazers_count - a.stargazers_count;
      case "created": return new Date(b.created_at) - new Date(a.created_at);
      case "name":    return a.name.localeCompare(b.name);
      default:        return new Date(b.pushed_at) - new Date(a.pushed_at);
    }
  });

  $("#all-count").textContent = list.length + (list.length === 1 ? " project" : " projects");
  const grid = $("#repo-grid");
  if (!list.length) { grid.innerHTML = '<div class="state"><div class="big">No projects match.</div>Try clearing the filter or search.</div>'; return; }
  grid.innerHTML = list.map(r => repoCard(r)).join("");
  observeReveal(grid);
}

/* ===================== SECTION ARRANGEMENT ===================== */
function applyArrangement() {
  const enabled = OVERRIDES.sections && OVERRIDES.sections.length ? OVERRIDES.sections : DEFAULT_SECTIONS;
  SECTION_DEFS.forEach(({ key }) => {
    const el = $(`[data-rail="${key}"]`);
    if (!el) return;
    const idx = enabled.indexOf(key);
    el.style.order = idx === -1 ? 99 : idx;
    // display is also governed by whether the rail has content (see renderFeatured/renderLanguages);
    // "all" always has content, so it's safe to toggle directly here.
    if (key === "all") el.style.display = idx === -1 ? "none" : "";
    if (idx === -1 && key !== "all") el.style.display = "none";
  });
}

/* ===================== RENDER EVERYTHING ===================== */
function renderAllSections() {
  computeOverrides();
  applyAccent();
  applyArrangement();
  renderHero();
  renderFeatured();
  renderLanguages();
  renderAll();
  applyArrangement(); // re-apply after featured/languages may have hidden themselves for having no content
}

/* ===================== EDITOR (site CMS) ===================== */
function isDevMode() { return localStorage.getItem("devMode") === "1"; }
function setDevMode(on) {
  localStorage.setItem("devMode", on ? "1" : "0");
  $("#editor-fab").classList.toggle("show", on);
  if (!on) $("#editor").close();
}
(function initDevAccess() {
  const params = new URLSearchParams(location.search);
  if (params.get("dev") === "1") setDevMode(true);
  if (params.get("dev") === "0") setDevMode(false);
  $("#editor-fab").classList.toggle("show", isDevMode());
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "D" || e.key === "d")) {
      e.preventDefault(); setDevMode(!isDevMode()); toast("Editor access " + (isDevMode() ? "on" : "off"));
    }
  });
})();

$("#editor-fab").addEventListener("click", () => { $("#editor").showModal(); buildEditor(); $("#cfg-name").focus(); });
$("#editor-close").addEventListener("click", () => $("#editor").close());
$("#editor").addEventListener("click", (e) => { if (e.target === $("#editor")) $("#editor").close(); });

function buildEditor() {
  $("#cfg-name").value = DRAFT.name ?? "";
  $("#cfg-tagline").value = DRAFT.tagline ?? "";
  $("#cfg-accent").value = DRAFT.accent ?? "";
  computeOverrides();
  buildArrangeControls();
  buildRepoControls();
  buildConnectControls();
}

/* ---- profile inputs ---- */
let cfgTimer;
["#cfg-name", "#cfg-tagline", "#cfg-accent"].forEach(sel => {
  $(sel).addEventListener("input", () => {
    clearTimeout(cfgTimer);
    cfgTimer = setTimeout(() => {
      DRAFT.name = $("#cfg-name").value || undefined;
      DRAFT.tagline = $("#cfg-tagline").value || undefined;
      DRAFT.accent = $("#cfg-accent").value || undefined;
      saveDraft(); renderAllSections();
    }, 250);
  });
});

/* ---- section arrangement controls ---- */
function buildArrangeControls() {
  computeOverrides();
  const enabled = OVERRIDES.sections || DEFAULT_SECTIONS;
  const displayOrder = [
    ...enabled,
    ...SECTION_DEFS.map(s => s.key).filter(k => !enabled.includes(k)),
  ];
  $("#arrange-list").innerHTML = displayOrder.map(key => {
    const def = SECTION_DEFS.find(s => s.key === key);
    const on = enabled.includes(key);
    return `<div class="arrange-row ${on ? "" : "is-off"}" data-key="${key}">
      <div class="rn"><b>${esc(def.label)}</b></div>
      <span class="mini" data-act="up" title="Move up">${ICONS.up}</span>
      <span class="mini" data-act="down" title="Move down">${ICONS.down}</span>
      <span class="mini ${on ? "on" : ""}" data-act="toggle" title="${on ? "Hide" : "Show"}">${on ? ICONS.eye : ICONS.eyeOff}</span>
    </div>`;
  }).join("");
}
$("#arrange-list").addEventListener("click", (e) => {
  const mini = e.target.closest(".mini"); if (!mini) return;
  const row = e.target.closest("[data-key]"); if (!row) return;
  const key = row.dataset.key;
  const act = mini.dataset.act;
  if (act === "up" || act === "down") {
    const sib = act === "up" ? row.previousElementSibling : row.nextElementSibling;
    if (sib) { act === "up" ? row.parentNode.insertBefore(row, sib) : row.parentNode.insertBefore(sib, row); }
  } else if (act === "toggle") {
    row.classList.toggle("is-off");
  }
  DRAFT.sections = [...$$("#arrange-list .arrange-row")]
    .filter(r => !r.classList.contains("is-off"))
    .map(r => r.dataset.key);
  saveDraft();
  renderAllSections();
  buildArrangeControls();
});

/* ---- repo controls (unchanged pattern, restyled) ---- */
function buildRepoControls() {
  computeOverrides();
  const hidden = new Set(OVERRIDES.hidden);
  const order = OVERRIDES.order || [];
  const sorted = [...REPOS].sort((a, b) => {
    const fa = isFeatured(a), fb = isFeatured(b);
    if (fa !== fb) return fb - fa;
    const ia = order.indexOf(a.name), ib = order.indexOf(b.name);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return new Date(b.pushed_at) - new Date(a.pushed_at);
  });
  $("#repo-list").innerHTML = sorted.map(r => {
    const isH = hidden.has(r.name);
    const isF = isFeatured(r);
    return `<div class="repo-row ${isH ? "is-hidden" : ""}" data-repo="${esc(r.name)}">
      <div class="rn"><b>${esc(r.name)}</b><small>${isLive(r) ? "live · " : ""}${r.language || "—"}</small></div>
      <span class="mini ${isF ? "on" : ""}" data-act="feature" title="Feature">${ICONS.star2}</span>
      <span class="mini" data-act="up" title="Move up">${ICONS.up}</span>
      <span class="mini" data-act="down" title="Move down">${ICONS.down}</span>
      <span class="mini ${isH ? "" : "on"}" data-act="show" title="Show / hide">${isH ? ICONS.eyeOff : ICONS.eye}</span>
    </div>`;
  }).join("");
}
function refreshRepoRow(row) {
  const name = row.dataset.repo;
  const repo = REPOS.find(r => r.name === name);
  if (!repo) return;
  const hidden = (OVERRIDES.hidden || []).includes(name);
  const feat = isFeatured(repo);
  row.classList.toggle("is-hidden", hidden);
  const star = row.querySelector('[data-act="feature"]');
  if (star) star.classList.toggle("on", feat);
  const show = row.querySelector('[data-act="show"]');
  if (show) { show.classList.toggle("on", !hidden); show.innerHTML = hidden ? ICONS.eyeOff : ICONS.eye; }
}
function syncOrderFromDom() { DRAFT.order = [...$$("#repo-list [data-repo]")].map(el => el.dataset.repo); }
let _pvTimer;
function livePreview() { clearTimeout(_pvTimer); _pvTimer = setTimeout(renderAllSections, 40); }

$("#repo-list").addEventListener("click", (e) => {
  const mini = e.target.closest(".mini"); if (!mini) return;
  const row = e.target.closest("[data-repo]"); if (!row) return;
  const name = row.dataset.repo;
  const repo = REPOS.find(r => r.name === name);
  const act = mini.dataset.act;
  DRAFT.hidden = DRAFT.hidden ?? [...(OVERRIDES.hidden || [])];
  DRAFT.order  = DRAFT.order  ?? [...(OVERRIDES.order  || [])];

  if (act === "show") {
    const i = DRAFT.hidden.indexOf(name);
    if (i === -1) DRAFT.hidden.push(name); else DRAFT.hidden.splice(i, 1);
  } else if (act === "feature") {
    setFeatured(repo, !isFeatured(repo));
  } else if (act === "up" || act === "down") {
    const sib = act === "up" ? row.previousElementSibling : row.nextElementSibling;
    if (sib && sib.matches("[data-repo]")) {
      act === "up" ? row.parentNode.insertBefore(row, sib) : row.parentNode.insertBefore(sib, row);
      syncOrderFromDom();
      row.scrollIntoView({ block: "nearest" });
    }
  }
  saveDraft();
  computeOverrides();
  if (act === "show" || act === "feature") refreshRepoRow(row);
  livePreview();
});

$("#editor-reset").addEventListener("click", () => {
  const previous = DRAFT;
  DRAFT = {}; saveDraft(); renderAllSections(); buildEditor();
  toast("Draft reset — back to the published version.", { label: "Undo", run: () => {
    DRAFT = previous; saveDraft(); renderAllSections(); buildEditor();
  } });
});

/* ---- GitHub connect + publish ---- */
function repoSlug() { return CONFIG.repo || `${CONFIG.username}/${CONFIG.username}.github.io`; }
function getToken() { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; } }
function setToken(t) { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch {} }

function buildConnectControls() {
  const on = !!getToken();
  $("#connect-off").style.display = on ? "none" : "";
  $("#connect-on").style.display = on ? "" : "none";
  if (on) $("#connect-repo").textContent = repoSlug();
}

function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode("0x" + p1)));
}

$("#gh-connect").addEventListener("click", async () => {
  const token = $("#gh-token").value.trim();
  if (!token) return;
  const btn = $("#gh-connect");
  btn.disabled = true; btn.textContent = "Checking…";
  try {
    const res = await fetch(`https://api.github.com/repos/${repoSlug()}`, {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) throw new Error("That token was rejected. Check it was copied in full and hasn't expired.");
    if (res.status === 404) throw new Error(`Couldn't find ${repoSlug()} with that token. Confirm the token can access this repository.`);
    if (!res.ok) throw new Error(`GitHub returned an unexpected error (${res.status}). Try again in a moment.`);
    setToken(token);
    $("#gh-token").value = "";
    buildConnectControls();
    toast("Connected to " + repoSlug());
  } catch (err) {
    toast(err.message || "Couldn't connect. Check the token and try again.");
  } finally {
    btn.disabled = false; btn.textContent = "Connect GitHub";
  }
});
$("#gh-disconnect").addEventListener("click", () => {
  setToken("");
  buildConnectControls();
  toast("Disconnected");
});

function buildConfigObject() {
  computeOverrides();
  const out = {};
  if (OVERRIDES.name) out.name = OVERRIDES.name;
  if (OVERRIDES.tagline) out.tagline = OVERRIDES.tagline;
  if (OVERRIDES.accent) out.accent = OVERRIDES.accent;
  if (OVERRIDES.hidden?.length) out.hidden = OVERRIDES.hidden;
  if (OVERRIDES.featured?.length) out.featured = OVERRIDES.featured;
  if (OVERRIDES.unfeatured?.length) out.unfeatured = OVERRIDES.unfeatured;
  if (OVERRIDES.order?.length) out.order = OVERRIDES.order;
  if (OVERRIDES.sections?.length && JSON.stringify(OVERRIDES.sections) !== JSON.stringify(DEFAULT_SECTIONS)) out.sections = OVERRIDES.sections;
  return out;
}

$("#editor-publish").addEventListener("click", async () => {
  const token = getToken();
  const btn = $("#editor-publish");
  const path = "config.json";
  const url = `https://api.github.com/repos/${repoSlug()}/contents/${path}`;
  const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}` };

  if (!token) {
    // No token connected — fall back to a manual export the user can commit themselves.
    const json = JSON.stringify(buildConfigObject(), null, 2);
    try { await navigator.clipboard.writeText(json); toast("Copied config.json — connect GitHub above to publish with one click instead."); }
    catch { toast("Connect GitHub above to publish, or copy config.json from the console.", { label: "Log it", run: () => console.log(json) }); }
    return;
  }

  btn.disabled = true; btn.textContent = "Publishing…";
  try {
    let sha;
    const cur = await fetch(url, { headers });
    if (cur.ok) { sha = (await cur.json()).sha; }
    else if (cur.status !== 404) throw new Error(`Couldn't read the current config.json (${cur.status}). Try again in a moment.`);

    const body = {
      message: "Update config.json via site editor",
      content: b64EncodeUnicode(JSON.stringify(buildConfigObject(), null, 2) + "\n"),
    };
    if (sha) body.sha = sha;

    const put = await fetch(url, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (put.status === 401) throw new Error("That token was rejected — it may have expired. Reconnect with a new one.");
    if (put.status === 403) throw new Error("That token doesn't have write access. Reconnect with a token that has Contents: Read and write.");
    if (put.status === 409) throw new Error("The published file changed since this draft was made. Reset the draft and reapply your edits.");
    if (!put.ok) throw new Error(`GitHub rejected the publish (${put.status}). Try again in a moment.`);

    PUBLISHED = buildConfigObject();
    DRAFT = {}; saveDraft();
    renderAllSections(); buildEditor();
    toast("Published — live for everyone in about a minute.");
  } catch (err) {
    toast(err.message || "Couldn't publish. Try again.");
  } finally {
    btn.disabled = false; btn.textContent = "Publish";
  }
});

/* ===================== COMMAND PALETTE ===================== */
let paletteItems = [], paletteIndex = 0;
function paletteActions() {
  const acts = [{ type: "action", label: "Open GitHub profile", run: () => window.open(PROFILE.html_url, "_blank", "noopener") }];
  if (isDevMode()) acts.push({ type: "action", label: "Open site editor", run: () => { $("#editor").showModal(); buildEditor(); } });
  return acts;
}
function paletteProjects(q) {
  const list = visibleRepos().filter(r => !q || r.name.toLowerCase().includes(q) || (r.language || "").toLowerCase().includes(q));
  list.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
  return list.slice(0, 8).map(r => ({ type: "project", repo: r }));
}
function renderPalette() {
  const q = $("#palette-input").value.trim().toLowerCase();
  const projects = paletteProjects(q);
  const actions = q ? [] : paletteActions();
  paletteItems = [...projects, ...actions];
  paletteIndex = 0;
  const box = $("#palette-results");
  if (!paletteItems.length) { box.innerHTML = '<div class="palette-empty">No projects match.</div>'; return; }
  let html = "";
  if (projects.length) {
    html += '<div class="palette-group-label">Projects</div>';
    html += projects.map((it, i) => `
      <div class="palette-row" role="option" aria-selected="${i === paletteIndex}" data-i="${i}">
        ${repoMono(it.repo)}
        <span class="pr-name">${esc(it.repo.name)}</span>
        <span class="pr-lang">${esc(it.repo.language || "")}</span>
      </div>`).join("");
  }
  if (actions.length) {
    html += '<div class="palette-group-label">Actions</div>';
    html += actions.map((it, i) => {
      const idx = projects.length + i;
      return `<div class="palette-row" role="option" aria-selected="${idx === paletteIndex}" data-i="${idx}">
        <span class="pr-name">${esc(it.label)}</span>
      </div>`;
    }).join("");
  }
  box.innerHTML = html;
}
function paletteSetIndex(i) {
  paletteIndex = (i + paletteItems.length) % paletteItems.length;
  $$(".palette-row", $("#palette-results")).forEach(row => row.setAttribute("aria-selected", String(Number(row.dataset.i) === paletteIndex)));
  const active = $(`.palette-row[data-i="${paletteIndex}"]`);
  if (active) active.scrollIntoView({ block: "nearest" });
}
function paletteRun(i) {
  const it = paletteItems[i];
  if (!it) return;
  $("#palette").close();
  if (it.type === "project") openPreview(it.repo);
  else it.run();
}
function openPalette() {
  $("#palette").showModal();
  $("#palette-input").value = "";
  renderPalette();
  $("#palette-input").focus();
}
$("#palette-open").addEventListener("click", openPalette);
$("#palette-input").addEventListener("input", renderPalette);
$("#palette").addEventListener("click", (e) => { if (e.target === $("#palette")) $("#palette").close(); });
$("#palette-results").addEventListener("click", (e) => {
  const row = e.target.closest(".palette-row"); if (!row) return;
  paletteRun(Number(row.dataset.i));
});
$("#palette-input").addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { e.preventDefault(); paletteSetIndex(paletteIndex + 1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); paletteSetIndex(paletteIndex - 1); }
  else if (e.key === "Enter") { e.preventDefault(); paletteRun(paletteIndex); }
});
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
});

/* ===================== POINTER GLOW (subtle card border light) ===================== */
document.addEventListener("pointermove", (e) => {
  const c = e.target.closest("[data-card]"); if (!c) return;
  const r = c.getBoundingClientRect();
  c.style.setProperty("--mx", (e.clientX - r.left) + "px");
  c.style.setProperty("--my", (e.clientY - r.top) + "px");
});

/* ===================== REPO PREVIEW ===================== */
function openPreview(repo) {
  const live = pagesUrl(repo);
  const owner = ownerOf(repo);
  const cb = encodeURIComponent(repo.pushed_at || String(repo.id) || "1");
  const og = `https://opengraph.githubassets.com/${cb}/${owner}/${repo.name}`;
  const topics = (repo.topics || []).map(t => `<span class="topic">${esc(t)}</span>`).join("");
  let updated = "";
  try { updated = new Date(repo.pushed_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); } catch {}

  const previewBlock = live
    ? `<div class="pv-frame">
         <div class="pv-loading">Loading live preview…</div>
         <iframe src="${esc(live)}" loading="lazy" referrerpolicy="no-referrer"
           sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
           onload="this.previousElementSibling.style.display='none'"></iframe>
       </div>`
    : `<div class="pv-frame static"><img src="${esc(og)}" alt="${esc(repo.name)} preview" loading="lazy"
         onerror="this.closest('.pv-frame').style.display='none'" /></div>`;

  $("#preview-content").innerHTML = `
    <button class="icon-btn dlg-close" id="preview-close" aria-label="Close preview">${ICONS.x}</button>
    <div class="pv-head">
      ${repoMono(repo, "lg")}
      <div>
        <h3>${esc(repo.name)}</h3>
        <div class="pv-sub">
          ${live ? '<span class="badge live">Live</span>' : repo.fork ? '<span class="badge fork">Fork</span>' : ""}
          ${ownerTag(repo)}
          ${repo.language ? `<span class="lang"><span class="lang-dot" style="background:${langColor(repo.language)}"></span>${esc(repo.language)}</span>` : ""}
          ${updated ? `<span>updated ${updated}</span>` : ""}
        </div>
      </div>
    </div>
    ${previewBlock}
    <p class="pv-desc">${esc(repo.description || "No description provided.")}</p>
    ${topics ? `<div class="topics" style="margin-bottom:var(--space-md)">${topics}</div>` : ""}
    <div class="pv-stats">${repo.stargazers_count} ★ &nbsp;·&nbsp; ${repo.forks_count} ⑂${repo.open_issues_count ? ` &nbsp;·&nbsp; ${repo.open_issues_count} open issues` : ""}</div>
    <div class="pv-actions">
      ${live ? `<a class="btn primary" href="${esc(live)}" target="_blank" rel="noopener">${ICONS.external}Open live</a>` : ""}
      <a class="btn" href="${esc(repo.html_url)}" target="_blank" rel="noopener">${ICONS.github}View code on GitHub</a>
    </div>`;
  $("#preview-close").addEventListener("click", () => $("#preview").close());
  $("#preview").showModal();
}
$("#preview").addEventListener("click", (e) => { if (e.target === $("#preview")) $("#preview").close(); });
$("#preview").addEventListener("close", () => { $("#preview-content").innerHTML = ""; });

document.addEventListener("click", (e) => {
  const card = e.target.closest("[data-card]");
  if (!card) return;
  if (e.target.closest("a, button, .btn")) return;
  const repo = REPOS.find(r => r.name === card.dataset.name);
  if (repo) openPreview(repo);
});
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ")) {
    const c = document.activeElement;
    if (c && c.matches && c.matches("[data-card]")) {
      e.preventDefault();
      const repo = REPOS.find(r => r.name === c.dataset.name);
      if (repo) openPreview(repo);
    }
  }
});

/* ===================== WIRE UP CONTROLS ===================== */
$("#show-forks").checked = !CONFIG.hideForks;
["input", "change"].forEach(ev => {
  $("#search").addEventListener(ev, renderAll);
  $("#lang-filter").addEventListener("change", renderAll);
  $("#sort").addEventListener("change", renderAll);
  $("#show-forks").addEventListener("change", renderAll);
});

/* ===================== BOOT ===================== */
async function boot() {
  loadDraft();
  try {
    const res = await fetch("config.json?v=" + Date.now());
    if (res.ok) PUBLISHED = await res.json();
  } catch { PUBLISHED = {}; }

  if (CONFIG.username === "YOUR_GITHUB_USERNAME") {
    $("#hero-text").innerHTML = '<div class="state"><div class="big">Set your GitHub username</div>Open <code>app.js</code> and change <code>CONFIG.username</code> to your handle.</div>';
    return;
  }
  try {
    PROFILE = await cachedJSON(`https://api.github.com/users/${CONFIG.username}`, "user:" + CONFIG.username);
    REPOS = await gatherRepos();
    populateLangFilter();
    renderAllSections();
  } catch (e) {
    $("#hero-text").innerHTML = `<div class="state"><div class="big">Couldn't load GitHub data</div>${
      String(e).includes("rate") ? "GitHub's hourly limit was hit — please try again shortly." :
      "Check that the username <b>" + esc(CONFIG.username) + "</b> is correct and the profile is public."}</div>`;
    $("#repo-grid").innerHTML = "";
  }
}
boot();
