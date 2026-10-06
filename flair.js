/* Hallmark · pre-emit critique: P5 H5 E4 S5 R4 V4
 * interaction layer: cursor ink + loose-card assembly
 * Existing Workbench / Midnight tokens. Motion is decorative and optional.
 */
(() => {
  function initializeFlair() {
    const motionButton = document.querySelector("#motion-toggle");
    if (!window.anime || !motionButton) return;

    const { animate, cubicBezier } = window.anime;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const easeOut = cubicBezier(.16, 1, .3, 1);
    const active = new Map();
    const seen = new Set();
    let paused = false;
    try { paused = localStorage.getItem("portfolio-motion") === "paused"; } catch {}
    const enabled = () => !paused && !reduced.matches && !document.hidden;
    const key = card => `${card.parentElement?.id}:${card.dataset.projectKey}`;
    const inView = rect => rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight;

    function finish(element) {
      const animation = active.get(element);
      active.delete(element);
      animation?.revert();
      delete element.dataset.flairMoving;
    }

    function move(element, parameters) {
      finish(element);
      if (element.contains(document.activeElement)) return;
      element.dataset.flairMoving = "";
      active.set(element, animate(element, {
        ease: easeOut,
        ...parameters,
        onComplete: () => finish(element),
      }));
    }

    function arrive(card, index = 0) {
      seen.add(key(card));
      if (!enabled() || card.contains(document.activeElement)) return;
      const direction = index % 2 ? 1 : -1;
      move(card, {
        x: [direction * 26, 0],
        y: [{ to: [46, -7], duration: 380 }, { to: 0, duration: 210 }],
        rotate: [direction * 2.8, 0],
        opacity: [.45, 1],
        delay: Math.min(index * 55, 165),
        duration: 590,
      });
    }

    const arrivals = new IntersectionObserver(entries => {
      let index = 0;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        arrivals.unobserve(entry.target);
        if (!seen.has(key(entry.target))) arrive(entry.target, index++);
      });
    }, { threshold: .08 });

    function observeGrid(grid) {
      grid.querySelectorAll("[data-card]").forEach(card => {
        if (!seen.has(key(card))) arrivals.observe(card);
      });
    }

    function updateGrid(grid, update) {
      const cards = [...grid.querySelectorAll("[data-card]")];
      // Read every old position before cancelling or changing the DOM.
      const before = new Map(cards.map(card => [card.dataset.projectKey, card.getBoundingClientRect()]));
      cards.forEach(card => { arrivals.unobserve(card); finish(card); });
      update();
      const after = [...grid.querySelectorAll("[data-card]")].map(card => ({ card, rect: card.getBoundingClientRect() }));
      let index = 0;
      after.forEach(({ card, rect }) => {
        const old = before.get(card.dataset.projectKey);
        if (!enabled() || !inView(rect)) return;
        if (old && inView(old)) {
          const x = old.left - rect.left;
          const y = old.top - rect.top;
          if (Math.abs(x) < 1 && Math.abs(y) < 1) return;
          seen.add(key(card));
          move(card, {
            x: [x, 0],
            y: [{ to: [y, -6], duration: 330 }, { to: 0, duration: 190 }],
            rotate: [x < 0 ? -1.5 : 1.5, 0],
            delay: Math.min(index++ * 35, 105),
            duration: 520,
          });
        } else if (!old || !seen.has(key(card))) {
          arrive(card, index++);
        }
      });
      observeGrid(grid);
    }

    let inkLayer;
    let strokes = [];
    let strokeIndex = 0;
    let lastPoint;
    let lastInkTime = 0;

    function clearInk() {
      lastPoint = null;
      strokes.forEach(stroke => {
        stroke.animation?.revert();
        stroke.animation = null;
        stroke.element.style.opacity = "0";
      });
    }

    function prepareInk() {
      if (!finePointer.matches || !enabled() || inkLayer) return;
      inkLayer = document.createElement("div");
      inkLayer.className = "cursor-ink";
      inkLayer.setAttribute("aria-hidden", "true");
      strokes = Array.from({ length: 18 }, (_, index) => {
        const element = document.createElement("i");
        element.className = "cursor-ink__stroke";
        element.dataset.tone = index % 3;
        inkLayer.append(element);
        return { element, animation: null };
      });
      document.body.append(inkLayer);
    }

    document.addEventListener("pointermove", event => {
      if (!enabled() || !finePointer.matches || event.pointerType !== "mouse") return;
      if (document.querySelector("dialog[open]") || event.target.closest("input, select, textarea, [contenteditable]")) {
        clearInk();
        return;
      }
      prepareInk();
      const point = { x: event.clientX, y: event.clientY };
      if (!lastPoint) { lastPoint = point; return; }
      const dx = point.x - lastPoint.x;
      const dy = point.y - lastPoint.y;
      const distance = Math.hypot(dx, dy);
      const now = performance.now();
      if (distance < 9 || now - lastInkTime < 32) return;
      lastPoint = point;
      lastInkTime = now;
      const stroke = strokes[strokeIndex++ % strokes.length];
      stroke.animation?.revert();
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const side = strokeIndex % 2 ? 1 : -1;
      const x = point.x - dx * .25;
      const y = point.y - dy * .25;
      stroke.animation = animate(stroke.element, {
        x: [x, x - dy / distance * 6 * side],
        y: [y, y + dx / distance * 6 * side],
        rotate: [angle, angle + side * 14],
        scaleX: [Math.min(1.8, .5 + distance / 40), .25],
        scaleY: [1, .45],
        opacity: [.7, 0],
        duration: 440,
        ease: easeOut,
        onComplete: () => { stroke.animation = null; stroke.element.style.opacity = "0"; },
      });
    }, { passive: true });

    function syncMotion() {
      const on = enabled();
      motionButton.hidden = false;
      motionButton.disabled = reduced.matches;
      motionButton.setAttribute("aria-pressed", String(on));
      const label = reduced.matches ? "Effects reduced by system preference" : on ? "Pause visual effects" : "Resume visual effects";
      motionButton.setAttribute("aria-label", label);
      motionButton.title = label;
      motionButton.querySelector("span").textContent = on ? "Motion on" : "Motion off";
      document.documentElement.dataset.motion = on ? "on" : "off";
      if (!on) {
        [...active.keys()].forEach(finish);
        clearInk();
      } else prepareInk();
    }

    motionButton.addEventListener("click", () => {
      paused = !paused;
      try { localStorage.setItem("portfolio-motion", paused ? "paused" : "on"); } catch {}
      syncMotion();
    });
    reduced.addEventListener("change", syncMotion);
    finePointer.addEventListener("change", () => {
      clearInk();
      if (!finePointer.matches) {
        inkLayer?.remove();
        inkLayer = null;
        strokes = [];
      } else prepareInk();
    });
    document.addEventListener("visibilitychange", syncMotion);
    document.addEventListener("pointerout", event => { if (!event.relatedTarget) clearInk(); });
    document.addEventListener("scroll", clearInk, { passive: true });
    document.addEventListener("keydown", clearInk);
    document.addEventListener("focusin", event => {
      const card = event.target.closest("[data-flair-moving]");
      if (card) finish(card);
    });
    document.addEventListener("click", () => { if (document.querySelector("dialog[open]")) clearInk(); });
    window.addEventListener("blur", clearInk);
    window.addEventListener("pagehide", () => { [...active.keys()].forEach(finish); clearInk(); });
    window.PortfolioFlair = { observeGrid, updateGrid };
    document.querySelectorAll("#featured-grid, #repo-grid").forEach(observeGrid);
    syncMotion();
  }

  // The core app starts independently, even if this optional download stalls.
  if (window.anime) initializeFlair();
  else {
    const script = document.createElement("script");
    script.src = "vendor/anime.umd.min.js";
    script.async = true;
    script.addEventListener("load", initializeFlair, { once: true });
    document.head.append(script);
  }
})();
