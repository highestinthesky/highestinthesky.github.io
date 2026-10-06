/* Shared by the static site and the scheduled screenshot job. */
(function(root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SiteSettings = factory();
})(globalThis, function() {
  const CONFIG = {
    username: "highestinthesky",
    email: "yaseru2003@gmail.com",
    repo: null,
    hideForks: false,
    hideArchived: false,
    cacheMinutes: 10,
    orgs: [],
    extraRepos: ["Rohawklings/32863-ftc"],
    images: {},
  };

  function repoKey(repo, config = CONFIG) {
    return `${repo.owner?.login || config.username}/${repo.name}`.toLowerCase();
  }

  function pagesUrl(repo, config = CONFIG) {
    if (repo.homepage && /^https?:\/\//i.test(repo.homepage)) {
      try {
        const homepage = new URL(repo.homepage);
        if (homepage.hostname.toLowerCase().endsWith(".github.io")) homepage.protocol = "https:";
        return homepage.href;
      } catch { return null; }
    }
    if (!repo.has_pages) return null;
    const owner = repo.owner?.login || config.username;
    return repo.name.toLowerCase() === `${owner}.github.io`.toLowerCase()
      ? `https://${owner}.github.io/`
      : `https://${owner}.github.io/${repo.name}/`;
  }

  function snapshotFor(repo, settings, config = CONFIG) {
    const snapshot = settings.snapshots?.[repoKey(repo, config)];
    if (!snapshot || snapshot.url !== pagesUrl(repo, config)) return null;
    if (!/^snapshots\/[a-z0-9-]+\/[a-z0-9_.-]+\.jpg$/i.test(snapshot.image || "")) return null;
    if (!Number.isFinite(Date.parse(snapshot.capturedAt))) return null;
    return snapshot;
  }

  function refreshHours(settings) {
    return [24, 168, 720].includes(settings.snapshotRefreshHours) ? settings.snapshotRefreshHours : 168;
  }

  return { CONFIG, repoKey, pagesUrl, snapshotFor, refreshHours };
});
